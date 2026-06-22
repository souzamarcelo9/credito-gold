"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatCurrency } from "@/lib/utils"
import { formatPhone } from "@/lib/utils"

interface Correspondente {
  id:         string
  nome:       string
  email:      string
  telefone:   string
  ativo:      boolean
  totalLeads: number
  _count?:    { leads: number }
  leads?:     Array<{
    lead: { id:string; nome:string; produto:string; valor:number; status:string; createdAt:string }
  }>
}

const STATUS_STYLE: Record<string,string> = {
  NOVO:"bg-[#ffedd5] text-[#c2410c]",
  EM_ANALISE:"bg-[#dbeafe] text-[#1d4ed8]",
  APROVADO:"bg-[#dcfce7] text-[#15803d]",
  PROPOSTA_ENVIADA:"bg-[#ede9fe] text-[#6d28d9]",
  RECUSADO:"bg-[#f1f5f9] text-[#475569]",
}

export default function DistribuicaoPage() {
  const [correspondentes, setCorrespondentes] = useState<Correspondente[]>([])
  const [distribuicao, setDistribuicao]       = useState<Correspondente[]>([])
  const [loading, setLoading]                 = useState(true)
  const [distributing, setDistributing]       = useState(false)
  const [resultado, setResultado]             = useState<any>(null)
  const [showNovo, setShowNovo]               = useState(false)
  const [novoForm, setNovoForm]               = useState({ nome:"", email:"", telefone:"" })
  const [novoMsg, setNovoMsg]                 = useState("")
  const [novoSaving, setNovoSaving]           = useState(false)
  const [somenteNovos, setSomenteNovos]       = useState(true)
  const [activeCorrespondente, setActive]     = useState<string|null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, dRes] = await Promise.all([
        fetch("/api/admin/correspondentes"),
        fetch("/api/admin/distribuir"),
      ])
      const [cJson, dJson] = await Promise.all([cRes.json(), dRes.json()])
      if (cJson.success) setCorrespondentes(cJson.data)
      if (dJson.success) setDistribuicao(dJson.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function distribuir() {
    setDistributing(true); setResultado(null)
    try {
      const res  = await fetch("/api/admin/distribuir", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ somenteNovos }),
      })
      const json = await res.json()
      setResultado(json)
      if (json.success) fetchData()
    } finally {
      setDistributing(false)
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await fetch(`/api/admin/correspondentes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ ativo: !ativo }),
    })
    fetchData()
  }

  async function salvarNovo() {
    if (!novoForm.nome.trim())  { setNovoMsg("❌ Nome obrigatório"); return }
    if (!novoForm.email.trim()) { setNovoMsg("❌ E-mail obrigatório"); return }
    setNovoSaving(true); setNovoMsg("")
    try {
      const res  = await fetch("/api/admin/correspondentes", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(novoForm),
      })
      const json = await res.json()
      if (json.success) {
        setNovoMsg("✅ Cadastrado com sucesso!")
        setNovoForm({ nome:"", email:"", telefone:"" })
        setTimeout(() => { setShowNovo(false); setNovoMsg(""); fetchData() }, 1000)
      } else {
        setNovoMsg("❌ " + json.message)
      }
    } catch {
      setNovoMsg("❌ Erro de conexão")
    } finally {
      setNovoSaving(false)
    }
  }

  const totalLeads      = distribuicao.reduce((s, c) => s + (c._count?.leads ?? 0), 0)
  const ativos          = correspondentes.filter(c => c.ativo).length
  const semCorrespondente = "—" // calculado no servidor

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">🎯 Distribuição de Leads</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Distribua leads automaticamente entre correspondentes ativos</p>
          </div>
          <button onClick={() => setShowNovo(true)}
            className="rounded-full bg-[#FF6B00] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#e06000]">
            + Novo Correspondente
          </button>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label:"Correspondentes ativos", value: loading ? "..." : ativos,      accent:"#1DB954" },
            { label:"Leads distribuídos",     value: loading ? "..." : totalLeads,  accent:"#FF6B00" },
            { label:"Total cadastrados",      value: loading ? "..." : correspondentes.length, accent:"#1DB954" },
          ].map(k => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Painel de distribuição */}
        <div className="mb-6 rounded-2xl border-2 border-[#1DB954]/20 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f8ee] text-xl">🚀</div>
            <div>
              <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Disparar Distribuição</div>
              <div className="font-['Sora'] text-xs text-[#9ca3af]">
                Algoritmo: Fisher-Yates shuffle + Round-Robin proporcional
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
            <input type="checkbox" id="somente-novos" checked={somenteNovos}
              onChange={e => setSomenteNovos(e.target.checked)}
              className="h-5 w-5 cursor-pointer rounded accent-[#1DB954]" />
            <label htmlFor="somente-novos" className="cursor-pointer">
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Distribuir apenas leads com status NOVO</div>
              <div className="font-['Sora'] text-xs text-[#9ca3af]">Desmarcando, distribui todos os leads sem correspondente</div>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={distribuir} disabled={distributing || ativos === 0}
              className="flex items-center gap-2 rounded-xl bg-[#1DB954] px-6 py-3 font-['Sora'] text-sm font-bold text-white shadow-[0_4px_16px_rgba(29,185,84,0.25)] transition-all hover:bg-[#0f9c40] disabled:opacity-60">
              {distributing ? "⏳ Distribuindo..." : "🎯 Distribuir agora"}
            </button>
            {ativos === 0 && (
              <span className="font-['Sora'] text-sm text-[#c2410c]">
                ⚠️ Cadastre ao menos um correspondente ativo
              </span>
            )}
          </div>

          {/* Resultado da última distribuição */}
          {resultado && (
            <div className={`mt-4 rounded-xl p-4 ${resultado.success ? "bg-[#e8f8ee]" : "bg-red-50"}`}>
              <div className={`font-['Sora'] text-sm font-bold ${resultado.success ? "text-[#0f9c40]" : "text-red-600"}`}>
                {resultado.success ? "✅" : "❌"} {resultado.message}
              </div>
              {resultado.success && resultado.data?.resumo?.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {resultado.data.resumo.map((r: any) => (
                    <div key={r.email} className="rounded-lg border border-[#1DB954]/20 bg-white px-3 py-2">
                      <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{r.nome}</div>
                      <div className="font-['Sora'] text-xs text-[#6b7280]">{r.email}</div>
                      <div className="mt-1 font-['Sora'] text-lg font-extrabold text-[#1DB954]">
                        +{r.recebeu} lead{r.recebeu !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de correspondentes + seus leads */}
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">

          {/* Lista */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            <div className="border-b border-[#e5e7eb] px-5 py-4">
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Correspondentes</div>
            </div>
            <div className="p-3 space-y-2">
              {loading ? Array(4).fill(0).map((_,i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-[#e5e7eb]" />
              )) : correspondentes.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#9ca3af]">
                  Nenhum correspondente cadastrado
                </div>
              ) : correspondentes.map(c => (
                <div key={c.id}
                  onClick={() => setActive(activeCorrespondente === c.id ? null : c.id)}
                  className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                    activeCorrespondente === c.id
                      ? "border-[#1DB954] bg-[#e8f8ee]"
                      : "border-[#e5e7eb] hover:border-[#1DB954]/40"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{c.nome}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold ${
                        c.ativo ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#f1f5f9] text-[#475569]"
                      }`}>{c.ativo ? "Ativo" : "Inativo"}</span>
                      <button
                        onClick={e => { e.stopPropagation(); toggleAtivo(c.id, c.ativo) }}
                        className="rounded-lg border border-[#e5e7eb] px-2 py-0.5 font-['Sora'] text-[0.6rem] hover:border-[#FF6B00] hover:text-[#FF6B00]">
                        {c.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 font-['Sora'] text-xs text-[#9ca3af]">{c.email}</div>
                  <div className="mt-1 font-['Sora'] text-xs font-bold text-[#FF6B00]">
                    {c._count?.leads ?? 0} leads atribuídos
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leads do correspondente selecionado */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            {!activeCorrespondente ? (
              <div className="flex h-full items-center justify-center py-20 text-center">
                <div>
                  <div className="mb-3 text-4xl">👆</div>
                  <p className="font-['Sora'] text-sm text-[#9ca3af]">Selecione um correspondente<br/>para ver seus leads</p>
                </div>
              </div>
            ) : (() => {
              const c = distribuicao.find(d => d.id === activeCorrespondente)
              if (!c) return (
                <div className="flex h-full items-center justify-center py-20 text-center">
                  <p className="font-['Sora'] text-sm text-[#9ca3af]">Nenhum lead distribuído ainda</p>
                </div>
              )
              return (
                <div>
                  <div className="border-b border-[#e5e7eb] px-5 py-4">
                    <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">{c.nome}</div>
                    <div className="font-['Sora'] text-xs text-[#9ca3af]">
                      {c._count?.leads ?? 0} leads · {c.email}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#f4f6f8]">
                          {["Cliente","Produto","Valor","Status","Data"].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(c.leads ?? []).length === 0 ? (
                          <tr><td colSpan={5} className="py-10 text-center text-sm text-[#9ca3af]">Nenhum lead atribuído</td></tr>
                        ) : (c.leads ?? []).map(({ lead }) => (
                          <tr key={lead.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                            <td className="px-4 py-3 font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{lead.nome}</td>
                            <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{lead.produto}</td>
                            <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{formatCurrency(lead.valor)}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold ${STATUS_STYLE[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {lead.status.replace("_"," ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-['Sora'] text-xs text-[#9ca3af]">
                              {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Modal novo correspondente */}
        {showNovo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowNovo(false)}>
            <div className="w-full max-w-[420px] rounded-3xl bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
              onClick={e => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">+ Novo Correspondente</h2>
                <button onClick={() => setShowNovo(false)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nome completo</label>
                  <input type="text" placeholder="Nome do correspondente" value={novoForm.nome}
                    onChange={e => setNovoForm(f => ({...f, nome: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">E-mail</label>
                  <input type="email" placeholder="email@exemplo.com" value={novoForm.email}
                    onChange={e => setNovoForm(f => ({...f, email: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Telefone</label>
                  <input type="tel" placeholder="(00) 0 0000-0000" value={novoForm.telefone}
                    onChange={e => setNovoForm(f => ({...f, telefone: e.target.value}))}
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>
                {novoMsg && (
                  <div className={`rounded-xl px-3 py-2 text-center font-['Sora'] text-sm font-bold ${novoMsg.startsWith("✅") ? "bg-[#e8f8ee] text-[#0f9c40]" : "bg-red-50 text-red-600"}`}>
                    {novoMsg}
                  </div>
                )}
                <button onClick={salvarNovo} disabled={novoSaving}
                  className="w-full rounded-xl bg-[#FF6B00] py-3 font-['Sora'] text-sm font-bold uppercase text-white transition-all hover:bg-[#e06000] disabled:opacity-60">
                  {novoSaving ? "Cadastrando..." : "+ Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
