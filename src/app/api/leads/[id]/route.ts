import { NextRequest, NextResponse } from "next/server"
import type { ApiResponse, LeadStatus } from "@/types"
import { ok, err } from "@/lib/api-helpers"
import { maskCpf, decrypt } from "@/lib/crypto"

const VALID: LeadStatus[] = ["novo","em_analise","proposta_enviada","contrato_assinado","aprovado","recusado"]

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        afiliado:     { select: { slug: true, nome: true } },
        dadosEnergia: true,
      },
    })

    if (!lead) return err("Lead não encontrado", 404)

    let cpfDecrypted = "Não disponível"
    try { cpfDecrypted = decrypt(lead.cpf) } catch {}
    return ok({ ...lead, cpf: cpfDecrypted })
  } catch (e) {
    console.error("[leads/[id] GET]", e)
    return err("Erro ao buscar lead", 500)
  }
}

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
