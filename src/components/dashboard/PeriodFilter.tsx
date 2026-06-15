"use client"

import { useState } from "react"

export type PeriodType = "diario" | "semanal" | "mensal" | "anual" | "personalizado"

export interface DateRange {
  period:     PeriodType
  startDate?: string
  endDate?:   string
  label:      string
}

interface PeriodFilterProps {
  onChange:      (range: DateRange) => void
  activeMonths?: boolean
}

const MONTHS      = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"]
const CURR_MONTH  = new Date().getMonth()

export function PeriodFilter({ onChange, activeMonths = false }: PeriodFilterProps) {
  const [period,      setPeriod]      = useState<PeriodType>("mensal")
  const [activeMonth, setActiveMonth] = useState(CURR_MONTH)
  const [startDate,   setStartDate]   = useState("")
  const [endDate,     setEndDate]     = useState("")
  const [showCustom,  setShowCustom]  = useState(false)

  function selectPeriod(p: PeriodType) {
    setPeriod(p)
    setShowCustom(p === "personalizado")
    if (p !== "personalizado") {
      const now   = new Date()
      let   start = new Date()
      if (p === "diario")  start = new Date(new Date().setDate(now.getDate() - 1))
      if (p === "semanal") start = new Date(new Date().setDate(now.getDate() - 7))
      if (p === "mensal")  start = new Date(new Date().setMonth(now.getMonth() - 1))
      if (p === "anual")   start = new Date(new Date().setFullYear(now.getFullYear() - 1))
      const labels: Record<string, string> = { diario:"Hoje", semanal:"7 dias", mensal:"30 dias", anual:"12 meses" }
      onChange({ period: p, startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0], label: labels[p] })
    }
  }

  function selectMonth(idx: number) {
    setActiveMonth(idx)
    const year  = new Date().getFullYear()
    const start = new Date(year, idx, 1).toISOString().split("T")[0]
    const end   = new Date(year, idx + 1, 0).toISOString().split("T")[0]
    onChange({ period: "mensal", startDate: start, endDate: end, label: MONTHS[idx] })
  }

  function applyCustom() {
    if (!startDate || !endDate) return
    onChange({ period: "personalizado", startDate, endDate, label: `${startDate} → ${endDate}` })
    setShowCustom(false)
  }

  const PERIODS: { key: PeriodType; label: string }[] = [
    { key: "diario",        label: "Diário"        },
    { key: "semanal",       label: "Semanal"       },
    { key: "mensal",        label: "Mensal"        },
    { key: "anual",         label: "Anual"         },
    { key: "personalizado", label: "Personalizado" },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => selectPeriod(p.key)}
            className={`rounded-full px-4 py-1.5 font-['Sora'] text-xs font-bold uppercase tracking-wide transition-all ${
              period === p.key
                ? "bg-[#1DB954] text-white shadow-[0_2px_12px_rgba(29,185,84,0.35)]"
                : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]"
            }`}>
            {p.label}
          </button>
        ))}
      </div>

      {activeMonths && (
        <div className="flex flex-wrap gap-1">
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => selectMonth(i)}
              className={`rounded-lg px-3 py-1 font-['Sora'] text-xs font-bold transition-all ${
                activeMonth === i ? "bg-[#0D1B2A] text-white" : "text-[#94a3b8] hover:text-[#0D1B2A]"
              }`}>
              {m}
            </button>
          ))}
        </div>
      )}

      {showCustom && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-3">
          <div className="flex items-center gap-2">
            <label className="font-['Sora'] text-xs font-bold uppercase tracking-wide text-[#6b7280]">De</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 font-['Sora'] text-xs outline-none focus:border-[#1DB954]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-['Sora'] text-xs font-bold uppercase tracking-wide text-[#6b7280]">Até</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 font-['Sora'] text-xs outline-none focus:border-[#1DB954]" />
          </div>
          <button onClick={applyCustom}
            className="rounded-lg bg-[#1DB954] px-4 py-1.5 font-['Sora'] text-xs font-bold text-white hover:bg-[#0f9c40]">
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
