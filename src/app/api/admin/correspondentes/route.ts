import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET() {
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")
    const data = await prisma.correspondente.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { leads: true } } },
    })
    return ok(data)
  } catch {
    return ok([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, telefone } = body

    if (!nome?.trim())  return err("Nome obrigatório", 400)
    if (!email?.trim()) return err("E-mail obrigatório", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const c = await prisma.correspondente.create({
      data: { nome: nome.trim(), email: email.trim(), telefone: telefone?.trim() ?? "" },
    })
    return ok(c, "Correspondente cadastrado!", 201)
  } catch (e: any) {
    if (e?.code === "P2002") return err("E-mail já cadastrado", 409)
    return err("Erro ao cadastrar correspondente", 500)
  }
}
