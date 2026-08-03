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

  // Email duplicado
  if (data.email) {
    const emailExist = await prisma.user.findUnique({ where: { email: data.email } })
    if (emailExist) throw new Error("DUPLICATE_EMAIL")
  }

  const slug = slugify(data.nome) + Math.floor(Math.random() * 900 + 100)

  // Hash da senha para o User
  const bcrypt = await import("bcryptjs")
  const senhaHash = await bcrypt.hash(data.senha ?? data.cpf.replace(/\D/g, "").slice(0, 8), 10)

  // Cria User + Afiliado em transação
  const result = await prisma.$transaction(async (tx) => {
    // Cria o User para autenticação
    const user = await tx.user.create({
      data: {
        nome:     data.nome,
        email:    data.email ?? `${slug}@afiliado.creditogold.com.br`,
        password: senhaHash,
        role:     "AFILIADO",
        ativo:    true,
      },
    })

    // Cria o Afiliado vinculado ao User
    const afiliado = await tx.afiliado.create({
      data: {
        nome:            data.nome,
        cpf:             encrypt(data.cpf),
        cpfHash,
        telefone:        data.telefone,
        email:           data.email || null,
        slug,
        codigoIndicacao: data.codigoIndicacao || null,
        userId:          user.id,
      },
    })

    return { user, afiliado }
  })

  await createAuditLog({
    action:     "AFILIADO_CREATED",
    ipAddress,
    targetId:   result.afiliado.id,
    targetType: "afiliado",
    success:    true,
    details:    { slug, nivel: result.afiliado.nivel },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://creditogold.com.br"
  return {
    afiliado: { ...result.afiliado, cpf: "[PROTEGIDO]" },
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
