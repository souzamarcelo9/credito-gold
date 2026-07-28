import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

/**
 * Webhook recebido pelo Typebot após coleta do lead via WhatsApp
 * Autenticado via header x-typebot-secret
 */
export async function POST(req: NextRequest) {
  // Validação do secret
  const secret = req.headers.get("x-typebot-secret")
  if (secret !== (process.env.TYPEBOT_SECRET ?? "cg-typebot-2026")) {
    return err("Não autorizado", 401)
  }

  try {
    const body = await req.json()

    const {
      nome, cpf, telefone, cidade,
      produto, produtoLabel, perfil,
      tipoCliente, consentimentoLGPD,
      consentimentoData, canal, origem,
    } = body

    // Validações básicas
    if (!nome?.trim())     return err("Nome obrigatório", 400)
    if (!cpf?.trim())      return err("CPF obrigatório", 400)
    if (!telefone?.trim()) return err("Telefone obrigatório", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    // Importa serviço de leads e cripto
    const { encrypt, hashCpf } = await import("@/lib/crypto")

    const cpfLimpo = cpf.replace(/\D/g, "")
    const cpfHash  = hashCpf(cpfLimpo)

    // Deduplicação — mesmo CPF nas últimas 24h
    const existing = await prisma.lead.findFirst({
      where: {
        cpfHash,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })

    if (existing) {
      // Retorna o lead existente sem erro — Typebot segue o fluxo normalmente
      return ok({ id: existing.id, duplicado: true }, "Lead já cadastrado nas últimas 24h")
    }

    // Mapeamento de produto do Typebot → enum do sistema
    const PRODUTO_MAP: Record<string, string> = {
      CONSIGNADO:  "CONSIGNADO",
      FGTS:        "FGTS",
      PESSOAL:     "PESSOAL",
      EMPRESARIAL: "EMPRESARIAL",
      ENERGIA:     "ENERGIA",
      GARANTIA:    "GARANTIA",
      PARCEIRO:    "PESSOAL",     // redireciona para pessoal por ora
      ESPECIALISTA:"PESSOAL",
    }
    const produtoEnum = PRODUTO_MAP[produto?.toUpperCase()] ?? "PESSOAL"

    // Cria o lead
    const lead = await prisma.lead.create({
      data: {
        nome:          nome.trim(),
        email:         `whatsapp+${cpfHash.slice(0,8)}@creditogold.com.br`, // placeholder
        cpf:           encrypt(cpfLimpo),
        cpfHash,
        telefone:      telefone.replace(/\D/g, ""),
        produto:       produtoEnum as any,
        valor:         0,           // será preenchido pelo operador
        parcelas:      12,          // default
        parcelaMensal: 0,
        origem:        "WHATSAPP" as any,
        status:        "NOVO" as any,
      },
    })

    // Registra consentimento LGPD como AuditLog
    if (consentimentoLGPD) {
      await (prisma as any).auditLog?.create?.({
        data: {
          action:     "LGPD_CONSENT",
          targetId:   lead.id,
          targetType: "lead",
          success:    true,
          details: {
            consentimento: true,
            canal:         canal ?? "WHATSAPP",
            data:          consentimentoData ?? new Date().toISOString(),
            perfil:        perfil ?? null,
            tipoCliente:   tipoCliente ?? null,
            cidade:        cidade ?? null,
            produtoLabel:  produtoLabel ?? null,
          },
        },
      }).catch(() => {})
    }

    // Notificação interna — novo lead via WhatsApp
    await (prisma as any).notificacao?.create?.({
      data: {
        tipo:         "LEAD_NOVO" as any,
        titulo:       `Novo lead via WhatsApp — ${nome.trim()}`,
        mensagem:     `${nome.trim()} solicitou ${produtoLabel ?? produtoEnum} pelo chatbot WhatsApp. Cidade: ${cidade ?? "não informada"}. Perfil: ${perfil ?? "não informado"}.`,
        destinatario: "admin",
        canal:        "SISTEMA" as any,
        leadId:       lead.id,
      },
    }).catch(() => {})

    // Notifica operador via Z-API
    const adminPhone = process.env.ADMIN_WHATSAPP
    if (adminPhone && process.env.ZAPI_INSTANCE_ID) {
      const { notificarLeadAprovadoCliente } = await import("@/lib/services/zapi.service")
      const zapiBase = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`
      fetch(`${zapiBase}/send-text`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Token":  process.env.ZAPI_CLIENT_TOKEN ?? "",
        },
        body: JSON.stringify({
          phone: adminPhone,
          message: `🆕 *Novo lead via WhatsApp!*\n\n👤 *Nome:* ${nome.trim()}\n📱 *Telefone:* ${telefone}\n🏙️ *Cidade:* ${cidade ?? "—"}\n💼 *Produto:* ${produtoLabel ?? produtoEnum}\n👔 *Perfil:* ${perfil ?? "—"}\n✅ *LGPD:* Autorizado\n\nAcesse o painel para atender:\ncreditogold.com.br/admin/leads`,
        }),
      }).catch(e => console.error("[webhook/typebot] zapi admin:", e))
    }

    return ok(
      { id: lead.id, nome: lead.nome, produto: produtoEnum },
      "Lead criado com sucesso!"
    )
  } catch (e: any) {
    console.error("[webhook/typebot]", e)
    return err("Erro ao processar lead", 500)
  }
}

// Permite verificação de saúde pelo Typebot
export async function GET() {
  return ok({ status: "online", service: "Crédito Gold Typebot Webhook" })
}
