"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"

const CATEGORIAS = [
  { key:"EMPRESA",        label:"Empresa",          color:"#1DB954", bg:"#e8f8ee" },
  { key:"CORRESPONDENTE", label:"Correspondente",    color:"#FF6B00", bg:"#fff3e8" },
  { key:"AFILIADO",       label:"Afiliado",          color:"#1d4ed8", bg:"#dbeafe" },
  { key:"BANCO_PARCEIRO", label:"Banco Parceiro",    color:"#6d28d9", bg:"#ede9fe" },
  { key:"JURIDICO",       label:"Jurídico",          color:"#0891b2", bg:"#e0f2fe" },
  { key:"CONTABIL",       label:"Contábil",          color:"#854d0e", bg:"#fef3c7" },
  { key:"OUTROS",         label:"Outros",            color:"#475569", bg:"#f1f5f9" },
]

const STATUS_CONFIG = {
  VALIDO:    { label:"Válido",     color:"#15803d", bg:"#dcfce7", icon:"✅" },
  VENCENDO:  { label:"Vencendo",   color:"#92400e", bg:"#fef3c7", icon:"⚠️" },
  VENCIDO:   { label:"Vencido",    color:"#dc2626", bg:"#fee2e2", icon:"❌" },
  ARQUIVADO: { label:"Arquivado",  color:"#475569", bg:"#f1f5f9", icon:"📁" },
}

interface Documento {
  id:string; titulo:string; categoria:string; descricao?:string
  responsavel?:string; arquivoNome?:string
  dataEmissao?:string; dataVencimento?:string; status:string; createdAt:string
}
interface Stats { total:number; validos:number; vencendo:number; vencidos:number }

