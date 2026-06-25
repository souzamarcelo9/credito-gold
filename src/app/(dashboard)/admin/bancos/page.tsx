"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatCurrency } from "@/lib/utils"

const PRODUTOS_LISTA = [
  { key:"PESSOAL",     label:"Crédito Pessoal"         },
  { key:"GARANTIA",    label:"Com Garantia"             },
  { key:"EMPRESARIAL", label:"Crédito Empresarial"      },
  { key:"CONSIGNADO",  label:"Consignado"               },
  { key:"FGTS",        label:"Antecipação FGTS"         },
  { key:"ENERGIA",     label:"Empréstimo Conta de Luz"  },
]

interface ProdutoBanco {
  produto: string; comissaoCG: number
  percentualAfiliado: number; percentualCorrespondente: number; ativo: boolean
}
interface Banco {
  id: string; nome: string; tipo: string; ativo: boolean
  produtos: ProdutoBanco[]
  _count?: { leads: number }
}

const EMPTY_PRODUTOS = () => PRODUTOS_LISTA.map(p => ({
  produto: p.key, comissaoCG: 0, percentualAfiliado: 0, percentualCorrespondente: 0, ativo: true,
}))

export default function BancosPage() {
  const [bancos, setBancos]     = useState<Banco[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Banco|null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState("")
  const [search, setSearch]     = useState("")

  const [form, setForm] = useState({
    nome: "", tipo: "BANCO", ativo: true,
    produtos: EMPTY_PRODUTOS(),
  })

  const fetchBancos = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/bancos")
      const json = await res.json()
      if (json.success) setBancos(json.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBancos() }, [fetchBancos])

  function openNovo() {
    setIsEdit(false)
    setForm({ nome:"", tipo:"BANCO", ativo:true, produtos: EMPTY_PRODUTOS() })
    setMsg("")
    setShowModal(true)
  }

  function openEdit(banco: Banco) {
    setIsEdit(true)
    setSelected(banco)
    const produtosMap = Object.fromEntries(banco.produtos.map(p => [p.produto, p]))
    setForm({
      nome:  banco.nome,
      tipo:  banco.tipo,
      ativo: banco.ativo,
      produtos: PRODUTOS_LISTA.map(p => ({
        produto:                  p.key,
        comissaoCG:               produtosMap[p.key]?.comissaoCG               ?? 0,
        percentualAfiliado:       produtosMap[p.key]?.percentualAfiliado       ?? 0,
        percentualCorrespondente: produtosMap[p.key]?.percentualCorrespondente ?? 0,
        ativo:                    produtosMap[p.key]?.ativo                    ?? true,
      })),
    })
    setMsg("")
    setShowModal(true)
  }

  function updateProduto(idx: number, field: string, value: any) {
    setForm(f => ({
      ...f,
      produtos: f.produtos.map((p, i) => i === idx ? { ...p, [field]: value } : p),
    }))
  }

  async function salvar() {
    if (!form.nome.trim()) { setMsg("❌ Nome obrigatório"); return }
    setSaving(true); setMsg("")
    try {
      const url    = isEdit ? `/api/admin/bancos/${selected!.id}` : "/api/admin/bancos"
      const method = isEdit ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setMsg("✅ " + json.message)
        fetchBancos()
        setTimeout(() => { setShowModal(false); setMsg("") }, 1000)
      } else {
        setMsg("❌ " + json.message)
      }
    } catch { setMsg("❌ Erro de conexão") }
    finally  { setSaving(false) }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este banco/promotora?")) return
    await fetch(`/api/admin/bancos/${id}`, { method:"DELETE" })
    fetchBancos()
    if (selected?.id === id) setSelected(null)
  }

  const filtered = bancos.filter(b =>
    !search || b.nome.toLowerCase().includes(search.toLowerCase())
  )

  const totalAtivos  = bancos.filter(b => b.ativo).length
  const totalLeads   = bancos.reduce((s, b) => s + (b._count?.leads ?? 0), 0)

  // Preview do cálculo de comissão para o produto selecionado no painel
  function previewComissao(p: ProdutoBanco, valorLead = 1000) {
    const cg      = (valorLead * p.comissaoCG)               / 100
    const afil    = (cg       * p.percentualAfiliado)         / 100
    const corresp = (cg       * p.percentualCorrespondente)   / 100
    const cgFinal = cg - afil - corresp
    return { cg, afil, corresp, cgFinal }
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">🏦 Bancos e Promotoras</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Gerencie comissões por banco, promotora e produto</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchBancos}
              className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
              ↻ Atualizar
            </button>
            <button onClick={openNovo}
              className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40]">
              ➕ Adicionar Banco/Promotora
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label:"Total cadastrados", value: loading ? "..." : bancos.length,    accent:"#1DB954" },
            { label:"Ativos",            value: loading ? "..." : totalAtivos,       accent:"#FF6B00" },
            { label:"Leads vinculados",  value: loading ? "..." : totalLeads,        accent:"#1DB954" },
          ].map(k => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Busca */}
        <div className="mb-4">
          <input placeholder="🔍 Buscar banco ou promotora..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full max-w-[400px] rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">

          {/* Tabela */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            <div className="border-b border-[#e5e7eb] px-5 py-4">
              <span className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                {loading ? "Carregando..." : `${filtered.length} banco${filtered.length !== 1 ? "s" : ""}/promotora${filtered.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f4f6f8]">
                    {["Nome","Tipo","Produtos","Leads","Status","Ações"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(4).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(6).fill(0).map((_,j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>
                      ))}
                    </tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <div className="text-4xl mb-3">🏦</div>
                      <p className="text-sm text-[#9ca3af]">Nenhum banco ou promotora cadastrado</p>
                      <button onClick={openNovo}
                        className="mt-3 font-['Sora'] text-sm font-bold text-[#1DB954] hover:underline">
                        + Adicionar o primeiro
                      </button>
                    </td></tr>
                  ) : filtered.map(banco => (
                    <tr key={banco.id}
                      onClick={() => setSelected(selected?.id === banco.id ? null : banco)}
                      className={`cursor-pointer border-t border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${selected?.id === banco.id ? "bg-[#e8f8ee]" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{banco.nome}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold ${
                          banco.tipo === "BANCO" ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#ede9fe] text-[#6d28d9]"
                        }`}>
                          {banco.tipo === "BANCO" ? "🏦 Banco" : "🏢 Promotora"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                        {banco.produtos.filter(p => p.ativo).length}/{PRODUTOS_LISTA.length}
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-sm text-[#6b7280]">
                        {banco._count?.leads ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold ${
                          banco.ativo ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#f1f5f9] text-[#475569]"
                        }`}>
                          {banco.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(banco)}
                            className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all">
                            Editar
                          </button>
                          <button onClick={() => excluir(banco.id)}
                            className="rounded-lg bg-[#fee2e2] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-all">
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Painel de detalhes */}
          <div className={`rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm transition-all ${selected ? "opacity-100" : "opacity-40"}`}>
            {!selected ? (
              <div className="flex h-full items-center justify-center py-20 text-center">
                <div>
                  <div className="text-4xl mb-3">🏦</div>
                  <p className="font-['Sora'] text-sm text-[#9ca3af]">Clique em um banco<br/>para ver as comissões</p>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#FF6B00]">
                      {selected.tipo === "BANCO" ? "🏦 Banco" : "🏢 Promotora"}
                    </div>
                    <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">{selected.nome}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(selected)}
                      className="rounded-lg border-2 border-[#1DB954] px-3 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#1DB954] hover:bg-[#1DB954] hover:text-white transition-all">
                      Editar
                    </button>
                    <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
                  </div>
                </div>

                <div className="mb-3 font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                  Comissões por produto (base: R$ 1.000 negociado)
                </div>

                <div className="space-y-3">
                  {PRODUTOS_LISTA.map(pl => {
                    const p = selected.produtos.find(x => x.produto === pl.key)
                    if (!p || !p.ativo) return null
                    const calc = previewComissao(p, 1000)
                    return (
                      <div key={pl.key} className="rounded-xl border border-[#e5e7eb] p-3">
                        <div className="mb-2 font-['Sora'] text-xs font-bold text-[#0D1B2A]">{pl.label}</div>
                        <div className="grid grid-cols-2 gap-1.5 text-[0.65rem]">
                          <div className="rounded-lg bg-[#f4f6f8] px-2 py-1.5">
                            <div className="font-bold text-[#9ca3af]">Comissão CG</div>
                            <div className="font-bold text-[#0D1B2A]">{p.comissaoCG}% → {formatCurrency(calc.cg)}</div>
                          </div>
                          <div className="rounded-lg bg-[#e8f8ee] px-2 py-1.5">
                            <div className="font-bold text-[#9ca3af]">CG fica</div>
                            <div className="font-bold text-[#0f9c40]">{(100 - p.percentualAfiliado - p.percentualCorrespondente).toFixed(0)}% → {formatCurrency(calc.cgFinal)}</div>
                          </div>
                          <div className="rounded-lg bg-[#fff3e8] px-2 py-1.5">
                            <div className="font-bold text-[#9ca3af]">Afiliado</div>
                            <div className="font-bold text-[#FF6B00]">{p.percentualAfiliado}% → {formatCurrency(calc.afil)}</div>
                          </div>
                          <div className="rounded-lg bg-[#ede9fe] px-2 py-1.5">
                            <div className="font-bold text-[#9ca3af]">Correspondente</div>
                            <div className="font-bold text-[#6d28d9]">{p.percentualCorrespondente}% → {formatCurrency(calc.corresp)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {selected.produtos.filter(p => p.ativo).length === 0 && (
                    <p className="text-center text-sm text-[#9ca3af] py-4">Nenhum produto configurado</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Novo/Editar */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8"
            onClick={() => setShowModal(false)}>
            <div className="w-full max-w-[680px] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              onClick={e => e.stopPropagation()}>

              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">
                  {isEdit ? "✏️ Editar" : "➕ Novo"} Banco/Promotora
                </h2>
                <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
              </div>

              {/* Dados básicos */}
              <div className="mb-5 grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nome</label>
                  <input type="text" placeholder="Ex: Banco do Brasil" value={form.nome}
                    onChange={e => setForm(f => ({...f, nome: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                    <option value="BANCO">🏦 Banco</option>
                    <option value="PROMOTORA">🏢 Promotora</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
                  <input type="checkbox" id="ativo" checked={form.ativo}
                    onChange={e => setForm(f => ({...f, ativo: e.target.checked}))}
                    className="h-5 w-5 cursor-pointer accent-[#1DB954]" />
                  <label htmlFor="ativo" className="cursor-pointer font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                    Ativo — aparece nas opções de vinculação de leads
                  </label>
                </div>
              </div>

              {/* Produtos */}
              <div className="mb-5">
                <div className="mb-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                  Configuração de Comissões por Produto
                </div>
                <div className="rounded-xl border border-[#e5e7eb] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f4f6f8]">
                        <th className="px-3 py-2.5 text-left font-['Sora'] text-[0.6rem] font-bold uppercase text-[#6b7280]">Produto</th>
                        <th className="px-3 py-2.5 text-center font-['Sora'] text-[0.6rem] font-bold uppercase text-[#6b7280]">Comissão CG %</th>
                        <th className="px-3 py-2.5 text-center font-['Sora'] text-[0.6rem] font-bold uppercase text-[#FF6B00]">Afiliado %</th>
                        <th className="px-3 py-2.5 text-center font-['Sora'] text-[0.6rem] font-bold uppercase text-[#6d28d9]">Corresp. %</th>
                        <th className="px-3 py-2.5 text-center font-['Sora'] text-[0.6rem] font-bold uppercase text-[#0f9c40]">CG fica %</th>
                        <th className="px-3 py-2.5 text-center font-['Sora'] text-[0.6rem] font-bold uppercase text-[#6b7280]">Ativo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.produtos.map((p, idx) => {
                        const cgFica = 100 - (p.percentualAfiliado || 0) - (p.percentualCorrespondente || 0)
                        return (
                          <tr key={p.produto} className="border-t border-[#e5e7eb]">
                            <td className="px-3 py-2 font-['Sora'] text-xs font-semibold text-[#0D1B2A]">
                              {PRODUTOS_LISTA.find(x => x.key === p.produto)?.label}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" max="100" step="0.1"
                                  value={p.comissaoCG}
                                  onChange={e => updateProduto(idx, "comissaoCG", parseFloat(e.target.value)||0)}
                                  className="w-16 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-2 py-1 text-center text-xs outline-none focus:border-[#1DB954]" />
                                <span className="text-xs text-[#9ca3af]">%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" max="100" step="0.1"
                                  value={p.percentualAfiliado}
                                  onChange={e => updateProduto(idx, "percentualAfiliado", parseFloat(e.target.value)||0)}
                                  className="w-16 rounded-lg border border-[#e5e7eb] bg-[#fff3e8] px-2 py-1 text-center text-xs outline-none focus:border-[#FF6B00]" />
                                <span className="text-xs text-[#9ca3af]">%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <input type="number" min="0" max="100" step="0.1"
                                  value={p.percentualCorrespondente}
                                  onChange={e => updateProduto(idx, "percentualCorrespondente", parseFloat(e.target.value)||0)}
                                  className="w-16 rounded-lg border border-[#e5e7eb] bg-[#ede9fe] px-2 py-1 text-center text-xs outline-none focus:border-[#6d28d9]" />
                                <span className="text-xs text-[#9ca3af]">%</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span className={`font-['Sora'] text-xs font-bold ${cgFica >= 0 ? "text-[#0f9c40]" : "text-red-500"}`}>
                                {cgFica.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input type="checkbox" checked={p.ativo}
                                onChange={e => updateProduto(idx, "ativo", e.target.checked)}
                                className="h-4 w-4 cursor-pointer accent-[#1DB954]" />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 font-['Sora'] text-[0.65rem] text-[#9ca3af]">
                  ⚠️ A soma de Afiliado% + Correspondente% não pode ultrapassar 100%. O restante fica com a Crédito Gold.
                </p>
              </div>

              {msg && (
                <div className={`mb-4 rounded-xl px-4 py-2.5 font-['Sora'] text-sm font-bold ${msg.startsWith("✅") ? "bg-[#e8f8ee] text-[#0f9c40]" : "bg-red-50 text-red-600"}`}>
                  {msg}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border-2 border-[#e5e7eb] py-3 font-['Sora'] text-sm font-bold text-[#6b7280] hover:border-[#0D1B2A] transition-all">
                  Cancelar
                </button>
                <button onClick={salvar} disabled={saving}
                  className="flex-1 rounded-xl bg-[#1DB954] py-3 font-['Sora'] text-sm font-bold text-white shadow-[0_4px_16px_rgba(29,185,84,0.25)] hover:bg-[#0f9c40] disabled:opacity-60 transition-all">
                  {saving ? "Salvando..." : isEdit ? "💾 Salvar alterações" : "➕ Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
