"use client"
export const dynamic = "force-dynamic"
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { PeriodFilter, type DateRange } from "@/components/dashboard/PeriodFilter"
import { MiniChart } from "@/components/dashboard/MiniChart"
import { formatCurrency } from "@/lib/utils"

interface AfiliadoData {
  afiliado: { id:string; nome:string; slug:string; nivel:string; totalCliques:number; totalLeads:number; totalAprovados:number; totalComissoes:number }
  leads:    Array<{ id:string; nome:string; produto:string; valor:number; status:string; createdAt:string; comissao?:{ valor:number; status:string } | null }>
  comissoesPeriodo: number
  serie: { labels:string[]; values:number[] }
}

const STATUS_STYLE: Record<string,string> = {
  APROVADO:         "bg-[#dcfce7] text-[#15803d]",
  EM_ANALISE:       "bg-[#dbeafe] text-[#1d4ed8]",
  PROPOSTA_ENVIADA: "bg-[#fff3e8] text-[#c2410c]",
  NOVO:             "bg-[#ffedd5] text-[#c2410c]",
  RECUSADO:         "bg-[#f1f5f9] text-[#475569]",
}
const PRODUTO_LABEL: Record<string,string> = {
  PESSOAL:"Crédito Pessoal", GARANTIA:"Com Garantia", EMPRESARIAL:"Empresarial",
  CONSIGNADO:"Consignado", FGTS:"Antecip. FGTS",
}
const NIVEL_COLOR: Record<string,string> = {
  BRONZE:"text-[#92400e]", PRATA:"text-[#475569]", GOLD:"text-[#854d0e]", DIAMANTE:"text-[#6d28d9]"
}

const NAV_ITEMS = [
  { icon:"📊", label:"Dashboard",          active:true  },
  { icon:"👥", label:"Referred Customers", active:false },
  { icon:"👁️", label:"Referred Visitors",  active:false },
  { icon:"💸", label:"Payments",           active:false },
  { icon:"🎨", label:"Promo Material",     active:false },
  { icon:"📚", label:"Resources",          active:false },
  { icon:"⚙️", label:"Settings",           active:false },
]

