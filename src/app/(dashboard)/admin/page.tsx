"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { PeriodFilter, type DateRange } from "@/components/dashboard/PeriodFilter"
import { formatCurrency } from "@/lib/utils"

// ── Tipos ──────────────────────────────────────────────────────────
interface Stats {
  kpis: { credito:number; leads:number; afiliados:number; aprovacao:number; comissoes:number; varLeads:number; varAfiliados:number }
  funil:{ novo:number; em_analise:number; proposta_enviada:number; aprovado:number; recusado:number }
  serie:{ labels:string[]; leads:number[] }
}

interface Lead {
  id:string; nome:string; produto:string; valor:number; status:string
  origem:string; createdAt:string; afiliado?:{ slug:string; nome:string } | null
}

const STATUS_STYLE: Record<string,string> = {
  NOVO:             "bg-[#ffedd5] text-[#c2410c]",
  EM_ANALISE:       "bg-[#dbeafe] text-[#1d4ed8]",
  APROVADO:         "bg-[#dcfce7] text-[#15803d]",
  PROPOSTA_ENVIADA: "bg-[#ede9fe] text-[#6d28d9]",
  RECUSADO:         "bg-[#f1f5f9] text-[#475569]",
}
const STATUS_LABEL: Record<string,string> = {
  NOVO:"Novo", EM_ANALISE:"Em análise", APROVADO:"Aprovado",
  PROPOSTA_ENVIADA:"Proposta", RECUSADO:"Recusado",
}
const PRODUTO_LABEL: Record<string,string> = {
  PESSOAL:"Crédito Pessoal", GARANTIA:"Com Garantia", EMPRESARIAL:"Empresarial",
  CONSIGNADO:"Consignado", FGTS:"Antecip. FGTS",
}

