"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { PeriodFilter, type DateRange } from "@/components/dashboard/PeriodFilter"
import { formatCurrency } from "@/lib/utils"

interface Lead {
  id: string; nome: string; email: string; telefone: string
  produto: string; valor: number; parcelas: number; parcelaMensal: number
  status: string; origem: string; createdAt: string
  afiliado?: { slug: string; nome: string } | null
}

const STATUS_STYLE: Record<string, string> = {
  NOVO:             "bg-[#ffedd5] text-[#c2410c]",
  EM_ANALISE:       "bg-[#dbeafe] text-[#1d4ed8]",
  APROVADO:         "bg-[#dcfce7] text-[#15803d]",
  PROPOSTA_ENVIADA: "bg-[#ede9fe] text-[#6d28d9]",
  RECUSADO:         "bg-[#f1f5f9] text-[#475569]",
  CONTRATO_ASSINADO:"bg-[#dcfce7] text-[#15803d]",
}
const STATUS_LABEL: Record<string, string> = {
  NOVO:"Novo", EM_ANALISE:"Em análise", APROVADO:"Aprovado",
  PROPOSTA_ENVIADA:"Proposta", RECUSADO:"Recusado", CONTRATO_ASSINADO:"Contrato",
}
const PRODUTO_LABEL: Record<string, string> = {
  PESSOAL:"Crédito Pessoal", GARANTIA:"Com Garantia", EMPRESARIAL:"Empresarial",
  CONSIGNADO:"Consignado", FGTS:"Antecip. FGTS",
}
const ORIGEM_STYLE: Record<string, string> = {
  AFILIADO:"bg-[#e8f8ee] text-[#0f9c40]",
  ORGANICO:"bg-[#f1f5f9] text-[#475569]",
  WHATSAPP:"bg-[#dcfce7] text-[#15803d]",
  DIRETO:  "bg-[#fff3e8] text-[#c2410c]",
}

