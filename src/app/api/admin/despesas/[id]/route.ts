import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }  = await params
    const body    = await req.json()
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const isParceled   = body.parcelado && body.totalParcelas > 1
    const nParcelas    = isParceled ? parseInt(body.totalParcelas) : 1
    const valorParcela = isParceled ? parseFloat(body.valor) / nParcelas : null

    const despesa = await (prisma as any).despesa.update({
      where: { id },
      data: {
        descricao:           body.descricao,
        categoria:           body.categoria,
        valor:               parseFloat(body.valor),
        parcelado:           isParceled,
        totalParcelas:       nParcelas,
        parcelaAtual:        body.parcelaAtual    ? parseInt(body.parcelaAtual)    : 1,
        valorParcela:        valorParcela,
        formaPagamento:      body.formaPagamento  ?? "À vista",
        dataPrimeiraParcela: body.dataPrimeiraParcela ? new Date(body.dataPrimeiraParcela) : null,
        observacao:          body.observacao      ?? null,
        data:                body.data            ? new Date(body.data) : undefined,
      },
    })
    return ok(despesa, "Despesa atualizada!")
  } catch { return err("Erro ao atualizar", 500) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    await (prisma as any).despesa.delete({ where: { id } })
    return ok(null, "Despesa removida!")
  } catch { return err("Erro ao remover", 500) }
}
