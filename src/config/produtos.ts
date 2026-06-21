import type { Produto } from "@/types"

export const PRODUTOS: Record<string, Produto> = {
  pessoal: {
    key: "pessoal",
    label: "Crédito Pessoal",
    taxa: 0.0289,
    valorMin: 500,
    valorMax: 50000,
    prazoMin: 6,
    prazoMax: 48,
  },
  garantia: {
    key: "garantia",
    label: "Com Garantia de Imóvel",
    taxa: 0.0089,
    valorMin: 10000,
    valorMax: 500000,
    prazoMin: 12,
    prazoMax: 120,
  },
  empresarial: {
    key: "empresarial",
    label: "Crédito Empresarial",
    taxa: 0.0149,
    valorMin: 5000,
    valorMax: 200000,
    prazoMin: 6,
    prazoMax: 60,
  },
  consignado: {
    key: "consignado",
    label: "Consignado",
    taxa: 0.0145,
    valorMin: 500,
    valorMax: 30000,
    prazoMin: 6,
    prazoMax: 84,
  },
  fgts: {
    key: "fgts",
    label: "Antecipação FGTS",
    taxa: 0.018,
    valorMin: 500,
    valorMax: 15000,
    prazoMin: 6,
    prazoMax: 24,
  },
  energia: {
    key: "energia",
    label: "Empréstimo na Conta de Luz",
    taxa: 0.0349,
    valorMin: 300,
    valorMax: 4000,
    prazoMin: 6,
    prazoMax: 24,
  },
}

export const COMISSOES: Record<string, number> = {
  pessoal:     100,
  garantia:    350,
  empresarial: 250,
  consignado:  120,
  fgts:        80,
  energia:     60,
}
