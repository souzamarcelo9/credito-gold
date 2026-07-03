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

const FORMAS_PAGAMENTO = [
  "À vista", "Cartão de Crédito", "Cartão de Débito", "PIX", "Boleto", "Transferência",
]

interface Despesa {
  id:string; descricao:string; categoria:string; valor:number
  parcelado:boolean; totalParcelas:number; parcelaAtual:number
  valorParcela?:number; formaPagamento:string
  dataPrimeiraParcela?:string; observacao?:string; data:string
}

const FORM_EMPTY = {
  descricao:"", categoria:"OPERACIONAL", valor:"", data: new Date().toISOString().slice(0,10),
  parcelado: false, totalParcelas:"1", parcelaAtual:"1",
  formaPagamento:"À vista", dataPrimeiraParcela:"", observacao:"",
}

export default function DespesasPage() {
  const [despesas, setDespesas]   = useState<Despesa[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Despesa|null>(null)
  const [selected, setSelected]   = useState<Despesa|null>(null)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState("")
  const [mes, setMes]             = useState(() => new Date().toISOString().slice(0,7))
  const [catFilter, setCatFilter] = useState("")
  const [form, setForm]           = useState({ ...FORM_EMPTY })

  const fetchDespesas = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ mes })
      if (catFilter) p.set("categoria", catFilter)
      const res  = await fetch(`/api/admin/despesas?${p}`)
      const json = await res.json()
      if (json.success) setDespesas(Array.isArray(json.data) ? json.data : [])
    } finally { setLoading(false) }
  }, [mes, catFilter])

  useEffect(() => { fetchDespesas() }, [fetchDespesas])

  function openNovo() {
    setEditando(null)
    setForm({ ...FORM_EMPTY, data: new Date().toISOString().slice(0,10) })
    setMsg(""); setShowModal(true)
  }

  function openEdit(d: Despesa) {
    setEditando(d)
    setForm({
      descricao:          d.descricao,
      categoria:          d.categoria,
      valor:              String(d.valor),
      data:               new Date(d.data).toISOString().slice(0,10),
      parcelado:          d.parcelado,
      totalParcelas:      String(d.totalParcelas),
      parcelaAtual:       String(d.parcelaAtual),
      formaPagamento:     d.formaPagamento,
      dataPrimeiraParcela:d.dataPrimeiraParcela ? new Date(d.dataPrimeiraParcela).toISOString().slice(0,10) : "",
      observacao:         d.observacao ?? "",
    })
    setMsg(""); setShowModal(true)
  }

  async function salvar() {
    if (!form.descricao.trim())            { setMsg("❌ Descrição obrigatória"); return }
    if (!form.valor || parseFloat(form.valor) <= 0) { setMsg("❌ Valor inválido"); return }
    if (form.parcelado && (!form.totalParcelas || parseInt(form.totalParcelas) < 2)) {
      setMsg("❌ Parcelamento requer mínimo 2 parcelas"); return
    }

    setSaving(true); setMsg("")
    try {
      const url    = editando ? `/api/admin/despesas/${editando.id}` : "/api/admin/despesas"
      const method = editando ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method, headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ ...form, valor: parseFloat(form.valor) }),
      })
      const json = await res.json()
      if (json.success) {
        setMsg("✅ " + json.message); fetchDespesas()
        setTimeout(() => { setShowModal(false); setMsg("") }, 800)
      } else { setMsg("❌ " + json.message) }
    } catch { setMsg("❌ Erro de conexão") }
    finally { setSaving(false) }
  }

  async function excluir(id: string) {
    if (!confirm("Remover esta despesa?")) return
    await fetch(`/api/admin/despesas/${id}`, { method:"DELETE" })
    fetchDespesas(); if (selected?.id === id) setSelected(null)
  }

  // Cálculos do mês
  const totalMes     = despesas.filter(d => !catFilter || d.categoria === catFilter)
                                .reduce((s, d) => s + (d.parcelado && d.valorParcela ? d.valorParcela : d.valor), 0)
  const totalParceladas = despesas.filter(d => d.parcelado).length

  // Breakdown por categoria
  const porCategoria = CATEGORIAS.map(c => ({
    ...c,
    total: despesas
      .filter(d => d.categoria === c.key)
      .reduce((s, d) => s + (d.parcelado && d.valorParcela ? d.valorParcela : d.valor), 0),
  })).filter(c => c.total > 0)

  function getCat(key: string) { return CATEGORIAS.find(c => c.key === key) ?? CATEGORIAS[CATEGORIAS.length-1] }

  // Preview parcela no formulário
  const previewParcela = form.parcelado && form.valor && parseInt(form.totalParcelas) > 1
    ? parseFloat(form.valor) / parseInt(form.totalParcelas)
    : null

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">💸 Despesas Operacionais</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Controle de despesas com suporte a parcelamento</p>
          </div>
          <button onClick={openNovo}
            className="rounded-full bg-[#FF6B00] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#e06000]">
            + Nova Despesa
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Mês:</label>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)}
              className="rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="rounded-xl border-2 border-[#e5e7eb] bg-white px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        {/* KPI total do mês */}
        <div className="mb-5 grid grid-cols-3 gap-4">
          {[
            { label:`Total do mês (parcelas inclusas)`, value: formatCurrency(totalMes), accent:"#dc2626", icon:"📊" },
            { label:"Despesas parceladas no mês",        value: totalParceladas,          accent:"#FF6B00", icon:"💳" },
            { label:"Despesas à vista no mês",           value: despesas.filter(d => !d.parcelado).length, accent:"#1DB954", icon:"💰" },
          ].map(k => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="flex items-center justify-between">
                <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
                <span className="text-xl">{k.icon}</span>
              </div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{loading ? "..." : k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

          {/* Tabela */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f4f6f8]">
                    {["Data","Descrição","Categoria","Forma","Total","Parcela/Mês","Parcelas","Ações"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(8).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>)}
                    </tr>
                  )) : despesas.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center">
                      <div className="text-4xl mb-3">💸</div>
                      <p className="text-sm text-[#9ca3af]">Nenhuma despesa neste período</p>
                      <button onClick={openNovo} className="mt-3 font-['Sora'] text-sm font-bold text-[#FF6B00] hover:underline">
                        + Cadastrar primeira despesa
                      </button>
                    </td></tr>
                  ) : despesas.map(d => {
                    const cat = getCat(d.categoria)
                    return (
                      <tr key={d.id}
                        onClick={() => setSelected(selected?.id === d.id ? null : d)}
                        className={`cursor-pointer border-t border-[#e5e7eb] hover:bg-[#f9fafb] ${selected?.id === d.id ? "bg-[#fff3e8]" : ""}`}>
                        <td className="px-4 py-3 font-['Sora'] text-xs text-[#9ca3af]">
                          {new Date(d.data).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-['Sora'] text-sm font-medium text-[#0D1B2A]">{d.descricao}</div>
                          {d.observacao && <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{d.observacao}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                            style={{ background: cat.bg, color: cat.color }}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">
                          {d.formaPagamento}
                        </td>
                        <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#dc2626]">
                          {formatCurrency(d.valor)}
                        </td>
                        <td className="px-4 py-3">
                          {d.parcelado && d.valorParcela ? (
                            <span className="font-['Sora'] text-sm font-bold text-[#FF6B00]">
                              {formatCurrency(d.valorParcela)}
                            </span>
                          ) : (
                            <span className="font-['Sora'] text-xs text-[#9ca3af]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {d.parcelado ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-['Sora'] text-xs font-bold text-[#0D1B2A]">
                                {d.parcelaAtual}/{d.totalParcelas}
                              </span>
                              {/* Barra de progresso mini */}
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#f4f6f8]">
                                <div className="h-full rounded-full bg-[#FF6B00] transition-all"
                                  style={{ width:`${(d.parcelaAtual/d.totalParcelas)*100}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold text-[#0f9c40]">
                              À vista
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5">
                            <button onClick={() => openEdit(d)}
                              className="rounded-lg bg-[#f4f6f8] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#374151] hover:bg-[#e5e7eb] transition-all">
                              Editar
                            </button>
                            <button onClick={() => excluir(d.id)}
                              className="rounded-lg bg-[#fee2e2] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-all">
                              ✕
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

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Detalhes do selecionado */}
            {selected && (
              <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{selected.descricao}</div>
                  <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
                </div>
                {selected.parcelado && selected.valorParcela && (
                  <div className="mb-3 rounded-xl bg-[#fff3e8] p-3">
                    <div className="font-['Sora'] text-[0.65rem] font-bold uppercase text-[#FF6B00]">Parcelamento</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">{formatCurrency(selected.valorParcela)}</span>
                      <span className="font-['Sora'] text-xs text-[#9ca3af]">/mês</span>
                    </div>
                    <div className="mt-2 font-['Sora'] text-xs text-[#6b7280]">
                      Parcela {selected.parcelaAtual} de {selected.totalParcelas} · Total: {formatCurrency(selected.valor)}
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                      <div className="h-full rounded-full bg-[#FF6B00] transition-all"
                        style={{ width:`${(selected.parcelaAtual/selected.totalParcelas)*100}%` }} />
                    </div>
                    <div className="mt-1 text-right font-['Sora'] text-[0.6rem] text-[#9ca3af]">
                      {selected.totalParcelas - selected.parcelaAtual} parcela{selected.totalParcelas - selected.parcelaAtual !== 1 ? "s" : ""} restante{selected.totalParcelas - selected.parcelaAtual !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-xs">
                  {[
                    { label:"Forma de pagamento", value: selected.formaPagamento },
                    { label:"Data",               value: new Date(selected.data).toLocaleDateString("pt-BR") },
                    { label:"Categoria",          value: getCat(selected.categoria).label },
                    ...(selected.dataPrimeiraParcela ? [{ label:"1ª parcela em", value: new Date(selected.dataPrimeiraParcela).toLocaleDateString("pt-BR") }] : []),
                  ].map(item => (
                    <div key={item.label} className="flex justify-between rounded-lg bg-[#f9fafb] px-3 py-2">
                      <span className="font-bold text-[#9ca3af]">{item.label}</span>
                      <span className="text-[#0D1B2A]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown por categoria */}
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="mb-4 font-['Sora'] text-sm font-bold text-[#0D1B2A]">Por Categoria</div>
              {loading ? (
                <div className="space-y-3">{Array(4).fill(0).map((_,i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-[#e5e7eb]" />)}</div>
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
                      <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background: cat.color }} />
                    </div>
                    <div className="mt-0.5 text-right font-['Sora'] text-[0.6rem] text-[#9ca3af]">{pct.toFixed(1)}%</div>
                  </div>
                )
              })}
            </div>

            <a href="/financeiro"
              className="flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 no-underline shadow-sm hover:border-[#1DB954] hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f8ee] text-xl">📈</div>
              <div>
                <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Dashboard Financeiro</div>
                <div className="font-['Sora'] text-xs text-[#9ca3af]">Ver receitas e margem</div>
              </div>
            </a>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8"
            onClick={() => setShowModal(false)}>
            <div className="w-full max-w-[520px] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              onClick={e => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">
                  {editando ? "✏️ Editar Despesa" : "+ Nova Despesa"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
              </div>

              <div className="space-y-4">
                {/* Descrição */}
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Descrição *</label>
                  <input type="text" placeholder="Ex: Desenvolvimento de sistema" value={form.descricao}
                    onChange={e => setForm(f => ({...f, descricao: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>

                {/* Categoria + Forma */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Categoria</label>
                    <select value={form.categoria} onChange={e => setForm(f => ({...f, categoria: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Forma de pagamento</label>
                    <select value={form.formaPagamento} onChange={e => setForm(f => ({...f, formaPagamento: e.target.value, parcelado: e.target.value === "Cartão de Crédito" ? f.parcelado : false}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      {FORMAS_PAGAMENTO.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {/* Valor + Data */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Valor total (R$) *</label>
                    <input type="number" min="0" step="0.01" placeholder="0,00" value={form.valor}
                      onChange={e => setForm(f => ({...f, valor: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Data da despesa</label>
                    <input type="date" value={form.data}
                      onChange={e => setForm(f => ({...f, data: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                </div>

                {/* Toggle parcelamento */}
                <div className="rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">💳 Parcelado</div>
                      <div className="font-['Sora'] text-xs text-[#9ca3af]">Divida o valor em parcelas mensais</div>
                    </div>
                    <button type="button"
                      onClick={() => setForm(f => ({...f, parcelado: !f.parcelado, totalParcelas: !f.parcelado ? "2" : "1"}))}
                      className={`relative h-6 w-11 rounded-full transition-colors ${form.parcelado ? "bg-[#FF6B00]" : "bg-[#e5e7eb]"}`}>
                      <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.parcelado ? "left-5.5 translate-x-5" : "left-0.5"}`} />
                    </button>
                  </div>

                  {form.parcelado && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase text-[#374151]">Total de parcelas</label>
                          <select value={form.totalParcelas}
                            onChange={e => setForm(f => ({...f, totalParcelas: e.target.value}))}
                            className="w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B00]">
                            {[2,3,4,5,6,7,8,9,10,11,12,18,24,36,48,60].map(n => (
                              <option key={n} value={n}>{n}x</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase text-[#374151]">Parcela atual</label>
                          <select value={form.parcelaAtual}
                            onChange={e => setForm(f => ({...f, parcelaAtual: e.target.value}))}
                            className="w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B00]">
                            {Array.from({ length: parseInt(form.totalParcelas) || 1 }, (_,i) => i+1).map(n => (
                              <option key={n} value={n}>{n}ª parcela</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase text-[#374151]">Data da 1ª parcela</label>
                        <input type="date" value={form.dataPrimeiraParcela}
                          onChange={e => setForm(f => ({...f, dataPrimeiraParcela: e.target.value}))}
                          className="w-full rounded-xl border-2 border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF6B00]" />
                      </div>

                      {/* Preview */}
                      {previewParcela && (
                        <div className="rounded-xl bg-[#fff3e8] p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-['Sora'] text-xs font-bold text-[#FF6B00]">Valor por parcela:</span>
                            <span className="font-['Sora'] text-lg font-extrabold text-[#FF6B00]">{formatCurrency(previewParcela)}</span>
                          </div>
                          <div className="mt-1 font-['Sora'] text-[0.65rem] text-[#9ca3af]">
                            {form.totalParcelas}x de {formatCurrency(previewParcela)} = {formatCurrency(parseFloat(form.valor))} total
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Observação */}
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Observação (opcional)</label>
                  <input type="text" placeholder="Ex: Contrato nº 123, fornecedor XYZ..." value={form.observacao}
                    onChange={e => setForm(f => ({...f, observacao: e.target.value}))}
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
