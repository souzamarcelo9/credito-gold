"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatPhone } from "@/lib/utils"

const TIPOS = [
  { key:"EMPRESA",    label:"Empresa",    color:"#1DB954", bg:"#e8f8ee" },
  { key:"CORRETORA",  label:"Corretora",  color:"#FF6B00", bg:"#fff3e8" },
  { key:"ESCRITORIO", label:"Escritório", color:"#1d4ed8", bg:"#dbeafe" },
  { key:"COOPERATIVA",label:"Cooperativa",color:"#6d28d9", bg:"#ede9fe" },
  { key:"OUTROS",     label:"Outros",     color:"#475569", bg:"#f1f5f9" },
]

const STATUS_CONFIG = {
  ATIVO:     { label:"Ativo",     color:"#15803d", bg:"#dcfce7" },
  INATIVO:   { label:"Inativo",   color:"#475569", bg:"#f1f5f9" },
  PROSPECTO: { label:"Prospecto", color:"#92400e", bg:"#fef3c7" },
}

const SEGMENTOS = [
  "Financeiro", "Imobiliário", "Contabilidade", "Advocacia", "Seguros",
  "Recursos Humanos", "Tecnologia", "Saúde", "Educação", "Varejo", "Outros",
]

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"]

interface Cliente {
  id:string; razaoSocial:string; nomeFantasia?:string; cnpj:string
  tipo:string; segmento?:string; responsavel:string; email:string
  telefone:string; cidade?:string; estado?:string; status:string
  observacoes?:string; createdAt:string
}

const FORM_EMPTY = {
  razaoSocial:"", nomeFantasia:"", cnpj:"", tipo:"EMPRESA", segmento:"",
  responsavel:"", email:"", telefone:"", cidade:"", estado:"SP",
  status:"ATIVO", observacoes:"",
}

function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14)
  if (d.length <= 2)  return d
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

