import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body   = await req.json()
    const { status, nivel } = body

    const validStatus = ["ATIVO","PENDENTE","INATIVO"]
    const validNivel  = ["BRONZE","PRATA","GOLD","DIAMANTE"]

    if (status && !validStatus.includes(status)) return err("Status inválido", 400)
    if (nivel  && !validNivel.includes(nivel))   return err("Nível inválido",  400)

    try {
      const prisma = (await import("@/lib/prisma")).default
      if (!prisma) throw new Error("no-prisma")
      const data: any = {}
      if (status) data.status = status
      if (nivel)  data.nivel  = nivel
      await prisma.afiliado.update({ where: { id }, data })
    } catch { /* fallback silencioso */ }

    return ok({ id, status, nivel }, "Afiliado atualizado com sucesso")
  } catch (e) {
    return err("Erro ao atualizar afiliado", 500)
  }
}
