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

  // Ignora respostas ao número do admin (2FA) — evita loop com chatbot
  const adminPhone = (process.env.ADMIN_WHATSAPP ?? "").replace(/\D/g, "")
  const fromPhone  = phone.replace(/\D/g, "")
  if (adminPhone && fromPhone === adminPhone) return true

  // Ignora mensagens de sistema (2FA, notificações internas)
  const texto = payload?.text?.message ?? payload?.message?.text ?? payload?.body ?? ""
  if (texto?.startsWith("🔐")) return true

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
        signal:  AbortSignal.timeout(10000),
      }
    )
    if (!res.ok) console.error("[zapi] Erro envio:", res.status)
    else         console.log("[zapi] ✅ Enviado para", phone)
  } catch (e: any) {
    console.error("[zapi] Erro:", e.message)
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
      return NextResponse.json({ ok: true, ignored: true })
    }

    console.log("[zapi-webhook] Processando:", phone, "|", texto.slice(0, 50))

    const { processarMensagem } = await import("@/lib/services/chatbot.service")
    const respostas = await processarMensagem(phone, texto.trim())

    console.log("[zapi-webhook] Respostas:", respostas.length)

    for (const msg of respostas) {
      if (msg.trim()) {
        await enviarWhatsApp(phone, msg)
        await new Promise(r => setTimeout(r, 500))
      }
    }

    return NextResponse.json({ ok: true, phone, enviadas: respostas.length })
  } catch (e: any) {
    console.error("[zapi-webhook] Erro:", e.message)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "online", service: "Crédito Gold — WhatsApp Bot" })
}