export default function ClientesPage() {
  const [clientes, setClientes]   = useState<Cliente[]>([])
  const [stats, setStats]         = useState({ total:0, ativos:0, inativos:0, prospectos:0 })
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [statusF, setStatusF]     = useState("")
  const [tipoF, setTipoF]         = useState("")
  const [selected, setSelected]   = useState<Cliente|null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Cliente|null>(null)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState("")
  const [form, setForm]           = useState({ ...FORM_EMPTY })

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (search)  p.set("search", search)
      if (statusF) p.set("status", statusF)
      if (tipoF)   p.set("tipo",   tipoF)
      const res  = await fetch(`/api/admin/clientes?${p}`)
      const json = await res.json()
      if (json.success) {
        setClientes(json.data.clientes ?? [])
        setStats(json.data.stats ?? { total:0, ativos:0, inativos:0, prospectos:0 })
      }
    } finally { setLoading(false) }
  }, [search, statusF, tipoF])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  function openNovo() {
    setEditando(null)
    setForm({ ...FORM_EMPTY })
    setMsg(""); setShowModal(true)
  }

  function openEdit(c: Cliente) {
    setEditando(c)
    setForm({
      razaoSocial:  c.razaoSocial,
      nomeFantasia: c.nomeFantasia  ?? "",
      cnpj:         c.cnpj,
      tipo:         c.tipo,
      segmento:     c.segmento      ?? "",
      responsavel:  c.responsavel,
      email:        c.email,
      telefone:     c.telefone,
      cidade:       c.cidade        ?? "",
      estado:       c.estado        ?? "SP",
      status:       c.status,
      observacoes:  c.observacoes   ?? "",
    })
    setMsg(""); setShowModal(true)
  }

  async function salvar() {
    if (!form.razaoSocial.trim()) { setMsg("❌ Razão social obrigatória"); return }
    if (!form.cnpj.trim())        { setMsg("❌ CNPJ obrigatório"); return }
    if (!form.responsavel.trim()) { setMsg("❌ Responsável obrigatório"); return }
    if (!form.email.trim())       { setMsg("❌ E-mail obrigatório"); return }

    setSaving(true); setMsg("")
    try {
      const url    = editando ? `/api/admin/clientes/${editando.id}` : "/api/admin/clientes"
      const method = editando ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method, headers: { "Content-Type":"application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setMsg("✅ " + json.message); fetchClientes()
        setTimeout(() => { setShowModal(false); setMsg("") }, 800)
      } else { setMsg("❌ " + json.message) }
    } catch { setMsg("❌ Erro de conexão") }
    finally { setSaving(false) }
  }

  async function excluir(id: string) {
    if (!confirm("Remover este cliente parceiro?")) return
    await fetch(`/api/admin/clientes/${id}`, { method:"DELETE" })
    fetchClientes(); if (selected?.id === id) setSelected(null)
  }

  async function alterarStatus(id: string, status: string) {
    const c = clientes.find(x => x.id === id)
    if (!c) return
    await fetch(`/api/admin/clientes/${id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...c, status }),
    })
    fetchClientes()
    if (selected?.id === id) setSelected(prev => prev ? {...prev, status} : null)
  }

  function getTipo(key: string) { return TIPOS.find(t => t.key === key) ?? TIPOS[TIPOS.length-1] }

  const field = (label: string, key: keyof typeof form, placeholder: string, extra?: any) => (
    <div key={key}>
      <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">{label}</label>
      <input type={extra?.type ?? "text"} placeholder={placeholder} value={form[key] as string}
        onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">🏢 Clientes Parceiros</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Empresas e organizações parceiras da Crédito Gold</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchClientes}
              className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
              ↻ Atualizar
            </button>
            <button onClick={openNovo}
              className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40]">
              + Novo Cliente
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Total",      value:stats.total,     accent:"#1DB954", f:""          },
            { label:"Ativos",     value:stats.ativos,    accent:"#1DB954", f:"ATIVO"     },
            { label:"Prospectos", value:stats.prospectos,accent:"#FF6B00", f:"PROSPECTO" },
            { label:"Inativos",   value:stats.inativos,  accent:"#9ca3af", f:"INATIVO"   },
          ].map(k => (
            <button key={k.label} onClick={() => setStatusF(statusF === k.f ? "" : k.f)}
              className={`relative overflow-hidden rounded-[14px] border-2 bg-white p-5 text-left transition-all hover:shadow-md ${statusF === k.f ? "border-[#0D1B2A]" : "border-[#e5e7eb]"}`}>
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{loading ? "..." : k.value}</div>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input placeholder="🔍 Buscar por razão social, CNPJ ou responsável..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="min-w-[260px] flex-1 rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
          <select value={tipoF} onChange={e => setTipoF(e.target.value)}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todos os tipos</option>
            {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* Tabela */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            <div className="border-b border-[#e5e7eb] px-5 py-4">
              <span className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                {loading ? "Carregando..." : `${clientes.length} parceiro${clientes.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f4f6f8]">
                    {["Empresa","CNPJ","Responsável","Tipo","Status","Ações"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(6).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>)}
                    </tr>
                  )) : clientes.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <div className="text-4xl mb-3">🏢</div>
                      <p className="text-sm text-[#9ca3af]">Nenhum cliente parceiro cadastrado</p>
                      <button onClick={openNovo} className="mt-3 font-['Sora'] text-sm font-bold text-[#1DB954] hover:underline">
                        + Cadastrar primeiro parceiro
                      </button>
                    </td></tr>
                  ) : clientes.map(c => {
                    const tipo = getTipo(c.tipo)
                    const st   = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ATIVO
                    return (
                      <tr key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                        className={`cursor-pointer border-t border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${selected?.id === c.id ? "bg-[#e8f8ee]" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{c.nomeFantasia || c.razaoSocial}</div>
                          {c.nomeFantasia && <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{c.razaoSocial}</div>}
                          {c.cidade && <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{c.cidade}/{c.estado}</div>}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{c.cnpj}</td>
                        <td className="px-4 py-3">
                          <div className="font-['Sora'] text-xs font-medium text-[#0D1B2A]">{c.responsavel}</div>
                          <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{c.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                            style={{ background: tipo.bg, color: tipo.color }}>
                            {tipo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select value={c.status}
                            onChange={e => { e.stopPropagation(); alterarStatus(c.id, e.target.value) }}
                            onClick={e => e.stopPropagation()}
                            className="rounded-full border-0 px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold outline-none cursor-pointer"
                            style={{ background: st.bg, color: st.color }}>
                            <option value="ATIVO">Ativo</option>
                            <option value="PROSPECTO">Prospecto</option>
                            <option value="INATIVO">Inativo</option>
                          </select>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5">
                            <button onClick={() => openEdit(c)}
                              className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all">
                              Editar
                            </button>
                            <button onClick={() => excluir(c.id)}
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

          {/* Painel detalhes */}
          <div className={`rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm transition-all ${selected ? "opacity-100" : "opacity-40"}`}>
            {!selected ? (
              <div className="flex h-full items-center justify-center py-20 text-center">
                <div><div className="text-4xl mb-3">🏢</div>
                <p className="font-['Sora'] text-sm text-[#9ca3af]">Clique em um cliente<br/>para ver os detalhes</p></div>
              </div>
            ) : (() => {
              const tipo = getTipo(selected.tipo)
              const st   = STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ATIVO
              return (
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                        style={{ background: tipo.bg, color: tipo.color }}>{tipo.label}</span>
                      <div className="mt-2 font-['Sora'] text-base font-bold text-[#0D1B2A]">{selected.nomeFantasia || selected.razaoSocial}</div>
                      {selected.nomeFantasia && <div className="font-['Sora'] text-xs text-[#9ca3af]">{selected.razaoSocial}</div>}
                    </div>
                    <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
                  </div>

                  <div className="mb-4 rounded-xl px-4 py-2.5 font-['Sora'] text-sm font-bold"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </div>

                  <div className="space-y-2">
                    {[
                      { label:"CNPJ",         value: selected.cnpj,                              mono: true  },
                      { label:"Responsável",   value: selected.responsavel                                    },
                      { label:"E-mail",        value: selected.email                                         },
                      { label:"Telefone",      value: selected.telefone                                      },
                      { label:"Segmento",      value: selected.segmento      ?? "—"                         },
                      { label:"Localidade",    value: selected.cidade ? `${selected.cidade}/${selected.estado}` : "—" },
                      { label:"Cadastrado em", value: new Date(selected.createdAt).toLocaleDateString("pt-BR") },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between rounded-xl bg-[#f9fafb] px-3 py-2.5">
                        <span className="font-['Sora'] text-xs font-bold text-[#9ca3af]">{item.label}</span>
                        <span className={`text-xs text-[#0D1B2A] ${(item as any).mono ? "font-mono" : "font-['Sora'] font-medium"}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selected.observacoes && (
                    <div className="mt-3 rounded-xl bg-[#f9fafb] px-3 py-2.5">
                      <div className="mb-1 font-['Sora'] text-[0.65rem] font-bold text-[#9ca3af]">Observações</div>
                      <div className="font-['Sora'] text-xs text-[#374151]">{selected.observacoes}</div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => openEdit(selected)}
                      className="w-full rounded-xl bg-[#1DB954] py-2.5 font-['Sora'] text-xs font-bold text-white hover:bg-[#0f9c40]">
                      ✏️ Editar
                    </button>
                    <a href={`mailto:${selected.email}`}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#e5e7eb] py-2.5 font-['Sora'] text-xs font-bold text-[#0D1B2A] no-underline hover:border-[#1DB954]">
                      ✉️ Enviar e-mail
                    </a>
                    <a href={`https://wa.me/55${selected.telefone.replace(/\D/g,"")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 font-['Sora'] text-xs font-bold text-white no-underline hover:bg-[#1db954]">
                      💬 WhatsApp
                    </a>
                    <button onClick={() => excluir(selected.id)}
                      className="w-full rounded-xl border-2 border-red-200 py-2 font-['Sora'] text-xs font-bold text-red-500 hover:bg-red-50">
                      🗑️ Remover
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-8"
            onClick={() => setShowModal(false)}>
            <div className="w-full max-w-[560px] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              onClick={e => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">
                  {editando ? "✏️ Editar Cliente Parceiro" : "🏢 Novo Cliente Parceiro"}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
              </div>

              <div className="space-y-4">
                {/* Razão + Nome fantasia */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Razão Social *</label>
                    <input type="text" placeholder="Razão Social Ltda." value={form.razaoSocial}
                      onChange={e => setForm(f => ({...f, razaoSocial: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nome Fantasia</label>
                    <input type="text" placeholder="Nome comercial" value={form.nomeFantasia}
                      onChange={e => setForm(f => ({...f, nomeFantasia: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                </div>

                {/* CNPJ + Tipo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">CNPJ *</label>
                    <input type="text" placeholder="00.000.000/0000-00" value={form.cnpj} maxLength={18}
                      onChange={e => setForm(f => ({...f, cnpj: formatCNPJ(e.target.value)}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm font-mono outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Tipo</label>
                    <select value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Segmento + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Segmento</label>
                    <select value={form.segmento} onChange={e => setForm(f => ({...f, segmento: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      <option value="">Selecione...</option>
                      {SEGMENTOS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      <option value="ATIVO">Ativo</option>
                      <option value="PROSPECTO">Prospecto</option>
                      <option value="INATIVO">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Responsável + E-mail */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Responsável *</label>
                    <input type="text" placeholder="Nome do responsável" value={form.responsavel}
                      onChange={e => setForm(f => ({...f, responsavel: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">E-mail *</label>
                    <input type="email" placeholder="email@empresa.com.br" value={form.email}
                      onChange={e => setForm(f => ({...f, email: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                </div>

                {/* Telefone + Cidade + Estado */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Telefone</label>
                    <input type="tel" placeholder="(00) 0 0000-0000" value={form.telefone} maxLength={16}
                      onChange={e => setForm(f => ({...f, telefone: formatPhone(e.target.value)}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Cidade</label>
                    <input type="text" placeholder="Cidade" value={form.cidade}
                      onChange={e => setForm(f => ({...f, cidade: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Estado</label>
                    <select value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Observações</label>
                  <textarea rows={2} placeholder="Notas sobre o parceiro..." value={form.observacoes}
                    onChange={e => setForm(f => ({...f, observacoes: e.target.value}))}
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
                    {saving ? "Salvando..." : editando ? "💾 Salvar" : "➕ Cadastrar"}
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
