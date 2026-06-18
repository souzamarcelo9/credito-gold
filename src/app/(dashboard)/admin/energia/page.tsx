"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatCurrency } from "@/lib/utils"

const CONCESSIONARIAS = [
  "Enel SP","Enel RJ","Enel CE","Energisa","CPFL","Equatorial","Cemig",
  "Coelba","Celpe","Cosern","Celg","Copel","RGE","CEEE","Elektro",
  "Light","EDP","Neoenergia","Outra",
]

const STATUS_STYLE: Record<string,string> = {
  NOVO:             "bg-[#ffedd5] text-[#c2410c]",
  EM_ANALISE:       "bg-[#dbeafe] text-[#1d4ed8]",
  APROVADO:         "bg-[#dcfce7] text-[#15803d]",
  PROPOSTA_ENVIADA: "bg-[#ede9fe] text-[#6d28d9]",
  RECUSADO:         "bg-[#f1f5f9] text-[#475569]",
  CONTRATO_ASSINADO:"bg-[#dcfce7] text-[#15803d]",
}
const STATUS_LABEL: Record<string,string> = {
  NOVO:"Novo", EM_ANALISE:"Em análise", APROVADO:"Aprovado",
  PROPOSTA_ENVIADA:"Proposta", RECUSADO:"Recusado", CONTRATO_ASSINADO:"Contrato",
}

interface Lead {
  id:string; nome:string; email:string; telefone:string; cidade?:string; estado?:string
  valor:number; status:string; origem:string; createdAt:string
  afiliado?:{ slug:string; nome:string }|null
  dadosEnergia?:{
    concessionaria?:string; numeroInstalacao?:string; numeroCliente?:string
    titularConta?:string; cpfTitular?:string; valorMedioFatura?:number
    possuiDebitos?:boolean; dataVencimento?:string; observacoesInternas?:string
  }|null
}

interface DadosEnergia {
  concessionaria:string; numeroInstalacao:string; numeroCliente:string
  titularConta:string; cpfTitular:string; valorMedioFatura:string
  possuiDebitos:boolean; dataVencimento:string; observacoesInternas:string
}

