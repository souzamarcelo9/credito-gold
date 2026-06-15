"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { PeriodFilter, type DateRange } from "@/components/dashboard/PeriodFilter"
import { MiniChart } from "@/components/dashboard/MiniChart"

const DATA: Record<string, any> = {
  diario:        { despesas:52000,    fat:215000,  margem:15.8, comissoes:42000,   sla:38.2, leads:12,  serie_fat:[190,210,195,215],    serie_desp:[48,51,50,52]    },
  semanal:       { despesas:380000,   fat:1500000, margem:16.2, comissoes:310000,  sla:39.5, leads:87,  serie_fat:[1200,1350,1420,1500], serie_desp:[300,340,370,380] },
  mensal:        { despesas:1600000,  fat:6500000, margem:17.5, comissoes:1300000, sla:40.3, leads:248, serie_fat:[4800,5200,6100,6500], serie_desp:[1200,1350,1480,1600] },
  anual:         { despesas:18000000, fat:72000000,margem:19.2, comissoes:14000000,sla:41.0, leads:2840,serie_fat:[52,58,65,72],        serie_desp:[14,15,16,18]    },
  personalizado: { despesas:800000,   fat:3200000, margem:16.8, comissoes:640000,  sla:39.8, leads:124, serie_fat:[2800,3000,3200,3200], serie_desp:[720,760,780,800] },
}

const DESPESAS_ROWS = [
  { label:"Pessoal e RH",         pct:42 },
  { label:"Tecnologia",           pct:17 },
  { label:"Marketing",            pct:15 },
  { label:"Comissões afiliados",  pct:13 },
  { label:"Infraestrutura cloud", pct:7  },
  { label:"Outras",               pct:5  },
]

const CAPTACAO_ROWS = [
  { canal:"Site orgânico", leads:98, conv:"73%", ticket:"R$ 14.200" },
  { canal:"Afiliados",     leads:87, conv:"68%", ticket:"R$ 18.400" },
  { canal:"WhatsApp",      leads:42, conv:"81%", ticket:"R$ 9.800"  },
  { canal:"Indicações",    leads:21, conv:"90%", ticket:"R$ 22.000" },
]