export default function AdminLeadsPage() {
  const [leads, setLeads]           = useState<Lead[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState("")
  const [origemFilter, setOrigem]   = useState("")
  const [page, setPage]             = useState(1)
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected]     = useState<Lead | null>(null)
  const [range, setRange]           = useState<DateRange>({ period:"mensal", label:"30 dias" })
  const LIMIT = 15

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (search)       params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      const res  = await fetch(`/api/dashboard/leads?${params}`)
      const json = await res.json()
      if (json.success) {
        const d = json.data
        setLeads(d.data ?? d)
        setTotal(d.total ?? 0)
        setTotalPages(d.totalPages ?? 1)
      }
    } finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchLeads() }, 400)
    return () => clearTimeout(t)
  }, [search])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchLeads()
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  function exportCSV() {
    const headers = ["Nome","Email","Telefone","Produto","Valor","Parcelas","Status","Origem","Afiliado","Data"]
    const rows = leads.map(l => [
      l.nome, l.email, l.telefone,
      PRODUTO_LABEL[l.produto] ?? l.produto,
      formatCurrency(l.valor), `${l.parcelas}x`,
      STATUS_LABEL[l.status] ?? l.status,
      l.origem, l.afiliado?.nome ?? "Orgânico",
      new Date(l.createdAt).toLocaleDateString("pt-BR"),
    ])
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n")
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // Totais dos filtrados
  const totalValor     = leads.reduce((s, l) => s + l.valor, 0)
  const totalAprovados = leads.filter(l => l.status === "APROVADO").length

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Gestão de Leads</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">
              {loading ? "Carregando..." : `${total} lead${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLeads}
              className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
              ↻ Atualizar
            </button>
            <button onClick={exportCSV}
              className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-xs font-bold text-white hover:bg-[#0f9c40]">
              ↓ Exportar CSV
            </button>
          </div>
        </div>

        {/* Filtro período */}
        <div className="mb-5 rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="mb-3 font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Filtrar período</div>
          <PeriodFilter onChange={setRange} />
        </div>

        {/* Mini KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Total leads",    value: loading ? "..." : total,                      accent:"#1DB954" },
            { label:"Aprovados",      value: loading ? "..." : totalAprovados,             accent:"#1DB954" },
            { label:"Volume total",   value: loading ? "..." : formatCurrency(totalValor), accent:"#FF6B00" },
            { label:"Taxa aprovação", value: loading || total === 0 ? "..." : `${Math.round((totalAprovados/leads.length)*100)}%`, accent:"#FF6B00" },
          ].map(k => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-4">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input placeholder="🔍 Buscar por nome, e-mail ou telefone..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="min-w-[260px] flex-1 rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
          <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todos os status</option>
            {["NOVO","EM_ANALISE","PROPOSTA_ENVIADA","APROVADO","RECUSADO"].map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select value={origemFilter} onChange={e => { setOrigem(e.target.value); setPage(1) }}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todas as origens</option>
            <option value="ORGANICO">Orgânico</option>
            <option value="AFILIADO">Afiliado</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="DIRETO">Direto</option>
          </select>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Tabela */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f4f6f8]">
                    {["Lead","Produto","Valor","Status","Origem","Afiliado","Data","Ações"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(8).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(8).fill(0).map((_,j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>
                      ))}
                    </tr>
                  )) : leads.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center text-sm text-[#9ca3af]">
                      Nenhum lead encontrado
                    </td></tr>
                  ) : leads.map(lead => (
                    <tr key={lead.id}
                      onClick={() => setSelected(lead)}
                      className={`cursor-pointer border-t border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${selected?.id === lead.id ? "bg-[#e8f8ee]" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{lead.nome}</div>
                        <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{lead.telefone}</div>
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{PRODUTO_LABEL[lead.produto] ?? lead.produto}</td>
                      <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{formatCurrency(lead.valor)}</td>
                      <td className="px-4 py-3">
                        <select value={lead.status}
                          onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          className={`rounded-full border-0 px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold outline-none cursor-pointer ${STATUS_STYLE[lead.status] ?? ""}`}>
                          {Object.entries(STATUS_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold ${ORIGEM_STYLE[lead.origem] ?? "bg-[#f1f5f9] text-[#475569]"}`}>
                          {lead.origem}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">
                        {lead.afiliado?.nome ?? "Orgânico"}
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-xs text-[#9ca3af]">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); setSelected(lead) }}
                          className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#e5e7eb] px-5 py-3">
                <span className="font-['Sora'] text-xs text-[#9ca3af]">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="rounded-lg border border-[#e5e7eb] px-3 py-1 font-['Sora'] text-xs font-bold disabled:opacity-40 hover:border-[#1DB954] hover:text-[#1DB954]">
                    ← Anterior
                  </button>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="rounded-lg border border-[#e5e7eb] px-3 py-1 font-['Sora'] text-xs font-bold disabled:opacity-40 hover:border-[#1DB954] hover:text-[#1DB954]">
                    Próximo →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Painel de detalhes */}
          <div className={`rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm transition-all duration-300 ${selected ? "opacity-100" : "opacity-40"}`}>
            {!selected ? (
              <div className="flex h-full items-center justify-center py-20 text-center">
                <div>
                  <div className="mb-3 text-4xl">👆</div>
                  <p className="font-['Sora'] text-sm text-[#9ca3af]">Clique em um lead<br />para ver os detalhes</p>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Detalhes do Lead</h3>
                  <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
                </div>

                {/* Avatar */}
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954] font-['Sora'] text-lg font-bold text-white">
                    {selected.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{selected.nome}</div>
                    <div className="font-['Sora'] text-xs text-[#9ca3af]">{selected.email}</div>
                  </div>
                </div>

                {/* Dados */}
                <div className="space-y-3">
                  {[
                    { label:"Telefone",  value:selected.telefone },
                    { label:"Produto",   value:PRODUTO_LABEL[selected.produto] ?? selected.produto },
                    { label:"Valor",     value:formatCurrency(selected.valor) },
                    { label:"Parcelas",  value:`${selected.parcelas}x de ${formatCurrency(selected.parcelaMensal)}` },
                    { label:"Origem",    value:selected.origem },
                    { label:"Afiliado",  value:selected.afiliado?.nome ?? "Orgânico" },
                    { label:"Cadastro",  value:new Date(selected.createdAt).toLocaleString("pt-BR") },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between rounded-xl bg-[#f9fafb] px-3 py-2.5">
                      <span className="font-['Sora'] text-xs font-bold text-[#9ca3af]">{item.label}</span>
                      <span className="font-['Sora'] text-xs font-medium text-[#0D1B2A]">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Status atual */}
                <div className="mt-4">
                  <div className="mb-2 font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Status atual</div>
                  <span className={`rounded-full px-3 py-1.5 font-['Sora'] text-xs font-bold ${STATUS_STYLE[selected.status] ?? ""}`}>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                </div>

                {/* Atualizar status */}
                <div className="mt-4">
                  <div className="mb-2 font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Atualizar status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { s:"EM_ANALISE",       label:"Em análise", color:"#1d4ed8", bg:"#dbeafe" },
                      { s:"PROPOSTA_ENVIADA", label:"Proposta",   color:"#6d28d9", bg:"#ede9fe" },
                      { s:"APROVADO",         label:"Aprovar ✓",  color:"#15803d", bg:"#dcfce7" },
                      { s:"RECUSADO",         label:"Recusar ✗",  color:"#dc2626", bg:"#fee2e2" },
                    ].map(btn => (
                      <button key={btn.s}
                        onClick={() => updateStatus(selected.id, btn.s)}
                        disabled={selected.status === btn.s}
                        className="rounded-xl px-3 py-2 font-['Sora'] text-xs font-bold transition-all hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: btn.bg, color: btn.color }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="mt-4 space-y-2">
                  <a href={`https://wa.me/55${selected.telefone.replace(/\D/g,"")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 font-['Sora'] text-xs font-bold text-white no-underline hover:bg-[#1db954] transition-colors">
                    💬 Contatar via WhatsApp
                  </a>
                  <a href={`mailto:${selected.email}`}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#e5e7eb] py-2.5 font-['Sora'] text-xs font-bold text-[#0D1B2A] no-underline hover:border-[#1DB954] transition-colors">
                    ✉️ Enviar e-mail
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
