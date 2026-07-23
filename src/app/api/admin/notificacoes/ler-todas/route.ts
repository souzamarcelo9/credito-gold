import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function POST(req: NextRequest) {
  try {
    const { dest } = await req.json()
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    await (prisma as any).notificacao.updateMany({
      where: { destinatario: dest ?? "admin", lida: false },
      data:  { lida: true },
    })
    return ok(null, "Todas marcadas como lidas")
  } catch { return err("Erro", 500) }
}
