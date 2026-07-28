/**
 * Typebot Session Service
 * Usa resultId (persistente) em vez de sessionId (temporário)
 */

const TYPEBOT_API = "https://typebot.io"
const PUBLIC_ID   = process.env.TYPEBOT_PUBLIC_ID ?? ""

// ── Supabase session storage ─────────────────────────────────────────
async function supabaseFetch(path: string, options: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase não configurado")
  return fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  })
}

async function getSession(phone: string): Promise<{ sessionId: string; resultId: string } | null> {
  try {
    const res  = await supabaseFetch(
      `typebot_sessions?phone=eq.${encodeURIComponent(phone)}&select=session_id,result_id,expires_at`
    )
    const rows = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) return null
    const row      = rows[0]
    const expiresAt = row.expires_at.endsWith("Z") ? row.expires_at : row.expires_at + "Z"
    if (new Date(expiresAt) < new Date()) {
      await deleteSession(phone)
      return null
    }
    console.log("[typebot] Sessão válida — resultId:", row.result_id)
    return { sessionId: row.session_id, resultId: row.result_id }
  } catch (e: any) {
    console.error("[typebot] getSession erro:", e.message)
    return null
  }
}

async function saveSession(phone: string, sessionId: string, resultId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  try {
    const res = await supabaseFetch("typebot_sessions", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ phone, session_id: sessionId, result_id: resultId, expires_at: expiresAt }),
    })
    console.log("[typebot] saveSession status:", res.status, "| resultId:", resultId)
  } catch (e: any) {
    console.error("[typebot] saveSession erro:", e.message)
  }
}

async function deleteSession(phone: string): Promise<void> {
  try {
    await supabaseFetch(`typebot_sessions?phone=eq.${encodeURIComponent(phone)}`, { method: "DELETE" })
  } catch {}
}

// ── Typebot API ──────────────────────────────────────────────────────
export interface TypebotMessage {
  type: string
  content?: { richText?: Array<{ type: string; children: Array<{ text: string }> }> }
}

async function startChat(phone: string): Promise<{ sessionId: string; resultId: string; messages: TypebotMessage[]; input?: any }> {
  const res = await fetch(`${TYPEBOT_API}/api/v1/typebots/${PUBLIC_ID}/startChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isStreamEnabled: false, prefilledVariables: { whatsappOrigem: phone } }),
  })
  if (!res.ok) throw new Error(`Typebot startChat error: ${res.status}`)
  const data = await res.json()
  await saveSession(phone, data.sessionId, data.resultId)
  console.log("[typebot] startChat OK | sessionId:", data.sessionId, "| resultId:", data.resultId)
  return data
}

async function continueChat_(sessionId: string, resultId: string, message: string, phone: string, retry = false): Promise<any> {
  const res = await fetch(`${TYPEBOT_API}/api/v1/typebots/${PUBLIC_ID}/continueChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, resultId, message }),
  })

  if (!res.ok) {
    console.warn("[typebot] continueChat erro:", res.status, "| retry:", retry)
    if (!retry) {
      // SessionId expirou mas temos resultId — tenta recriar sessão com mesmo resultId
      const reRes = await fetch(`${TYPEBOT_API}/api/v1/typebots/${PUBLIC_ID}/startChat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isStreamEnabled: false,
          resultId,  // reutiliza o resultId existente para continuar de onde parou
          prefilledVariables: { whatsappOrigem: phone },
        }),
      })
      if (reRes.ok) {
        const reData = await reRes.json()
        await saveSession(phone, reData.sessionId, resultId)
        console.log("[typebot] Sessão recriada com resultId:", resultId, "| novo sessionId:", reData.sessionId)
        // Tenta continueChat com novo sessionId
        return continueChat_(reData.sessionId, resultId, message, phone, true)
      }
      // Se tudo falhar, reinicia do zero
      await deleteSession(phone)
      const start = await startChat(phone)
      return { messages: start.messages ?? [], input: start.input }
    }
    throw new Error(`Typebot continueChat error: ${res.status}`)
  }

  const data = await res.json()
  // Atualiza sessionId se mudou
  if (data.sessionId && data.sessionId !== sessionId) {
    await saveSession(phone, data.sessionId, resultId)
  }
  if (data.isEnded) await deleteSession(phone)
  return data
}

export async function continueChat(
  phone: string,
  message: string
): Promise<{ messages: TypebotMessage[]; input?: any; isEnded?: boolean }> {
  const session = await getSession(phone)

  if (!session) {
    // Primeira mensagem — inicia bot e retorna boas-vindas
    const start = await startChat(phone)
    const welcome = start.messages ?? []

    if (start.input) {
      // Já tem input, processa a mensagem do usuário
      try {
        const reply = await continueChat_(start.sessionId, start.resultId, message, phone, true)
        return {
          messages: [...welcome, ...(reply.messages ?? [])],
          input:    reply.input,
          isEnded:  reply.isEnded,
        }
      } catch {
        return { messages: welcome, input: start.input }
      }
    }
    return { messages: welcome, input: start.input }
  }

  return continueChat_(session.sessionId, session.resultId, message, phone, false)
}

export function typebotMessagesToText(messages: TypebotMessage[]): string[] {
  return messages
    .filter(m => m.type === "text" && m.content?.richText)
    .map(m => (m.content!.richText ?? [])
      .map(block => block.children?.map((c: any) => {
        let t = c.text ?? ""
        if (c.bold)   t = `*${t}*`
        if (c.italic) t = `_${t}_`
        return t
      }).join(""))
      .join("\n")
    )
    .filter(Boolean)
}
