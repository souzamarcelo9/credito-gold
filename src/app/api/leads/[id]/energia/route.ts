import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body   = await req.json()

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    // Verifica se o lead existe e é do produto ENERGIA
    const lead = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return err("Lead não encontrado", 404)

    // Upsert nos dados de energia
    await prisma.leadEnergia.upsert({
      where:  { leadId: id },
      update: {
        concessionaria:      body.concessionaria      || null,
        numeroInstalacao:    body.numeroInstalacao    || null,
        numeroCliente:       body.numeroCliente       || null,
        titularConta:        body.titularConta        || null,
        cpfTitular:          body.cpfTitular          || null,
        valorMedioFatura:    body.valorMedioFatura    ?? null,
        possuiDebitos:       body.possuiDebitos       ?? false,
        dataVencimento:      body.dataVencimento      || null,
        observacoesInternas: body.observacoesInternas || null,
        updatedAt:           new Date(),
      },
      create: {
        leadId:              id,
        concessionaria:      body.concessionaria      || null,
        numeroInstalacao:    body.numeroInstalacao    || null,
        numeroCliente:       body.numeroCliente       || null,
        titularConta:        body.titularConta        || null,
        cpfTitular:          body.cpfTitular          || null,
        valorMedioFatura:    body.valorMedioFatura    ?? null,
        possuiDebitos:       body.possuiDebitos       ?? false,
        dataVencimento:      body.dataVencimento      || null,
        observacoesInternas: body.observacoesInternas || null,
      },
    })

    return ok({ leadId: id }, "Dados da conta de energia salvos com sucesso")
  } catch (e) {
    console.error("[leads/energia POST]", e)
    return err("Erro ao salvar dados", 500)
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const dados = await prisma.leadEnergia.findUnique({ where: { leadId: id } })
    return ok(dados)
  } catch (e) {
    return err("Erro ao buscar dados", 500)
  }
}
