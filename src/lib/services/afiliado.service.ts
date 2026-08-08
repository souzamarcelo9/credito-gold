import { encrypt, hashCpf } from "@/lib/crypto"
import prisma from "@/lib/prisma"

function slugify(nome: string) {
  return nome.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 30)
}

async function createAuditLog(data: any) {
  try { await (prisma as any).auditLog?.create({ data }) } catch {}
}

export async function createAfiliado(data: {
  nome: string; cpf: string; telefone: string
  email?: string; codigoIndicacao?: string; senha?: string
}, ipAddress: string) {
  const cpfHash = hashCpf(data.cpf)

  const existing = await prisma.afiliado.findFirst({ where: { cpfHash } })
  if (existing) throw new Error("DUPLICATE_CPF")

  if (data.email) {
    const emailExist = await prisma.user.findUnique({ where: { email: data.email } })
    if (emailExist) throw new Error("DUPLICATE_EMAIL")
  }

  const slug = slugify(data.nome) + Math.floor(Math.random() * 900 + 100)
  const bcrypt = await import("bcryptjs")
  const senhaHash = await bcrypt.hash(data.senha ?? data.cpf.replace(/\D/g, "").slice(0, 8), 10)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        nome:     data.nome,
        email:    data.email ?? `${slug}@afiliado.creditogold.com.br`,
        password: senhaHash,
        role:     "AFILIADO",
        ativo:    true,
      },
    })
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
    action: "AFILIADO_CREATED", ipAddress,
    targetId: result.afiliado.id, targetType: "afiliado",
    success: true, details: { slug },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://creditogold.com.br"
  const link    = `${baseUrl}/ref/${slug}`

  // E-mail de boas-vindas
  try {
    if (data.email) {
      const { emailBoasVindasAfiliado } = await import("@/lib/services/email.service")
      await emailBoasVindasAfiliado({ email: data.email, nome: data.nome, link, slug })
    }
  } catch (emailErr: any) {
    console.error("[createAfiliado] Erro e-mail:", emailErr.message)
  }

  return {
    afiliado: { ...result.afiliado, cpf: "[PROTEGIDO]" },
    link,
  }
}