export default function PainelAfiliadoPage() {
  const { data: session } = useSession()
  const [range, setRange]   = useState<DateRange>({ period:"mensal", label:"30 dias" })
  const [data, setData]     = useState<AfiliadoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const afiliadoId = (session?.user as any)?.afiliadoId

  const fetchData = useCallback(async (r: DateRange) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: r.period })
      if (afiliadoId) params.set("afiliadoId", afiliadoId)
      if (r.startDate) params.set("startDate", r.startDate)
      if (r.endDate)   params.set("endDate",   r.endDate)
      const res  = await fetch(`/api/dashboard/afiliado?${params}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } finally { setLoading(false) }
  }, [afiliadoId])

  useEffect(() => { fetchData(range) }, [fetchData])

  function copyLink() {
    const slug = data?.afiliado?.slug ?? "meu-link"
    const url  = `${window.location.origin}/ref/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const af   = data?.afiliado
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const link = af ? `${baseUrl}/ref/${af.slug}` : ""

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">

      {/* Sidebar afiliado */}
      <aside className="fixed bottom-0 left-0 top-0 flex w-[260px] flex-col overflow-y-auto bg-[#0D1B2A] px-5 py-6">
        <div className="mb-8">
          <div className="mb-1 font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#FF6B00]">Painel Exclusivo</div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B00] font-['Sora'] text-sm font-extrabold text-white">CG</div>
            <div>
              <div className="font-['Sora'] text-base font-extrabold text-white">
                crédito<span className="text-[#1DB954]">gold</span>
              </div>
              <div className="font-['Sora'] text-[0.6rem] text-[#475569]">Parceiros de indicação</div>
            </div>
          </div>
        </div>

        <div className="mb-2 font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#475569]">Principal</div>
        {NAV_ITEMS.slice(0, 4).map(item => (
          <div key={item.label} className={`mb-0.5 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 font-['Sora'] text-sm font-medium transition-all ${
            item.active ? "bg-[#1DB954]/20 text-[#1DB954]" : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
          }`}>
            <span className="w-5 text-center text-base">{item.icon}</span>{item.label}
          </div>
        ))}

        <div className="mb-2 mt-5 font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#475569]">Suporte & Links</div>
        {NAV_ITEMS.slice(4).map(item => (
          <div key={item.label} className="mb-0.5 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 font-['Sora'] text-sm font-medium text-[#94a3b8] transition-all hover:bg-white/5 hover:text-white">
            <span className="w-5 text-center text-base">{item.icon}</span>{item.label}
          </div>
        ))}

        <div className="mt-auto pt-4 space-y-2">
          {af && (
            <div className="rounded-xl bg-white/5 px-3 py-2 text-center">
              <div className="font-['Sora'] text-xs text-[#94a3b8]">Nível</div>
              <div className={`font-['Sora'] text-sm font-bold ${NIVEL_COLOR[af.nivel] ?? "text-white"}`}>
                {af.nivel}
              </div>
            </div>
          )}
          <button onClick={copyLink}
            className="w-full rounded-xl bg-[#FF6B00] py-3 font-['Sora'] text-sm font-bold text-white transition-colors hover:bg-[#e06000]">
            {copied ? "✓ Copiado!" : "+ Copiar Meu Link"}
          </button>
          <a href="/" className="block text-center font-['Sora'] text-xs text-[#475569] hover:text-white transition-colors">
            ← Voltar ao site
          </a>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="ml-[260px] flex-1 p-6">

        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">
              {loading ? "Dashboard" : `Olá, ${af?.nome?.split(" ")[0] ?? "Afiliado"}! 👋`}
            </h1>
            <p className="font-['Sora'] text-xs uppercase tracking-[0.08em] text-[#9ca3af]">
              Visão geral de tráfego, propostas e comissão acumulada
            </p>
          </div>
          {/* Link box */}
          <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-2.5 shadow-sm">
            <div>
              <div className="font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Seu link padrão</div>
              <div className="font-['Sora'] text-xs text-[#374151]">
                {af ? `...${link.slice(-28)}` : "Carregando..."}
              </div>
            </div>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg bg-[#1DB954] px-3 py-1.5 font-['Sora'] text-xs font-bold text-white transition-colors hover:bg-[#0f9c40]">
              {copied ? "✓ Copiado!" : "📋 Copiar"}
            </button>
          </div>
        </div>

        {/* Filtro */}
        <div className="mb-5 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-3 font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Filtrar por período</div>
          <PeriodFilter onChange={r => { setRange(r); fetchData(r) }} />
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Active Referrals",       value: af?.totalLeads       ?? 0, suffix:"", change:"leads gerados",      color:"#1DB954", series: data?.serie.values ?? [] },
            { label:"Comissões no Período",   value: data?.comissoesPeriodo ?? 0, prefix:"R$ ", change:"pagamento estimado", color:"#FF6B00", series: (data?.serie.values ?? []).map(v => v*100) },
            { label:"Total Aprovados",        value: af?.totalAprovados   ?? 0, suffix:"", change:"conversões",         color:"#0D1B2A", series: data?.serie.values ?? [] },
            { label:"Total de Cliques",       value: af?.totalCliques     ?? 0, suffix:"", change:"no link",            color:"#1DB954", series: (data?.serie.values ?? []).map((v,i) => v*(i+1)*3) },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              <div className="mb-1 font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">{kpi.label}</div>
              <div className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">
                {loading ? "..." : kpi.prefix ? `${kpi.prefix}${kpi.value.toLocaleString("pt-BR", { minimumFractionDigits:2 })}` : kpi.value}
              </div>
              <div className="mt-0.5 font-['Sora'] text-[0.65rem] font-bold" style={{ color: kpi.color }}>↗ {kpi.change}</div>
              {kpi.series.length > 0 && <MiniChart data={kpi.series} color={kpi.color} height={44} />}
            </div>
          ))}
        </div>

        {/* Gráfico + performance */}
        <div className="mb-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm lg:col-span-2">
            <div className="mb-1 font-['Sora'] text-sm font-bold text-[#0D1B2A]">Leads por período — {range.label}</div>
            <div className="flex h-48 items-end gap-2 pb-2 pt-4">
              {loading ? Array(7).fill(0).map((_,i) => (
                <div key={i} className="flex-1 animate-pulse rounded-t-md bg-[#e5e7eb]" style={{height:"60%"}} />
              )) : (data?.serie.values ?? []).map((v, i) => {
                const max = Math.max(...(data?.serie.values ?? [1]))
                return (
                  <div key={i} className="group relative flex-1">
                    <div className="w-full rounded-t-md bg-[#1DB954] transition-all duration-700"
                      style={{ height:`${(v/max)*100}%` }} />
                    <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 font-['Sora'] text-[0.6rem] font-bold text-[#0D1B2A] group-hover:block">{v}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              {(data?.serie.labels ?? []).map((l: string) => (
                <div key={l} className="flex-1 text-center font-['Sora'] text-[0.6rem] text-[#9ca3af]">{l}</div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
            <div className="mb-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">Performance</div>
            <div className="space-y-3">
              {[
                { label:"Taxa de Conversão", value: af && af.totalLeads > 0 ? `${((af.totalAprovados/af.totalLeads)*100).toFixed(1)}%` : "0%", color:"#1DB954" },
                { label:"Comissão Total",    value: loading ? "..." : `R$ ${af?.totalComissoes.toLocaleString("pt-BR") ?? 0}`, color:"#FF6B00" },
                { label:"Média por Lead",    value: af && af.totalAprovados > 0 ? formatCurrency(af.totalComissoes/af.totalAprovados) : "R$ 0", color:"#0D1B2A" },
              ].map(p => (
                <div key={p.label} className="rounded-xl bg-[#f4f6f8] p-3">
                  <div className="font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">{p.label}</div>
                  <div className="font-['Sora'] text-xl font-bold" style={{ color: p.color }}>{p.value}</div>
                </div>
              ))}
              <button className="w-full rounded-xl bg-[#FF6B00]/10 py-2 font-['Sora'] text-[0.7rem] font-bold text-[#FF6B00] transition-colors hover:bg-[#FF6B00]/20">
                ⭐ Melhores taxas de comissão ativas
              </button>
            </div>
          </div>
        </div>

        {/* Tabela atividades */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f4f6f8] px-5 py-4">
            <div>
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Atividades Recentes</div>
              <div className="font-['Sora'] text-xs text-[#9ca3af]">Últimos leads que realizaram simulação com seu link</div>
            </div>
            <button onClick={() => fetchData(range)}
              className="font-['Sora'] text-xs font-bold text-[#1DB954] hover:underline">Atualizar</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f4f6f8]">
                  {["Cliente","Produto","Valor","Status","Comissão"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(4).fill(0).map((_,i) => (
                  <tr key={i} className="border-b border-[#f4f6f8]">
                    {Array(5).fill(0).map((_,j) => (
                      <td key={j} className="px-5 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>
                    ))}
                  </tr>
                )) : (data?.leads ?? []).map(lead => (
                  <tr key={lead.id} className="border-b border-[#f4f6f8] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-5 py-3 font-['Sora'] text-sm font-medium text-[#0D1B2A]">{lead.nome}</td>
                    <td className="px-5 py-3 font-['Sora'] text-xs text-[#6b7280]">{PRODUTO_LABEL[lead.produto] ?? lead.produto}</td>
                    <td className="px-5 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{formatCurrency(lead.valor)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 font-['Sora'] text-[0.65rem] font-bold ${STATUS_STYLE[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {lead.status.replace("_"," ")}
                      </span>
                    </td>
                    <td className={`px-5 py-3 font-['Sora'] text-sm font-bold ${lead.comissao ? "text-[#1DB954]" : "text-[#9ca3af]"}`}>
                      {lead.comissao ? formatCurrency(lead.comissao.valor) : "Aguardando"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && (data?.leads ?? []).length === 0 && (
              <div className="py-12 text-center text-sm text-[#9ca3af]">Nenhuma atividade no período</div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
