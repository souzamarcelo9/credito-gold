import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

function deveIgnorar(payload: any): boolean {
  if (payload?.fromMe === true)        return true
  if (payload?.isGroup === true)       return true
  if (payload?.isStatusReply === true) return true
  if (payload?.isNewsletter === true)  return true
  const phone = payload?.phone ?? payload?.chatId ?? ""
  if (phone.includes("@g.us"))         return true
  if (phone.includes("status"))        return true
  return false
}

function extrairTexto(payload: any): string | null {
  return payload?.text?.message ?? payload?.message?.text ?? payload?.body ?? payload?.caption ?? null
}

function extrairPhone(payload: any): string | null {
  const raw = payload?.phone ?? payload?.chatId ?? payload?.from ?? ""
  return raw.split("@")[0].replace(/\D/g, "") || null
}

async function enviarWhatsApp(phone: string, message: string): Promise<void> {
  const instanceId  = process.env.ZAPI_INSTANCE_ID
  const token       = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN
  if (!instanceId || !token) return

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Client-Token": clientToken ?? "" },
        body:    JSON.stringify({ phone, message }),
        signal:  AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) console.error("[zapi] Erro envio:", res.status, await res.text())
    else         console.log("[zapi] ✅ Enviado para", phone, "| preview:", message.slice(0, 40))
  } catch (e: any) {
    console.error("[zapi] Timeout/erro envio:", e.message)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    if (deveIgnorar(payload)) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const phone = extrairPhone(payload)
    const texto = extrairTexto(payload)

    if (!phone || !texto?.trim()) {
      return NextResponse.json({ ok: true, ignored: true, reason: "sem phone/texto" })
    }

    console.log("[zapi-webhook] Processando:", phone, "|", texto.slice(0, 50))

    const { continueChat, typebotMessagesToText } = await import("@/lib/services/typebot.service")
    const result = await continueChat(phone, texto.trim())
    const textos = typebotMessagesToText(result.messages ?? [])

    console.log("[zapi-webhook] Respostas:", textos.length)

    for (const msg of textos) {
      if (msg.trim()) {
        await enviarWhatsApp(phone, msg)
        await new Promise(r => setTimeout(r, 500))
      }
    }

    return NextResponse.json({ ok: true, phone, enviadas: textos.length })
  } catch (e: any) {
    console.error("[zapi-webhook] Erro:", e.message)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "online", service: "Crédito Gold — Z-API Bridge" })
}
