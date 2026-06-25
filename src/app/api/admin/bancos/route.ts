import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET() {
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")
    const bancos = await prisma.bancoPromotora.findMany({
      orderBy: { nome: "asc" },
      include: { produtos: true, _count: { select: { leads: true } } },
    })
    return ok(bancos)
  } catch { return ok([]) }
}

export async function POST(req: NextRequest) {
  try {
    const { nome, tipo, produtos } = await req.json()
    if (!nome?.trim()) return err("Nome obrigatório", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const banco = await prisma.bancoPromotora.create({
      data: {
        nome: nome.trim(),
        tipo: tipo ?? "BANCO",
        produtos: produtos?.length ? {
          create: produtos.map((p: any) => ({
            produto:                  p.produto,
            comissaoCG:               parseFloat(p.comissaoCG)               || 0,
            percentualAfiliado:       parseFloat(p.percentualAfiliado)       || 0,
            percentualCorrespondente: parseFloat(p.percentualCorrespondente) || 0,
          }))
        } : undefined,
      },
      include: { produtos: true },
    })
    return ok(banco, "Banco/Promotora cadastrado!", 201)
  } catch (e: any) {
    console.error("[bancos POST]", e)
    return err("Erro ao cadastrar", 500)
  }
}
