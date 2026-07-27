import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60 // Pro plan; no free é ignorado mas não quebra

function deveIgnorar(payload: any): boolean {
  if (payload?.fromMe === true)        return true
  if (payload?.isGroup === true)       return true
  if (payload?.isStatusReply === true) return true
  if (payload?.isNewsletter === true)  return true
  const chatId = payload?.chatId ?? payload?.phone ?? ""
  if (chatId.includes("@g.us"))        return true
  if (chatId.includes("status"))       return true
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
    if (!res.ok) console.error("[zapi] Erro envio:", res.status, await res.text())
    else console.log("[zapi] ✅ Enviado para", phone)
  } catch (e: any) {
    console.error("[zapi] Timeout envio:", e.message)
  }
}

async function processarMensagem(phone: string, texto: string) {
  try {
    const { continueChat, typebotMessagesToText } = await import("@/lib/services/typebot.service")
    const result = await continueChat(phone, texto)
    const textos = typebotMessagesToText(result.messages ?? [])
    console.log("[zapi] Respostas Typebot:", textos.length)
    for (const msg of textos) {
      if (msg.trim()) {
        await enviarWhatsApp(phone, msg)
        await new Promise(r => setTimeout(r, 600))
      }
    }
  } catch (e: any) {
    console.error("[zapi] Erro processamento:", e.message)
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  try {
    const payload = await req.json()
    console.log("[zapi-webhook] phone:", payload?.phone, "| texto:", payload?.text?.message?.slice(0,50))

    if (deveIgnorar(payload)) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const phone = extrairPhone(payload)
    const texto = extrairTexto(payload)

    if (!phone || !texto?.trim()) {
      return NextResponse.json({ ok: true, ignored: true, reason: "sem phone/texto" })
    }

    console.log("[zapi-webhook] Processando:", phone, "|", texto)

    // Processa com limite de 25s para não estourar o timeout do Vercel free (10s)
    // Se ultrapassar, retorna 200 mesmo assim para a Z-API não retentar
    try {
      await Promise.race([
        processarMensagem(phone, texto.trim()),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
      ])
    } catch (e: any) {
      console.warn("[zapi-webhook] Processamento interrompido:", e.message)
      // Ainda retorna 200 para a Z-API não reenviar o webhook
    }

    console.log("[zapi-webhook] Concluído em", Date.now() - startTime, "ms")
    return NextResponse.json({ ok: true, phone })
  } catch (e: any) {
    console.error("[zapi-webhook] Erro:", e.message)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "Crédito Gold — Z-API ↔ Typebot Bridge",
    timestamp: new Date().toISOString(),
  })
}
