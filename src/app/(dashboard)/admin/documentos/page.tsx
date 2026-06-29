"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"

const CATEGORIAS = [
  { key:"EMPRESA",        label:"Empresa",       color:"#1DB954", bg:"#e8f8ee" },
  { key:"CORRESPONDENTE", label:"Correspondentes",color:"#FF6B00", bg:"#fff3e8" },
  { key:"AFILIADO",       label:"Afiliados",     color:"#1d4ed8", bg:"#dbeafe" },
  { key:"BANCO_PARCEIRO", label:"Bancos Parceiros",color:"#6d28d9",bg:"#ede9fe" },
  { key:"JURIDICO",       label:"Jurídico",      color:"#0891b2", bg:"#e0f2fe" },
  { key:"CONTABIL",       label:"Contábil",      color:"#854d0e", bg:"#fef3c7" },
  { key:"OUTROS",         label:"Outros",        color:"#9ca3af", bg:"#f1f5f9" },
]

const STATUS_CONFIG = {
  VALIDO:    { label:"Válido",    color:"#15803d", bg:"#dcfce7", icon:"✅" },
  VENCENDO:  { label:"Vencendo",  color:"#92400e", bg:"#fef3c7", icon:"⚠️" },
  VENCIDO:   { label:"Vencido",   color:"#dc2626", bg:"#fee2e2", icon:"❌" },
  ARQUIVADO: { label:"Arquivado", color:"#475569", bg:"#f1f5f9", icon:"📁" },
}

interface Documento {
  id:string; titulo:string; categoria:string; descricao?:string
  responsavel?:string; arquivoUrl?:string; arquivoNome?:string
  dataEmissao?:string; dataVencimento?:string; status:string; createdAt:string
}