export default function AdminPage() {
  const [range, setRange]   = useState<DateRange>({ period:"mensal", label:"30 dias" })
  const [stats, setStats]   = useState<Stats | null>(null)
  const [leads, setLeads]   = useState<Lead[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [leadsLoading, setLeadsLoading] = useState(true)

  // Busca KPIs
  const fetchStats = useCallback(async (r: DateRange) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: r.period })
      if (r.startDate) params.set("startDate", r.startDate)
      if (r.endDate)   params.set("endDate",   r.endDate)
      const res  = await fetch(`/api/dashboard/stats?${params}`)
      const json = await res.json()
      if (json.success) setStats(json.data)
    } finally { setLoading(false) }
  }, [])

  // Busca leads
  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true)
    try {
      const params = new URLSearchParams({ limit:"10" })
      if (statusFilter) params.set("status", statusFilter)
      if (search)       params.set("search", search)
      const res  = await fetch(`/api/dashboard/leads?${params}`)
      const json = await res.json()
      if (json.success) setLeads(json.data.data ?? json.data)
    } finally { setLeadsLoading(false) }
  }, [statusFilter, search])

  useEffect(() => { fetchStats(range) }, [range, fetchStats])
  useEffect(() => { fetchLeads() }, [fetchLeads])

  // Atualiza status do lead
  async function updateStatus(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchLeads()
    fetchStats(range)
  }

  const k = stats?.kpis
  const fmtM = (v: number) => v >= 1000000
    ? `R$ ${(v/1000000).toFixed(1).replace(".",",")} Mi`
    : v >= 1000 ? `R$ ${(v/1000).toFixed(0)}k` : formatCurrency(v)

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Dashboard</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">
              {loading ? "Carregando dados..." : `Dados em tempo real — ${range.label}`}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954] font-['Sora'] font-bold text-white">A</div>
        </div>

        {/* Filtro */}
        <div className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-3 font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
            Filtrar período — todos os indicadores refletem o período selecionado
          </div>
          <PeriodFilter onChange={r => { setRange(r); fetchStats(r) }} />
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Crédito Concedido", value: loading ? "..." : fmtM(k?.credito ?? 0),           change: `${k?.varLeads    ?? 0}% este período`, accent:"#1DB954" },
            { label:"Novos Leads",       value: loading ? "..." : String(k?.leads ?? 0),            change: `+${k?.varLeads   ?? 0}% vs anterior`,  accent:"#FF6B00" },
            { label:"Afiliados Ativos",  value: loading ? "..." : String(k?.afiliados ?? 0),        change: `+${k?.varAfiliados ?? 0}% vs anterior`, accent:"#1DB954" },
            { label:"Taxa Aprovação",    value: loading ? "..." : `${k?.aprovacao ?? 0}%`,          change: "no período",                            accent:"#FF6B00" },
          ].map(kpi => (
            <div key={kpi.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: kpi.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{kpi.label}</div>
              <div className="my-2 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{kpi.value}</div>
              <div className="font-['Sora'] text-xs font-semibold" style={{ color: kpi.accent }}>▲ {kpi.change}</div>
            </div>
          ))}
        </div>

        {/* Gráfico + Funil */}
        <div className="mb-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
          {/* Gráfico de barras */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white">
            <div className="border-b border-[#e5e7eb] px-6 py-4">
              <h3 className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Leads por período — {range.label}</h3>
            </div>
            <div className="flex h-44 items-end gap-2 px-6 pb-2 pt-4">
              {loading ? (
                Array(7).fill(0).map((_,i) => (
                  <div key={i} className="flex-1 animate-pulse rounded-t-md bg-[#e5e7eb]" style={{ height:"60%" }} />
                ))
              ) : (
                (stats?.serie.leads ?? []).map((v, i) => {
                  const max = Math.max(...(stats?.serie.leads ?? [1]))
                  return (
                    <div key={i} className="group relative flex-1">
                      <div className="w-full rounded-t-[6px] transition-all duration-700"
                        style={{ height:`${(v/max)*100}%`, background:"linear-gradient(to top,#1DB954,#86efac)" }} />
                      <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-['Sora'] text-[0.6rem] font-bold text-[#0D1B2A] group-hover:block">{v}</span>
                    </div>
                  )
                })
              )}
            </div>
            <div className="flex gap-2 px-6 pb-3">
              {(stats?.serie.labels ?? Array(7).fill("...")).map((l: string) => (
                <div key={l} className="flex-1 text-center font-['Sora'] text-[0.62rem] text-[#9ca3af]">{l}</div>
              ))}
            </div>
          </div>

          {/* Funil */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white">
            <div className="border-b border-[#e5e7eb] px-6 py-4">
              <h3 className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Funil de Vendas</h3>
            </div>
            {loading ? (
              Array(4).fill(0).map((_,i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-3">
                  <div className="h-4 w-24 animate-pulse rounded bg-[#e5e7eb]" />
                  <div className="h-4 w-10 animate-pulse rounded bg-[#e5e7eb]" />
                </div>
              ))
            ) : [
              { label:"Novos",           val:stats?.funil.novo             ?? 0, color:"#FF6B00" },
              { label:"Em análise",      val:stats?.funil.em_analise       ?? 0, color:"#1DB954" },
              { label:"Proposta",        val:stats?.funil.proposta_enviada ?? 0, color:"#1DB954" },
              { label:"Aprovados ✓",     val:stats?.funil.aprovado         ?? 0, color:"#1DB954" },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-3 last:border-0">
                <div>
                  <div className="text-xs text-[#6b7280]">{f.label}</div>
                  <div className="font-['Sora'] text-lg font-bold text-[#0D1B2A]">{f.val}</div>
                </div>
                <div className="font-['Sora'] text-sm font-bold" style={{ color: f.color }}>
                  {stats?.funil.novo ? Math.round((f.val / (stats.funil.novo + stats.funil.em_analise + stats.funil.proposta_enviada + stats.funil.aprovado)) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela leads */}
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
            <h3 className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Leads Recentes</h3>
            <div className="flex flex-wrap gap-2">
              <input placeholder="🔍 Buscar por nome, e-mail..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="rounded-full border-2 border-[#e5e7eb] px-4 py-1.5 text-sm outline-none focus:border-[#1DB954]" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="rounded-full border-2 border-[#e5e7eb] px-4 py-1.5 text-sm outline-none focus:border-[#1DB954]">
                <option value="">Todos os status</option>
                {["NOVO","EM_ANALISE","PROPOSTA_ENVIADA","APROVADO","RECUSADO"].map(s => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
              <button onClick={fetchLeads}
                className="rounded-full bg-[#1DB954] px-4 py-1.5 font-['Sora'] text-xs font-bold text-white hover:bg-[#0f9c40]">
                Atualizar
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f4f6f8]">
                  {["Nome","Produto","Valor","Parcela","Status","Origem","Afiliado","Ações"].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-['Sora'] text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsLoading ? (
                  Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(8).fill(0).map((_,j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]" /></td>
                      ))}
                    </tr>
                  ))
                ) : leads.map(lead => (
                  <tr key={lead.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                    <td className="px-5 py-3 font-semibold text-[#0D1B2A]">{lead.nome}</td>
                    <td className="px-5 py-3 text-sm text-[#6b7280]">{PRODUTO_LABEL[lead.produto] ?? lead.produto}</td>
                    <td className="px-5 py-3 text-sm font-bold text-[#0D1B2A]">{formatCurrency(lead.valor)}</td>
                    <td className="px-5 py-3 text-sm text-[#6b7280]">{lead.parcelas ?? "—"}x</td>
                    <td className="px-5 py-3">
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className={`rounded-full px-3 py-1 font-['Sora'] text-[0.65rem] font-bold border-0 outline-none cursor-pointer ${STATUS_STYLE[lead.status] ?? ""}`}>
                        {["NOVO","EM_ANALISE","PROPOSTA_ENVIADA","APROVADO","RECUSADO"].map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-sm text-[#6b7280]">{lead.origem}</td>
                    <td className="px-5 py-3 text-sm text-[#6b7280]">{lead.afiliado?.nome ?? "Orgânico"}</td>
                    <td className="px-5 py-3">
                      <button className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white">
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!leadsLoading && leads.length === 0 && (
              <div className="py-12 text-center text-sm text-[#9ca3af]">Nenhum lead encontrado</div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
