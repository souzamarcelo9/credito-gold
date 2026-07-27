import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const phone  = searchParams.get("phone") ?? "5521999999999"
  const msg    = searchParams.get("msg")   ?? "oi"
  const action = searchParams.get("action") ?? "chat"

  const botId    = process.env.TYPEBOT_BOT_ID    ?? ""
  const publicId = process.env.TYPEBOT_PUBLIC_ID ?? botId

  if (action === "config") {
    return ok({
      TYPEBOT_BOT_ID:    botId    || "❌ não configurado",
      TYPEBOT_PUBLIC_ID: publicId || "❌ não configurado",
      TYPEBOT_API_URL:   process.env.TYPEBOT_API_URL ?? "https://typebot.io (padrão)",
      ZAPI_INSTANCE_ID:  process.env.ZAPI_INSTANCE_ID ? "✅" : "❌ não configurado",
    })
  }

  // Testa todas as combinações possíveis de URL + ID
  if (action === "ping") {
    const combinacoes = [
      { url: `https://app.typebot.io/api/v1/typebots/${publicId}/startChat`, desc: "app.typebot.io + publicId" },
      { url: `https://app.typebot.io/api/v1/typebots/${botId}/startChat`,    desc: "app.typebot.io + botId"   },
      { url: `https://typebot.io/api/v1/typebots/${publicId}/startChat`,     desc: "typebot.io + publicId"    },
      { url: `https://typebot.io/api/v1/typebots/${botId}/startChat`,        desc: "typebot.io + botId"       },
    ]

    const resultados: any[] = []
    for (const c of combinacoes) {
      try {
        const res  = await fetch(c.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isStreamEnabled: false }),
        })
        const text = await res.text()
        resultados.push({
          desc:     c.desc,
          status:   res.status,
          ok:       res.ok,
          response: text.slice(0, 200),
        })
        // Para na primeira que funcionar
        if (res.ok) break
      } catch (e: any) {
        resultados.push({ desc: c.desc, erro: e.message })
      }
    }
    return ok({ botId, publicId, resultados })
  }

  // Teste completo de chat
  try {
    if (!botId) return err("TYPEBOT_BOT_ID não configurado no Vercel", 500)
    const { continueChat, typebotMessagesToText } = await import("@/lib/services/typebot.service")
    const result = await continueChat(phone, msg)
    const textos = typebotMessagesToText(result.messages ?? [])
    return ok({
      phone, mensagem: msg,
      respostas:    textos,
      totalMsgs:    result.messages?.length ?? 0,
      input:        result.input?.type ?? null,
      ended:        result.isEnded ?? false,
      // DEBUG — mostra estrutura raw das mensagens
      rawMessages:  result.messages?.slice(0, 2) ?? [],
    })
  } catch (e: any) {
    return err(e.message, 500)
  }
}
