"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatCurrency } from "@/lib/utils"

const CATEGORIAS = [
  { key:"OPERACIONAL", label:"Operacional",  color:"#1DB954", bg:"#e8f8ee" },
  { key:"PESSOAL",     label:"Pessoal",      color:"#FF6B00", bg:"#fff3e8" },
  { key:"MARKETING",   label:"Marketing",    color:"#1d4ed8", bg:"#dbeafe" },
  { key:"TECNOLOGIA",  label:"Tecnologia",   color:"#6d28d9", bg:"#ede9fe" },
  { key:"JURIDICO",    label:"Jurídico",     color:"#0891b2", bg:"#e0f2fe" },
  { key:"IMPOSTOS",    label:"Impostos",     color:"#dc2626", bg:"#fee2e2" },
  { key:"OUTROS",      label:"Outros",       color:"#475569", bg:"#f1f5f9" },
]

interface Despesa {
  id: string; descricao: string; categoria: string; valor: number; data: string
}

export default function DespesasPage() {
  const [despesas, setDespesas]   = useState<Despesa[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Despesa|null>(null)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState("")
  const [mes, setMes]             = useState(() => new Date().toISOString().slice(0,7))
  const [catFilter, setCatFilter] = useState("")

  const [form, setForm] = useState({
    descricao:"", categoria:"OPERACIONAL", valor:"", data: new Date().toISOString().slice(0,10),
  })

  const fetchDespesas = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/despesas?mes=${mes}`)
      const json = await res.json()
      if (json.success) setDespesas(Array.isArray(json.data) ? json.data : [])
    } finally { setLoading(false) }
  }, [mes])

  useEffect(() => { fetchDespesas() }, [fetchDespesas])

  function openNovo() {
    setEditando(null)
    setForm({ descricao:"", categoria:"OPERACIONAL", valor:"", data: new Date().toISOString().slice(0,10) })
    setMsg("")
    setShowModal(true)
  }

  function openEdit(d: Despesa) {
    setEditando(d)
    setForm({
      descricao: d.descricao,
      categoria: d.categoria,
      valor:     String(d.valor),
      data:      new Date(d.data).toISOString().slice(0,10),
    })
    setMsg("")
    setShowModal(true)
  }

  async function salvar() {
    if (!form.descricao.trim()) { setMsg("❌ Descrição obrigatória"); return }
    if (!form.valor || parseFloat(form.valor) <= 0) { setMsg("❌ Valor inválido"); return }

    setSaving(true); setMsg("")
    try {
      const url    = editando ? `/api/admin/despesas/${editando.id}` : "/api/admin/despesas"
      const method = editando ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ ...form, valor: parseFloat(form.valor) }),
      })
      const json = await res.json()
      if (json.success) {
        setMsg("✅ " + json.message)
        fetchDespesas()
        setTimeout(() => { setShowModal(false); setMsg("") }, 800)
      } else {
        setMsg("❌ " + json.message)
      }
    } catch { setMsg("❌ Erro de conexão") }
    finally { setSaving(false) }
  }

  async function excluir(id: string) {
    if (!confirm("Remover esta despesa?")) return
    await fetch(`/api/admin/despesas/${id}`, { method:"DELETE" })
    fetchDespesas()
  }

  const filtered = despesas.filter(d => !catFilter || d.categoria === catFilter)
  const totalMes = filtered.reduce((s, d) => s + d.valor, 0)

  // Agrupamento por categoria
  const porCategoria = CATEGORIAS.map(c => ({
    ...c,
    total: despesas.filter(d => d.categoria === c.key).reduce((s,d) => s + d.valor, 0),
  })).filter(c => c.total > 0)

  function getCat(key: string) {
    return CATEGORIAS.find(c => c.key === key) ?? CATEGORIAS[CATEGORIAS.length - 1]
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">💸 Despesas Operacionais</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Controle e categorização das despesas da empresa</p>
          </div>
          <button onClick={openNovo}
            className="rounded-full bg-[#FF6B00] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#e06000]">
            + Nova Despesa
          </button>
        </div>

        {/* Filtro de mês */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Mês:</label>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            className="rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

          {/* Tabela */}
          <div>
            {/* KPI total */}
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#e5e7eb] bg-white px-6 py-4 shadow-sm">
              <div>
                <div className="font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                  Total de despesas — {new Date(mes + "-01").toLocaleString("pt-BR",{month:"long",year:"numeric"})}
                </div>
                <div className="font-['Sora'] text-2xl font-extrabold text-[#dc2626]">
                  {loading ? "..." : formatCurrency(totalMes)}
                </div>
              </div>
              <div className="text-4xl">📊</div>
            </div>

            <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f4f6f8]">
                      {["Data","Descrição","Categoria","Valor","Ações"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? Array(5).fill(0).map((_,i) => (
                      <tr key={i} className="border-t border-[#e5e7eb]">
                        {Array(5).fill(0).map((_,j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>
                        ))}
                      </tr>
                    )) : filtered.length === 0 ? (
                      <tr><td colSpan={5} className="py-16 text-center">
                        <div className="text-4xl mb-3">💸</div>
                        <p className="text-sm text-[#9ca3af]">Nenhuma despesa neste período</p>
                        <button onClick={openNovo}
                          className="mt-3 font-['Sora'] text-sm font-bold text-[#FF6B00] hover:underline">
                          + Cadastrar primeira despesa
                        </button>
                      </td></tr>
                    ) : filtered.map(d => {
                      const cat = getCat(d.categoria)
                      return (
                        <tr key={d.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                          <td className="px-4 py-3 font-['Sora'] text-xs text-[#9ca3af]">
                            {new Date(d.data).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 font-['Sora'] text-sm font-medium text-[#0D1B2A]">
                            {d.descricao}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                              style={{ background: cat.bg, color: cat.color }}>
                              {cat.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#dc2626]">
                            {formatCurrency(d.valor)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => openEdit(d)}
                                className="rounded-lg bg-[#f4f6f8] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#374151] hover:bg-[#e5e7eb] transition-all">
                                Editar
                              </button>
                              <button onClick={() => excluir(d.id)}
                                className="rounded-lg bg-[#fee2e2] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-all">
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar — breakdown por categoria */}
          <div className="space-y-4">
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="mb-4 font-['Sora'] text-sm font-bold text-[#0D1B2A]">Por Categoria</div>
              {loading ? (
                <div className="space-y-3">
                  {Array(4).fill(0).map((_,i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-[#e5e7eb]" />)}
                </div>
              ) : porCategoria.length === 0 ? (
                <p className="text-center text-sm text-[#9ca3af]">Sem dados</p>
              ) : porCategoria.sort((a,b) => b.total - a.total).map(cat => {
                const pct = totalMes > 0 ? (cat.total / totalMes) * 100 : 0
                return (
                  <div key={cat.key} className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-['Sora'] text-xs font-semibold text-[#374151]">{cat.label}</span>
                      <span className="font-['Sora'] text-xs font-bold text-[#0D1B2A]">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f4f6f8]">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width:`${pct}%`, background: cat.color }} />
                    </div>
                    <div className="mt-0.5 text-right font-['Sora'] text-[0.6rem] text-[#9ca3af]">{pct.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>

            {/* Atalho para o financeiro */}
            <a href="/financeiro"
              className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 no-underline shadow-sm hover:border-[#1DB954] hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f8ee] text-xl">📈</div>
              <div>
                <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Ver Dashboard Financeiro</div>
                <div className="font-['Sora'] text-xs text-[#9ca3af]">Receitas, margem e resultado</div>
              </div>
            </a>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}>
            <div className="w-full max-w-[440px] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              onClick={e => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">
                  {editando ? "✏️ Editar Despesa" : "+ Nova Despesa"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Descrição</label>
                  <input type="text" placeholder="Ex: Aluguel do escritório" value={form.descricao}
                    onChange={e => setForm(f => ({...f, descricao: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Categoria</label>
                    <select value={form.categoria} onChange={e => setForm(f => ({...f, categoria: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Valor (R$)</label>
                    <input type="number" min="0" step="0.01" placeholder="0,00" value={form.valor}
                      onChange={e => setForm(f => ({...f, valor: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Data</label>
                  <input type="date" value={form.data}
                    onChange={e => setForm(f => ({...f, data: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>

                {msg && (
                  <div className={`rounded-xl px-4 py-2.5 font-['Sora'] text-sm font-bold ${msg.startsWith("✅") ? "bg-[#e8f8ee] text-[#0f9c40]" : "bg-red-50 text-red-600"}`}>
                    {msg}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl border-2 border-[#e5e7eb] py-3 font-['Sora'] text-sm font-bold text-[#6b7280] hover:border-[#0D1B2A]">
                    Cancelar
                  </button>
                  <button onClick={salvar} disabled={saving}
                    className="flex-1 rounded-xl bg-[#FF6B00] py-3 font-['Sora'] text-sm font-bold text-white hover:bg-[#e06000] disabled:opacity-60">
                    {saving ? "Salvando..." : editando ? "💾 Salvar" : "+ Cadastrar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
