import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") ?? "mensal"

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const now     = new Date()
    const dateFrom = new Date()
    if (period === "diario")  dateFrom.setDate(now.getDate() - 1)
    else if (period === "semanal") dateFrom.setDate(now.getDate() - 7)
    else if (period === "anual")   dateFrom.setFullYear(now.getFullYear() - 1)
    else dateFrom.setDate(now.getDate() - 30) // mensal padrão

    const where = { createdAt: { gte: dateFrom } }

    const [leadsAprovados, comissoes, despesas, totalLeads] = await Promise.all([
      prisma.lead.findMany({ where: { ...where, status: "APROVADO" }, select: { valor:true, produto:true, afiliadoId:true, origem:true } }),
      prisma.comissao.findMany({ where, select: { valor:true } }),
      (prisma as any).despesa?.findMany({ where, select: { valor:true, categoria:true } }) ?? Promise.resolve([]),
      prisma.lead.count({ where }),
    ])

    const faturamento    = leadsAprovados.reduce((s: number, l: any) => s + (l.valor ?? 0), 0)
    const totalComissoes = comissoes.reduce((s: number, c: any) => s + c.valor, 0)
    const totalDespesas  = (despesas as any[]).reduce((s, d) => s + d.valor, 0)
    const margem         = faturamento > 0 ? ((faturamento - totalDespesas) / faturamento) * 100 : 0

    const leadsWpp   = leadsAprovados.filter((l: any) => l.origem === "whatsapp").length
    const leadsAfil  = leadsAprovados.filter((l: any) => l.afiliadoId).length
    const leadsSite  = leadsAprovados.length - leadsWpp - leadsAfil

    const ticketMedio = leadsAprovados.length > 0 ? faturamento / leadsAprovados.length : 0

    // Despesas agrupadas por categoria
    const despMap: Record<string, number> = {}
    for (const d of (despesas as any[])) {
      despMap[d.categoria] = (despMap[d.categoria] ?? 0) + d.valor
    }

    return ok({
      faturamento, totalComissoes, totalDespesas,
      margemOperacional: parseFloat(margem.toFixed(1)),
      totalLeads, leadsAprovados: leadsAprovados.length, ticketMedio,
      serie_fat:  [faturamento*0.7, faturamento*0.8, faturamento*0.9, faturamento].map(Math.round),
      serie_desp: [totalDespesas*0.7, totalDespesas*0.8, totalDespesas*0.9, totalDespesas].map(Math.round),
      captacao: [
        { canal:"Site orgânico", leads: leadsSite  },
        { canal:"Afiliados",     leads: leadsAfil  },
        { canal:"WhatsApp",      leads: leadsWpp   },
      ],
      despesasRows: Object.entries(despMap)
        .sort((a,b) => b[1]-a[1])
        .map(([cat, val]) => ({
          label: cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_/g," "),
          valor: val,
          pct:   totalDespesas > 0 ? Math.round((val/totalDespesas)*100) : 0,
        })),
    })
  } catch (e: any) {
    console.error("[financeiro]", e)
    return err("Erro ao carregar dados financeiros", 500)
  }
}
