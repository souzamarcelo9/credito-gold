/**
 * Serviço de Leads — camada entre a API e o banco
 * Centraliza lógica de negócio, criptografia e audit log
 */
import prisma from "@/lib/prisma"
import { encrypt, hashCpf, maskCpf } from "@/lib/crypto"
import { createAuditLog } from "@/lib/audit-log"
import { COMISSOES } from "@/config/produtos"
import type { CreateLeadDTO, LeadStatus } from "@/types"
import {
  notificarLeadAprovadoCliente,
  notificarLeadRecusadoCliente,
  notificarLeadAprovadoAfiliado,
} from "@/lib/services/zapi.service"

const PRODUTO_LABEL: Record<string, string> = {
  PESSOAL:"Crédito Pessoal", GARANTIA:"Com Garantia de Imóvel",
  EMPRESARIAL:"Crédito Empresarial", CONSIGNADO:"Consignado",
  FGTS:"Antecipação de FGTS", ENERGIA:"Empréstimo na Conta de Luz",
}

export async function createLead(data: CreateLeadDTO, ipAddress: string) {
  const cpfHash = hashCpf(data.cpf)

  // Deduplicação — mesmo CPF nas últimas 24h
  const existing = await prisma.lead.findFirst({
    where: {
      cpfHash,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  })
  if (existing) {
    throw new Error("DUPLICATE_LEAD")
  }

  // Criptografa CPF antes de salvar
  const cpfEncrypted = encrypt(data.cpf)

  const lead = await prisma.lead.create({
    data: {
      nome:          data.nome,
      email:         data.email,
      cpf:           cpfEncrypted,
      cpfHash,
      telefone:      data.telefone,
      produto:       data.produto.toUpperCase() as any,
      valor:         data.valor,
      parcelas:      data.parcelas,
      parcelaMensal: data.parcelaMensal,
      origem:        (data.origem ?? "organico").toUpperCase() as any,
      afiliadoId:    data.afiliadoId,
    },
  })

  // Incrementa contador do afiliado
  if (data.afiliadoId) {
    await prisma.afiliado.update({
      where: { id: data.afiliadoId },
      data:  { totalLeads: { increment: 1 } },
    })
  }

  // Audit log
  await createAuditLog({
    action:     "LEAD_CREATED",
    ipAddress,
    targetId:   lead.id,
    targetType: "lead",
    success:    true,
    details: {
      produto:    lead.produto,
      valor:      lead.valor,
      origem:     lead.origem,
      afiliadoId: lead.afiliadoId,
    },
  })

  return { ...lead, cpf: maskCpf(data.cpf) }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  userId: string,
  ipAddress: string
) {
  const lead = await prisma.lead.update({
    where: { id },
    data:  { status: status.toUpperCase() as any },
  })

  // Se aprovado, gera comissão para o afiliado
  if (status === "aprovado" && lead.afiliadoId) {
    const valorComissao = COMISSOES[lead.produto.toLowerCase()] ?? 100

    await prisma.comissao.upsert({
      where:  { leadId: id },
      create: {
        leadId:     id,
        afiliadoId: lead.afiliadoId,
        valor:      valorComissao,
        status:     "PENDENTE",
      },
      update: {},
    })

    await prisma.afiliado.update({
      where: { id: lead.afiliadoId },
      data: {
        totalAprovados: { increment: 1 },
        totalComissoes: { increment: valorComissao },
      },
    })
  }

  // ── Notificações Z-API ──────────────────────────────────────────
  const produtoLabel = PRODUTO_LABEL[lead.produto] ?? lead.produto

  if (status === "aprovado") {
    notificarLeadAprovadoCliente({
      nomeCliente: lead.nome,
      telefone:    lead.telefone,
      produto:     produtoLabel,
      valor:       lead.valor,
    }).catch(e => console.error("[zapi] cliente aprovado:", e))

    prisma.notificacao?.create?.({
      data: {
        tipo:        "LEAD_APROVADO" as any,
        titulo:      `Lead aprovado — ${lead.nome}`,
        mensagem:    `${lead.nome} teve o crédito de ${produtoLabel} aprovado.`,
        destinatario:"admin",
        canal:       "WHATSAPP" as any,
        enviadaZapi: true,
        leadId:      id,
      },
    }).catch(() => {})

    if (lead.afiliadoId) {
      const afiliado = await prisma.afiliado.findUnique({
        where:  { id: lead.afiliadoId },
        select: { nome: true, telefone: true },
      })
      const comissao = await prisma.comissao.findFirst({ where: { leadId: id } })
      if (afiliado?.telefone && comissao) {
        notificarLeadAprovadoAfiliado({
          nomeAfiliado:  afiliado.nome,
          telefone:      afiliado.telefone,
          nomeCliente:   lead.nome,
          produto:       produtoLabel,
          valorComissao: comissao.valor,
        }).catch(e => console.error("[zapi] afiliado aprovado:", e))
      }
    }
  }

  if (status === "recusado") {
    notificarLeadRecusadoCliente({
      nomeCliente: lead.nome,
      telefone:    lead.telefone,
      produto:     produtoLabel,
    }).catch(e => console.error("[zapi] cliente recusado:", e))

    prisma.notificacao?.create?.({
      data: {
        tipo:        "LEAD_RECUSADO" as any,
        titulo:      `Lead recusado — ${lead.nome}`,
        mensagem:    `${lead.nome} foi notificado da recusa de ${produtoLabel} via WhatsApp.`,
        destinatario:"admin",
        canal:       "WHATSAPP" as any,
        enviadaZapi: true,
        leadId:      id,
      },
    }).catch(() => {})
  }
  // ────────────────────────────────────────────────────────────────

  await createAuditLog({
    action:     "LEAD_STATUS_CHANGED",
    ipAddress,
    userId,
    targetId:   id,
    targetType: "lead",
    success:    true,
    details:    { novoStatus: status },
  })

  return lead
}

export async function listLeads(filters: {
  status?:    string
  afiliadoId?: string
  page?:      number
  limit?:     number
}) {
  const page  = filters.page  ?? 1
  const limit = filters.limit ?? 20
  const skip  = (page - 1) * limit

  const where: any = {}
  if (filters.status)     where.status     = filters.status.toUpperCase()
  if (filters.afiliadoId) where.afiliadoId = filters.afiliadoId

  const [leads, total] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: "desc" },
      include: { afiliado: { select: { slug: true, nome: true } } },
    }),
    prisma.lead.count({ where }),
  ])

  // Mascara CPF em todos os leads
  const safeleads = leads.map((l: any) => ({ ...l, cpf: maskCpf("") }))

  return {
    data:       safeleads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}
