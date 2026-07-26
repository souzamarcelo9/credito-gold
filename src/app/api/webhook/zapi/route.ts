import { NextRequest, NextResponse } from "next/server"

/**
 * Webhook Z-API → Typebot → Z-API
 * 
 * Configure na Z-API:
 *   URL do webhook: https://credito-gold-pi.vercel.app/api/webhook/zapi
 *   Eventos: MessageReceived (on-message)
 * 
 * Variáveis no Vercel:
 *   ZAPI_INSTANCE_ID   — ID da instância Z-API
 *   ZAPI_TOKEN         — Token Z-API
 *   ZAPI_CLIENT_TOKEN  — Client-Token (security)
 *   TYPEBOT_BOT_ID     — ID do bot Typebot
 *   TYPEBOT_API_URL    — https://typebot.io
 */

// Números a ignorar (grupos, broadcasts, status)
function deveIgnorar(payload: any): boolean {
  const phone = payload?.phone ?? payload?.chatId ?? ""
  // Ignora grupos, status do WhatsApp e mensagens próprias
  if (phone.includes("@g.us"))    return true  // grupo
  if (phone.includes("status"))   return true  // status
  if (payload?.fromMe === true)   return true  // própria mensagem enviada
  if (payload?.isGroup === true)  return true  // grupo
  return false
}

function extrairTexto(payload: any): string | null {
  // Z-API envia o texto em diferentes campos dependendo do tipo
  return (
    payload?.text?.message ??
    payload?.message ??
    payload?.text ??
    payload?.caption ??
    null
  )
}

function extrairPhone(payload: any): string | null {
  return payload?.phone ?? payload?.from ?? payload?.chatId ?? null
}

async function enviarWhatsApp(phone: string, message: string): Promise<void> {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token      = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) {
    console.warn("[zapi-webhook] ZAPI não configurado — mensagem não enviada")
    return
  }

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`

  const res = await fetch(url, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token":  clientToken ?? "",
    },
    body: JSON.stringify({ phone, message }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[zapi-webhook] Erro ao enviar:", res.status, err)
  }
}

// Fila simples para evitar processamento simultâneo do mesmo número
const processing = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Log para debug (remover em produção se quiser)
    console.log("[zapi-webhook] Recebido:", JSON.stringify(payload).slice(0, 200))

    // Ignora mensagens que não devem ser processadas
    if (deveIgnorar(payload)) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const phone = extrairPhone(payload)
    const texto = extrairTexto(payload)

    if (!phone || !texto?.trim()) {
      return NextResponse.json({ ok: true, ignored: true, reason: "sem texto" })
    }

    // Evita processamento simultâneo do mesmo número
    if (processing.has(phone)) {
      return NextResponse.json({ ok: true, queued: true })
    }
    processing.add(phone)

    try {
      const { continueChat, typebotMessagesToText } = await import(
        "@/lib/services/typebot.service"
      )

      const botId = process.env.TYPEBOT_BOT_ID
      if (!botId) {
        console.error("[zapi-webhook] TYPEBOT_BOT_ID não configurado")
        return NextResponse.json({ ok: false, error: "TYPEBOT_BOT_ID não configurado" })
      }

      // Envia mensagem ao Typebot e obtém respostas
      const result = await continueChat(phone, texto.trim())

      // Converte e envia cada mensagem de resposta
      const textos = typebotMessagesToText(result.messages ?? [])

      for (const msg of textos) {
        if (msg.trim()) {
          await enviarWhatsApp(phone, msg)
          // Pequeno delay entre mensagens para parecer mais natural
          await new Promise(r => setTimeout(r, 800))
        }
      }

      return NextResponse.json({
        ok: true,
        phone,
        mensagensEnviadas: textos.length,
        ended: result.isEnded ?? false,
      })
    } finally {
      processing.delete(phone)
    }
  } catch (e: any) {
    console.error("[zapi-webhook] Erro:", e.message)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// Z-API envia GET para verificar se o webhook está ativo
export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Crédito Gold — Z-API ↔ Typebot Bridge",
    timestamp: new Date().toISOString(),
  })
}
