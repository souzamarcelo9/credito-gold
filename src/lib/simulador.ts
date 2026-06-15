import type { SimulacaoInput, SimulacaoResult } from "@/types"
import { PRODUTOS } from "@/config/produtos"

/**
 * Cálculo de parcela pelo sistema Price (juros compostos)
 * PMT = PV × [ i(1+i)^n / (1+i)^n − 1 ]
 */
export function calcularParcela(
  valor: number,
  parcelas: number,
  taxa: number
): number {
  if (taxa === 0) return valor / parcelas
  const fator = Math.pow(1 + taxa, parcelas)
  return valor * (taxa * fator) / (fator - 1)
}

/**
 * CET anual a partir da taxa mensal
 * CET = (1 + i)^12 − 1
 */
export function calcularCET(taxaMensal: number): number {
  return (Math.pow(1 + taxaMensal, 12) - 1) * 100
}

export function simular(input: SimulacaoInput): SimulacaoResult {
  const produto = PRODUTOS[input.produto]
  if (!produto) throw new Error(`Produto inválido: ${input.produto}`)

  const taxa     = produto.taxa
  const parcela  = calcularParcela(input.valor, input.parcelas, taxa)
  const total    = parcela * input.parcelas
  const juros    = total - input.valor

  return {
    parcela,
    taxa,
    cetAnual:   calcularCET(taxa),
    totalPagar: total,
    jurosTotal: juros,
  }
}
