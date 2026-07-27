/**
 * Typebot Session Service
 * Sessões armazenadas no Supabase para persistir entre invocações serverless
 */

const TYPEBOT_API = "https://typebot.io"
const PUBLIC_ID   = process.env.TYPEBOT_PUBLIC_ID ?? ""

// ── Supabase como storage de sessões ────────────────────────────────
async function getSession(phone: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error("[typebot] getSession: Supabase não configurado")
    return null
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/typebot_sessions?phone=eq.${encodeURIComponent(phone)}&select=session_id,expires_at`,
      { headers: { "apikey": key, "Authorization": `Bearer ${key}` } }
    )
    const rows = await res.json()
    console.log("[typebot] getSession:", phone, "| status:", res.status, "| rows:", JSON.stringify(rows).slice(0, 100))
    if (!Array.isArray(rows) || rows.length === 0) return null
    const row = rows[0]
    if (new Date(row.expires_at) < new Date()) {
      await deleteSession(phone)
      return null
    }
    return row.session_id
  } catch (e: any) {
    console.error("[typebot] getSession erro:", e.message)
    return null
  }
}

async function saveSession(phone: string, sessionId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error("[typebot] saveSession: Supabase não configurado")
    return
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  try {
    const res = await fetch(`${url}/rest/v1/typebot_sessions`, {
      method: "POST",
      headers: {
        "apikey": key, "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({ phone, session_id: sessionId, expires_at: expiresAt }),
    })
    const text = await res.text()
    console.log("[typebot] saveSession:", phone, "| status:", res.status, "| resp:", text.slice(0, 100))
  } catch (e: any) {
    console.error("[typebot] saveSession erro:", e.message)
  }
}

async function deleteSession(phone: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return
  try {
    await fetch(
      `${url}/rest/v1/typebot_sessions?phone=eq.${encodeURIComponent(phone)}`,
      { method: "DELETE", headers: { "apikey": key, "Authorization": `Bearer ${key}` } }
    )
  } catch {}
}

// ── Typebot API ──────────────────────────────────────────────────────
export interface TypebotMessage {
  type: string
  content?: { richText?: Array<{ type: string; children: Array<{ text: string }> }> }
}

async function startChat(phone: string): Promise<{ sessionId: string; messages: TypebotMessage[]; input?: any }> {
  const res = await fetch(`${TYPEBOT_API}/api/v1/typebots/${PUBLIC_ID}/startChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isStreamEnabled: false, prefilledVariables: { whatsappOrigem: phone } }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Typebot startChat error: ${res.status} ${err}`)
  }
  const data = await res.json()
  await saveSession(phone, data.sessionId)
  console.log("[typebot] startChat OK, sessionId:", data.sessionId)
  return data
}

async function continueWithSession(sessionId: string, message: string, phone: string, retry = false) {
  const res = await fetch(`${TYPEBOT_API}/api/v1/typebots/${PUBLIC_ID}/continueChat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  })

  if (!res.ok) {
    if ((res.status === 400 || res.status === 404) && !retry) {
      // Sessão expirou — inicia nova SEM recursão infinita
      console.log("[typebot] Sessão expirada, iniciando nova...")
      await deleteSession(phone)
      const start = await startChat(phone)
      if (start.input) {
        return continueWithSession(start.sessionId, message, phone, true) // retry=true evita loop
      }
      return start
    }
    throw new Error(`Typebot continueChat error: ${res.status}`)
  }

  const data = await res.json()
  if (data.isEnded) await deleteSession(phone)
  return data
}

export async function continueChat(
  phone: string,
  message: string
): Promise<{ messages: TypebotMessage[]; input?: any; isEnded?: boolean }> {
  const sessionId = await getSession(phone)

  if (!sessionId) {
    // Primeira mensagem — inicia e já processa
    const start = await startChat(phone)
    const welcome = start.messages ?? []
    if (start.input) {
      const reply = await continueWithSession(start.sessionId, message, phone)
      return {
        messages: [...welcome, ...(reply.messages ?? [])],
        input:    reply.input,
        isEnded:  reply.isEnded,
      }
    }
    return start
  }

  return continueWithSession(sessionId, message, phone)
}

export function typebotMessagesToText(messages: TypebotMessage[]): string[] {
  return messages
    .filter(m => m.type === "text" && m.content?.richText)
    .map(m => {
      return (m.content!.richText ?? [])
        .map(block => block.children?.map((c: any) => {
          let t = c.text ?? ""
          if (c.bold)   t = `*${t}*`
          if (c.italic) t = `_${t}_`
          return t
        }).join(""))
        .join("\n")
    })
    .filter(Boolean)
}
