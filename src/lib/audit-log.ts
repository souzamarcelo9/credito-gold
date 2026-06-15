/**
 * Sistema de Audit Log — conformidade LGPD + auditoria bancária
 *
 * Registra TODAS as operações sensíveis:
 * - Criação, leitura, alteração e exclusão de dados pessoais
 * - Tentativas de login (sucesso e falha)
 * - Alterações de status de leads e contratos
 * - Acesso a documentos
 * - Ações administrativas
 *
 * Em produção: salvar no banco via Prisma + Cloud Logging (imutável)
 * Retenção mínima: 5 anos (exigência Bacen/LGPD)
 */

import { v4 as uuidv4 } from "uuid"

// ── Tipos ──────────────────────────────────────────────────────────
export type AuditAction =
  // Dados pessoais (LGPD crítico)
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_DELETED"
  | "LEAD_EXPORTED"
  | "AFILIADO_CREATED"
  | "AFILIADO_UPDATED"
  | "AFILIADO_DELETED"
  | "USER_DATA_ACCESSED"
  | "USER_DATA_EXPORTED"       // Portabilidade LGPD
  | "USER_DATA_ANONYMIZED"     // Direito ao esquecimento LGPD
  // Auth
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_BLOCKED"            // Rate limit atingido
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  // Documentos
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_ACCESSED"
  | "DOCUMENT_DELETED"
  // Admin
  | "ADMIN_ACTION"
  | "COMMISSION_PAID"
  | "REPORT_GENERATED"
  // Sistema
  | "RATE_LIMIT_HIT"
  | "CSRF_VIOLATION"
  | "UNAUTHORIZED_ACCESS"

export type AuditSeverity = "info" | "warning" | "critical"

export interface AuditLogEntry {
  id:          string
  timestamp:   Date
  action:      AuditAction
  severity:    AuditSeverity
  userId?:     string          // Quem executou (null = anônimo)
  userEmail?:  string
  userRole?:   string
  targetId?:   string          // ID do recurso afetado
  targetType?: string          // "lead" | "afiliado" | "user" | "document"
  ipAddress:   string
  userAgent?:  string
  details?:    Record<string, unknown>  // Contexto adicional (SEM dados sensíveis)
  success:     boolean
  errorMsg?:   string
}

// ── Severidade por ação ────────────────────────────────────────────
const ACTION_SEVERITY: Partial<Record<AuditAction, AuditSeverity>> = {
  LOGIN_FAILED:         "warning",
  LOGIN_BLOCKED:        "critical",
  CSRF_VIOLATION:       "critical",
  UNAUTHORIZED_ACCESS:  "critical",
  USER_DATA_ANONYMIZED: "warning",
  DOCUMENT_DELETED:     "warning",
  COMMISSION_PAID:      "warning",
  MFA_DISABLED:         "warning",
}

// ── Store em memória (substituir por Prisma em produção) ───────────
const auditStore: AuditLogEntry[] = []

// ── Função principal ───────────────────────────────────────────────
export async function createAuditLog(
  params: Omit<AuditLogEntry, "id" | "timestamp" | "severity"> & { severity?: AuditSeverity }
): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id:        uuidv4(),
    timestamp: new Date(),
    severity:  params.severity ?? ACTION_SEVERITY[params.action] ?? "info",
    ...params,
    // Garante que dados sensíveis não entrem nos detalhes
    details:   sanitizeDetails(params.details),
  }

  // Salva em memória (DEV)
  auditStore.push(entry)

  // TODO em produção:
  // await prisma.auditLog.create({ data: entry })
  // await googleCloudLogging.write(entry)  // Log imutável

  // Log crítico: alerta imediato
  if (entry.severity === "critical") {
    console.error(`[AUDIT CRITICAL] ${entry.action}`, {
      id: entry.id,
      ip: entry.ipAddress,
      userId: entry.userId,
      details: entry.details,
    })
    // TODO: await sendSecurityAlert(entry)
  }

  return entry
}

// ── Consultas ──────────────────────────────────────────────────────
export function getAuditLogs(filters?: {
  action?:    AuditAction
  userId?:    string
  targetId?:  string
  severity?:  AuditSeverity
  from?:      Date
  to?:        Date
  limit?:     number
}): AuditLogEntry[] {
  let logs = [...auditStore]

  if (filters?.action)   logs = logs.filter(l => l.action   === filters.action)
  if (filters?.userId)   logs = logs.filter(l => l.userId   === filters.userId)
  if (filters?.targetId) logs = logs.filter(l => l.targetId === filters.targetId)
  if (filters?.severity) logs = logs.filter(l => l.severity === filters.severity)
  if (filters?.from)     logs = logs.filter(l => l.timestamp >= filters.from!)
  if (filters?.to)       logs = logs.filter(l => l.timestamp <= filters.to!)

  return logs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, filters?.limit ?? 100)
}

// ── Helpers ────────────────────────────────────────────────────────
/**
 * Remove campos sensíveis dos detalhes antes de logar
 * NUNCA logar: CPF, senha, token, número de conta
 */
function sanitizeDetails(
  details?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!details) return undefined

  const SENSITIVE_KEYS = [
    "password", "senha", "cpf", "token", "secret",
    "card", "account", "conta", "pix", "chave",
  ]

  const sanitized = { ...details }
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]"
    }
  }
  return sanitized
}

/**
 * Extrai IP real considerando proxies e Cloud Run
 */
export function extractIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??  // Cloudflare
    "unknown"
  )
}

/**
 * Helper para rotas de API — já extrai IP e user-agent
 */
export async function auditApiAction(
  req: Request,
  action: AuditAction,
  params: Partial<Omit<AuditLogEntry, "id" | "timestamp" | "action" | "ipAddress">>
): Promise<AuditLogEntry> {
  return createAuditLog({
    action,
    ipAddress: extractIp(req.headers),
    userAgent: req.headers.get("user-agent") ?? undefined,
    success:   true,
    ...params,
  })
}
