import { NextRequest } from "next/server"
import { createAfiliadoSchema } from "@/lib/validations"
import { withRateLimit, sanitizeObject, ok, err, validationErr } from "@/lib/api-helpers"
import { RATE_LIMITS } from "@/lib/rate-limit"
import { extractIp } from "@/lib/audit-log"
import { slugify } from "@/lib/utils"
import type { Afiliado } from "@/types"

// In-memory store (substituído pelo Prisma em produção quando o client estiver gerado)
const afiliadosStore: Afiliado[] = []

export async function POST(req: NextRequest) {
  const limited = withRateLimit(req, RATE_LIMITS.afiliados)
  if (limited) return limited

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return err("Body inválido", 400) }

  const sanitized = sanitizeObject(body)
  const parsed    = createAfiliadoSchema.safeParse(sanitized)
  if (!parsed.success) return validationErr(parsed.error.flatten().fieldErrors as Record<string, string[]>)

  try {
    // Tenta usar o serviço com Prisma
    const { createAfiliado } = await import("@/lib/services/afiliado.service")
    const result = await createAfiliado(parsed.data, extractIp(req.headers))
    return ok(result, "Afiliado cadastrado! Seu link foi gerado com sucesso.", 201)
  } catch (e: any) {
    if (e.message === "DUPLICATE_CPF") return err("CPF já cadastrado como afiliado.", 409)

    // Fallback in-memory se Prisma não estiver disponível
    const cpfLimpo = parsed.data.cpf.replace(/\D/g, "")
    const existe   = afiliadosStore.find(a => a.cpf.replace(/\D/g, "") === cpfLimpo)
    if (existe) return err("CPF já cadastrado como afiliado.", 409)

    const slug = slugify(parsed.data.nome) + Math.floor(Math.random() * 900 + 100)
    const afiliado: Afiliado = {
      id: crypto.randomUUID(), ...parsed.data, slug,
      status: "pendente", nivel: "bronze",
      totalCliques: 0, totalLeads: 0, totalAprovados: 0, totalComissoes: 0,
      createdAt: new Date(),
    }
    afiliadosStore.push(afiliado)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://creditogold.com.br"
    return ok({ afiliado: { ...afiliado, cpf: "[PROTEGIDO]" }, link: `${baseUrl}/ref/${slug}` }, "Afiliado cadastrado!", 201)
  }
}

export async function GET() {
  try {
    const { listAfiliados } = await import("@/lib/services/afiliado.service")
    const result = await listAfiliados()
    return ok(result)
  } catch {
    return ok({ data: afiliadosStore.map(a => ({ ...a, cpf: "[PROTEGIDO]" })), total: afiliadosStore.length })
  }
}
