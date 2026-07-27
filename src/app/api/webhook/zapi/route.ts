import { NextRequest, NextResponse } from "next/server"

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
  return (
    payload?.text?.message ??
    payload?.message?.text ??
    payload?.body          ??
    payload?.caption       ??
    null
  )
}

function extrairPhone(payload: any): string | null {
  const raw = payload?.phone ?? payload?.chatId ?? payload?.from ?? ""
  return raw.split("@")[0].replace(/\D/g, "") || null
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

    console.log("[zapi-webhook] Recebido:", phone, "|", texto?.slice(0, 50))

    // Dispara processamento assíncrono sem aguardar
    const host    = req.headers.get("host") ?? "credito-gold-pi.vercel.app"
    const proto   = host.includes("localhost") ? "http" : "https"
    const baseUrl = `${proto}://${host}`

    // Fire-and-forget: chama o endpoint de processamento sem await
    fetch(`${baseUrl}/api/webhook/zapi-process`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-internal": "1" },
      body:    JSON.stringify({ phone, texto: texto.trim() }),
    }).catch(e => console.error("[zapi-webhook] dispatch erro:", e.message))

    // Responde imediatamente para a Z-API não dar timeout
    return NextResponse.json({ ok: true, phone, queued: true })
  } catch (e: any) {
    console.error("[zapi-webhook] Erro:", e.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "online", service: "Crédito Gold — Z-API Bridge" })
}
