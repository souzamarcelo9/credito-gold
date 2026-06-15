"use client"

import { useState } from "react"
import { PRODUTOS } from "@/config/produtos"
import { useSimulador } from "@/hooks/useSimulador"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ProdutoKey } from "@/types"

interface SimuladorCardProps {
  onSolicitar?: (dados: {
    produto: ProdutoKey
    valor: number
    parcelas: number
    parcelaMensal: number
  }) => void
}

export function SimuladorCard({ onSolicitar }: SimuladorCardProps) {
  const { produto, valor, parcelas, resultado, produtoConfig, setProduto, setValor, setParcelas } =
    useSimulador()

  function handleSolicitar() {
    onSolicitar?.({
      produto,
      valor,
      parcelas,
      parcelaMensal: resultado.parcela,
    })
  }

  const pctValor  = ((valor - produtoConfig.valorMin) / (produtoConfig.valorMax - produtoConfig.valorMin)) * 100
  const pctPrazo  = ((parcelas - produtoConfig.prazoMin) / (produtoConfig.prazoMax - produtoConfig.prazoMin)) * 100

  return (
    <div className="rounded-[20px] bg-white p-7 shadow-[0_12px_48px_rgba(0,0,0,0.14)]">
      {/* Header */}
      <div className="mb-5">
        <h3 className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">Simule seu Crédito</h3>
        <p className="mt-0.5 text-sm text-[#6b7280]">Dinheiro rápido na conta, sem burocracia.</p>
      </div>

      {/* Produto */}
      <div className="mb-5">
        <label className="mb-1.5 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
          Produto
        </label>
        <div className="relative">
          <select
            value={produto}
            onChange={e => setProduto(e.target.value as ProdutoKey)}
            className="w-full appearance-none rounded-[14px] border-2 border-[#e5e7eb] bg-white px-4 py-3 font-['Sora'] text-sm font-semibold text-[#0D1B2A] outline-none transition-colors focus:border-[#1DB954]"
          >
            {Object.values(PRODUTOS).map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">▾</span>
        </div>
      </div>

      {/* Slider Valor */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">Valor</span>
          <span className="font-['Sora'] text-lg font-extrabold text-[#1DB954]">{formatCurrency(valor)}</span>
        </div>
        <input
          type="range"
          min={produtoConfig.valorMin}
          max={produtoConfig.valorMax}
          step={100}
          value={valor}
          onChange={e => setValor(Number(e.target.value))}
          className="slider-green-orange w-full"
          style={{ "--pct": `${pctValor}%` } as React.CSSProperties}
        />
        <div className="mt-1 flex justify-between text-[0.68rem] text-[#9ca3af]">
          <span>{formatCurrency(produtoConfig.valorMin)}</span>
          <span>{formatCurrency(produtoConfig.valorMax)}</span>
        </div>
      </div>

      {/* Slider Prazo */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">Prazo</span>
          <span className="font-['Sora'] text-lg font-extrabold text-[#1DB954]">{parcelas}x</span>
        </div>
        <input
          type="range"
          min={produtoConfig.prazoMin}
          max={produtoConfig.prazoMax}
          step={6}
          value={parcelas}
          onChange={e => setParcelas(Number(e.target.value))}
          className="slider-green-orange w-full"
          style={{ "--pct": `${pctPrazo}%` } as React.CSSProperties}
        />
        <div className="mt-1 flex justify-between text-[0.68rem] text-[#9ca3af]">
          <span>{produtoConfig.prazoMin}x</span>
          <span>{produtoConfig.prazoMax}x</span>
        </div>
      </div>

      {/* Resultado */}
      <div className="mb-5 rounded-[14px] bg-[#e8f8ee] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Parcela mensal</span>
          <span className="font-['Sora'] text-2xl font-extrabold text-[#1DB954]">
            {formatCurrency(resultado.parcela)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            { label: "Taxa",         value: `${(resultado.taxa * 100).toFixed(2).replace(".", ",")}% a.m.` },
            { label: "CET Aprox.",   value: `${resultado.cetAnual.toFixed(2).replace(".", ",")}% a.a.` },
            { label: "Total a pagar",value: formatCurrency(resultado.totalPagar) },
            { label: "Juros totais", value: formatCurrency(resultado.jurosTotal) },
          ].map(item => (
            <div key={item.label}>
              <div className="font-['Sora'] text-[0.62rem] font-bold uppercase tracking-[0.07em] text-[#6b7280]">
                {item.label}
              </div>
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <Button variant="orange" size="full" onClick={handleSolicitar}>
        Solicitar este crédito
      </Button>
      <p className="mt-2 text-center text-[0.65rem] text-[#9ca3af]">
        Simulação ilustrativa. Condições sujeitas à análise de crédito.
      </p>
    </div>
  )
}
