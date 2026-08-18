import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function supabase(path: string, opts: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = (process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "apikey": key, "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json", "Prefer": "return=representation",
      ...(opts.headers ?? {}),
    },
  })
  const text = await res.text()
  try { return { ok: res.ok, data: JSON.parse(text) } }
  catch { return { ok: res.ok, data: text } }
}

// POST — envia código
export async function POST(req: NextRequest) {
  try {
    const { userId, email, metodo } = await req.json()
    if (!userId) return err("Usuário inválido", 400)

    // Busca configuração do método
    const configRes = await supabase("configs?chave=eq.2FA_METODO&select=valor")
    const cfgMetodo = Array.isArray(configRes.data) && configRes.data[0]
      ? configRes.data[0].valor : "WHATSAPP"
    const canal = metodo ?? cfgMetodo

    const codigo    = gerarCodigo()
    const expiraEm  = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Salva no Supabase
    await supabase("codigos_2fa", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id:    userId,
        codigo,
        expira_em:  expiraEm,
        canal,
        usado:      false,
        created_at: new Date().toISOString(),
      }),
    })

    if (canal === "EMAIL" && email) {
      // Envia por e-mail via Resend
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from:    process.env.EMAIL_FROM ?? "Crédito Gold <noreply@creditogold.com.br>",
            to:      email,
            subject: "🔐 Código de verificação — Crédito Gold",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
                <div style="background:#0D1B2A;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                  <div style="font-size:22px;font-weight:900;color:#fff">
                    Crédito <span style="color:#4ade80">Gold</span><span style="color:#FF6B00">®</span>
                  </div>
                </div>
                <h2 style="color:#0D1B2A;margin-bottom:8px">Código de verificação</h2>
                <p style="color:#6b7280;margin-bottom:24px">
                  Use o código abaixo para acessar sua conta. Válido por <strong>10 minutos</strong>.
                </p>
                <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                  <div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#0f3d22">${codigo}</div>
                </div>
                <p style="color:#9ca3af;font-size:12px">
                  Se você não tentou fazer login, ignore este e-mail e sua conta continuará segura.
                </p>
              </div>
            `,
          }),
        })
      } else {
        console.warn("[2fa] RESEND_API_KEY não configurado")
      }
    } else {
      // ── WhatsApp via Z-API ──
      // Usa ADMIN_WHATSAPP como fallback (já que User não tem campo telefone)
      const adminPhone = process.env.ADMIN_WHATSAPP
      const instanceId = process.env.ZAPI_INSTANCE_ID
      const token      = process.env.ZAPI_TOKEN
      const clientToken= process.env.ZAPI_CLIENT_TOKEN

      if (!adminPhone) {
        console.warn("[2fa] ADMIN_WHATSAPP não configurado — código gerado mas não enviado:", codigo)
      } else if (!instanceId || !token) {
        console.warn("[2fa] Z-API não configurado")
      } else {
        const phone = adminPhone.startsWith("55") ? adminPhone : `55${adminPhone}`
        const res2  = await fetch(
          `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
          {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Client-Token": clientToken ?? "" },
            body: JSON.stringify({
              phone,
              message: `🔐 *Crédito Gold — Verificação de Segurança*\n\nSeu código de acesso ao painel é:\n\n*${codigo}*\n\nVálido por 10 minutos.\nNão compartilhe com ninguém.\n\n_Se não foi você tentando acessar, altere sua senha imediatamente._`,
            }),
          }
        )
        if (!res2.ok) console.error("[2fa] Erro Z-API:", res2.status)
        else console.log("[2fa] Código enviado para", phone)
      }
    }

    return ok({ canal, expiraEm }, "Código enviado!")
  } catch (e: any) {
    console.error("[2fa POST]", e.message)
    return err("Erro ao enviar código", 500)
  }
}

// PUT — verifica código
export async function PUT(req: NextRequest) {
  try {
    const { userId, codigo } = await req.json()
    if (!userId || !codigo) return err("Dados inválidos", 400)

    const agora = new Date().toISOString()
    const res = await supabase(
      `codigos_2fa?user_id=eq.${userId}&codigo=eq.${codigo}&usado=eq.false&expira_em=gt.${agora}&select=*&order=created_at.desc&limit=1`
    )

    if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) {
      return err("Código inválido ou expirado", 401)
    }

    // Marca como usado
    await supabase(`codigos_2fa?user_id=eq.${userId}&codigo=eq.${codigo}`, {
      method:  "PATCH",
      headers: { "Prefer": "return=minimal" },
      body:    JSON.stringify({ usado: true }),
    })

    return ok({ verificado: true }, "Código verificado!")
  } catch (e: any) {
    console.error("[2fa PUT]", e.message)
    return err("Erro ao verificar código", 500)
  }
}
