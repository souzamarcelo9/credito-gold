import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const afiliadoId = searchParams.get("afiliadoId") ?? undefined
  const period     = searchParams.get("period")     ?? "mensal"

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma || !afiliadoId) throw new Error("no-prisma")

    const now   = new Date()
    let   start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    if (period === "diario")  start = new Date(now.getTime() - 24*60*60*1000)
    if (period === "semanal") start = new Date(now.getTime() - 7*24*60*60*1000)
    if (period === "anual")   start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const where = { afiliadoId, createdAt: { gte: start } }

    const [afiliado, leads, comissoes, leadsSerie] = await prisma.$transaction([
      prisma.afiliado.findUnique({
        where: { id: afiliadoId },
        select: { id:true, nome:true, slug:true, nivel:true, totalCliques:true, totalLeads:true, totalAprovados:true, totalComissoes:true },
      }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id:true, nome:true, produto:true, valor:true, status:true, createdAt:true, comissao: { select:{ valor:true, status:true } } },
      }),
      prisma.comissao.aggregate({ where: { afiliadoId, createdAt: { gte: start } }, _sum: { valor:true } }),
      prisma.lead.findMany({ where, select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
    ])

    const serieMap: Record<string, number> = {}
    ;(leadsSerie as any[]).forEach(l => {
      const dia = new Date(l.createdAt).toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" })
      serieMap[dia] = (serieMap[dia] ?? 0) + 1
    })
    const serie = Object.entries(serieMap).slice(-7)

    return ok({
      afiliado,
      leads,
      comissoesPeriodo: (comissoes as any)._sum.valor ?? 0,
      serie: { labels: serie.map(([l]) => l), values: serie.map(([,v]) => v) },
    })
  } catch {
    // Fallback mock
    return ok({
      afiliado: { id:"1", nome:"João Silva", slug:"joao123", nivel:"GOLD", totalCliques:1248, totalLeads:42, totalAprovados:18, totalComissoes:4200 },
      leads: [
        { id:"1", nome:"Mariana Silva",   produto:"FGTS",       valor:4850,  status:"APROVADO",  createdAt: new Date().toISOString(), comissao:{ valor:242.51, status:"PAGO"    } },
        { id:"2", nome:"Carlos Eduardo",  produto:"PESSOAL",    valor:12000, status:"EM_ANALISE",createdAt: new Date().toISOString(), comissao:null },
        { id:"3", nome:"Fernanda Lima",   produto:"GARANTIA",   valor:85000, status:"APROVADO",  createdAt: new Date().toISOString(), comissao:{ valor:350,    status:"PENDENTE"} },
        { id:"4", nome:"Roberto Alves",   produto:"CONSIGNADO", valor:8400,  status:"PROPOSTA_ENVIADA",createdAt: new Date().toISOString(), comissao:null },
        { id:"5", nome:"Ana Paula",       produto:"EMPRESARIAL",valor:35000, status:"APROVADO",  createdAt: new Date().toISOString(), comissao:{ valor:250,    status:"PAGO"    } },
      ],
      comissoesPeriodo: 842.51,
      serie: { labels:["01/06","02/06","03/06","04/06","05/06","06/06","07/06"], values:[4,6,3,8,5,7,9] },
    })
  }
}
