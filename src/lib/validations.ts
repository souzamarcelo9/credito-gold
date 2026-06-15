import { z } from "zod"

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/

// ── Lead ──────────────────────────────────────────────────────────
export const createLeadSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  cpf: z.string().regex(cpfRegex, "CPF inválido (use 000.000.000-00)"),
  telefone: z.string().regex(phoneRegex, "Telefone inválido"),
  produto: z.enum(["pessoal", "garantia", "empresarial", "consignado", "fgts"]),
  valor: z.number().positive("Valor deve ser positivo"),
  parcelas: z.number().int().positive(),
  parcelaMensal: z.number().positive(),
  origem: z.enum(["organico", "afiliado", "whatsapp", "direto"]).optional(),
  afiliadoId: z.string().optional(),
})

// ── Afiliado ──────────────────────────────────────────────────────
export const createAfiliadoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().regex(cpfRegex, "CPF inválido"),
  telefone: z.string().regex(phoneRegex, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  codigoIndicacao: z.string().optional(),
})

// ── Simulação ─────────────────────────────────────────────────────
export const simulacaoSchema = z.object({
  produto: z.enum(["pessoal", "garantia", "empresarial", "consignado", "fgts"]),
  valor: z.number().positive(),
  parcelas: z.number().int().min(1).max(360),
})

// ── Auth ──────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export const cadastroSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  cpf: z.string().regex(cpfRegex),
  telefone: z.string().regex(phoneRegex),
})

export type CreateLeadInput    = z.infer<typeof createLeadSchema>
export type CreateAfiliadoInput = z.infer<typeof createAfiliadoSchema>
export type SimulacaoInput      = z.infer<typeof simulacaoSchema>
export type LoginInput          = z.infer<typeof loginSchema>
export type CadastroInput       = z.infer<typeof cadastroSchema>
