/**
 * Z-API WhatsApp Service
 * Variáveis necessárias no Vercel:
 *   ZAPI_INSTANCE_ID  — ID da instância Z-API
 *   ZAPI_TOKEN        — Token de autenticação Z-API
 *   ZAPI_CLIENT_TOKEN — Client-Token (Security Token no painel Z-API)
 *   ADMIN_WHATSAPP    — Número do admin para alertas (ex: 5521999999999)
 */

const ZAPI_BASE = () => {
  const id = process.env.ZAPI_INSTANCE_ID
  return `https://api.z-api.io/instances/${id}/token/${process.env.ZAPI_TOKEN}`
}

const HEADERS = () => ({
  "Content-Type": "application/json",
  "Client-Token":  process.env.ZAPI_CLIENT_TOKEN ?? "",
})

/** Formata número para padrão Z-API (somente dígitos, com DDI 55) */
function formatPhone(telefone: string): string {
  const digits = telefone.replace(/\D/g, "")
  if (digits.startsWith("55") && digits.length >= 12) return digits
  return `55${digits}`
}

/** Envia mensagem de texto simples */
async function sendText(telefone: string, message: string): Promise<boolean> {
  if (!process.env.ZAPI_INSTANCE_ID || !process.env.ZAPI_TOKEN) {
    console.warn("[zapi] Variáveis não configuradas — mensagem não enviada")
    return false
  }
  try {
    const res = await fetch(`${ZAPI_BASE()}/send-text`, {
      method:  "POST",
      headers: HEADERS(),
      body: JSON.stringify({ phone: formatPhone(telefone), message }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error("[zapi] Erro ao enviar:", res.status, body)
      return false
    }
    return true
  } catch (e) {
    console.error("[zapi] Exceção:", e)
    return false
  }
}

// ─── Templates de mensagem ──────────────────────────────────────────

/** 1. Lead aprovado → cliente */
export async function notificarLeadAprovadoCliente(params: {
  nomeCliente: string
  telefone:    string
  produto:     string
  valor:       number
}) {
  const msg = `✅ *Crédito Aprovado!*

Olá, *${params.nomeCliente}*! 🎉

Temos uma ótima notícia: sua solicitação de *${params.produto}* no valor de *R$ ${params.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}* foi *aprovada*!

Nossa equipe entrará em contato em breve para finalizar os detalhes e informar o prazo de liberação.

Qualquer dúvida, é só responder esta mensagem.

_Crédito Gold — Soluções Financeiras_ 💛`

  return sendText(params.telefone, msg)
}

/** 2. Lead recusado → cliente */
export async function notificarLeadRecusadoCliente(params: {
  nomeCliente: string
  telefone:    string
  produto:     string
}) {
  const msg = `⚠️ *Atualização da sua solicitação*

Olá, *${params.nomeCliente}*.

Infelizmente, após análise, não foi possível aprovar sua solicitação de *${params.produto}* no momento.

Isso não significa que é definitivo! Alguns fatores podem ser ajustados para uma nova tentativa. Nossa equipe pode orientar você sobre os próximos passos.

👉 Entre em contato pelo WhatsApp para saber mais sobre as alternativas disponíveis.

_Crédito Gold — Soluções Financeiras_ 💛`

  return sendText(params.telefone, msg)
}

/** 3. Lead aprovado → afiliado */
export async function notificarLeadAprovadoAfiliado(params: {
  nomeAfiliado:  string
  telefone:      string
  nomeCliente:   string
  produto:       string
  valorComissao: number
}) {
  const msg = `🎯 *Comissão gerada!*

Olá, *${params.nomeAfiliado}*! 💰

Seu cliente *${params.nomeCliente}* teve o crédito de *${params.produto}* aprovado!

💸 *Comissão: R$ ${params.valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*

O valor será processado e disponibilizado em até 30 dias após a liberação do crédito.

Acompanhe no seu painel: creditogold.com.br/painel-afiliado

Continue indicando e aumentando seus ganhos! 🚀

_Crédito Gold — Soluções Financeiras_ 💛`

  return sendText(params.telefone, msg)
}

/** 4. Documento vencendo → admin */
export async function notificarDocumentoVencendo(params: {
  tituloDoc:  string
  diasRestantes: number
  categoria:  string
}) {
  const adminPhone = process.env.ADMIN_WHATSAPP
  if (!adminPhone) {
    console.warn("[zapi] ADMIN_WHATSAPP não configurado")
    return false
  }

  const urgencia = params.diasRestantes <= 7 ? "🔴 *URGENTE*" : "⚠️ *Atenção*"

  const msg = `${urgencia} — Documento vencendo

📋 *${params.tituloDoc}*
📁 Categoria: ${params.categoria}
📅 Vence em: *${params.diasRestantes} dia${params.diasRestantes !== 1 ? "s" : ""}*

Acesse o sistema para renovar ou arquivar:
👉 creditogold.com.br/admin/documentos

_Crédito Gold — Sistema Interno_ 🔒`

  return sendText(adminPhone, msg)
}

/** Utilitário: notifica múltiplos documentos vencendo */
export async function verificarENotificarDocumentos(prisma: any) {
  try {
    const hoje    = new Date()
    const em30    = new Date(hoje)
    em30.setDate(hoje.getDate() + 30)

    const docs = await prisma.documentoInterno.findMany({
      where: {
        status:         { not: "ARQUIVADO" },
        dataVencimento: { gte: hoje, lte: em30 },
      },
    })

    const CATS: Record<string, string> = {
      EMPRESA:"Empresa", CORRESPONDENTE:"Correspondente", AFILIADO:"Afiliado",
      BANCO_PARCEIRO:"Banco Parceiro", JURIDICO:"Jurídico", CONTABIL:"Contábil", OUTROS:"Outros",
    }

    for (const doc of docs) {
      const dias = Math.ceil((new Date(doc.dataVencimento).getTime() - hoje.getTime()) / (1000*60*60*24))
      await notificarDocumentoVencendo({
        tituloDoc:    doc.titulo,
        diasRestantes: dias,
        categoria:    CATS[doc.categoria] ?? doc.categoria,
      })
      // Pequeno delay para não sobrecarregar a API
      await new Promise(r => setTimeout(r, 500))
    }

    return docs.length
  } catch (e) {
    console.error("[zapi] verificarDocumentos:", e)
    return 0
  }
}
