import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone  = searchParams.get("phone") ?? "5521999999999"
  const msg    = searchParams.get("msg")   ?? "oi"
  const action = searchParams.get("action") ?? "chat"

  // Mostra configuração atual
  if (action === "config") {
    return ok({
      TYPEBOT_BOT_ID:    process.env.TYPEBOT_BOT_ID    ?? "NÃO CONFIGURADO",
      TYPEBOT_API_URL:   process.env.TYPEBOT_API_URL   ?? "https://typebot.io (padrão)",
      TYPEBOT_PUBLIC_ID: process.env.TYPEBOT_PUBLIC_ID ?? "igual ao BOT_ID",
      ZAPI_INSTANCE_ID:  process.env.ZAPI_INSTANCE_ID  ? "✅ configurado" : "❌ não configurado",
    })
  }

  // Testa conexão direta com a API do Typebot
  if (action === "ping") {
    const botId  = process.env.TYPEBOT_BOT_ID ?? ""
    const apiUrl = process.env.TYPEBOT_API_URL ?? "https://typebot.io"
    try {
      const res = await fetch(`${apiUrl}/api/v1/typebots/${botId}/startChat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStreamEnabled: false }),
      })
      const text = await res.text()
      return ok({ status: res.status, url: `${apiUrl}/api/v1/typebots/${botId}/startChat`, response: text.slice(0, 300) })
    } catch (e: any) {
      return err(`Ping falhou: ${e.message}`, 500)
    }
  }

  // Teste completo de chat
  try {
    const botId = process.env.TYPEBOT_BOT_ID
    if (!botId) return err("TYPEBOT_BOT_ID não configurado no Vercel", 500)

    const { continueChat, typebotMessagesToText } = await import("@/lib/services/typebot.service")
    const result = await continueChat(phone, msg)
    const textos = typebotMessagesToText(result.messages ?? [])

    return ok({
      phone, mensagem: msg,
      respostas:  textos,
      totalMsgs:  result.messages?.length ?? 0,
      input:      result.input?.type ?? null,
      ended:      result.isEnded ?? false,
    })
  } catch (e: any) {
    return err(e.message, 500)
  }
}
