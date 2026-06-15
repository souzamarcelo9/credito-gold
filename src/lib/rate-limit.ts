/**
 * Rate Limiting em memória (para desenvolvimento e MVP)
 *
 * Em produção com múltiplas instâncias no Cloud Run,
 * substituir por Redis/Upstash:
 *   import { Ratelimit } from "@upstash/ratelimit"
 *   import { Redis } from "@upstash/redis"
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store em memória — funciona em instância única
const store = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Janela de tempo em segundos */
  windowSec: number
  /** Máximo de requests na janela */
  maxRequests: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  retryAfterSec: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSec * 1000
  const key = identifier

  let entry = store.get(key)

  // Janela expirou ou não existe — reinicia
  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
      retryAfterSec: 0,
    }
  }

  // Dentro da janela
  entry.count++
  store.set(key, entry)

  const success   = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const retryAfterSec = success ? 0 : Math.ceil((entry.resetAt - now) / 1000)

  return { success, remaining, resetAt: entry.resetAt, retryAfterSec }
}

// Limites pré-definidos por rota
export const RATE_LIMITS = {
  // APIs públicas — mais restritivas
  leads:      { windowSec: 60,  maxRequests: 5  },  // 5 leads/min por IP
  afiliados:  { windowSec: 60,  maxRequests: 3  },  // 3 cadastros/min por IP
  simulador:  { windowSec: 60,  maxRequests: 30 },  // 30 simulações/min por IP
  // Auth — muito restritivo para evitar brute force
  login:      { windowSec: 300, maxRequests: 10 },  // 10 tentativas/5min por IP
  // APIs de admin — mais permissivas (usuário autenticado)
  admin:      { windowSec: 60,  maxRequests: 120 },
} as const
