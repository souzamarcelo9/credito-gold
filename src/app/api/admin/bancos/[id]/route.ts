import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    const banco = await prisma.bancoPromotora.findUnique({
      where: { id },
      include: { produtos: true },
    })
    if (!banco) return err("Não encontrado", 404)
    return ok(banco)
  } catch { return err("Erro", 500) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id }              = await params
    const { nome, tipo, ativo, produtos } = await req.json()
    const prisma              = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    // Atualiza banco
    await prisma.bancoPromotora.update({
      where: { id },
      data: {
        ...(nome  !== undefined && { nome }),
        ...(tipo  !== undefined && { tipo }),
        ...(ativo !== undefined && { ativo }),
      },
    })

    // Upsert produtos se fornecidos
    if (produtos?.length) {
      await prisma.$transaction(
        produtos.map((p: any) =>
          prisma.produtoBanco.upsert({
            where:  { bancoId_produto: { bancoId: id, produto: p.produto } },
            update: {
              comissaoCG:               parseFloat(p.comissaoCG)               || 0,
              percentualAfiliado:       parseFloat(p.percentualAfiliado)       || 0,
              percentualCorrespondente: parseFloat(p.percentualCorrespondente) || 0,
              ativo:                    p.ativo ?? true,
            },
            create: {
              bancoId:                  id,
              produto:                  p.produto,
              comissaoCG:               parseFloat(p.comissaoCG)               || 0,
              percentualAfiliado:       parseFloat(p.percentualAfiliado)       || 0,
              percentualCorrespondente: parseFloat(p.percentualCorrespondente) || 0,
            },
          })
        )
      )
    }

    const updated = await prisma.bancoPromotora.findUnique({
      where: { id }, include: { produtos: true },
    })
    return ok(updated, "Atualizado com sucesso!")
  } catch (e) {
    console.error("[bancos PATCH]", e)
    return err("Erro ao atualizar", 500)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    await prisma.bancoPromotora.delete({ where: { id } })
    return ok(null, "Removido com sucesso!")
  } catch { return err("Erro ao remover", 500) }
}
