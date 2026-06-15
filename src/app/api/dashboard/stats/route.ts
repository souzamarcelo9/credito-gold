import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

function getPeriodDates(period: string, startDate?: string, endDate?: string) {
  const now = new Date()
  const end = endDate ? new Date(endDate) : now
  let start = startDate ? new Date(startDate) : new Date()
  if (!startDate) {
    if (period === "diario")  start = new Date(now.getTime() - 24*60*60*1000)
    if (period === "semanal") start = new Date(now.getTime() - 7*24*60*60*1000)
    if (period === "mensal")  start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    if (period === "anual")   start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  }
  return { start, end }
}

const MOCK = {
  diario:   { credito:48000,    leads:34,   afiliados:3,  aprovacao:71.2, comissoes:42000,   varLeads:12, varAfiliados:5,  funil:{novo:12,em_analise:10,proposta_enviada:7,aprovado:4,recusado:1},  serie:{labels:["08h","10h","12h","14h","16h","18h","20h"],leads:[3,6,8,5,7,4,1]} },
  semanal:  { credito:285000,   leads:87,   afiliados:8,  aprovacao:72.1, comissoes:95000,   varLeads:18, varAfiliados:10, funil:{novo:28,em_analise:30,proposta_enviada:18,aprovado:8,recusado:3},  serie:{labels:["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],leads:[14,18,12,16,14,8,5]} },
  mensal:   { credito:1200000,  leads:248,  afiliados:42, aprovacao:73.4, comissoes:380000,  varLeads:22, varAfiliados:15, funil:{novo:48,em_analise:87,proposta_enviada:62,aprovado:182,recusado:31}, serie:{labels:["01/06","02/06","03/06","04/06","05/06","06/06","07/06"],leads:[32,28,41,35,38,45,29]} },
  anual:    { credito:14800000, leads:2840, afiliados:380,aprovacao:74.0, comissoes:4200000, varLeads:34, varAfiliados:28, funil:{novo:180,em_analise:420,proposta_enviada:380,aprovado:2100,recusado:240},serie:{labels:["Jun/24","Ago","Out","Dez","Fev","Abr","Jun/25"],leads:[180,210,195,240,225,260,285]} },
  personalizado:{ credito:620000,leads:124,afiliados:18, aprovacao:73.0, comissoes:190000,  varLeads:8,  varAfiliados:6,  funil:{novo:24,em_analise:42,proposta_enviada:30,aprovado:91,recusado:14},  serie:{labels:["S1","S2","S3","S4"],leads:[28,32,35,29]} },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const period    = searchParams.get("period")    ?? "mensal"
  const startDate = searchParams.get("startDate") ?? undefined
  const endDate   = searchParams.get("endDate")   ?? undefined

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const { start, end } = getPeriodDates(period, startDate, endDate)
    const where = { createdAt: { gte: start, lte: end } }
    const diff      = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - diff)
    const prevEnd   = new Date(start.getTime() - 1)
    const wherePrev = { createdAt: { gte: prevStart, lte: prevEnd } }

    const [totalLeads, prevLeads, leadsPorStatus, afiliados, prevAfiliados,
           aprovados, creditoTotal, comissoesTotal, leadsSerie] =
      await prisma.$transaction([
        prisma.lead.count({ where }),
        prisma.lead.count({ where: wherePrev }),
        prisma.lead.groupBy({ by: ["status"] as any, where, _count: true }),
        prisma.afiliado.count({ where }),
        prisma.afiliado.count({ where: wherePrev }),
        prisma.lead.count({ where: { ...where, status: "APROVADO" } }),
        prisma.lead.aggregate({ where: { ...where, status: "APROVADO" }, _sum: { valor: true } }),
        prisma.comissao.aggregate({ where: { createdAt: { gte: start, lte: end } }, _sum: { valor: true } }),
        prisma.lead.findMany({ where, select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
      ])

    const statusMap: Record<string, number> = {}
    ;(leadsPorStatus as any[]).forEach(s => { statusMap[s.status] = s._count })

    // Agrupa por dia para o gráfico
    const serieMap: Record<string, number> = {}
    ;(leadsSerie as any[]).forEach(l => {
      const dia = new Date(l.createdAt).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" })
      serieMap[dia] = (serieMap[dia] ?? 0) + 1
    })
    const serieEntries = Object.entries(serieMap).slice(-7)

    const taxaAprovacao = totalLeads > 0 ? ((aprovados / totalLeads) * 100) : 0
    const varLeads      = prevLeads  > 0 ? (((totalLeads - prevLeads) / prevLeads) * 100) : 0
    const varAfiliados  = prevAfiliados > 0 ? (((afiliados - prevAfiliados) / prevAfiliados) * 100) : 0

    return ok({
      kpis: {
        credito:      (creditoTotal as any)._sum.valor    ?? 0,
        leads:        totalLeads,
        afiliados,
        aprovacao:    parseFloat(taxaAprovacao.toFixed(1)),
        comissoes:    (comissoesTotal as any)._sum.valor  ?? 0,
        varLeads:     parseFloat(varLeads.toFixed(1)),
        varAfiliados: parseFloat(varAfiliados.toFixed(1)),
      },
      funil: {
        novo:             statusMap["NOVO"]             ?? 0,
        em_analise:       statusMap["EM_ANALISE"]       ?? 0,
        proposta_enviada: statusMap["PROPOSTA_ENVIADA"] ?? 0,
        aprovado:         statusMap["APROVADO"]         ?? 0,
        recusado:         statusMap["RECUSADO"]         ?? 0,
      },
      serie: {
        labels: serieEntries.map(([l]) => l),
        leads:  serieEntries.map(([, v]) => v),
      },
    })
  } catch {
    // Fallback mock
    const mock = (MOCK as any)[period] ?? MOCK.mensal
    return ok({ kpis: mock, funil: mock.funil, serie: mock.serie })
  }
}
