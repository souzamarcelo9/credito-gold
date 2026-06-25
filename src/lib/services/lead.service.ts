/**
 * Serviço de Leads — camada entre a API e o banco
 * Centraliza lógica de negócio, criptografia e audit log
 */
import prisma from "@/lib/prisma"
import { encrypt, hashCpf, maskCpf } from "@/lib/crypto"
import { createAuditLog } from "@/lib/audit-log"
import { COMISSOES } from "@/config/produtos"
import type { CreateLeadDTO, LeadStatus } from "@/types"

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
    include: {
      banco: { include: { produtos: true } },
    },
  })

  // Se aprovado, gera comissão para o afiliado
  if (status === "aprovado" && lead.afiliadoId) {
    let valorComissao = COMISSOES[lead.produto.toLowerCase()] ?? 100

    // Se tem banco vinculado com config do produto, usa o cálculo proporcional
    const produtoBanco = (lead as any).banco?.produtos?.find(
      (p: any) => p.produto === lead.produto && p.ativo
    )
    if (produtoBanco) {
      const comissaoCG  = (lead.valor * produtoBanco.comissaoCG) / 100
      valorComissao     = (comissaoCG * produtoBanco.percentualAfiliado) / 100
    }

    await prisma.comissao.upsert({
      where:  { leadId: id },
      create: {
        leadId:     id,
        afiliadoId: lead.afiliadoId,
        valor:      valorComissao,
        status:     "PENDENTE",
      },
      update: { valor: valorComissao },
    })

    await prisma.afiliado.update({
      where: { id: lead.afiliadoId },
      data: {
        totalAprovados: { increment: 1 },
        totalComissoes: { increment: valorComissao },
      },
    })
  }

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
