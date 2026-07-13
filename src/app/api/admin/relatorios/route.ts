import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tipo     = searchParams.get("tipo")     ?? "aprovados"
  const dataInicio = searchParams.get("dataInicio") ?? undefined
  const dataFim    = searchParams.get("dataFim")    ?? undefined
  const produto    = searchParams.get("produto")    ?? undefined

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const where: any = { status: "APROVADO" }

    if (produto)     where.produto = produto.toUpperCase()
    if (dataInicio || dataFim) {
      where.updatedAt = {}
      if (dataInicio) where.updatedAt.gte = new Date(dataInicio)
      if (dataFim)    where.updatedAt.lte = new Date(dataFim + "T23:59:59")
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        afiliado:     { select: { nome: true, slug: true } },
        comissao:     { select: { valor: true, status: true } },
        banco:        { select: { nome: true } },
        correspondente: {
          include: { correspondente: { select: { nome: true } } }
        },
      },
    })

    // Totalizadores
    const totalValor     = leads.reduce((s, l) => s + l.valor, 0)
    const totalComissoes = leads.reduce((s, l) => s + ((l as any).comissao?.valor ?? 0), 0)

    // Por produto
    const porProduto: Record<string, { qtd: number; valor: number }> = {}
    leads.forEach((l: any) => {
      if (!porProduto[l.produto]) porProduto[l.produto] = { qtd: 0, valor: 0 }
      porProduto[l.produto].qtd++
      porProduto[l.produto].valor += l.valor
    })

    // Por afiliado
    const porAfiliado: Record<string, { nome: string; qtd: number; comissao: number }> = {}
    leads.forEach((l: any) => {
      if (!l.afiliadoId) return
      const nome = l.afiliado?.nome ?? l.afiliadoId
      if (!porAfiliado[l.afiliadoId]) porAfiliado[l.afiliadoId] = { nome, qtd: 0, comissao: 0 }
      porAfiliado[l.afiliadoId].qtd++
      porAfiliado[l.afiliadoId].comissao += l.comissao?.valor ?? 0
    })

    return ok({
      leads: leads.map((l: any) => ({
        id:           l.id,
        nome:         l.nome,
        telefone:     l.telefone,
        produto:      l.produto,
        valor:        l.valor,
        banco:        l.banco?.nome ?? "—",
        afiliado:     l.afiliado?.nome ?? "Orgânico",
        correspondente: l.correspondente?.correspondente?.nome ?? "—",
        comissao:     l.comissao?.valor ?? 0,
        statusComissao: l.comissao?.status ?? "—",
        dataAprovacao: l.updatedAt,
      })),
      totais: {
        qtd:          leads.length,
        valorTotal:   totalValor,
        comissoes:    totalComissoes,
      },
      porProduto,
      porAfiliado: Object.values(porAfiliado).sort((a, b) => b.qtd - a.qtd),
    })
  } catch (e) {
    console.error("[relatorios GET]", e)
    return err("Erro ao gerar relatório", 500)
  }
}
