import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

async function enviarWhatsApp(phone: string, message: string): Promise<void> {
  const instanceId  = process.env.ZAPI_INSTANCE_ID
  const token       = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN
  if (!instanceId || !token) return

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`
  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Client-Token": clientToken ?? "" },
      body:    JSON.stringify({ phone, message }),
      signal:  AbortSignal.timeout(15000),
    })
    if (!res.ok) console.error("[zapi-process] Erro envio:", res.status, await res.text())
    else         console.log("[zapi-process] ✅ Enviado para", phone, "| msg:", message.slice(0, 40))
  } catch (e: any) {
    console.error("[zapi-process] Timeout envio:", e.message)
  }
}

export async function POST(req: NextRequest) {
  // Só aceita chamadas internas
  const internal = req.headers.get("x-internal")
  if (internal !== "1") {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  try {
    const { phone, texto } = await req.json()
    if (!phone || !texto) return NextResponse.json({ ok: false })

    console.log("[zapi-process] Iniciando:", phone, "|", texto)

    const { continueChat, typebotMessagesToText } = await import("@/lib/services/typebot.service")
    const result = await continueChat(phone, texto)
    const textos = typebotMessagesToText(result.messages ?? [])

    console.log("[zapi-process] Respostas:", textos.length)

    for (const msg of textos) {
      if (msg.trim()) {
        await enviarWhatsApp(phone, msg)
        await new Promise(r => setTimeout(r, 600))
      }
    }

    return NextResponse.json({ ok: true, enviadas: textos.length })
  } catch (e: any) {
    console.error("[zapi-process] Erro:", e.message)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