export default function FinanceiroPage() {
  const [range, setRange] = useState<DateRange>({ period:"mensal", label:"30 dias" })
  const d = DATA[range.period] ?? DATA.mensal

  const fmtM = (v: number) => v >= 1000000
    ? `R$ ${(v/1000000).toFixed(1).replace(".",",")} Mi`
    : `R$ ${(v/1000).toFixed(0)}k`

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="financeiro" />
      <main className="ml-[260px] flex-1">

        {/* Header escuro */}
        <div className="bg-[#0D1B2A] px-8 py-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B00]">
                <span className="font-['Sora'] text-sm font-extrabold text-white">CG</span>
              </div>
              <div>
                <div className="font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#475569]">Desempenho Financeiro</div>
                <div className="font-['Sora'] text-sm font-bold text-white">Crédito <span className="text-[#1DB954]">Gold</span></div>
              </div>
            </div>
            <div className="font-['Sora'] text-xs text-[#475569]">
              Período: <span className="font-bold text-white">{range.label}</span>
            </div>
          </div>

          {/* Filtro de período */}
          <div className="mb-5 rounded-xl bg-white/8 p-3 border border-white/10">
            <PeriodFilter onChange={setRange} activeMonths />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-4">
              <div className="mb-1 font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">Despesas</div>
              <div className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">{fmtM(d.despesas)}</div>
              <div className="mt-0.5 font-['Sora'] text-[0.62rem] text-[#9ca3af]">Custos operacionais ADM</div>
              <MiniChart data={d.serie_desp} color="#FF6B00" height={36} />
            </div>
            <div className="rounded-xl bg-white p-4">
              <div className="mb-1 font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">Faturamento</div>
              <div className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">{fmtM(d.fat)}</div>
              <div className="mt-0.5 font-['Sora'] text-[0.62rem] text-[#9ca3af]">Originação Crédito Gold</div>
              <MiniChart data={d.serie_fat} color="#1DB954" height={36} />
            </div>
            <div className="rounded-xl bg-[#1DB954] p-4">
              <div className="mb-1 font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#0a5c26]">Margem Operacional</div>
              <div className="font-['Sora'] text-xl font-extrabold text-white">↗ {d.margem.toFixed(1).replace(".",",")}%</div>
              <div className="mt-0.5 font-['Sora'] text-[0.62rem] text-[#0a5c26]">Rentabilidade líquida</div>
              <MiniChart data={[14,15,16,16.5,17,d.margem]} color="rgba(255,255,255,0.8)" height={36} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex-1 rounded-xl bg-white p-3">
                <div className="font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">Comissões</div>
                <div className="font-['Sora'] text-lg font-extrabold text-[#FF6B00]">{fmtM(d.comissoes)}</div>
              </div>
              <div className="flex-1 rounded-xl bg-white p-3">
                <div className="font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">SLA Médio</div>
                <div className="font-['Sora'] text-lg font-extrabold text-[#1DB954]">{d.sla.toFixed(1).replace(".",",")}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="grid gap-5 p-6 lg:grid-cols-2">

          {/* Despesas operacionais */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Despesas Operacionais</div>
                <div className="font-['Sora'] text-xs text-[#9ca3af]">{range.label}</div>
              </div>
              <span className="rounded-full bg-[#1DB954] px-3 py-1 font-['Sora'] text-[0.65rem] font-bold text-white">Consolidado</span>
            </div>
            <div className="space-y-3">
              {DESPESAS_ROWS.map(row => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between">
                    <span className="font-['Sora'] text-xs text-[#374151]">{row.label}</span>
                    <span className="font-['Sora'] text-xs font-bold text-[#0D1B2A]">
                      {fmtM(Math.round(row.pct/100 * d.despesas))}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f4f6f8]">
                    <div className="h-full rounded-full bg-[#0D1B2A] transition-all duration-700"
                      style={{ width:`${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Captação de crédito */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Captação de Crédito</div>
                <div className="font-['Sora'] text-xs text-[#9ca3af]">Por canal — {range.label}</div>
              </div>
              <div className="flex gap-1">
                {["Todos","Online","Físicas"].map((t, i) => (
                  <button key={t} className={`rounded-lg px-3 py-1 font-['Sora'] text-[0.65rem] font-bold transition-all ${i===0 ? "bg-[#0D1B2A] text-white" : "text-[#6b7280] hover:text-[#0D1B2A]"}`}>{t}</button>
                ))}
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f4f6f8]">
                  {["Canal","Leads","Conv.","Ticket Médio"].map(h => (
                    <th key={h} className="pb-2 text-left font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPTACAO_ROWS.map(r => (
                  <tr key={r.canal} className="border-b border-[#f4f6f8] last:border-0">
                    <td className="py-2.5 font-['Sora'] text-xs font-medium text-[#374151]">{r.canal}</td>
                    <td className="py-2.5 font-['Sora'] text-xs font-bold text-[#FF6B00]">{Math.round(r.leads * d.leads / 248)}</td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 font-['Sora'] text-[0.65rem] font-bold text-[#15803d]">{r.conv}</span>
                    </td>
                    <td className="py-2.5 font-['Sora'] text-xs text-[#374151]">{r.ticket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Evolução financeira */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Evolução Financeira — {range.label}</div>
              <div className="flex items-center gap-4 font-['Sora'] text-xs text-[#6b7280]">
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1DB954]"/>Faturamento</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0D1B2A]"/>Despesas</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FF6B00]"/>Comissões</span>
              </div>
            </div>
            <div className="flex h-44 items-end gap-3">
              {d.serie_fat.map((v: number, i: number) => {
                const max  = Math.max(...d.serie_fat)
                const dv   = d.serie_desp[i] ?? d.serie_desp[d.serie_desp.length - 1]
                const cv   = Math.round(dv * 0.8)
                return (
                  <div key={i} className="flex flex-1 items-end gap-0.5">
                    <div className="flex-1 rounded-t-md bg-[#1DB954] transition-all duration-700" style={{ height:`${(v/max)*100}%` }} />
                    <div className="flex-1 rounded-t-md bg-[#0D1B2A] transition-all duration-700" style={{ height:`${(dv/max)*100}%` }} />
                    <div className="flex-1 rounded-t-md bg-[#FF6B00] transition-all duration-700" style={{ height:`${(cv/max)*100}%` }} />
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
