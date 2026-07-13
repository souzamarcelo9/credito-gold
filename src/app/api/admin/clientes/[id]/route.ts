import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body   = await req.json()
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const cliente = await (prisma as any).clienteParceiro.update({
      where: { id },
      data: {
        razaoSocial:  body.razaoSocial,
        nomeFantasia: body.nomeFantasia  || null,
        cnpj:         body.cnpj,
        tipo:         body.tipo,
        segmento:     body.segmento      || null,
        responsavel:  body.responsavel,
        email:        body.email,
        telefone:     body.telefone,
        cidade:       body.cidade        || null,
        estado:       body.estado        || null,
        status:       body.status,
        observacoes:  body.observacoes   || null,
      },
    })
    return ok(cliente, "Cliente atualizado!")
  } catch { return err("Erro ao atualizar", 500) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    await (prisma as any).clienteParceiro.delete({ where: { id } })
    return ok(null, "Cliente removido!")
  } catch { return err("Erro ao remover", 500) }
}
