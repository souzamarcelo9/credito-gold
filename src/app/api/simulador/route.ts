import { NextRequest } from "next/server"
import { simulacaoSchema } from "@/lib/validations"
import { simular } from "@/lib/simulador"
import { withRateLimit, ok, err, validationErr } from "@/lib/api-helpers"
import { RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  // Rate limit — mais permissivo pois não persiste dados
  const limited = withRateLimit(req, RATE_LIMITS.simulador)
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("Body inválido", 400)
  }

  const parsed = simulacaoSchema.safeParse(body)
  if (!parsed.success) {
    return validationErr(parsed.error.flatten().fieldErrors as Record<string, string[]>)
  }

  try {
    const resultado = simular(parsed.data)
    return ok(resultado)
  } catch (e) {
    return err("Erro ao processar simulação", 500)
  }
}
