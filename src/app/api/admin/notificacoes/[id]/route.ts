import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

// Marcar como lida
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    const notif = await (prisma as any).notificacao.update({
      where: { id }, data: { lida: true },
    })
    return ok(notif, "Marcada como lida")
  } catch { return err("Erro", 500) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    await (prisma as any).notificacao.delete({ where: { id } })
    return ok(null, "Removida")
  } catch { return err("Erro", 500) }
}
