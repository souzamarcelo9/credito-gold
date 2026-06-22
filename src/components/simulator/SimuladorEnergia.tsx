"use client"

import { useState, useMemo } from "react"
import { simular } from "@/lib/simulador"
import { formatCurrency } from "@/lib/utils"

interface SimuladorEnergiaProps {
  onSolicitar?: (dados: { valor: number; parcelas: number; parcelaMensal: number }) => void
}

const VALOR_MIN = 300
const VALOR_MAX = 4000
const PRAZO_MIN = 6
const PRAZO_MAX = 24

export function SimuladorEnergia({ onSolicitar }: SimuladorEnergiaProps) {
  const [valor, setValor]       = useState(1500)
  const [parcelas, setParcelas] = useState(12)

  const resultado = useMemo(() => {
    try {
      return simular({ produto: "energia", valor, parcelas })
    } catch {
      return { parcela: 0, taxa: 0.0349, cetAnual: 0, totalPagar: 0, jurosTotal: 0 }
    }
  }, [valor, parcelas])

  const pctValor = ((valor - VALOR_MIN) / (VALOR_MAX - VALOR_MIN)) * 100
  const pctPrazo = ((parcelas - PRAZO_MIN) / (PRAZO_MAX - PRAZO_MIN)) * 100

  return (
    <div className="rounded-[20px] bg-white p-7 shadow-[0_12px_48px_rgba(0,0,0,0.14)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">Simule Seu Limite</h3>
          <p className="mt-0.5 text-sm text-[#6b7280]">Resultado no mesmo instante, sem compromisso.</p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-[#FF6B00] px-3 py-1.5 font-['Sora'] text-[0.65rem] font-bold uppercase tracking-wide text-white shadow-[0_4px_12px_rgba(255,107,0,0.3)]">
          Sem SPC/Serasa
        </span>
      </div>

      {/* Slider Valor */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">Valor Desejado</span>
          <span className="font-['Sora'] text-lg font-extrabold text-[#1DB954]">{formatCurrency(valor)}</span>
        </div>
        <input
          type="range"
          min={VALOR_MIN}
          max={VALOR_MAX}
          step={50}
          value={valor}
          onChange={e => setValor(Number(e.target.value))}
          className="slider-green-orange w-full"
          style={{ "--pct": `${pctValor}%` } as React.CSSProperties}
        />
        <div className="mt-1 flex justify-between text-[0.68rem] text-[#9ca3af]">
          <span>{formatCurrency(VALOR_MIN)}</span>
          <span>{formatCurrency(VALOR_MAX)}</span>
        </div>
      </div>

      {/* Slider Prazo */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">Prazo</span>
          <span className="font-['Sora'] text-lg font-extrabold text-[#FF6B00]">{parcelas} meses</span>
        </div>
        <input
          type="range"
          min={PRAZO_MIN}
          max={PRAZO_MAX}
          step={1}
          value={parcelas}
          onChange={e => setParcelas(Number(e.target.value))}
          className="slider-green-orange w-full"
          style={{ "--pct": `${pctPrazo}%` } as React.CSSProperties}
        />
        <div className="mt-1 flex justify-between text-[0.68rem] text-[#9ca3af]">
          <span>{PRAZO_MIN}x</span>
          <span>{PRAZO_MAX}x</span>
        </div>
      </div>

      {/* Resultado */}
      <div className="mb-5 rounded-2xl bg-[#f0fdf4] p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-['Sora'] text-xs font-bold uppercase tracking-wide text-[#6b7280]">Parcela estimada</span>
          <span className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{formatCurrency(resultado.parcela)}</span>
        </div>
        <p className="mb-3 font-['Sora'] text-[0.7rem] font-semibold text-[#1DB954]">Com desconto direto na fatura</p>
        <div className="grid grid-cols-3 gap-2 border-t border-[#1DB954]/15 pt-3">
          <div>
            <div className="font-['Sora'] text-[0.6rem] font-bold uppercase text-[#9ca3af]">Taxa</div>
            <div className="font-['Sora'] text-xs font-bold text-[#0D1B2A]">{(resultado.taxa*100).toFixed(2).replace(".",",")}% a.m.</div>
          </div>
          <div>
            <div className="font-['Sora'] text-[0.6rem] font-bold uppercase text-[#9ca3af]">Total pago</div>
            <div className="font-['Sora'] text-xs font-bold text-[#0D1B2A]">{formatCurrency(resultado.totalPagar)}</div>
          </div>
          <div>
            <div className="font-['Sora'] text-[0.6rem] font-bold uppercase text-[#9ca3af]">CET aprox.</div>
            <div className="font-['Sora'] text-xs font-bold text-[#0D1B2A]">{resultado.cetAnual.toFixed(2).replace(".",",")}% a.a.</div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onSolicitar?.({ valor, parcelas, parcelaMensal: resultado.parcela })}
        className="w-full rounded-xl bg-gradient-to-r from-[#1DB954] to-[#FF6B00] py-3.5 font-['Sora'] text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(29,185,84,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(29,185,84,0.4)]">
        Solicitar Empréstimo →
      </button>

      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-[#9ca3af] text-xs">🔒</span>
        <p className="font-['Sora'] text-xs text-[#9ca3af]">Criptografia Segura SSL</p>
      </div>
    </div>
  )
}
