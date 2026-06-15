/**
 * Helpers reutilizáveis para rotas de API
 * Aplica rate limiting, CSRF e audit log de forma padronizada
 */

import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, type RateLimitConfig } from "./rate-limit"
import { validateCsrfToken, extractCsrfToken } from "./csrf"
import { auditApiAction, extractIp, type AuditAction } from "./audit-log"
import type { ApiResponse } from "@/types"

// ── Rate limit ─────────────────────────────────────────────────────
export function withRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): NextResponse | null {
  const ip  = extractIp(req.headers)
  const key = `${identifier ?? req.nextUrl.pathname}:${ip}`
  const result = checkRateLimit(key, config)

  if (!result.success) {
    // Loga violação
    auditApiAction(req, "RATE_LIMIT_HIT", {
      success: false,
      details: { path: req.nextUrl.pathname, ip },
    })

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: `Muitas tentativas. Aguarde ${result.retryAfterSec} segundos.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After":        String(result.retryAfterSec),
          "X-RateLimit-Limit":  String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset":  String(Math.ceil(result.resetAt / 1000)),
        },
      }
    )
  }

  return null // Sem bloqueio
}

// ── CSRF ───────────────────────────────────────────────────────────
export function withCsrf(
  req: NextRequest,
  body?: Record<string, unknown>
): NextResponse | null {
  // Aplica apenas em mutations (POST, PUT, PATCH, DELETE)
  const safeMethods = ["GET", "HEAD", "OPTIONS"]
  if (safeMethods.includes(req.method)) return null

  // Rotas de API internas (chamadas server-side) ficam isentas
  const isServerCall = req.headers.get("x-internal-call") === process.env.INTERNAL_API_KEY
  if (isServerCall) return null

  const token = extractCsrfToken(req.headers, body)

  if (!token || !validateCsrfToken(token)) {
    auditApiAction(req, "CSRF_VIOLATION", {
      success: false,
      severity: "critical",
      details: { path: req.nextUrl.pathname, hasToken: !!token },
    })

    return NextResponse.json<ApiResponse>(
      { success: false, message: "Token de segurança inválido ou expirado." },
      { status: 403 }
    )
  }

  return null
}

// ── Sanitização de inputs ──────────────────────────────────────────
/**
 * Remove caracteres perigosos de strings
 * Previne XSS e injection básico
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return ""
  return value
    .trim()
    .replace(/[<>'"]/g, "")      // Remove caracteres HTML/JS
    .replace(/javascript:/gi, "") // Remove proto javascript:
    .slice(0, 500)                // Limita tamanho
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T
  for (const [key, value] of Object.entries(obj)) {
    result[key as keyof T] =
      typeof value === "string"
        ? sanitizeString(value) as T[keyof T]
        : value as T[keyof T]
  }
  return result
}

// ── Response helpers ───────────────────────────────────────────────
export function ok<T>(data: T, message?: string, status = 200): NextResponse {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data, message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma":        "no-cache",
      },
    }
  )
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json<ApiResponse>(
    { success: false, message },
    { status }
  )
}

export function validationErr(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json<ApiResponse>(
    { success: false, message: "Dados inválidos", errors },
    { status: 400 }
  )
}
