import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? undefined

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const where: any = {}
    if (status) where.status = status

    const saques = await (prisma as any).saqueComissao.findMany({
      where,
      orderBy: { solicitadoEm: "desc" },
      include: {
        afiliado: { select: { nome: true, email: true, telefone: true, slug: true } },
      },
    })

    const stats = {
      total:      await (prisma as any).saqueComissao.count(),
      solicitados:await (prisma as any).saqueComissao.count({ where: { status: "SOLICITADO" } }),
      aprovados:  await (prisma as any).saqueComissao.count({ where: { status: "APROVADO"   } }),
      pagos:      await (prisma as any).saqueComissao.count({ where: { status: "PAGO"       } }),
    }

    // Saldo Asaas
    let saldoAsaas = null
    try {
      const { consultarSaldo } = await import("@/lib/services/asaas.service")
      saldoAsaas = await consultarSaldo()
    } catch {}

    return ok({ saques, stats, saldoAsaas })
  } catch (e) {
    console.error("[saques GET]", e)
    return ok({ saques: [], stats: { total:0, solicitados:0, aprovados:0, pagos:0 }, saldoAsaas: null })
  }
}
