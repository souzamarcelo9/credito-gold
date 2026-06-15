"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatCurrency } from "@/lib/utils"

interface Afiliado {
  id:             string
  nome:           string
  email?:         string
  telefone:       string
  slug:           string
  status:         string
  nivel:          string
  totalCliques:   number
  totalLeads:     number
  totalAprovados: number
  totalComissoes: number
  createdAt:      string
}

const STATUS_STYLE: Record<string, string> = {
  ATIVO:    "bg-[#dcfce7] text-[#15803d]",
  PENDENTE: "bg-[#fff3e8] text-[#c2410c]",
  INATIVO:  "bg-[#f1f5f9] text-[#475569]",
}

const NIVEL_STYLE: Record<string, string> = {
  BRONZE:   "bg-[#fef3c7] text-[#92400e]",
  PRATA:    "bg-[#f1f5f9] text-[#475569]",
  GOLD:     "bg-[#fef9c3] text-[#854d0e]",
  DIAMANTE: "bg-[#ede9fe] text-[#6d28d9]",
}

export default function AdminAfiliadosPage() {
  const [afiliados, setAfiliados]   = useState<Afiliado[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatus]   = useState("")
  const [nivelFilter, setNivel]     = useState("")
  const [copied, setCopied]         = useState<string | null>(null)

  const fetchAfiliados = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "50" })
      const res  = await fetch(`/api/afiliados?${params}`)
      const json = await res.json()
      if (json.success) {
        const data = json.data?.data ?? json.data ?? []
        setAfiliados(Array.isArray(data) ? data : [])
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAfiliados() }, [fetchAfiliados])

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/afiliados/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      fetchAfiliados()
    } catch { fetchAfiliados() }
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/ref/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(slug)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = afiliados.filter(a => {
    const matchSearch = !search ||
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      (a.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || a.status === statusFilter
    const matchNivel  = !nivelFilter  || a.nivel  === nivelFilter
    return matchSearch && matchStatus && matchNivel
  })

  // KPIs
  const totalAtivos    = afiliados.filter(a => a.status === "ATIVO").length
  const totalLeads     = afiliados.reduce((s, a) => s + a.totalLeads, 0)
  const totalAprovados = afiliados.reduce((s, a) => s + a.totalAprovados, 0)
  const totalComissoes = afiliados.reduce((s, a) => s + a.totalComissoes, 0)

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Afiliados</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Gestão completa do programa de afiliados</p>
          </div>
          <button onClick={fetchAfiliados}
            className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-xs font-bold text-white hover:bg-[#0f9c40]">
            Atualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Total de Afiliados", value: afiliados.length,          accent:"#1DB954" },
            { label:"Afiliados Ativos",   value: totalAtivos,                accent:"#FF6B00" },
            { label:"Leads Gerados",      value: totalLeads,                 accent:"#1DB954" },
            { label:"Comissões Totais",   value: formatCurrency(totalComissoes), accent:"#FF6B00" },
          ].map(kpi => (
            <div key={kpi.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: kpi.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{kpi.label}</div>
              <div className="my-2 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">
                {loading ? "..." : kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            placeholder="🔍 Buscar por nome, e-mail ou slug..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[220px] rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="PENDENTE">Pendente</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select value={nivelFilter} onChange={e => setNivel(e.target.value)}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todos os níveis</option>
            <option value="BRONZE">Bronze</option>
            <option value="PRATA">Prata</option>
            <option value="GOLD">Gold</option>
            <option value="DIAMANTE">Diamante</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-6 py-4">
            <span className="font-['Sora'] text-base font-bold text-[#0D1B2A]">
              {loading ? "Carregando..." : `${filtered.length} afiliado${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f4f6f8]">
                  {["Afiliado","Contato","Link","Nível","Status","Cliques","Leads","Aprovados","Comissões","Ações"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(10).fill(0).map((_,j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-[#e5e7eb]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-sm text-[#9ca3af]">
                      Nenhum afiliado encontrado
                    </td>
                  </tr>
                ) : filtered.map(af => (
                  <tr key={af.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                    {/* Nome */}
                    <td className="px-4 py-3">
                      <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{af.nome}</div>
                      <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">
                        {new Date(af.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    {/* Contato */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-[#374151]">{af.email ?? "—"}</div>
                      <div className="text-xs text-[#6b7280]">{af.telefone}</div>
                    </td>
                    {/* Link */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyLink(af.slug)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all"
                      >
                        {copied === af.slug ? "✓ Copiado!" : `📋 /ref/${af.slug}`}
                      </button>
                    </td>
                    {/* Nível */}
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold ${NIVEL_STYLE[af.nivel] ?? ""}`}>
                        {af.nivel}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={af.status}
                        onChange={e => updateStatus(af.id, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold outline-none cursor-pointer ${STATUS_STYLE[af.status] ?? ""}`}
                      >
                        <option value="PENDENTE">Pendente</option>
                        <option value="ATIVO">Ativo</option>
                        <option value="INATIVO">Inativo</option>
                      </select>
                    </td>
                    {/* Métricas */}
                    <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{af.totalCliques}</td>
                    <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#FF6B00]">{af.totalLeads}</td>
                    <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#1DB954]">{af.totalAprovados}</td>
                    <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#1DB954]">
                      {formatCurrency(af.totalComissoes)}
                    </td>
                    {/* Ações */}
                    <td className="px-4 py-3">
                      <a
                        href={`/ref/${af.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#fff3e8] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#c2410c] hover:bg-[#FF6B00] hover:text-white transition-all no-underline"
                      >
                        Ver link
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