export default function AdminEnergiaPage() {
  const [leads, setLeads]         = useState<Lead[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Lead|null>(null)
  const [saving, setSaving]       = useState(false)
  const [savedMsg, setSavedMsg]   = useState("")
  const [search, setSearch]       = useState("")
  const [statusFilter, setStatus] = useState("")
  const [dados, setDados] = useState<DadosEnergia>({
    concessionaria:"", numeroInstalacao:"", numeroCliente:"",
    titularConta:"", cpfTitular:"", valorMedioFatura:"",
    possuiDebitos:false, dataVencimento:"", observacoesInternas:"",
  })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit:"50" })
      if (search)       params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      // Filtra somente leads de energia
      const res  = await fetch(`/api/dashboard/leads?${params}&produto=ENERGIA`)
      const json = await res.json()
      if (json.success) {
        const data = json.data?.data ?? json.data ?? []
        // Filtra pelo produto ENERGIA no cliente
        const energiaLeads = Array.isArray(data)
          ? data.filter((l: Lead) => (l as any).produto === "ENERGIA" || (l as any).produto === "energia")
          : []
        setLeads(energiaLeads)
      }
    } finally { setLoading(false) }
  }, [search, statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  function selectLead(lead: Lead) {
    setSelected(lead)
    setSavedMsg("")
    setDados({
      concessionaria:      lead.dadosEnergia?.concessionaria      ?? "",
      numeroInstalacao:    lead.dadosEnergia?.numeroInstalacao    ?? "",
      numeroCliente:       lead.dadosEnergia?.numeroCliente       ?? "",
      titularConta:        lead.dadosEnergia?.titularConta        ?? "",
      cpfTitular:          lead.dadosEnergia?.cpfTitular          ?? "",
      valorMedioFatura:    String(lead.dadosEnergia?.valorMedioFatura ?? ""),
      possuiDebitos:       lead.dadosEnergia?.possuiDebitos       ?? false,
      dataVencimento:      lead.dadosEnergia?.dataVencimento      ?? "",
      observacoesInternas: lead.dadosEnergia?.observacoesInternas ?? "",
    })
  }

  async function saveDados() {
    if (!selected) return
    setSaving(true); setSavedMsg("")
    try {
      const res = await fetch(`/api/leads/${selected.id}/energia`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          ...dados,
          valorMedioFatura: dados.valorMedioFatura ? parseFloat(dados.valorMedioFatura) : null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSavedMsg("✅ Dados salvos com sucesso!")
        fetchLeads()
      } else {
        setSavedMsg("❌ Erro ao salvar. Tente novamente.")
      }
    } catch {
      setSavedMsg("❌ Erro de conexão.")
    } finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ status }),
    })
    fetchLeads()
    if (selected?.id === id) setSelected(prev => prev ? {...prev, status} : null)
  }

  const totalLeads     = leads.length
  const totalAprovados = leads.filter(l => l.status === "APROVADO").length
  const totalValor     = leads.reduce((s,l) => s + l.valor, 0)

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Energia — Gestão de Leads</h1>
            </div>
            <p className="mt-0.5 text-sm text-[#6b7280]">Leads do produto Empréstimo na Conta de Luz</p>
          </div>
          <button onClick={fetchLeads}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
            ↻ Atualizar
          </button>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label:"Total de Leads",  value: loading ? "..." : totalLeads,                      accent:"#1DB954" },
            { label:"Aprovados",       value: loading ? "..." : totalAprovados,                  accent:"#FF6B00" },
            { label:"Volume Total",    value: loading ? "..." : formatCurrency(totalValor),      accent:"#1DB954" },
          ].map(k => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-4 flex gap-3">
          <input placeholder="🔍 Buscar por nome ou telefone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]" />
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">

          {/* Tabela */}
          <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
            <div className="border-b border-[#e5e7eb] px-5 py-4">
              <span className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                {loading ? "Carregando..." : `${leads.length} lead${leads.length !== 1 ? "s" : ""} de energia`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f4f6f8]">
                    {["Cliente","Localidade","Valor","Status","Concessionária","Data","Ação"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array(5).fill(0).map((_,i) => (
                    <tr key={i} className="border-t border-[#e5e7eb]">
                      {Array(7).fill(0).map((_,j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>
                      ))}
                    </tr>
                  )) : leads.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <div className="text-4xl mb-3">⚡</div>
                      <p className="text-sm text-[#9ca3af]">Nenhum lead de energia ainda</p>
                    </td></tr>
                  ) : leads.map(lead => (
                    <tr key={lead.id}
                      onClick={() => selectLead(lead)}
                      className={`cursor-pointer border-t border-[#e5e7eb] transition-colors hover:bg-[#f9fafb] ${selected?.id === lead.id ? "bg-[#e8f8ee]" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{lead.nome}</div>
                        <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{lead.telefone}</div>
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">
                        {lead.cidade ?? "—"}{lead.estado ? ` / ${lead.estado}` : ""}
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{formatCurrency(lead.valor)}</td>
                      <td className="px-4 py-3">
                        <select value={lead.status}
                          onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          className={`rounded-full border-0 px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold outline-none cursor-pointer ${STATUS_STYLE[lead.status] ?? ""}`}>
                          {Object.entries(STATUS_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">
                        {lead.dadosEnergia?.concessionaria ? (
                          <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 font-bold text-[#0f9c40]">
                            {lead.dadosEnergia.concessionaria}
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#fff3e8] px-2 py-0.5 text-[#c2410c]">Pendente</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-xs text-[#9ca3af]">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={e => { e.stopPropagation(); selectLead(lead) }}
                          className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all">
                          {lead.dadosEnergia ? "Editar" : "Preencher"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Painel de dados da conta */}
          <div className={`rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm transition-all duration-300 ${selected ? "opacity-100" : "opacity-40"}`}>
            {!selected ? (
              <div className="flex h-full items-center justify-center py-20 text-center">
                <div>
                  <div className="mb-3 text-4xl">⚡</div>
                  <p className="font-['Sora'] text-sm text-[#9ca3af]">Selecione um lead para<br />preencher os dados da conta</p>
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#FF6B00]">Dados da Conta de Energia</div>
                    <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">{selected.nome}</div>
                    <div className="font-['Sora'] text-xs text-[#9ca3af]">{selected.telefone} · {selected.cidade}/{selected.estado}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-[#9ca3af] hover:text-[#0D1B2A]">✕</button>
                </div>

                {/* Dados do cliente (read-only) */}
                <div className="mb-4 grid grid-cols-2 gap-2">
                  {[
                    { label:"WhatsApp", value:selected.telefone },
                    { label:"Valor",    value:formatCurrency(selected.valor) },
                    { label:"Origem",   value:selected.origem },
                    { label:"Status",   value:STATUS_LABEL[selected.status] ?? selected.status },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-[#f9fafb] px-3 py-2">
                      <div className="font-['Sora'] text-[0.6rem] font-bold uppercase text-[#9ca3af]">{item.label}</div>
                      <div className="font-['Sora'] text-xs font-medium text-[#0D1B2A]">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-3 border-t border-[#e5e7eb] pt-4">
                  <div className="mb-3 font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                    Informações do Imóvel & Parâmetros Fatura
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Concessionária */}
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Concessionária</label>
                    <select value={dados.concessionaria} onChange={e => setDados(d => ({...d, concessionaria:e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      <option value="">Selecione...</option>
                      {CONCESSIONARIAS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Número instalação + cliente */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nº Instalação</label>
                      <input type="text" placeholder="Ex: 88726514" value={dados.numeroInstalacao}
                        onChange={e => setDados(d => ({...d, numeroInstalacao:e.target.value}))}
                        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                    </div>
                    <div>
                      <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nº Cliente</label>
                      <input type="text" placeholder="Ex: 1049583" value={dados.numeroCliente}
                        onChange={e => setDados(d => ({...d, numeroCliente:e.target.value}))}
                        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                    </div>
                  </div>

                  {/* Titular + CPF titular */}
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Titular da Conta</label>
                    <input type="text" placeholder="Nome Completo do Titular" value={dados.titularConta}
                      onChange={e => setDados(d => ({...d, titularConta:e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">CPF do Titular</label>
                      <input type="text" placeholder="000.000.000-00" value={dados.cpfTitular}
                        onChange={e => setDados(d => ({...d, cpfTitular:e.target.value}))}
                        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                    </div>
                    <div>
                      <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Valor Médio Fatura</label>
                      <input type="number" placeholder="Ex: 150" value={dados.valorMedioFatura}
                        onChange={e => setDados(d => ({...d, valorMedioFatura:e.target.value}))}
                        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                    </div>
                  </div>

                  {/* Possui débitos */}
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Possui Débitos na Conta?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button"
                        onClick={() => setDados(d => ({...d, possuiDebitos:true}))}
                        className={`rounded-xl border-2 py-2 font-['Sora'] text-sm font-bold transition-all ${dados.possuiDebitos ? "border-[#FF6B00] bg-[#fff3e8] text-[#c2410c]" : "border-[#e5e7eb] text-[#9ca3af] hover:border-[#FF6B00]/40"}`}>
                        SIM
                      </button>
                      <button type="button"
                        onClick={() => setDados(d => ({...d, possuiDebitos:false}))}
                        className={`rounded-xl border-2 py-2 font-['Sora'] text-sm font-bold transition-all ${!dados.possuiDebitos ? "border-[#1DB954] bg-[#e8f8ee] text-[#0f9c40]" : "border-[#e5e7eb] text-[#9ca3af] hover:border-[#1DB954]/40"}`}>
                        NÃO
                      </button>
                    </div>
                  </div>

                  {/* Vencimento + Obs */}
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Data de Vencimento</label>
                    <input type="text" placeholder="Ex: Todo dia 10" value={dados.dataVencimento}
                      onChange={e => setDados(d => ({...d, dataVencimento:e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Observações Internas</label>
                    <textarea rows={2} placeholder="Anotações do atendimento..." value={dados.observacoesInternas}
                      onChange={e => setDados(d => ({...d, observacoesInternas:e.target.value}))}
                      className="w-full resize-none rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>

                  {/* Salvar */}
                  <button onClick={saveDados} disabled={saving}
                    className="w-full rounded-xl bg-[#1DB954] py-3 font-['Sora'] text-sm font-bold text-white shadow-[0_4px_12px_rgba(29,185,84,0.25)] transition-all hover:bg-[#0f9c40] disabled:opacity-60">
                    {saving ? "Salvando..." : "💾 Salvar Dados da Conta"}
                  </button>

                  {savedMsg && (
                    <div className={`rounded-xl px-3 py-2 text-center font-['Sora'] text-sm font-bold ${savedMsg.startsWith("✅") ? "bg-[#e8f8ee] text-[#0f9c40]" : "bg-red-50 text-red-600"}`}>
                      {savedMsg}
                    </div>
                  )}

                  {/* WhatsApp direto */}
                  <a href={`https://wa.me/55${selected.telefone.replace(/\D/g,"")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 font-['Sora'] text-xs font-bold text-white no-underline hover:bg-[#1db954] transition-colors">
                    💬 Contatar via WhatsApp
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
