"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { PeriodFilter, type DateRange } from "@/components/dashboard/PeriodFilter"
import { MiniChart } from "@/components/dashboard/MiniChart"
import { formatCurrency } from "@/lib/utils"

interface FinData {
  faturamento:       number
  totalComissoes:    number
  totalDespesas:     number
  margemOperacional: number
  totalLeads:        number
  leadsAprovados:    number
  ticketMedio:       number
  serie_fat:         number[]
  serie_desp:        number[]
  captacao:          { canal:string; leads:number }[]
  despesasRows:      { label:string; valor:number; pct:number }[]
}

const fmtM = (v: number) => v >= 1000000
  ? `R$ ${(v/1000000).toFixed(1).replace(".",",")} Mi`
  : v >= 1000
  ? `R$ ${(v/1000).toFixed(0)}k`
  : formatCurrency(v)

export default function FinanceiroPage() {
  const [range,   setRange]   = useState<DateRange>({ period:"mensal", label:"30 dias" })
  const [data,    setData]    = useState<FinData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/dashboard/financeiro?period=${range.period}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {}
    finally { setLoading(false) }
  }, [range.period])

  useEffect(() => { fetchData() }, [fetchData])

  const d = data

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="financeiro" />
      <main className="ml-[260px] flex-1">

        {/* Header */}
        <div className="bg-[#0D1B2A] px-8 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#475569]">Desempenho Financeiro</div>
              <div className="font-['Sora'] text-lg font-extrabold text-white">Dashboard <span className="text-[#1DB954]">Financeiro</span></div>
            </div>
            <div className="font-['Sora'] text-xs text-[#475569]">
              Período: <span className="font-bold text-white">{range.label}</span>
            </div>
          </div>
          <div className="mb-5 rounded-xl bg-white/8 p-3 border border-white/10">
            <PeriodFilter onChange={setRange} activeMonths />
          </div>

          {/* KPIs */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label:"Despesas",          val: d?.totalDespesas,     icon:"📉", color:"#FF6B00", serie: d?.serie_desp },
              { label:"Faturamento",       val: d?.faturamento,       icon:"📈", color:"#1DB954", serie: d?.serie_fat  },
              { label:"Margem Operacional",val: d?.margemOperacional, icon:"🎯", color:"#1DB954", pct:true, verde:true },
              { label:"Comissões",         val: d?.totalComissoes,    icon:"💰", color:"#FF6B00", serie: [] },
            ].map(k => (
              <div key={k.label}
                className={`relative overflow-hidden rounded-2xl border border-white/10 p-5 ${k.verde ? "bg-[#1DB954]" : "bg-white/5"}`}>
                <div className="font-['Sora'] text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/50">{k.label}</div>
                <div className={`mt-1 font-['Sora'] text-2xl font-extrabold ${k.verde ? "text-white" : "text-white"}`}>
                  {loading ? "..." : k.pct ? `↗ ${k.val?.toFixed(1)}%` : fmtM(k.val ?? 0)}
                </div>
                {k.serie && k.serie.length > 0 && !loading && (
                  <div className="mt-2 h-9">
                    <MiniChart data={k.serie} color={k.verde ? "rgba(255,255,255,0.8)" : k.color} height={36} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* SLA e Ticket */}
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-['Sora'] text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/50">Leads no Período</div>
              <div className="mt-1 font-['Sora'] text-xl font-extrabold text-white">
                {loading ? "..." : `${d?.leadsAprovados ?? 0} aprovados`}
                <span className="ml-2 font-['Sora'] text-sm text-white/40">de {d?.totalLeads ?? 0}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="font-['Sora'] text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/50">Ticket Médio</div>
              <div className="mt-1 font-['Sora'] text-xl font-extrabold text-[#FF6B00]">
                {loading ? "..." : formatCurrency(d?.ticketMedio ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-6 p-8 lg:grid-cols-2">

          {/* Despesas */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Despesas Operacionais</div>
                <div className="font-['Sora'] text-xs text-[#9ca3af]">{range.label}</div>
              </div>
              <span className="rounded-full bg-[#e8f8ee] px-3 py-1 font-['Sora'] text-xs font-bold text-[#0f9c40]">Consolidado</span>
            </div>
            <div className="space-y-3">
              {loading ? (
                Array(5).fill(0).map((_,i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-3 flex-1 animate-pulse rounded bg-[#e5e7eb]"/>
                    <div className="h-3 w-16 animate-pulse rounded bg-[#e5e7eb]"/>
                  </div>
                ))
              ) : (d?.despesasRows ?? []).length === 0 ? (
                <p className="text-center text-sm text-[#9ca3af] py-8">Nenhuma despesa registrada</p>
              ) : (
                (d?.despesasRows ?? []).map(row => (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between font-['Sora'] text-sm">
                      <span className="text-[#374151]">{row.label}</span>
                      <span className="font-bold text-[#0D1B2A]">{fmtM(row.valor)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#f4f6f8]">
                      <div className="h-full rounded-full bg-[#FF6B00]" style={{ width:`${row.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Captação */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Captação de Crédito</div>
              <div className="font-['Sora'] text-xs text-[#9ca3af]">Por canal — {range.label}</div>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  {["Canal","Leads","% Aprovação"].map(h => (
                    <th key={h} className="pb-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(3).fill(0).map((_,i) => (
                  <tr key={i}><td colSpan={3}><div className="my-2 h-6 animate-pulse rounded bg-[#f4f6f8]"/></td></tr>
                )) : (d?.captacao ?? []).map(row => {
                  const totalCap = (d?.totalLeads ?? 0)
                  const conv = totalCap > 0 && row.leads > 0
                    ? `${Math.min(99, Math.round((d?.leadsAprovados ?? 0) / totalCap * 100))}%`
                    : "—"
                  return (
                    <tr key={row.canal} className="border-t border-[#f4f6f8]">
                      <td className="py-3 font-['Sora'] text-sm text-[#374151]">{row.canal}</td>
                      <td className="py-3 font-['Sora'] text-sm font-bold text-[#FF6B00]">{row.leads}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 font-['Sora'] text-xs font-bold text-[#0f9c40]">{conv}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Evolução */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">Evolução Financeira — {range.label}</div>
              <div className="flex gap-3 font-['Sora'] text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#1DB954]"/>Faturamento</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#FF6B00]"/>Despesas</span>
              </div>
            </div>
            {loading ? (
              <div className="h-32 animate-pulse rounded bg-[#f4f6f8]"/>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-1 font-['Sora'] text-xs text-[#9ca3af]">Faturamento</div>
                  <MiniChart data={d?.serie_fat ?? []} color="#1DB954" height={80} />
                </div>
                <div>
                  <div className="mb-1 font-['Sora'] text-xs text-[#9ca3af]">Despesas</div>
                  <MiniChart data={d?.serie_desp ?? []} color="#FF6B00" height={80} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
