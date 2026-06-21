/**
 * Middleware global Next.js
 *
 * Executado em TODA requisição antes do handler.
 * Responsável por:
 * 1. Rate limiting por IP
 * 2. Proteção de rotas autenticadas
 * 3. Headers de segurança adicionais
 * 4. Logging de acesso a rotas sensíveis
 */

import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { extractIp } from "@/lib/audit-log"

// Rotas que exigem autenticação
const PROTECTED_ROUTES = [
  "/admin",
  "/financeiro",
  "/afiliados/painel",
  "/api/admin",
]

// Rotas com rate limit específico
const RATE_LIMITED_ROUTES: Record<string, keyof typeof RATE_LIMITS> = {
  "/api/leads":     "leads",
  "/api/afiliados": "afiliados",
  "/api/simulador": "simulador",
  "/api/auth":      "login",
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = extractIp(req.headers)

  // ── 1. Rate limiting ─────────────────────────────────────────────
  const rateLimitKey = Object.keys(RATE_LIMITED_ROUTES).find(route =>
    pathname.startsWith(route)
  )

  if (rateLimitKey) {
    const limitConfig = RATE_LIMITS[RATE_LIMITED_ROUTES[rateLimitKey]]
    const result = checkRateLimit(`${rateLimitKey}:${ip}`, limitConfig)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Muitas tentativas. Aguarde ${result.retryAfterSec} segundos.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After":           String(result.retryAfterSec),
            "X-RateLimit-Limit":     String(limitConfig.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset":     String(Math.ceil(result.resetAt / 1000)),
            "Content-Type":          "application/json",
          },
        }
      )
    }
  }

  // ── 2. Proteção de rotas autenticadas ────────────────────────────
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  if (isProtected) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
    })

    if (!token) {
      // API: retorna 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Não autenticado" },
          { status: 401 }
        )
      }
      // Página: redireciona para login
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificação de role para rotas financeiras
    const role = String(token.role ?? "").toUpperCase()
    if (pathname.startsWith("/financeiro") && role !== "ADMIN" && role !== "FINANCEIRO") {
      return NextResponse.json(
        { success: false, message: "Acesso negado" },
        { status: 403 }
      )
    }
  }

  // ── 3. Headers de segurança adicionais ───────────────────────────
  const response = NextResponse.next()

  // Impede cache de dados sensíveis
  if (pathname.startsWith("/api/") || isProtected) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
    response.headers.set("Pragma",        "no-cache")
    response.headers.set("Expires",       "0")
  }

  // Adiciona Request ID para rastreamento de logs
  const requestId = crypto.randomUUID()
  response.headers.set("X-Request-Id", requestId)

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}
