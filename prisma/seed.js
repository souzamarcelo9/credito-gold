const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const crypto = require("crypto")

const prisma = new PrismaClient()

function encrypt(value) {
  const key = Buffer.from((process.env.ENCRYPTION_KEY ?? "dev-encryption-key-32-chars-long!!").padEnd(32).slice(0, 32))
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return `${iv.toString("base64")}:${encrypted.toString("base64")}`
}

function hashCpf(cpf) {
  const clean = cpf.replace(/\D/g, "")
  return crypto.createHash("sha256")
    .update(clean + (process.env.CPF_HASH_SALT ?? "credito-gold-salt"))
    .digest("hex")
}

async function main() {
  console.log("🌱 Iniciando seed...")

  const adminPass = await bcrypt.hash("Admin@123", 12)
  const finPass   = await bcrypt.hash("Fin@123",   12)
  const afiliadoPass = await bcrypt.hash("Afil@123", 12)

  await prisma.user.upsert({
    where:  { email: "admin@creditogold.com.br" },
    update: {},
    create: { nome: "Administrador", email: "admin@creditogold.com.br", password: adminPass, role: "ADMIN" },
  })

  await prisma.user.upsert({
    where:  { email: "financeiro@creditogold.com.br" },
    update: {},
    create: { nome: "Equipe Financeiro", email: "financeiro@creditogold.com.br", password: finPass, role: "FINANCEIRO" },
  })

  await prisma.user.upsert({
  where:  { email: "afiliado@creditogold.com.br" },
  update: {},
  create: {
    nome:     "João Afiliado",
    email:    "afiliado@creditogold.com.br",
    password: afiliadoPass,
    role:     "AFILIADO",
  },
})

  console.log("✅ Usuários criados")

  const afiliado = await prisma.afiliado.upsert({
    where:  { slug: "joao123" },
    update: {},
    create: {
      nome: "João Silva", cpf: encrypt("123.456.789-09"),
      cpfHash: hashCpf("123.456.789-09"), telefone: "(21) 99999-9999",
      email: "joao@email.com", slug: "joao123", status: "ATIVO",
      nivel: "GOLD", totalCliques: 248, totalLeads: 42,
      totalAprovados: 18, totalComissoes: 4200,
    },
  })

  console.log("✅ Afiliado criado:", afiliado.slug)

  const configs = [
    { chave: "WHATSAPP_ATIVO",       valor: "false" },
    { chave: "EMAIL_ATIVO",          valor: "false" },
    { chave: "COMISSAO_PESSOAL",     valor: "100"   },
    { chave: "COMISSAO_GARANTIA",    valor: "350"   },
    { chave: "COMISSAO_EMPRESARIAL", valor: "250"   },
    { chave: "COMISSAO_CONSIGNADO",  valor: "120"   },
    { chave: "COMISSAO_FGTS",        valor: "80"    },
  ]

  for (const c of configs) {
    await prisma.config.upsert({
      where: { chave: c.chave }, update: {}, create: c,
    })
  }

  console.log("✅ Configs criadas")
  console.log("🎉 Seed concluído!")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())