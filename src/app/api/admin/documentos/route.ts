import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

function calcStatus(dataVencimento?: Date | null): string {
  if (!dataVencimento) return "VALIDO"
  const diff = (dataVencimento.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)   return "VENCIDO"
  if (diff <= 30) return "VENCENDO"
  return "VALIDO"
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get("categoria") ?? undefined
  const status    = searchParams.get("status")    ?? undefined
  const search    = searchParams.get("search")    ?? undefined

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    // Atualiza status expirados automaticamente
    const expirados = await (prisma as any).documentoInterno.findMany({
      where: {
        status:        { not: "ARQUIVADO" },
        dataVencimento: { not: null },
      },
    })
    const updates = expirados.filter((d: any) => {
      const novo = calcStatus(d.dataVencimento)
      return novo !== d.status
    })
    if (updates.length > 0) {
      await Promise.all(updates.map((d: any) =>
        (prisma as any).documentoInterno.update({
          where: { id: d.id },
          data:  { status: calcStatus(d.dataVencimento) },
        })
      ))
    }

    // Busca filtrada
    const where: any = {}
    if (categoria) where.categoria = categoria
    if (status)    where.status    = status
    if (search)    where.OR = [
      { titulo:      { contains: search, mode: "insensitive" } },
      { responsavel: { contains: search, mode: "insensitive" } },
    ]

    const documentos = await (prisma as any).documentoInterno.findMany({
      where,
      orderBy: [{ dataVencimento: "asc" }, { createdAt: "desc" }],
    })

    // Stats gerais
    const todos = await (prisma as any).documentoInterno.findMany()
    const stats = {
      total:    todos.length,
      validos:  todos.filter((d: any) => d.status === "VALIDO").length,
      vencendo: todos.filter((d: any) => d.status === "VENCENDO").length,
      vencidos: todos.filter((d: any) => d.status === "VENCIDO").length,
    }

    // Dados para gráfico de pizza — por categoria
    const CATS = ["EMPRESA","CORRESPONDENTE","AFILIADO","BANCO_PARCEIRO","JURIDICO","CONTABIL","OUTROS"]
    const porCategoria = CATS.map(cat => ({
      categoria: cat,
      total: todos.filter((d: any) => d.categoria === cat).length,
    })).filter(c => c.total > 0)

    // Dados para gráfico de linha — últimos 30 dias
    const hoje = new Date()
    const linhas: Array<{ data: string; validos: number; vencendo: number; vencidos: number }> = []
    for (let i = 29; i >= 0; i--) {
      const dia = new Date(hoje)
      dia.setDate(hoje.getDate() - i)
      dia.setHours(0, 0, 0, 0)
      const diaStr = dia.toISOString().slice(0, 10)
      const criados = todos.filter((d: any) => new Date(d.createdAt) <= dia)
      linhas.push({
        data:     diaStr,
        validos:  criados.filter((d: any) => d.status === "VALIDO").length,
        vencendo: criados.filter((d: any) => d.status === "VENCENDO").length,
        vencidos: criados.filter((d: any) => d.status === "VENCIDO").length,
      })
    }

    return ok({ documentos, stats, porCategoria, linhas })
  } catch {
    return ok({ documentos: [], stats: { total:0, validos:0, vencendo:0, vencidos:0 }, porCategoria: [], linhas: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, categoria, descricao, responsavel, dataEmissao, dataVencimento, arquivoNome } = body
    if (!titulo?.trim()) return err("Título obrigatório", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const venc   = dataVencimento ? new Date(dataVencimento) : null
    const status = venc ? calcStatus(venc) : "VALIDO"

    const doc = await (prisma as any).documentoInterno.create({
      data: {
        titulo:         titulo.trim(),
        categoria:      categoria   ?? "EMPRESA",
        descricao:      descricao   ?? null,
        responsavel:    responsavel ?? null,
        arquivoNome:    arquivoNome ?? null,
        dataEmissao:    dataEmissao    ? new Date(dataEmissao)    : null,
        dataVencimento: venc,
        status,
      },
    })
    return ok(doc, "Documento cadastrado!", 201)
  } catch (e) {
    console.error("[documentos POST]", e)
    return err("Erro ao cadastrar", 500)
  }
}
