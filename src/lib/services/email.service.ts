/**
 * Email Service — Resend
 *
 * Variáveis no Vercel:
 *   RESEND_API_KEY     — re_...
 *   EMAIL_FROM         — noreply@creditogold.com.br
 *   EMAIL_ADMIN        — admin@creditogold.com.br
 */

const RESEND_API = "https://api.resend.com/emails"
const FROM       = process.env.EMAIL_FROM  ?? "Crédito Gold <noreply@creditogold.com.br>"
const ADMIN      = process.env.EMAIL_ADMIN ?? "admin@creditogold.com.br"

async function send(to: string | string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("[email] RESEND_API_KEY não configurado — e-mail não enviado")
    return { ok: false, skipped: true }
  }

  const res = await fetch(RESEND_API, {
    method:  "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error("[email] Erro Resend:", data)
    return { ok: false, error: data }
  }

  console.log("[email] Enviado para:", to, "| id:", data.id)
  return { ok: true, id: data.id }
}

// ── Templates ────────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Crédito Gold</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0a2e1a,#0f3d22);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
              Crédito <span style="color:#4ade80;">Gold</span><span style="color:#FF6B00;">®</span>
            </div>
            <div style="font-size:10px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-top:4px;">
              Soluções Financeiras
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
              © 2026 Crédito Gold Soluções Financeiras. Todos os direitos reservados.<br/>
              Este e-mail foi enviado automaticamente, por favor não responda.
            </p>
            <div style="margin-top:12px;">
              <a href="https://credito-gold-pi.vercel.app" style="color:#0f3d22;font-size:11px;text-decoration:none;">Ver site</a>
              &nbsp;·&nbsp;
              <a href="https://credito-gold-pi.vercel.app/ajuda" style="color:#0f3d22;font-size:11px;text-decoration:none;">Central de Ajuda</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btnPrimary(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#0f3d22;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">${label}</a>`
}

function divider() {
  return `<div style="height:1px;background:linear-gradient(to right,#0f3d22,#FF6B00,#0f3d22);margin:28px 0;opacity:0.15;"></div>`
}

// ── 1. Boas-vindas afiliado ──────────────────────────────────────────
export async function emailBoasVindasAfiliado(params: {
  email:  string
  nome:   string
  link:   string
  slug:   string
}) {
  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:16px;">🎉</div>
      <h1 style="margin:0;font-size:26px;font-weight:900;color:#0D1B2A;">
        Bem-vindo(a) ao programa<br/>de <span style="color:#0f3d22;">afiliados</span>!
      </h1>
      <p style="margin:12px 0 0;font-size:15px;color:#6b7280;">
        Olá, <strong>${params.nome}</strong>! Seu link exclusivo está pronto.
      </p>
    </div>

    ${divider()}

    <p style="font-size:14px;color:#374151;line-height:1.7;">
      Parabéns por se cadastrar no <strong>Programa de Afiliados da Crédito Gold</strong>!
      A partir de agora você pode indicar clientes e ganhar comissões a cada crédito aprovado.
    </p>

    <!-- Link de indicação -->
    <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Seu link exclusivo</p>
      <p style="margin:0;font-size:14px;font-weight:700;color:#0f3d22;word-break:break-all;">${params.link}</p>
    </div>

    <!-- Comissões -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        ${[
          { icon:"💰", label:"Comissão", val:"até R$ 350" },
          { icon:"📅", label:"Pagamento", val:"30 dias via PIX" },
          { icon:"📊", label:"Painel", val:"tempo real" },
        ].map(i => `
          <td style="text-align:center;padding:16px;background:#f9fafb;border-radius:12px;margin:4px;" width="33%">
            <div style="font-size:24px;">${i.icon}</div>
            <div style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-top:6px;">${i.label}</div>
            <div style="font-size:13px;font-weight:700;color:#0D1B2A;margin-top:2px;">${i.val}</div>
          </td>
        `).join('<td width="8px"></td>')}
      </tr>
    </table>

    ${divider()}

    <div style="text-align:center;margin-top:28px;">
      ${btnPrimary("https://credito-gold-pi.vercel.app/login", "Acessar meu painel →")}
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
        Compartilhe seu link e comece a ganhar agora mesmo!
      </p>
    </div>
  `)

  return send(params.email, "🎉 Bem-vindo(a) ao Programa de Afiliados — Crédito Gold", html)
}

// ── 2. Lead aprovado → cliente ───────────────────────────────────────
export async function emailLeadAprovado(params: {
  email:    string
  nome:     string
  produto:  string
  valor?:   number
}) {
  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:16px;">✅</div>
      <h1 style="margin:0;font-size:26px;font-weight:900;color:#0D1B2A;">
        Seu crédito foi <span style="color:#0f3d22;">aprovado</span>!
      </h1>
      <p style="margin:12px 0 0;font-size:15px;color:#6b7280;">
        Parabéns, <strong>${params.nome}</strong>!
      </p>
    </div>

    ${divider()}

    <p style="font-size:14px;color:#374151;line-height:1.7;">
      Temos uma ótima notícia! Sua solicitação de <strong>${params.produto}</strong>
      foi analisada e <strong style="color:#0f3d22;">aprovada</strong> pela nossa equipe.
    </p>

    ${params.valor ? `
    <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Valor aprovado</p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#0f3d22;">
        R$ ${params.valor.toLocaleString("pt-BR", { minimumFractionDigits:2 })}
      </p>
    </div>` : ""}

    <p style="font-size:14px;color:#374151;line-height:1.7;">
      Um de nossos especialistas entrará em contato em breve para finalizar os detalhes
      e orientar sobre os próximos passos.
    </p>

    ${divider()}

    <div style="background:#fff3e8;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>📱 Fique atento ao seu WhatsApp!</strong><br/>
        Nossa equipe entrará em contato pelo número cadastrado para concluir o processo.
      </p>
    </div>

    <div style="text-align:center;margin-top:28px;">
      ${btnPrimary("https://wa.me/5561982503427", "💬 Falar com especialista")}
    </div>
  `)

  return send(params.email, "✅ Seu crédito foi aprovado — Crédito Gold", html)
}

