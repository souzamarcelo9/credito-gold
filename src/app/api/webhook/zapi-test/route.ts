import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

/**
 * Endpoint de teste — simula uma mensagem recebida da Z-API
 * GET /api/webhook/zapi-test?phone=5521999999999&msg=1
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone = searchParams.get("phone") ?? "5521999999999"
  const msg   = searchParams.get("msg")   ?? "1"

  try {
    const { continueChat, typebotMessagesToText } = await import(
      "@/lib/services/typebot.service"
    )

    const botId = process.env.TYPEBOT_BOT_ID
    if (!botId) return err("TYPEBOT_BOT_ID não configurado no Vercel", 500)

    const result = await continueChat(phone, msg)
    const textos = typebotMessagesToText(result.messages ?? [])

    return ok({
      phone,
      mensagem:   msg,
      respostas:  textos,
      input:      result.input?.type ?? null,
      ended:      result.isEnded ?? false,
    })
  } catch (e: any) {
    return err(e.message, 500)
  }
}
