import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const c = await prisma.correspondente.update({
      where: { id },
      data:  { ativo: body.ativo },
    })
    return ok(c, "Correspondente atualizado!")
  } catch {
    return err("Erro ao atualizar", 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    await prisma.correspondente.delete({ where: { id } })
    return ok(null, "Correspondente removido!")
  } catch {
    return err("Erro ao remover", 500)
  }
}
