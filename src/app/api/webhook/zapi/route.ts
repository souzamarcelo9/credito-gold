import { NextRequest, NextResponse } from "next/server"

function deveIgnorar(payload: any): boolean {
  if (payload?.fromMe === true)        return true
  if (payload?.isGroup === true)       return true
  if (payload?.isStatusReply === true) return true
  const chatId = payload?.chatId ?? payload?.phone ?? ""
  if (chatId.includes("@g.us"))        return true
  if (chatId.includes("status"))       return true
  if (chatId.includes("broadcast"))    return true
  return false
}

function extrairTexto(payload: any): string | null {
  return (
    payload?.text?.message   ??
    payload?.message?.text   ??
    payload?.body            ??
    payload?.message         ??
    payload?.text            ??
    payload?.caption         ??
    null
  )
}

function extrairPhone(payload: any): string | null {
  // Z-API Business usa chatId no formato "5561999999999@lid" ou "@s.whatsapp.net"
  const raw = payload?.phone ?? payload?.chatId ?? payload?.from ?? ""
  const digits = raw.split("@")[0].replace(/\D/g, "")
  return digits || null
}

async function enviarWhatsApp(phone: string, message: string): Promise<void> {
  const instanceId  = process.env.ZAPI_INSTANCE_ID
  const token       = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) {
    console.warn("[zapi] ZAPI não configurado")
    return
  }

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token":  clientToken ?? "",
      },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(10000), // timeout 10s
    })
    if (!res.ok) {
      const err = await res.text()
      console.error("[zapi] Erro ao enviar:", res.status, err)
    } else {
      console.log("[zapi] Mensagem enviada para", phone)
    }
  } catch (e: any) {
    console.error("[zapi] Timeout ou erro ao enviar:", e.message)
  }
}

const processing = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log("[zapi-webhook] Recebido FULL:", JSON.stringify(payload))

    if (deveIgnorar(payload)) {
      console.log("[zapi-webhook] Ignorado — fromMe/grupo/status")
      return NextResponse.json({ ok: true, ignored: true })
    }

    const phone = extrairPhone(payload)
    const texto = extrairTexto(payload)

    console.log("[zapi-webhook] phone:", phone, "| texto:", texto)

    if (!phone || !texto?.trim()) {
      return NextResponse.json({ ok: true, ignored: true, reason: "sem phone ou texto" })
    }

    if (processing.has(phone)) {
      return NextResponse.json({ ok: true, queued: true })
    }
    processing.add(phone)

    // Responde imediatamente ao webhook para não dar timeout na Z-API
    // e processa em background
    const responsePromise = (async () => {
      try {
        const { continueChat, typebotMessagesToText } = await import(
          "@/lib/services/typebot.service"
        )

        const result = await continueChat(phone, texto.trim())
        const textos = typebotMessagesToText(result.messages ?? [])

        console.log("[zapi-webhook] Respostas do Typebot:", textos.length)

        for (const msg of textos) {
          if (msg.trim()) {
            await enviarWhatsApp(phone, msg)
            await new Promise(r => setTimeout(r, 800))
          }
        }
      } catch (e: any) {
        console.error("[zapi-webhook] Erro no processamento:", e.message)
      } finally {
        processing.delete(phone)
      }
    })()

    // Aguarda com timeout de 25s (limite Vercel serverless)
    await Promise.race([
      responsePromise,
      new Promise(r => setTimeout(r, 25000)),
    ])

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