// ── 3. Lead recusado → cliente ───────────────────────────────────────
export async function emailLeadRecusado(params: {
  email:   string
  nome:    string
  produto: string
  motivo?: string
}) {
  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:16px;">😔</div>
      <h1 style="margin:0;font-size:26px;font-weight:900;color:#0D1B2A;">
        Atualização sobre sua<br/>solicitação de crédito
      </h1>
      <p style="margin:12px 0 0;font-size:15px;color:#6b7280;">
        Olá, <strong>${params.nome}</strong>.
      </p>
    </div>

    ${divider()}

    <p style="font-size:14px;color:#374151;line-height:1.7;">
      Agradecemos por escolher a <strong>Crédito Gold</strong> para sua solicitação de
      <strong>${params.produto}</strong>.
    </p>

    <p style="font-size:14px;color:#374151;line-height:1.7;">
      Após análise cuidadosa do seu perfil, infelizmente não foi possível aprovar
      sua solicitação neste momento.
      ${params.motivo ? `<br/><br/><em>Motivo: ${params.motivo}</em>` : ""}
    </p>

    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
        <strong>💡 Não desanime!</strong><br/>
        Nossos especialistas podem indicar outras opções de crédito que se adequem
        ao seu perfil. Entre em contato conosco para explorar alternativas.
      </p>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.7;">
      Você pode tentar novamente em 60 dias ou entrar em contato com nossa equipe
      para verificar outras opções disponíveis.
    </p>

    ${divider()}

    <div style="text-align:center;margin-top:28px;">
      ${btnPrimary("https://wa.me/5561982503427", "💬 Explorar outras opções")}
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
        Estamos à disposição para ajudá-lo(a) a encontrar a melhor solução.
      </p>
    </div>
  `)

  return send(params.email, "Atualização sobre sua solicitação — Crédito Gold", html)
}

// ── 4. Afiliado notificado sobre lead aprovado ───────────────────────
export async function emailLeadAprovadoAfiliado(params: {
  email:      string
  nomeAfil:   string
  nomeCliente:string
  produto:    string
  comissao:   number
}) {
  const html = baseTemplate(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:16px;">💰</div>
      <h1 style="margin:0;font-size:26px;font-weight:900;color:#0D1B2A;">
        Comissão <span style="color:#0f3d22;">liberada</span>!
      </h1>
      <p style="margin:12px 0 0;font-size:15px;color:#6b7280;">
        Boa notícia, <strong>${params.nomeAfil}</strong>!
      </p>
    </div>

    ${divider()}

    <p style="font-size:14px;color:#374151;line-height:1.7;">
      Um cliente que você indicou teve o crédito <strong style="color:#0f3d22;">aprovado</strong>!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:#f9fafb;border-radius:12px;padding:20px;" width="48%">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Cliente</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0D1B2A;">${params.nomeCliente}</p>
        </td>
        <td width="4%"></td>
        <td style="background:#f9fafb;border-radius:12px;padding:20px;" width="48%">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Produto</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#0D1B2A;">${params.produto}</p>
        </td>
      </tr>
    </table>

    <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Sua comissão</p>
      <p style="margin:0;font-size:36px;font-weight:900;color:#0f3d22;">
        R$ ${params.comissao.toLocaleString("pt-BR", { minimumFractionDigits:2 })}
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Disponível para saque em 30 dias</p>
    </div>

    ${divider()}

    <div style="text-align:center;margin-top:28px;">
      ${btnPrimary("https://credito-gold-pi.vercel.app/login", "Ver meu painel →")}
    </div>
  `)

  return send(
    params.email,
    `💰 Comissão de R$ ${params.comissao.toFixed(2).replace(".", ",")} liberada — Crédito Gold`,
    html
  )
}
