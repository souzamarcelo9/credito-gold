import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

function calcStatus(dataVencimento?: Date | null): string {
  if (!dataVencimento) return "VALIDO"
  const diff = (dataVencimento.getTime() - new Date().getTime()) / (1000*60*60*24)
  if (diff < 0)   return "VENCIDO"
  if (diff <= 30) return "VENCENDO"
  return "VALIDO"
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body   = await req.json()
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const venc = body.dataVencimento ? new Date(body.dataVencimento) : null
    const doc  = await (prisma as any).documentoInterno.update({
      where: { id },
      data: {
        titulo:         body.titulo,
        categoria:      body.categoria,
        descricao:      body.descricao      ?? null,
        responsavel:    body.responsavel    ?? null,
        arquivoNome:    body.arquivoNome    ?? null,
        dataEmissao:    body.dataEmissao    ? new Date(body.dataEmissao) : null,
        dataVencimento: venc,
        status:         body.status === "ARQUIVADO" ? "ARQUIVADO" : calcStatus(venc),
      },
    })
    return ok(doc, "Documento atualizado!")
  } catch { return err("Erro ao atualizar", 500) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    await (prisma as any).documentoInterno.delete({ where: { id } })
    return ok(null, "Documento removido!")
  } catch { return err("Erro ao remover", 500) }
}
