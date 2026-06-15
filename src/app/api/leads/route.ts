import { NextRequest } from "next/server"
import { createLeadSchema } from "@/lib/validations"
import { withRateLimit, sanitizeObject, ok, err, validationErr } from "@/lib/api-helpers"
import { RATE_LIMITS } from "@/lib/rate-limit"
import { extractIp } from "@/lib/audit-log"
import type { Lead } from "@/types"

const leadsStore: Lead[] = []

export async function POST(req: NextRequest) {
  const limited = withRateLimit(req, RATE_LIMITS.leads)
  if (limited) return limited

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return err("Body inválido", 400) }

  const sanitized = sanitizeObject(body)

  // Resolve afiliadoSlug → afiliadoId antes de validar
  if (sanitized.afiliadoSlug && !sanitized.afiliadoId) {
    try {
      const prisma = (await import("@/lib/prisma")).default
      if (prisma) {
        const afiliado = await prisma.afiliado.findUnique({
          where: { slug: sanitized.afiliadoSlug as string },
          select: { id: true },
        })
        if (afiliado) {
          sanitized.afiliadoId = afiliado.id
          sanitized.origem     = "afiliado"
        }
      }
    } catch { /* silencioso */ }
  }
  delete sanitized.afiliadoSlug

  const parsed = createLeadSchema.safeParse(sanitized)
  if (!parsed.success) return validationErr(parsed.error.flatten().fieldErrors as Record<string, string[]>)

  try {
    const { createLead } = await import("@/lib/services/lead.service")
    const lead = await createLead(parsed.data, extractIp(req.headers))
    return ok(lead, "Solicitação recebida! Entraremos em contato em breve.", 201)
  } catch (e: any) {
    if (e.message === "DUPLICATE_LEAD") return err("Já existe uma solicitação recente para este CPF.", 409)

    // Fallback in-memory
    const lead: Lead = {
      id: crypto.randomUUID(), ...parsed.data,
      origem: parsed.data.origem ?? "organico",
      status: "novo", createdAt: new Date(), updatedAt: new Date(),
    }
    leadsStore.push(lead)
    const { cpf: leadCpf, ...leadSemCpf } = lead
    return ok({ ...leadSemCpf, cpf: `***.***.${leadCpf.slice(-6)}` }, "Solicitação recebida!", 201)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  try {
    const { listLeads } = await import("@/lib/services/lead.service")
    const result = await listLeads({
      status:     searchParams.get("status")     ?? undefined,
      afiliadoId: searchParams.get("afiliadoId") ?? undefined,
      page:       parseInt(searchParams.get("page")  ?? "1"),
      limit:      parseInt(searchParams.get("limit") ?? "20"),
    })
    return ok(result)
  } catch {
    return ok({ data: leadsStore.map(l => ({ ...l, cpf: "***" })), total: leadsStore.length, page:1, totalPages:1 })
  }
}
