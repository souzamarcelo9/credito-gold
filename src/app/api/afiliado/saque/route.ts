import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function POST(req: NextRequest) {
  try {
    const { afiliadoId, pixChave, pixTipo, valor } = await req.json()
    if (!afiliadoId) return err("Afiliado obrigatório", 400)
    if (!pixChave)   return err("Chave PIX obrigatória", 400)
    if (!valor || valor <= 0) return err("Valor inválido", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    // Verifica se afiliado tem saldo disponível
    const afiliado = await prisma.afiliado.findUnique({
      where: { id: afiliadoId },
    })
    if (!afiliado) return err("Afiliado não encontrado", 404)

    // Verifica comissões elegíveis (aprovadas há mais de 30 dias)
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    const comissoesElegiveis = await prisma.comissao.findMany({
      where: {
        afiliadoId,
        status:    "PENDENTE",
        createdAt: { lte: trintaDiasAtras },
        saqueId:   null,
      },
    })

    const totalElegivel = comissoesElegiveis.reduce((s, c) => s + c.valor, 0)
    if (valor > totalElegivel) {
      return err(`Valor solicitado (R$ ${valor}) superior ao disponível para saque (R$ ${totalElegivel.toFixed(2)})`, 400)
    }

    // Verifica se não tem saque pendente
    const saquePendente = await (prisma as any).saqueComissao.findFirst({
      where: { afiliadoId, status: { in: ["SOLICITADO", "APROVADO"] } },
    })
    if (saquePendente) return err("Você já tem um saque em andamento", 400)

    // Cria saque
    const saque = await (prisma as any).saqueComissao.create({
      data: {
        afiliadoId,
        valor,
        pixChave,
        pixTipo: pixTipo ?? "CPF",
        status: "SOLICITADO",
      },
    })

    // Vincula comissões ao saque
    const idsComissoes = comissoesElegiveis.map(c => c.id)
    await prisma.comissao.updateMany({
      where: { id: { in: idsComissoes } },
      data:  { saqueId: saque.id },
    })

    return ok(saque, "Saque solicitado com sucesso! Aguarde análise do administrador.", 201)
  } catch (e: any) {
    console.error("[saque POST]", e)
    return err("Erro ao solicitar saque", 500)
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const afiliadoId = searchParams.get("afiliadoId")
  if (!afiliadoId) return err("afiliadoId obrigatório", 400)

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const saques = await (prisma as any).saqueComissao.findMany({
      where:   { afiliadoId },
      orderBy: { solicitadoEm: "desc" },
    })

    // Calcula saldo disponível
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    const comissoesElegiveis = await prisma.comissao.findMany({
      where: {
        afiliadoId,
        status:    "PENDENTE",
        createdAt: { lte: trintaDiasAtras },
        saqueId:   null,
      },
    })

    const saldoDisponivel = comissoesElegiveis.reduce((s, c) => s + c.valor, 0)

    return ok({ saques, saldoDisponivel })
  } catch { return ok({ saques: [], saldoDisponivel: 0 }) }
}
