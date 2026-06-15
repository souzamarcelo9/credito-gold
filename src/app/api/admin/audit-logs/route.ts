/**
 * GET /api/admin/audit-logs
 * Endpoint protegido — apenas admin
 * Para conformidade LGPD e auditoria bancária
 */
import { NextRequest } from "next/server"
import { getAuditLogs, type AuditAction, type AuditSeverity } from "@/lib/audit-log"
import { ok } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  // Middleware já garante autenticação para /api/admin/*
  const { searchParams } = new URL(req.url)

  const filters = {
    action:   searchParams.get("action")   as AuditAction | undefined,
    userId:   searchParams.get("userId")   ?? undefined,
    targetId: searchParams.get("targetId") ?? undefined,
    severity: searchParams.get("severity") as AuditSeverity | undefined,
    from:     searchParams.get("from")   ? new Date(searchParams.get("from")!)   : undefined,
    to:       searchParams.get("to")     ? new Date(searchParams.get("to")!)     : undefined,
    limit:    searchParams.get("limit")  ? parseInt(searchParams.get("limit")!)  : 50,
  }

  const logs = getAuditLogs(filters)

  return ok({ logs, total: logs.length })
}