// ── Gráfico de pizza SVG ────────────────────────────────────────────
function PieChart({ data }: { data: Array<{ categoria:string; total:number }> }) {
  const total = data.reduce((s, d) => s + d.total, 0)
  if (total === 0) return <div className="flex h-full items-center justify-center text-sm text-[#9ca3af]">Sem dados</div>

  let cumAngle = -90
  const slices = data.map(d => {
    const angle = (d.total / total) * 360
    const cat   = CATEGORIAS.find(c => c.key === d.categoria) ?? CATEGORIAS[CATEGORIAS.length - 1]
    const start = cumAngle
    cumAngle += angle
    return { ...d, angle, start, color: cat.color, label: cat.label }
  })

  function polarToXY(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180
    return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) }
  }

  function slicePath(start: number, angle: number, outer = 80, inner = 50) {
    const s1 = polarToXY(start, outer)
    const e1 = polarToXY(start + angle, outer)
    const s2 = polarToXY(start + angle, inner)
    const e2 = polarToXY(start, inner)
    const lg = angle > 180 ? 1 : 0
    return `M ${s1.x} ${s1.y} A ${outer} ${outer} 0 ${lg} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${inner} ${inner} 0 ${lg} 0 ${e2.x} ${e2.y} Z`
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0">
        <svg viewBox="0 0 200 200" className="h-40 w-40">
          {slices.filter(s => s.angle > 0).map((s, i) => (
            <path key={i} d={slicePath(s.start, s.angle)} fill={s.color} opacity={0.85}
              className="transition-opacity hover:opacity-100 cursor-pointer">
              <title>{s.label}: {s.total} ({((s.total/total)*100).toFixed(0)}%)</title>
            </path>
          ))}
          <text x="100" y="96"  textAnchor="middle" fontSize="20" fontWeight="bold" fill="#0D1B2A">{total}</text>
          <text x="100" y="112" textAnchor="middle" fontSize="9"  fill="#9ca3af">Total</text>
        </svg>
      </div>
      <div className="flex-1 space-y-1.5 min-w-0">
        {slices.map(s => (
          <div key={s.categoria} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate text-[0.72rem] text-[#374151]">{s.label}</span>
            <span className="ml-auto font-['Sora'] text-[0.72rem] font-bold text-[#0D1B2A] flex-shrink-0">
              {s.total} <span className="font-normal text-[#9ca3af]">({((s.total/total)*100).toFixed(0)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Gráfico de linhas SVG ───────────────────────────────────────────
function LineChart({ linhas }: { linhas: Array<{ data:string; validos:number; vencendo:number; vencidos:number }> }) {
  if (!linhas.length) return <div className="flex h-full items-center justify-center text-sm text-[#9ca3af]">Sem dados</div>

  const W = 560; const H = 160; const PAD = { t:10, r:10, b:30, l:35 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const maxVal = Math.max(...linhas.flatMap(l => [l.validos, l.vencendo, l.vencidos]), 1)

  // Apenas a cada 5 dias mostra label
  const labels = linhas.filter((_, i) => i % 5 === 0 || i === linhas.length - 1)

  function toX(i: number) { return PAD.l + (i / (linhas.length - 1)) * cW }
  function toY(v: number) { return PAD.t + cH - (v / maxVal) * cH }

  function path(key: "validos"|"vencendo"|"vencidos") {
    return linhas.map((l, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(l[key]).toFixed(1)}`).join(" ")
  }

  function area(key: "validos"|"vencendo"|"vencidos") {
    const p = path(key)
    const last = linhas.length - 1
    return `${p} L ${toX(last).toFixed(1)} ${(PAD.t + cH).toFixed(1)} L ${PAD.l.toFixed(1)} ${(PAD.t + cH).toFixed(1)} Z`
  }

  const SERIES = [
    { key:"validos"  as const, color:"#1DB954", label:"Válidos"  },
    { key:"vencendo" as const, color:"#f59e0b", label:"Vencendo" },
    { key:"vencidos" as const, color:"#ef4444", label:"Vencidos" },
  ]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height:160 }}>
        {/* Grid horizontal */}
        {[0,0.25,0.5,0.75,1].map(p => (
          <g key={p}>
            <line x1={PAD.l} y1={PAD.t + cH * (1-p)} x2={PAD.l + cW} y2={PAD.t + cH * (1-p)}
              stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={PAD.l - 4} y={PAD.t + cH * (1-p) + 3} textAnchor="end" fontSize="8" fill="#9ca3af">
              {Math.round(maxVal * p)}
            </text>
          </g>
        ))}

        {/* Áreas */}
        {SERIES.map(s => (
          <path key={s.key} d={area(s.key)} fill={s.color} opacity={0.08} />
        ))}

        {/* Linhas */}
        {SERIES.map(s => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinejoin="round" />
        ))}

        {/* Labels do eixo X */}
        {labels.map((l) => {
          const idx = linhas.indexOf(l)
          return (
            <text key={l.data} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize="8" fill="#9ca3af">
              {l.data.slice(5)}
            </text>
          )
        })}
      </svg>

      {/* Legenda */}
      <div className="mt-2 flex justify-center gap-5">
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="h-2 w-5 rounded-full" style={{ background: s.color }} />
            <span className="text-[0.7rem] text-[#6b7280]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Upload Component ────────────────────────────────────────────────
function UploadButton({ docId, onSuccess }: { docId: string; onSuccess: (nome: string, url: string|null) => void }) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [prog, setProg]           = useState(0)
  const [error, setError]         = useState("")

  async function handleFile(file: File) {
    setUploading(true); setError(""); setProg(10)
    try {
      const fd = new FormData()
      fd.append("file",  file)
      fd.append("docId", docId)
      setProg(40)
      const res  = await fetch("/api/admin/documentos/upload", { method:"POST", body: fd })
      setProg(80)
      const json = await res.json()
      if (json.success) {
        setProg(100)
        onSuccess(json.data.nome, json.data.url)
        setTimeout(() => { setUploading(false); setProg(0) }, 600)
      } else {
        setError(json.message ?? "Erro no upload")
        setUploading(false); setProg(0)
      }
    } catch {
      setError("Erro de conexão")
      setUploading(false); setProg(0)
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {uploading ? (
        <div className="rounded-xl border-2 border-[#1DB954]/30 bg-[#e8f8ee] p-3">
          <div className="mb-2 flex justify-between text-xs font-['Sora'] font-bold text-[#0f9c40]">
            <span>Enviando...</span><span>{prog}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#c6f0d4]">
            <div className="h-full rounded-full bg-[#1DB954] transition-all duration-300" style={{ width:`${prog}%` }} />
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e5e7eb] bg-[#f9fafb] py-3 font-['Sora'] text-sm font-bold text-[#6b7280] transition-all hover:border-[#1DB954] hover:bg-[#e8f8ee] hover:text-[#0f9c40]">
          📎 Anexar arquivo (PDF, imagem, Office — máx. 10MB)
        </button>
      )}
      {error && <p className="mt-1 text-xs font-bold text-red-500">{error}</p>}
    </div>
  )
}

// ── Página principal ────────────────────────────────────────────────
export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [stats,    setStats]    = useState({ total:0, validos:0, vencendo:0, vencidos:0 })
  const [porCat,   setPorCat]   = useState<any[]>([])
  const [linhas,   setLinhas]   = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState("")
  const [catFilter,setCatFilter]= useState("")
  const [statusF,  setStatusF]  = useState("")
  const [showModal,setShowModal]= useState(false)
  const [editando, setEditando] = useState<Documento|null>(null)
  const [selected, setSelected] = useState<Documento|null>(null)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState("")
  const [uploadedDoc, setUploadedDoc] = useState<{id:string}|null>(null)

  const [form, setForm] = useState({
    titulo:"", categoria:"EMPRESA", descricao:"", responsavel:"",
    dataEmissao:"", dataVencimento:"", arquivoNome:"", arquivoUrl:"",
  })

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (catFilter) p.set("categoria", catFilter)
      if (statusF)   p.set("status",    statusF)
      if (search)    p.set("search",    search)
      const res  = await fetch(`/api/admin/documentos?${p}`)
      const json = await res.json()
      if (json.success) {
        setDocumentos(json.data.documentos ?? [])
        setStats(json.data.stats ?? { total:0, validos:0, vencendo:0, vencidos:0 })
        setPorCat(json.data.porCategoria ?? [])
        setLinhas(json.data.linhas ?? [])
      }
    } finally { setLoading(false) }
  }, [catFilter, statusF, search])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  function openNovo() {
    setEditando(null); setUploadedDoc(null)
    setForm({ titulo:"", categoria:"EMPRESA", descricao:"", responsavel:"", dataEmissao:"", dataVencimento:"", arquivoNome:"", arquivoUrl:"" })
    setMsg(""); setShowModal(true)
  }

  function openEdit(doc: Documento) {
    setEditando(doc); setUploadedDoc(null)
    setForm({
      titulo:         doc.titulo,
      categoria:      doc.categoria,
      descricao:      doc.descricao   ?? "",
      responsavel:    doc.responsavel ?? "",
      dataEmissao:    doc.dataEmissao    ? new Date(doc.dataEmissao).toISOString().slice(0,10)    : "",
      dataVencimento: doc.dataVencimento ? new Date(doc.dataVencimento).toISOString().slice(0,10) : "",
      arquivoNome:    doc.arquivoNome ?? "",
      arquivoUrl:     doc.arquivoUrl  ?? "",
    })
    setMsg(""); setShowModal(true)
  }

  async function salvar() {
    if (!form.titulo.trim()) { setMsg("❌ Título obrigatório"); return }
    setSaving(true); setMsg("")
    try {
      const url    = editando ? `/api/admin/documentos/${editando.id}` : "/api/admin/documentos"
      const method = editando ? "PATCH" : "POST"
      const res    = await fetch(url, {
        method, headers: { "Content-Type":"application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setMsg("✅ " + json.message)
        // Guarda id para o upload
        if (!editando && json.data?.id) setUploadedDoc({ id: json.data.id })
        fetchDocs()
        if (editando) setTimeout(() => { setShowModal(false); setMsg("") }, 800)
      } else { setMsg("❌ " + json.message) }
    } catch { setMsg("❌ Erro de conexão") }
    finally { setSaving(false) }
  }

  async function arquivar(id: string) {
    const doc = documentos.find(d => d.id === id)
    if (!doc) return
    await fetch(`/api/admin/documentos/${id}`, {
      method: "PATCH", headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ ...doc, status:"ARQUIVADO" }),
    })
    fetchDocs(); if (selected?.id === id) setSelected(null)
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este documento permanentemente?")) return
    await fetch(`/api/admin/documentos/${id}`, { method:"DELETE" })
    fetchDocs(); if (selected?.id === id) setSelected(null)
  }

  function getCat(key: string) { return CATEGORIAS.find(c => c.key === key) ?? CATEGORIAS[CATEGORIAS.length-1] }
  function diasRestantes(dv?: string) {
    if (!dv) return null
    return Math.ceil((new Date(dv).getTime() - Date.now()) / (1000*60*60*24))
  }

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
            { label:"Total",          value:stats.total,    accent:"#1DB954", icon:"📋", f:""        },
            { label:"Válidos",        value:stats.validos,  accent:"#1DB954", icon:"✅", f:"VALIDO"  },
            { label:"Vencendo em 30d",value:stats.vencendo, accent:"#FF6B00", icon:"⚠️", f:"VENCENDO"},
            { label:"Vencidos",       value:stats.vencidos, accent:"#dc2626", icon:"❌", f:"VENCIDO" },
          ].map(k => (
            <button key={k.label} onClick={() => setStatusF(statusF === k.f ? "" : k.f)}
              className={`relative overflow-hidden rounded-[14px] border-2 bg-white p-5 text-left transition-all hover:shadow-md ${statusF === k.f ? "border-[#0D1B2A]" : "border-[#e5e7eb]"}`}>
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="flex items-center justify-between">
                <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
                <span className="text-lg">{k.icon}</span>
              </div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{loading ? "..." : k.value}</div>
            </button>
          ))}
        </div>

        {/* ── DASHBOARDS ── */}
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          {/* Pizza */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Documentos por Categoria</div>
              <span className="rounded-full bg-[#f4f6f8] px-3 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#6b7280]">
                Total: {stats.total}
              </span>
            </div>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-32 w-32 animate-pulse rounded-full bg-[#e5e7eb]" />
              </div>
            ) : <PieChart data={porCat} />}
          </div>

          {/* Linha */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Situação dos Documentos</div>
              <span className="rounded-full bg-[#f4f6f8] px-3 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#6b7280]">
                Últimos 30 dias
              </span>
            </div>
            {loading ? (
              <div className="h-40 animate-pulse rounded-xl bg-[#e5e7eb]" />
            ) : <LineChart linhas={linhas} />}
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && !catFilter && !statusF && (
          <div className="mb-5 rounded-2xl border border-[#FF6B00]/30 bg-[#fff8f3] p-4">
            <div className="mb-2 flex items-center gap-2 font-['Sora'] text-sm font-bold text-[#c2410c]">
              ⚠️ {alertas.length} documento{alertas.length !== 1 ? "s" : ""} precisam de atenção
            </div>
            <div className="flex flex-wrap gap-2">
              {alertas.slice(0,6).map(d => {
                const dias = diasRestantes(d.dataVencimento)
                return (
                  <button key={d.id} onClick={() => setSelected(d)}
                    className={`rounded-xl px-3 py-1.5 font-['Sora'] text-xs font-bold transition-all hover:opacity-80 ${d.status === "VENCIDO" ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#fef3c7] text-[#92400e]"}`}>
                    {d.titulo} {dias !== null ? (dias < 0 ? `(vencido há ${Math.abs(dias)}d)` : `(${dias}d)`) : ""}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input placeholder="🔍 Buscar título ou responsável..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="min-w-[220px] flex-1 rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
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
                  {loading ? Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(6).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>)}
                    </tr>
                  )) : documentos.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-sm text-[#9ca3af]">Nenhum documento encontrado</p>
                      <button onClick={openNovo} className="mt-3 font-['Sora'] text-sm font-bold text-[#1DB954] hover:underline">
                        + Adicionar primeiro documento
                      </button>
                    </td></tr>
                  ) : documentos.map(doc => {
                    const cat  = getCat(doc.categoria)
                    const st   = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.VALIDO
                    const dias = diasRestantes(doc.dataVencimento)
                    return (
                      <tr key={doc.id} onClick={() => setSelected(selected?.id === doc.id ? null : doc)}
                        className={`cursor-pointer border-t border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${selected?.id === doc.id ? "bg-[#e8f8ee]" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{doc.titulo}</div>
                          {doc.arquivoNome && <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">📎 {doc.arquivoNome}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold" style={{ background:cat.bg, color:cat.color }}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{doc.responsavel ?? "—"}</td>
                        <td className="px-4 py-3">
                          {doc.dataVencimento ? (
                            <div>
                              <div className="font-['Sora'] text-xs font-medium text-[#0D1B2A]">{new Date(doc.dataVencimento).toLocaleDateString("pt-BR")}</div>
                              {dias !== null && (
                                <div className={`font-['Sora'] text-[0.6rem] font-bold ${dias < 0 ? "text-[#dc2626]" : dias <= 30 ? "text-[#92400e]" : "text-[#9ca3af]"}`}>
                                  {dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d restantes`}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-xs text-[#9ca3af]">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold" style={{ background:st.bg, color:st.color }}>
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

          {/* Painel detalhes */}
          <div className={`rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm transition-all ${selected ? "opacity-100" : "opacity-40"}`}>
            {!selected ? (
              <div className="flex h-full items-center justify-center py-20 text-center">
                <div><div className="text-4xl mb-3">📋</div>
                <p className="font-['Sora'] text-sm text-[#9ca3af]">Clique em um documento<br/>para ver os detalhes</p></div>
              </div>
            ) : (() => {
              const cat  = getCat(selected.categoria)
              const st   = STATUS_CONFIG[selected.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.VALIDO
              const dias = diasRestantes(selected.dataVencimento)
              return (
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold" style={{ background:cat.bg, color:cat.color }}>{cat.label}</span>
                      <div className="mt-2 font-['Sora'] text-base font-bold text-[#0D1B2A]">{selected.titulo}</div>
                    </div>
                    <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
                  </div>

                  <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 font-['Sora'] text-sm font-bold"
                    style={{ background:st.bg, color:st.color }}>
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

                  <div className="space-y-2">
                    {[
                      { label:"Responsável",    value:selected.responsavel ?? "—" },
                      { label:"Data de emissão",value:selected.dataEmissao ? new Date(selected.dataEmissao).toLocaleDateString("pt-BR") : "—" },
                      { label:"Vencimento",     value:selected.dataVencimento ? new Date(selected.dataVencimento).toLocaleDateString("pt-BR") : "Sem vencimento" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between rounded-xl bg-[#f9fafb] px-3 py-2">
                        <span className="font-['Sora'] text-xs font-bold text-[#9ca3af]">{item.label}</span>
                        <span className="font-['Sora'] text-xs text-[#0D1B2A]">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Arquivo */}
                  <div className="mt-3">
                    <div className="mb-1.5 font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">Arquivo</div>
                    {selected.arquivoUrl ? (
                      <a href={selected.arquivoUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border-2 border-[#1DB954]/30 bg-[#e8f8ee] px-3 py-2.5 no-underline transition-all hover:border-[#1DB954]">
                        <span className="text-xl">📄</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-['Sora'] text-xs font-bold text-[#0f9c40]">{selected.arquivoNome}</div>
                          <div className="font-['Sora'] text-[0.6rem] text-[#9ca3af]">Clique para visualizar</div>
                        </div>
                      </a>
                    ) : selected.arquivoNome ? (
                      <div className="flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5">
                        <span>📎</span>
                        <span className="font-['Sora'] text-xs text-[#6b7280]">{selected.arquivoNome}</span>
                      </div>
                    ) : (
                      <UploadButton docId={selected.id} onSuccess={(nome, url) => {
                        setSelected(prev => prev ? { ...prev, arquivoNome: nome, arquivoUrl: url ?? undefined } : null)
                        fetchDocs()
                      }} />
                    )}
                    {(selected.arquivoUrl || selected.arquivoNome) && (
                      <UploadButton docId={selected.id} onSuccess={(nome, url) => {
                        setSelected(prev => prev ? { ...prev, arquivoNome: nome, arquivoUrl: url ?? undefined } : null)
                        fetchDocs()
                      }} />
                    )}
                  </div>

                  {selected.descricao && (
                    <div className="mt-3 rounded-xl bg-[#f9fafb] px-3 py-2.5">
                      <div className="mb-1 font-['Sora'] text-[0.65rem] font-bold text-[#9ca3af]">Descrição</div>
                      <div className="font-['Sora'] text-xs text-[#374151]">{selected.descricao}</div>
                    </div>
                  )}

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
            onClick={() => { if (!uploadedDoc) setShowModal(false) }}>
            <div className="w-full max-w-[500px] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              onClick={e => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">
                  {editando ? "✏️ Editar Documento" : "+" + (uploadedDoc ? " Anexar arquivo" : " Novo Documento")}
                </h2>
                <button onClick={() => { setShowModal(false); setUploadedDoc(null) }} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
              </div>

              {/* Após salvar novo, oferece upload */}
              {uploadedDoc ? (
                <div>
                  <div className="mb-4 rounded-xl bg-[#e8f8ee] p-3 text-center font-['Sora'] text-sm font-bold text-[#0f9c40]">
                    ✅ Documento cadastrado! Deseja anexar um arquivo?
                  </div>
                  <UploadButton docId={uploadedDoc.id} onSuccess={(nome) => {
                    setMsg("✅ Arquivo anexado com sucesso!")
                    fetchDocs()
                    setTimeout(() => { setShowModal(false); setUploadedDoc(null); setMsg("") }, 800)
                  }} />
                  <button onClick={() => { setShowModal(false); setUploadedDoc(null) }}
                    className="mt-3 w-full rounded-xl border-2 border-[#e5e7eb] py-2.5 font-['Sora'] text-sm font-bold text-[#6b7280] hover:border-[#0D1B2A]">
                    Pular — anexar depois
                  </button>
                </div>
              ) : (
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
                      <input type="text" placeholder="Nome" value={form.responsavel}
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
                  {editando && (
                    <div>
                      <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Arquivo</label>
                      <UploadButton docId={editando.id} onSuccess={(nome, url) => {
                        setForm(f => ({...f, arquivoNome: nome, arquivoUrl: url ?? ""}))
                      }} />
                      {form.arquivoNome && <p className="mt-1 font-['Sora'] text-xs text-[#1DB954]">✓ {form.arquivoNome}</p>}
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Descrição</label>
                    <textarea rows={2} placeholder="Informações adicionais..." value={form.descricao}
                      onChange={e => setForm(f => ({...f, descricao: e.target.value}))}
                      className="w-full resize-none rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>

                  {msg && (
                    <div className={`rounded-xl px-4 py-2.5 font-['Sora'] text-sm font-bold ${msg.startsWith("✅") ? "bg-[#e8f8ee] text-[#0f9c40]" : "bg-red-50 text-red-600"}`}>{msg}</div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowModal(false)}
                      className="flex-1 rounded-xl border-2 border-[#e5e7eb] py-3 font-['Sora'] text-sm font-bold text-[#6b7280] hover:border-[#0D1B2A]">
                      Cancelar
                    </button>
                    <button onClick={salvar} disabled={saving}
                      className="flex-1 rounded-xl bg-[#1DB954] py-3 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40] disabled:opacity-60">
                      {saving ? "Salvando..." : editando ? "💾 Salvar" : "Próximo →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
