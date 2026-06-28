import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

// Atualiza status automaticamente baseado no vencimento
function calcStatus(dataVencimento?: Date | null): string {
  if (!dataVencimento) return "VALIDO"
  const hoje  = new Date()
  const diff  = (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0)  return "VENCIDO"
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

    const where: any = {}
    if (categoria) where.categoria = categoria
    if (status)    where.status    = status
    if (search)    where.OR = [
      { titulo:      { contains: search, mode: "insensitive" } },
      { responsavel: { contains: search, mode: "insensitive" } },
      { descricao:   { contains: search, mode: "insensitive" } },
    ]

    // Atualiza status de vencimento antes de retornar
    const docs = await (prisma as any).documentoInterno.findMany({
      where,
      orderBy: [{ dataVencimento: "asc" }, { createdAt: "desc" }],
    })

    // Atualiza status automaticamente
    const updates = docs
      .filter((d: any) => {
        const newStatus = d.status === "ARQUIVADO" ? "ARQUIVADO" : calcStatus(d.dataVencimento)
        return newStatus !== d.status
      })
    if (updates.length > 0) {
      await Promise.all(updates.map((d: any) =>
        (prisma as any).documentoInterno.update({
          where: { id: d.id },
          data:  { status: calcStatus(d.dataVencimento) },
        })
      ))
    }

    // Busca novamente com status atualizado
    const result = await (prisma as any).documentoInterno.findMany({
      where, orderBy: [{ dataVencimento: "asc" }, { createdAt: "desc" }],
    })

    // Stats
    const todos   = await (prisma as any).documentoInterno.findMany()
    const stats = {
      total:    todos.length,
      validos:  todos.filter((d: any) => d.status === "VALIDO").length,
      vencendo: todos.filter((d: any) => d.status === "VENCENDO").length,
      vencidos: todos.filter((d: any) => d.status === "VENCIDO").length,
    }

    return ok({ documentos: result, stats })
  } catch { return ok({ documentos: [], stats: { total:0, validos:0, vencendo:0, vencidos:0 } }) }
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
        categoria:      categoria      ?? "EMPRESA",
        descricao:      descricao      ?? null,
        responsavel:    responsavel    ?? null,
        arquivoNome:    arquivoNome    ?? null,
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
