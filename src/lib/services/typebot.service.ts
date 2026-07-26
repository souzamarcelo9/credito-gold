/**
 * Typebot Session Service
 * Gerencia sessões de conversa entre Z-API e Typebot
 * 
 * Variáveis necessárias no Vercel:
 *   TYPEBOT_BOT_ID     — ID do bot criado (ex: cm...)
 *   TYPEBOT_API_URL    — https://typebot.io (padrão cloud)
 */

const TYPEBOT_API  = process.env.TYPEBOT_API_URL ?? "https://typebot.io"
const BOT_ID       = process.env.TYPEBOT_BOT_ID ?? ""

// Armazena sessões em memória (Vercel serverless — suficiente para MVP)
// Em produção com alto volume, migrar para Redis/Supabase
const sessions = new Map<string, { sessionId: string; expiresAt: number }>()

function getSession(phone: string) {
  const s = sessions.get(phone)
  if (s && s.expiresAt > Date.now()) return s
  sessions.delete(phone)
  return null
}

function saveSession(phone: string, sessionId: string) {
  sessions.set(phone, {
    sessionId,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 min de inatividade
  })
}

function clearSession(phone: string) {
  sessions.delete(phone)
}

/**
 * Inicia uma nova conversa no Typebot
 */
async function startChat(phone: string): Promise<{
  sessionId: string
  messages: TypebotMessage[]
  input?: any
}> {
  const res = await fetch(
    `${TYPEBOT_API}/api/v1/typebots/${BOT_ID}/startChat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isStreamEnabled: false,
        startFrom: { type: "group", groupId: undefined },
        prefilledVariables: { whatsappOrigem: phone },
        isOnlyRegistering: false,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Typebot startChat error: ${res.status} ${err}`)
  }

  const data = await res.json()
  saveSession(phone, data.sessionId)
  return data
}

/**
 * Continua uma conversa existente enviando a resposta do usuário
 */
async function continueChat(
  phone: string,
  message: string
): Promise<{ messages: TypebotMessage[]; input?: any; isEnded?: boolean }> {
  const session = getSession(phone)

  // Sem sessão → inicia nova conversa
  if (!session) {
    const start = await startChat(phone)
    // Se o bot já espera input na abertura, envia a mensagem
    if (start.input) {
      return continueWithSession(start.sessionId, message, phone)
    }
    return start
  }

  return continueWithSession(session.sessionId, message, phone)
}

async function continueWithSession(
  sessionId: string,
  message: string,
  phone: string
) {
  const res = await fetch(
    `${TYPEBOT_API}/api/v1/typebots/${BOT_ID}/continueChat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        message,
      }),
    }
  )

  if (!res.ok) {
    // Sessão expirou no Typebot → inicia nova
    if (res.status === 400 || res.status === 404) {
      clearSession(phone)
      const start = await startChat(phone)
      if (start.input) {
        return continueWithSession(start.sessionId, message, phone)
      }
      return start
    }
    const err = await res.text()
    throw new Error(`Typebot continueChat error: ${res.status} ${err}`)
  }

  const data = await res.json()

  // Se a conversa terminou, limpa a sessão
  if (data.isEnded) clearSession(phone)

  return data
}

export interface TypebotMessage {
  type: "text" | "image" | "video" | "audio" | "embed" | "custom-embed"
  content: {
    richText?: Array<{ type: string; children: Array<{ text: string }> }>
    url?: string
    html?: string
  }
}

/**
 * Converte mensagens do Typebot em texto plano para o WhatsApp
 */
export function typebotMessagesToText(messages: TypebotMessage[]): string[] {
  return messages
    .filter(m => m.type === "text" && m.content?.richText)
    .map(m => {
      const lines = (m.content.richText ?? [])
        .map(block =>
          (block.children ?? [])
            .map((c: any) => {
              let t = c.text ?? ""
              if (c.bold)   t = `*${t}*`
              if (c.italic) t = `_${t}_`
              return t
            })
            .join("")
        )
      return lines.join("\n")
    })
    .filter(Boolean)
}

export { startChat, continueChat, clearSession, getSession }
