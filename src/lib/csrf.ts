import { createHmac, randomBytes, timingSafeEqual } from "crypto"

const CSRF_SECRET = process.env.NEXTAUTH_SECRET ?? "dev-csrf-secret"
const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hora

/**
 * Gera um token CSRF assinado com HMAC-SHA256
 * Formato: timestamp.nonce.signature
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString()
  const nonce     = randomBytes(16).toString("hex")
  const payload   = `${timestamp}.${nonce}`
  const sig       = createHmac("sha256", CSRF_SECRET).update(payload).digest("hex")
  return `${payload}.${sig}`
}

/**
 * Valida um token CSRF
 * Verifica assinatura e validade temporal
 */
export function validateCsrfToken(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false

    const [timestamp, nonce, signature] = parts
    const payload   = `${timestamp}.${nonce}`
    const expected  = createHmac("sha256", CSRF_SECRET).update(payload).digest("hex")

    // Compara em tempo constante (previne timing attacks)
    const sigBuffer = Buffer.from(signature, "hex")
    const expBuffer = Buffer.from(expected,   "hex")
    if (sigBuffer.length !== expBuffer.length) return false
    if (!timingSafeEqual(sigBuffer, expBuffer)) return false

    // Verifica expiração
    const age = Date.now() - parseInt(timestamp, 10)
    return age <= TOKEN_TTL_MS
  } catch {
    return false
  }
}

/**
 * Extrai o token do header ou body da request
 * Ordem de verificação: header X-CSRF-Token > body._csrf
 */
export function extractCsrfToken(
  headers: Headers,
  body?: Record<string, unknown>
): string | null {
  return (
    headers.get("x-csrf-token") ??
    (body?._csrf as string | undefined) ??
    null
  )
}
