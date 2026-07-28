import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }     = await params
    const { status, observacao } = await req.json()
    const prisma     = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const saque = await (prisma as any).saqueComissao.update({
      where: { id },
      data: {
        status,
        observacao: observacao ?? null,
      },
    })
    return ok(saque, `Saque ${status.toLowerCase()}!`)
  } catch { return err("Erro ao atualizar", 500) }
}
