import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

// Chamado por cron job (ex: Vercel Cron ou cronjob.org) diariamente
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return err("Não autorizado", 401)
  }
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const { verificarENotificarDocumentos } = await import("@/lib/services/zapi.service")
    const qtd = await verificarENotificarDocumentos(prisma)

    // Registra notificação no sistema
    if (qtd > 0) {
      await (prisma as any).notificacao.create({
        data: {
          tipo:         "DOCUMENTO_VENCENDO",
          titulo:       `${qtd} documento${qtd !== 1 ? "s" : ""} vencendo`,
          mensagem:     `${qtd} documento${qtd !== 1 ? "s" : ""} vencem nos próximos 30 dias. Notificação enviada via WhatsApp.`,
          destinatario: "admin",
          canal:        "WHATSAPP",
          enviadaZapi:  true,
          zapiStatus:   "ok",
        },
      })
    }
    return ok({ enviadas: qtd }, `${qtd} notificações enviadas`)
  } catch (e) {
    console.error("[check-documentos]", e)
    return err("Erro", 500)
  }
}
