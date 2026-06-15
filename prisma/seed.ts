/**
 * Seed — popula o banco com dados iniciais para desenvolvimento
 * Rodar com: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { encrypt, hashCpf } from "../src/lib/crypto"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // ── Usuários de sistema ────────────────────────────────────────
  const adminPass = await bcrypt.hash("Admin@123", 12)
  const finPass   = await bcrypt.hash("Fin@123",   12)

  const admin = await prisma.user.upsert({
    where:  { email: "admin@creditogold.com.br" },
    update: {},
    create: {
      nome:     "Administrador",
      email:    "admin@creditogold.com.br",
      password: adminPass,
      role:     "ADMIN",
    },
  })

  await prisma.user.upsert({
    where:  { email: "financeiro@creditogold.com.br" },
    update: {},
    create: {
      nome:     "Equipe Financeiro",
      email:    "financeiro@creditogold.com.br",
      password: finPass,
      role:     "FINANCEIRO",
    },
  })

  console.log("✅ Usuários criados")

  // ── Afiliado de exemplo ────────────────────────────────────────
  const afiliado = await prisma.afiliado.upsert({
    where:  { slug: "joao123" },
    update: {},
    create: {
      nome:           "João Silva",
      cpf:            encrypt("123.456.789-09"),
      cpfHash:        hashCpf("123.456.789-09"),
      telefone:       "(21) 99999-9999",
      email:          "joao@email.com",
      slug:           "joao123",
      status:         "ATIVO",
      nivel:          "GOLD",
      totalCliques:   248,
      totalLeads:     42,
      totalAprovados: 18,
      totalComissoes: 4200,
    },
  })

  console.log("✅ Afiliado criado:", afiliado.slug)

  // ── Leads de exemplo ───────────────────────────────────────────
  const leadsData = [
    { nome: "Marcos Alves",   email: "marcos@email.com",   cpf: "111.222.333-44", telefone: "(21) 98821-3344", produto: "PESSOAL",     valor: 8000,  parcelas: 24, parcelaMensal: 465.20, status: "NOVO",             origem: "AFILIADO"  },
    { nome: "Ana Rodrigues",  email: "ana@email.com",      cpf: "222.333.444-55", telefone: "(11) 98765-4321", produto: "GARANTIA",    valor: 45000, parcelas: 60, parcelaMensal: 983.15, status: "EM_ANALISE",       origem: "AFILIADO"  },
    { nome: "Carlos Mendes",  email: "carlos@email.com",   cpf: "333.444.555-66", telefone: "(31) 97654-3210", produto: "CONSIGNADO",  valor: 12000, parcelas: 48, parcelaMensal: 352.80, status: "APROVADO",         origem: "ORGANICO"  },
    { nome: "Fernanda Lima",  email: "fernanda@email.com", cpf: "444.555.666-77", telefone: "(85) 99234-5678", produto: "FGTS",        valor: 3200,  parcelas: 12, parcelaMensal: 298.40, status: "APROVADO",         origem: "WHATSAPP"  },
    { nome: "Roberto Costa",  email: "roberto@email.com",  cpf: "555.666.777-88", telefone: "(71) 98123-4567", produto: "EMPRESARIAL", valor: 80000, parcelas: 36, parcelaMensal: 2840.0, status: "PROPOSTA_ENVIADA", origem: "AFILIADO"  },
  ]

  for (const ld of leadsData) {
    await prisma.lead.upsert({
      where:  { cpfHash: hashCpf(ld.cpf) } as any,
      update: {},
      create: {
        nome:          ld.nome,
        email:         ld.email,
        cpf:           encrypt(ld.cpf),
        cpfHash:       hashCpf(ld.cpf),
        telefone:      ld.telefone,
        produto:       ld.produto as any,
        valor:         ld.valor,
        parcelas:      ld.parcelas,
        parcelaMensal: ld.parcelaMensal,
        status:        ld.status as any,
        origem:        ld.origem as any,
        afiliadoId:    ld.origem === "AFILIADO" ? afiliado.id : null,
      },
    })
  }

  console.log("✅ Leads de exemplo criados")

  // ── Configs iniciais ───────────────────────────────────────────
  const configs = [
    { chave: "WHATSAPP_ATIVO",      valor: "false",  descricao: "Habilita envio de mensagens WhatsApp" },
    { chave: "EMAIL_ATIVO",         valor: "false",  descricao: "Habilita envio de e-mails" },
    { chave: "COMISSAO_PESSOAL",    valor: "100",    descricao: "Comissão por lead aprovado — Crédito Pessoal (R$)" },
    { chave: "COMISSAO_GARANTIA",   valor: "350",    descricao: "Comissão por lead aprovado — Com Garantia (R$)" },
    { chave: "COMISSAO_EMPRESARIAL",valor: "250",    descricao: "Comissão por lead aprovado — Empresarial (R$)" },
    { chave: "COMISSAO_CONSIGNADO", valor: "120",    descricao: "Comissão por lead aprovado — Consignado (R$)" },
    { chave: "COMISSAO_FGTS",       valor: "80",     descricao: "Comissão por lead aprovado — FGTS (R$)" },
  ]

  for (const c of configs) {
    await prisma.config.upsert({
      where:  { chave: c.chave },
      update: {},
      create: c,
    })
  }

  console.log("✅ Configurações iniciais criadas")
  console.log("")
  console.log("🎉 Seed concluído!")
  console.log("")
  console.log("Credenciais de acesso:")
  console.log("  Admin:      admin@creditogold.com.br     / Admin@123")
  console.log("  Financeiro: financeiro@creditogold.com.br / Fin@123")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
