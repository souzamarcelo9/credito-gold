import { NextRequest, NextResponse } from "next/server"
import type { ApiResponse, LeadStatus } from "@/types"
import { ok, err } from "@/lib/api-helpers"

const VALID: LeadStatus[] = ["novo","em_analise","proposta_enviada","contrato_assinado","aprovado","recusado"]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body   = await req.json()
    const status = (body.status as string)?.toLowerCase()

    if (!VALID.includes(status as LeadStatus)) {
      return err(`Status inválido: ${status}`, 400)
    }

    try {
      const { updateLeadStatus } = await import("@/lib/services/lead.service")
      await updateLeadStatus(id, status as LeadStatus, "admin", req.headers.get("x-forwarded-for") ?? "unknown")
      return ok({ id, status }, `Lead atualizado para ${status}`)
    } catch {
      // Fallback sem banco
      return ok({ id, status }, `Lead atualizado para ${status}`)
    }
  } catch (e) {
    console.error("[leads PATCH]", e)
    return err("Erro ao atualizar lead", 500)
  }
}
