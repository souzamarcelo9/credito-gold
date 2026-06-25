import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }      = await params
    const { bancoId } = await req.json()
    if (!bancoId) return err("bancoId obrigatório", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    // Busca lead e banco com produto
    const [lead, banco] = await Promise.all([
      prisma.lead.findUnique({ where: { id }, include: { afiliado: true, correspondente: true } }),
      prisma.bancoPromotora.findUnique({
        where: { id: bancoId },
        include: { produtos: true },
      }),
    ])

    if (!lead)  return err("Lead não encontrado", 404)
    if (!banco) return err("Banco não encontrado", 404)

    // Vincula banco ao lead
    await prisma.lead.update({ where: { id }, data: { bancoId } })

    // Calcula comissões se lead já está aprovado
    let comissoes = null
    if (lead.status === "APROVADO") {
      comissoes = await calcularComissoes(prisma, lead, banco)
    }

    return ok({ bancoId, comissoes }, "Banco vinculado ao lead!")
  } catch (e) {
    console.error("[leads/banco POST]", e)
    return err("Erro ao vincular banco", 500)
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const lead = await prisma.lead.findUnique({
      where:   { id },
      include: { banco: { include: { produtos: true } } },
    })
    if (!lead) return err("Lead não encontrado", 404)
    return ok(lead.banco)
  } catch { return err("Erro", 500) }
}

/**
 * Calcula e distribui comissões baseado na config do banco/produto
 */
async function calcularComissoes(prisma: any, lead: any, banco: any) {
  const produtoBanco = banco.produtos?.find(
    (p: any) => p.produto === lead.produto && p.ativo
  )
  if (!produtoBanco) return null

  // Comissão total recebida pela CG (% do valor do lead)
  const comissaoCG = (lead.valor * produtoBanco.comissaoCG) / 100

  // Distribuição
  const valorAfiliado       = (comissaoCG * produtoBanco.percentualAfiliado)       / 100
  const valorCorrespondente = (comissaoCG * produtoBanco.percentualCorrespondente) / 100
  const valorCG             = comissaoCG - valorAfiliado - valorCorrespondente

  // Atualiza comissão do afiliado se existir
  if (lead.afiliadoId && valorAfiliado > 0) {
    await prisma.comissao.upsert({
      where:  { leadId: lead.id },
      update: { valor: valorAfiliado },
      create: {
        leadId:     lead.id,
        afiliadoId: lead.afiliadoId,
        valor:      valorAfiliado,
        status:     "PENDENTE",
      },
    })
    await prisma.afiliado.update({
      where: { id: lead.afiliadoId },
      data:  { totalComissoes: { increment: valorAfiliado } },
    })
  }

  return {
    valorLead:          lead.valor,
    comissaoCGPct:      produtoBanco.comissaoCG,
    comissaoCGReais:    comissaoCG,
    afiliado: {
      pct:   produtoBanco.percentualAfiliado,
      valor: valorAfiliado,
    },
    correspondente: {
      pct:   produtoBanco.percentualCorrespondente,
      valor: valorCorrespondente,
    },
    creditoGold: {
      pct:   100 - produtoBanco.percentualAfiliado - produtoBanco.percentualCorrespondente,
      valor: valorCG,
    },
  }
}
