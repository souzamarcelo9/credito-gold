import prisma from "@/lib/prisma"
import { encrypt, hashCpf } from "@/lib/crypto"
import { slugify } from "@/lib/utils"
import { createAuditLog } from "@/lib/audit-log"
import type { CreateAfiliadoDTO } from "@/types"

export async function createAfiliado(data: CreateAfiliadoDTO, ipAddress: string) {
  const cpfHash = hashCpf(data.cpf)

  // CPF duplicado
  const existing = await prisma.afiliado.findFirst({ where: { cpfHash } })
  if (existing) throw new Error("DUPLICATE_CPF")

  const slug = slugify(data.nome) + Math.floor(Math.random() * 900 + 100)

  const afiliado = await prisma.afiliado.create({
    data: {
      nome:            data.nome,
      cpf:             encrypt(data.cpf),
      cpfHash,
      telefone:        data.telefone,
      email:           data.email || null,
      slug,
      codigoIndicacao: data.codigoIndicacao || null,
    },
  })

  await createAuditLog({
    action:     "AFILIADO_CREATED",
    ipAddress,
    targetId:   afiliado.id,
    targetType: "afiliado",
    success:    true,
    details:    { slug, nivel: afiliado.nivel },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://creditogold.com.br"
  return {
    afiliado: { ...afiliado, cpf: "[PROTEGIDO]" },
    link:     `${baseUrl}/ref/${slug}`,
  }
}

export async function getAfiliadoBySlug(slug: string) {
  return prisma.afiliado.findUnique({
    where:   { slug },
    include: {
      leads:    { select: { id: true, status: true, produto: true, createdAt: true } },
      comissoes:{ select: { valor: true, status: true, paidAt: true } },
    },
  })
}

export async function listAfiliados(page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const [afiliados, total] = await prisma.$transaction([
    prisma.afiliado.findMany({
      skip, take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, nome: true, slug: true, status: true, nivel: true,
        totalCliques: true, totalLeads: true, totalAprovados: true,
        totalComissoes: true, createdAt: true, email: true, telefone: true,
      },
    }),
    prisma.afiliado.count(),
  ])
  return { data: afiliados, total, page, totalPages: Math.ceil(total / limit) }
}

export async function incrementClique(slug: string) {
  return prisma.afiliado.update({
    where: { slug },
    data:  { totalCliques: { increment: 1 } },
  })
}
