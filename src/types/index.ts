// ── Produtos de crédito ──────────────────────────────────────────
export type ProdutoKey = "pessoal" | "garantia" | "empresarial" | "consignado" | "fgts"

export interface Produto {
  key: ProdutoKey
  label: string
  taxa: number          // taxa mensal decimal
  valorMin: number
  valorMax: number
  prazoMin: number
  prazoMax: number
}

// ── Simulação ────────────────────────────────────────────────────
export interface SimulacaoInput {
  produto: ProdutoKey
  valor: number
  parcelas: number
}

export interface SimulacaoResult {
  parcela: number
  taxa: number
  cetAnual: number
  totalPagar: number
  jurosTotal: number
}

// ── Lead ─────────────────────────────────────────────────────────
export type LeadStatus =
  | "novo"
  | "em_analise"
  | "proposta_enviada"
  | "contrato_assinado"
  | "aprovado"
  | "recusado"

export interface Lead {
  id: string
  nome: string
  email: string
  cpf: string
  telefone: string
  produto: ProdutoKey
  valor: number
  parcelas: number
  parcelaMensal: number
  status: LeadStatus
  origem: "organico" | "afiliado" | "whatsapp" | "direto"
  afiliadoId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateLeadDTO {
  nome: string
  email: string
  cpf: string
  telefone: string
  produto: ProdutoKey
  valor: number
  parcelas: number
  parcelaMensal: number
  origem?: Lead["origem"]
  afiliadoId?: string
}

// ── Afiliado ──────────────────────────────────────────────────────
export type AfiliadoStatus = "ativo" | "inativo" | "pendente"
export type AfiliadoNivel  = "bronze" | "prata" | "gold" | "diamante"

export interface Afiliado {
  id: string
  nome: string
  cpf: string
  email?: string
  telefone: string
  slug: string
  status: AfiliadoStatus
  nivel: AfiliadoNivel
  codigoIndicacao?: string
  totalCliques: number
  totalLeads: number
  totalAprovados: number
  totalComissoes: number
  createdAt: Date
}

export interface CreateAfiliadoDTO {
  nome: string
  cpf: string
  telefone: string
  email?: string
  codigoIndicacao?: string
}

// ── Usuário / Auth ────────────────────────────────────────────────
export type UserRole = "admin" | "financeiro" | "afiliado" | "cliente"

export interface User {
  id: string
  nome: string
  email: string
  role: UserRole
  afiliadoId?: string
  createdAt: Date
}

// ── API Response ──────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}
