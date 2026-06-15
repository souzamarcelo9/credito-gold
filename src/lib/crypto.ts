/**
 * Utilitários de criptografia para dados sensíveis (LGPD)
 * CPF é criptografado antes de salvar e descriptografado só quando necessário
 */
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? "dev-key-32-chars-change-in-prod!!"
const ALGORITHM      = "aes-256-cbc"

// Garante que a chave tem exatamente 32 bytes
function getKey(): Buffer {
  return Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32))
}

/**
 * Criptografa um valor (ex: CPF)
 * Retorna: iv:dados (base64)
 */
export function encrypt(value: string): string {
  const iv         = randomBytes(16)
  const cipher     = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted  = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return `${iv.toString("base64")}:${encrypted.toString("base64")}`
}

/**
 * Descriptografa um valor
 */
export function decrypt(encrypted: string): string {
  const [ivBase64, dataBase64] = encrypted.split(":")
  const iv         = Buffer.from(ivBase64,   "base64")
  const data       = Buffer.from(dataBase64, "base64")
  const decipher   = createDecipheriv(ALGORITHM, getKey(), iv)
  const decrypted  = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString("utf8")
}

/**
 * Hash SHA-256 do CPF (sem máscara) para buscas e deduplicação
 * Nunca é reversível — só serve para comparação
 */
export function hashCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "")
  return createHash("sha256")
    .update(clean + (process.env.CPF_HASH_SALT ?? "credito-gold-salt"))
    .digest("hex")
}

/**
 * Mascara CPF para exibição
 * Ex: "123.456.789-09" → "***.456.789-**"
 */
export function maskCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "")
  if (clean.length !== 11) return "***.***.***-**"
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`
}
