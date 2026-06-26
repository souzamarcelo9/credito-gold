import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mes = searchParams.get("mes") // formato YYYY-MM
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")
    const where: any = {}
    if (mes) {
      const [year, month] = mes.split("-").map(Number)
      where.data = {
        gte: new Date(year, month - 1, 1),
        lt:  new Date(year, month, 1),
      }
    }
    const despesas = await (prisma as any).despesa.findMany({
      where,
      orderBy: { data: "desc" },
    })
    return ok(despesas)
  } catch { return ok([]) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { descricao, categoria, valor, data } = body
    if (!descricao?.trim()) return err("Descrição obrigatória", 400)
    if (!valor || valor <= 0) return err("Valor inválido", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const despesa = await (prisma as any).despesa.create({
      data: {
        descricao: descricao.trim(),
        categoria: categoria ?? "OPERACIONAL",
        valor:     parseFloat(valor),
        data:      data ? new Date(data) : new Date(),
      },
    })
    return ok(despesa, "Despesa cadastrada!", 201)
  } catch (e) {
    console.error("[despesas POST]", e)
    return err("Erro ao cadastrar despesa", 500)
  }
}
