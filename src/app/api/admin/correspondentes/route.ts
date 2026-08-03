import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET() {
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    // Verifica se o modelo existe no cliente Prisma
    if (!(prisma as any).correspondente) {
      console.error("[correspondentes] modelo não existe no Prisma client — rode prisma generate")
      return ok([])
    }

    const data = await (prisma as any).correspondente.findMany({
      orderBy: { nome: "asc" },
    })
    return ok(data)
  } catch (e: any) {
    console.error("[correspondentes GET]", e.message)
    return ok([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, telefone, cidade, estado } = body

    if (!nome?.trim()) return err("Nome obrigatório", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    if (!(prisma as any).correspondente) {
      return err("Tabela de correspondentes não encontrada. Execute prisma generate e migrate.", 500)
    }

    const c = await (prisma as any).correspondente.create({
      data: {
        id:       crypto.randomUUID(),
        nome:     nome.trim(),
        email:    email?.trim() ?? "",
        telefone: telefone?.trim() ?? "",
        cidade:   cidade?.trim() ?? "",
        estado:   estado?.trim() ?? "",
        updatedAt: new Date(),
      },
    })
    return ok(c, "Correspondente cadastrado!", 201)
  } catch (e: any) {
    console.error("[correspondentes POST]", e.message, e.code)
    if (e?.code === "P2002") return err("E-mail já cadastrado", 409)
    if (e?.message?.includes("does not exist")) {
      return err("Tabela não existe no banco. Execute o SQL de migration no Supabase.", 500)
    }
    return err(`Erro ao cadastrar: ${e.message}`, 500)
  }
}
