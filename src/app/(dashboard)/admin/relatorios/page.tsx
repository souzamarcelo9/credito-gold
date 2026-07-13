"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatCurrency } from "@/lib/utils"

const PRODUTOS_LABEL: Record<string, string> = {
  PESSOAL:"Crédito Pessoal", GARANTIA:"Com Garantia", EMPRESARIAL:"Empresarial",
  CONSIGNADO:"Consignado", FGTS:"Antecip. FGTS", ENERGIA:"Conta de Luz",
}

interface LeadAprovado {
  id:string; nome:string; telefone:string; produto:string; valor:number
  banco:string; afiliado:string; correspondente:string
  comissao:number; statusComissao:string; dataAprovacao:string
}

interface Totais { qtd:number; valorTotal:number; comissoes:number }

export default function RelatoriosPage() {
  const [leads, setLeads]         = useState<LeadAprovado[]>([])
  const [totais, setTotais]       = useState<Totais>({ qtd:0, valorTotal:0, comissoes:0 })
  const [porProduto, setPorProduto] = useState<Record<string,{qtd:number;valor:number}>>({})
  const [porAfiliado, setPorAfiliado] = useState<Array<{nome:string;qtd:number;comissao:number}>>([])
  const [loading, setLoading]     = useState(false)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim]     = useState("")
  const [produto, setProduto]     = useState("")

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ tipo:"aprovados" })
      if (dataInicio) p.set("dataInicio", dataInicio)
      if (dataFim)    p.set("dataFim",    dataFim)
      if (produto)    p.set("produto",    produto)
      const res  = await fetch(`/api/admin/relatorios?${p}`)
      const json = await res.json()
      if (json.success) {
        setLeads(json.data.leads ?? [])
        setTotais(json.data.totais ?? { qtd:0, valorTotal:0, comissoes:0 })
        setPorProduto(json.data.porProduto ?? {})
        setPorAfiliado(json.data.porAfiliado ?? [])
      }
    } finally { setLoading(false) }
  }, [dataInicio, dataFim, produto])

  useEffect(() => { fetch_() }, [fetch_])

  function exportCSV() {
    const headers = ["Nome","Telefone","Produto","Valor","Banco","Afiliado","Correspondente","Comissão","Status Comissão","Data Aprovação"]
    const rows = leads.map(l => [
      l.nome, l.telefone,
      PRODUTOS_LABEL[l.produto] ?? l.produto,
      formatCurrency(l.valor),
      l.banco, l.afiliado, l.correspondente,
      formatCurrency(l.comissao),
      l.statusComissao,
      new Date(l.dataAprovacao).toLocaleDateString("pt-BR"),
    ])
    const csv  = [headers, ...rows].map(r => r.join(";")).join("\n")
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `creditos-aprovados-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">📊 Relatórios</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Análise de créditos aprovados e resultados</p>
          </div>
          <button onClick={exportCSV}
            className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40]">
            ↓ Exportar CSV
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-5 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="mb-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">🔍 Filtros</div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="font-['Sora'] text-xs font-bold text-[#6b7280]">De:</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                className="rounded-xl border-2 border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#1DB954]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-['Sora'] text-xs font-bold text-[#6b7280]">Até:</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                className="rounded-xl border-2 border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#1DB954]" />
            </div>
            <select value={produto} onChange={e => setProduto(e.target.value)}
              className="rounded-xl border-2 border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#1DB954]">
              <option value="">Todos os produtos</option>
              {Object.entries(PRODUTOS_LABEL).map(([k,l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button onClick={() => { setDataInicio(""); setDataFim(""); setProduto("") }}
              className="rounded-xl border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-sm text-[#6b7280] hover:border-[#dc2626] hover:text-[#dc2626]">
              Limpar
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-3 gap-4">
          {[
            { label:"Créditos aprovados",  value: loading ? "..." : totais.qtd,                          accent:"#1DB954" },
            { label:"Volume total liberado",value: loading ? "..." : formatCurrency(totais.valorTotal),   accent:"#FF6B00" },
            { label:"Comissões geradas",    value: loading ? "..." : formatCurrency(totais.comissoes),    accent:"#1DB954" },
          ].map(k => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Breakdown por produto + afiliado */}
        {!loading && Object.keys(porProduto).length > 0 && (
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            {/* Por produto */}
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="mb-4 font-['Sora'] text-sm font-bold text-[#0D1B2A]">Por Produto</div>
              <div className="space-y-3">
                {Object.entries(porProduto)
                  .sort((a,b) => b[1].valor - a[1].valor)
                  .map(([prod, data]) => {
                    const pct = totais.valorTotal > 0 ? (data.valor / totais.valorTotal) * 100 : 0
                    return (
                      <div key={prod}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-['Sora'] font-semibold text-[#374151]">{PRODUTOS_LABEL[prod] ?? prod}</span>
                          <span className="font-['Sora'] font-bold text-[#0D1B2A]">{data.qtd}x · {formatCurrency(data.valor)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#f4f6f8]">
                          <div className="h-full rounded-full bg-[#1DB954] transition-all" style={{ width:`${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Top afiliados */}
            <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="mb-4 font-['Sora'] text-sm font-bold text-[#0D1B2A]">Top Afiliados</div>
              {porAfiliado.length === 0 ? (
                <p className="text-sm text-[#9ca3af]">Nenhum lead via afiliado no período</p>
              ) : (
                <div className="space-y-3">
                  {porAfiliado.slice(0,5).map((af, i) => (
                    <div key={af.nome} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FF6B00] font-['Sora'] text-xs font-extrabold text-white">
                        {i+1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{af.nome}</div>
                        <div className="font-['Sora'] text-xs text-[#9ca3af]">{af.qtd} aprovado{af.qtd !== 1 ? "s" : ""}</div>
                      </div>
                      <span className="font-['Sora'] text-sm font-bold text-[#1DB954]">{formatCurrency(af.comissao)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabela detalhada */}
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-5 py-4">
            <span className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">
              {loading ? "Carregando..." : `${leads.length} crédito${leads.length !== 1 ? "s" : ""} aprovado${leads.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f4f6f8]">
                  {["Cliente","Produto","Valor","Banco","Afiliado","Correspondente","Comissão","Data"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(5).fill(0).map((_,i) => (
                  <tr key={i} className="border-t border-[#e5e7eb]">
                    {Array(8).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>)}
                  </tr>
                )) : leads.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-sm text-[#9ca3af]">Nenhum crédito aprovado no período selecionado</p>
                  </td></tr>
                ) : leads.map(l => (
                  <tr key={l.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                    <td className="px-4 py-3">
                      <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{l.nome}</div>
                      <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{l.telefone}</div>
                    </td>
                    <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{PRODUTOS_LABEL[l.produto] ?? l.produto}</td>
                    <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{formatCurrency(l.valor)}</td>
                    <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{l.banco}</td>
                    <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{l.afiliado}</td>
                    <td className="px-4 py-3 font-['Sora'] text-xs text-[#6b7280]">{l.correspondente}</td>
                    <td className="px-4 py-3">
                      <span className="font-['Sora'] text-sm font-bold text-[#1DB954]">{formatCurrency(l.comissao)}</span>
                    </td>
                    <td className="px-4 py-3 font-['Sora'] text-xs text-[#9ca3af]">
                      {new Date(l.dataAprovacao).toLocaleDateString("pt-BR")}
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
