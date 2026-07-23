import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const apenasNaoLidas = searchParams.get("naoLidas") === "true"
  const dest           = searchParams.get("dest") ?? "admin"

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const where: any = { destinatario: dest }
    if (apenasNaoLidas) where.lida = false

    const [notificacoes, totalNaoLidas] = await Promise.all([
      (prisma as any).notificacao.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      (prisma as any).notificacao.count({ where: { destinatario: dest, lida: false } }),
    ])

    return ok({ notificacoes, totalNaoLidas })
  } catch { return ok({ notificacoes: [], totalNaoLidas: 0 }) }
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const notif = await (prisma as any).notificacao.create({
      data: {
        tipo:         body.tipo         ?? "SISTEMA",
        titulo:       body.titulo,
        mensagem:     body.mensagem,
        destinatario: body.destinatario ?? "admin",
        canal:        body.canal        ?? "SISTEMA",
        leadId:       body.leadId       ?? null,
      },
    })
    return ok(notif, "Notificação criada!", 201)
  } catch { return err("Erro ao criar notificação", 500) }
}