function diasRestantes(dataVencimento?: string) {
  if (!dataVencimento) return null
  const diff = Math.ceil((new Date(dataVencimento).getTime() - Date.now()) / (1000*60*60*24))
  return diff
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [stats, setStats]           = useState<Stats>({ total:0, validos:0, vencendo:0, vencidos:0 })
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [catFilter, setCatFilter]   = useState("")
  const [statusFilter, setStatus]   = useState("")
  const [showModal, setShowModal]   = useState(false)
  const [editando, setEditando]     = useState<Documento|null>(null)
  const [selected, setSelected]     = useState<Documento|null>(null)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState("")

  const [form, setForm] = useState({
    titulo:"", categoria:"EMPRESA", descricao:"", responsavel:"",
    dataEmissao:"", dataVencimento:"", arquivoNome:"",
  })

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (catFilter)    params.set("categoria", catFilter)
      if (statusFilter) params.set("status",    statusFilter)
      if (search)       params.set("search",    search)
      const res  = await fetch(`/api/admin/documentos?${params}`)
      const json = await res.json()
      if (json.success) {
        setDocumentos(json.data.documentos ?? [])
        setStats(json.data.stats ?? { total:0, validos:0, vencendo:0, vencidos:0 })
      }
    } finally { setLoading(false) }
  }, [catFilter, statusFilter, search])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  function openNovo() {
    setEditando(null)
    setForm({ titulo:"", categoria:"EMPRESA", descricao:"", responsavel:"", dataEmissao:"", dataVencimento:"", arquivoNome:"" })
    setMsg("")
    setShowModal(true)
  }

  function openEdit(doc: Documento) {
    setEditando(doc)
    setForm({
      titulo:         doc.titulo,
      categoria:      doc.categoria,
      descricao:      doc.descricao      ?? "",
      responsavel:    doc.responsavel    ?? "",
      dataEmissao:    doc.dataEmissao    ? new Date(doc.dataEmissao).toISOString().slice(0,10)    : "",
      dataVencimento: doc.dataVencimento ? new Date(doc.dataVencimento).toISOString().slice(0,10) : "",
      arquivoNome:    doc.arquivoNome    ?? "",
    })
    setMsg("")
    setShowModal(true)
  }

  async function salvar() {
    if (!form.titulo.trim()) { setMsg("❌ Título obrigatório"); return }
    setSaving(true); setMsg("")
    try {
      const url    = editando ? `/api/admin/documentos/${editando.id}` : "/api/admin/documentos"
      const method = editando ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setMsg("✅ " + json.message)
        fetchDocs()
        setTimeout(() => { setShowModal(false); setMsg("") }, 800)
      } else { setMsg("❌ " + json.message) }
    } catch { setMsg("❌ Erro de conexão") }
    finally { setSaving(false) }
  }

  async function arquivar(id: string) {
    await fetch(`/api/admin/documentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ ...documentos.find(d => d.id === id), status:"ARQUIVADO" }),
    })
    fetchDocs()
    if (selected?.id === id) setSelected(null)
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este documento permanentemente?")) return
    await fetch(`/api/admin/documentos/${id}`, { method:"DELETE" })
    fetchDocs()
    if (selected?.id === id) setSelected(null)
  }

  function getCat(key: string) { return CATEGORIAS.find(c => c.key === key) ?? CATEGORIAS[CATEGORIAS.length-1] }

  // Documentos com vencimento próximo para alertas
  const alertas = documentos.filter(d => d.status === "VENCENDO" || d.status === "VENCIDO")

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">📋 Controle de Documentos</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Gerencie documentos, contratos e certificados</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchDocs}
              className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
              ↻ Atualizar
            </button>
            <button onClick={openNovo}
              className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40]">
              + Novo Documento
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Total",           value:stats.total,    accent:"#1DB954", icon:"📋", filter:""         },
            { label:"Válidos",         value:stats.validos,  accent:"#1DB954", icon:"✅", filter:"VALIDO"   },
            { label:"Vencendo em 30d", value:stats.vencendo, accent:"#FF6B00", icon:"⚠️", filter:"VENCENDO" },
            { label:"Vencidos",        value:stats.vencidos, accent:"#dc2626", icon:"❌", filter:"VENCIDO"  },
          ].map(k => (
            <button key={k.label}
              onClick={() => setStatus(statusFilter === k.filter ? "" : k.filter)}
              className={`relative overflow-hidden rounded-[14px] border-2 bg-white p-5 text-left transition-all hover:shadow-md ${
                statusFilter === k.filter ? "border-[#0D1B2A]" : "border-[#e5e7eb]"
              }`}>
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="flex items-center justify-between">
                <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
                <span className="text-lg">{k.icon}</span>
              </div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{loading ? "..." : k.value}</div>
            </button>
          ))}
        </div>

        {/* Alertas de vencimento */}
        {alertas.length > 0 && !catFilter && !statusFilter && (
          <div className="mb-5 rounded-2xl border border-[#FF6B00]/30 bg-[#fff8f3] p-4">
            <div className="mb-2 flex items-center gap-2 font-['Sora'] text-sm font-bold text-[#c2410c]">
              ⚠️ {alertas.length} documento{alertas.length !== 1 ? "s" : ""} precisam de atenção
            </div>
            <div className="flex flex-wrap gap-2">
              {alertas.slice(0,5).map(d => {
                const dias = diasRestantes(d.dataVencimento)
                return (
                  <button key={d.id} onClick={() => setSelected(d)}
                    className={`rounded-xl px-3 py-1.5 font-['Sora'] text-xs font-bold transition-all hover:opacity-80 ${
                      d.status === "VENCIDO" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#fef3c7] text-[#92400e]"
                    }`}>
                    {d.titulo} {dias !== null ? (dias < 0 ? "(vencido)" : `(${dias}d)`) : ""}
                  </button>
                )
              })}
              {alertas.length > 5 && (
                <span className="font-['Sora'] text-xs text-[#9ca3af]">+{alertas.length - 5} mais</span>
              )}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input placeholder="🔍 Buscar por título, responsável..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="min-w-[240px] flex-1 rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* Tabela */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            <div className="border-b border-[#e5e7eb] px-5 py-4">
              <span className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                {loading ? "Carregando..." : `${documentos.length} documento${documentos.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f4f6f8]">
                    {["Título","Categoria","Responsável","Vencimento","Status","Ações"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(6).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(6).fill(0).map((_,j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>
                      ))}
                    </tr>
                  )) : documentos.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-sm text-[#9ca3af]">Nenhum documento encontrado</p>
                      <button onClick={openNovo}
                        className="mt-3 font-['Sora'] text-sm font-bold text-[#1DB954] hover:underline">
                        + Adicionar primeiro documento
                      </button>
                    </td></tr>
                  ) : documentos.map(doc => {
                    const cat    = getCat(doc.categoria)
                    const st     = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.VALIDO
                    const dias   = diasRestantes(doc.dataVencimento)
                    return (
                      <tr key={doc.id}
                        onClick={() => setSelected(selected?.id === doc.id ? null : doc)}
                        className={`cursor-pointer border-t border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${selected?.id === doc.id ? "bg-[#e8f8ee]" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{doc.titulo}</div>
                          {doc.arquivoNome && (
                            <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">📎 {doc.arquivoNome}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                            style={{ background: cat.bg, color: cat.color }}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{doc.responsavel ?? "—"}</td>
                        <td className="px-4 py-3">
                          {doc.dataVencimento ? (
                            <div>
                              <div className="font-['Sora'] text-xs font-medium text-[#0D1B2A]">
                                {new Date(doc.dataVencimento).toLocaleDateString("pt-BR")}
                              </div>
                              {dias !== null && (
                                <div className={`font-['Sora'] text-[0.6rem] font-bold ${dias < 0 ? "text-[#dc2626]" : dias <= 30 ? "text-[#92400e]" : "text-[#9ca3af]"}`}>
                                  {dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d restantes`}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-xs text-[#9ca3af]">Sem vencimento</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                            style={{ background: st.bg, color: st.color }}>
                            {st.icon} {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5">
                            <button onClick={() => openEdit(doc)}
                              className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all">
                              Editar
                            </button>
                            {doc.status !== "ARQUIVADO" && (
                              <button onClick={() => arquivar(doc.id)}
                                className="rounded-lg bg-[#f1f5f9] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#475569] hover:bg-[#e2e8f0] transition-all">
                                Arquivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Painel de detalhes */}
          <div className={`rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm transition-all ${selected ? "opacity-100" : "opacity-40"}`}>
            {!selected ? (
              <div className="flex h-full items-center justify-center py-20 text-center">
                <div>
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-['Sora'] text-sm text-[#9ca3af]">Clique em um documento<br/>para ver os detalhes</p>
                </div>
              </div>
            ) : (() => {
              const cat  = getCat(selected.categoria)
              const st   = STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.VALIDO
              const dias = diasRestantes(selected.dataVencimento)
              return (
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                        style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                      <div className="mt-2 font-['Sora'] text-base font-bold text-[#0D1B2A]">{selected.titulo}</div>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
                  </div>

                  {/* Status banner */}
                  <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 font-['Sora'] text-sm font-bold"
                    style={{ background: st.bg, color: st.color }}>
                    <span className="text-lg">{st.icon}</span>
                    <div>
                      <div>{st.label}</div>
                      {dias !== null && (
                        <div className="text-[0.65rem] font-normal opacity-80">
                          {dias < 0 ? `Venceu há ${Math.abs(dias)} dias` : `Vence em ${dias} dias`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label:"Responsável",    value: selected.responsavel ?? "Não informado" },
                      { label:"Data de emissão", value: selected.dataEmissao ? new Date(selected.dataEmissao).toLocaleDateString("pt-BR") : "Não informada" },
                      { label:"Vencimento",      value: selected.dataVencimento ? new Date(selected.dataVencimento).toLocaleDateString("pt-BR") : "Sem vencimento" },
                      { label:"Arquivo",         value: selected.arquivoNome ?? "Sem arquivo" },
                      { label:"Cadastrado em",   value: new Date(selected.createdAt).toLocaleDateString("pt-BR") },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between rounded-xl bg-[#f9fafb] px-3 py-2.5">
                        <span className="font-['Sora'] text-xs font-bold text-[#9ca3af]">{item.label}</span>
                        <span className="font-['Sora'] text-xs font-medium text-[#0D1B2A]">{item.value}</span>
                      </div>
                    ))}
                    {selected.descricao && (
                      <div className="rounded-xl bg-[#f9fafb] px-3 py-2.5">
                        <div className="mb-1 font-['Sora'] text-xs font-bold text-[#9ca3af]">Descrição</div>
                        <div className="font-['Sora'] text-xs text-[#374151]">{selected.descricao}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => openEdit(selected)}
                      className="w-full rounded-xl bg-[#1DB954] py-2.5 font-['Sora'] text-xs font-bold text-white hover:bg-[#0f9c40] transition-colors">
                      ✏️ Editar documento
                    </button>
                    {selected.status !== "ARQUIVADO" && (
                      <button onClick={() => arquivar(selected.id)}
                        className="w-full rounded-xl border-2 border-[#e5e7eb] py-2.5 font-['Sora'] text-xs font-bold text-[#475569] hover:border-[#475569] transition-colors">
                        📁 Arquivar
                      </button>
                    )}
                    <button onClick={() => excluir(selected.id)}
                      className="w-full rounded-xl border-2 border-red-200 py-2.5 font-['Sora'] text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                      🗑️ Excluir permanentemente
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Modal Novo/Editar */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8"
            onClick={() => setShowModal(false)}>
            <div className="w-full max-w-[500px] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              onClick={e => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">
                  {editando ? "✏️ Editar Documento" : "+ Novo Documento"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Título *</label>
                  <input type="text" placeholder="Ex: Contrato Social" value={form.titulo}
                    onChange={e => setForm(f => ({...f, titulo: e.target.value}))}
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
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Responsável</label>
                    <input type="text" placeholder="Nome do responsável" value={form.responsavel}
                      onChange={e => setForm(f => ({...f, responsavel: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Data de emissão</label>
                    <input type="date" value={form.dataEmissao}
                      onChange={e => setForm(f => ({...f, dataEmissao: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Data de vencimento</label>
                    <input type="date" value={form.dataVencimento}
                      onChange={e => setForm(f => ({...f, dataVencimento: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nome do arquivo (opcional)</label>
                  <input type="text" placeholder="Ex: contrato_social_2025.pdf" value={form.arquivoNome}
                    onChange={e => setForm(f => ({...f, arquivoNome: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  <p className="mt-1 font-['Sora'] text-[0.65rem] text-[#9ca3af]">Upload de arquivos será disponibilizado em breve</p>
                </div>

                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Descrição (opcional)</label>
                  <textarea rows={3} placeholder="Informações adicionais sobre o documento..." value={form.descricao}
                    onChange={e => setForm(f => ({...f, descricao: e.target.value}))}
                    className="w-full resize-none rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
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
                    className="flex-1 rounded-xl bg-[#1DB954] py-3 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40] disabled:opacity-60">
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
