import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() // array de IDs de saques
    if (!ids?.length) return err("Nenhum saque selecionado", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const { enviarPixAfiliado } = await import("@/lib/services/asaas.service")

    const resultados: any[] = []

    for (const id of ids) {
      const saque = await (prisma as any).saqueComissao.findUnique({
        where:   { id },
        include: { afiliado: { select: { nome: true } } },
      })

      if (!saque) {
        resultados.push({ id, status: "erro", motivo: "Não encontrado" })
        continue
      }

      if (saque.status !== "APROVADO") {
        resultados.push({ id, status: "pulado", motivo: "Não está aprovado" })
        continue
      }

      try {
        const pix = await enviarPixAfiliado({
          valor:    saque.valor,
          pixChave: saque.pixChave,
          pixTipo:  saque.pixTipo,
          descricao:`Comissão Crédito Gold — ${saque.afiliado?.nome ?? saque.afiliadoId}`,
          saqueId:  saque.id,
        })

        await (prisma as any).saqueComissao.update({
          where: { id },
          data: {
            status:  "PAGO",
            asaasId: pix.id,
            pagoEm:  new Date(),
          },
        })

        resultados.push({ id, status: "pago", asaasId: pix.id, valor: pix.value })
        console.log(`[saques] PIX enviado: ${id} → ${pix.id}`)
      } catch (e: any) {
        await (prisma as any).saqueComissao.update({
          where: { id },
          data:  { status: "PENDENTE", observacao: e.message },
        })
        resultados.push({ id, status: "erro", motivo: e.message })
        console.error(`[saques] Erro PIX ${id}:`, e.message)
      }
    }

    const pagos    = resultados.filter(r => r.status === "pago").length
    const erros    = resultados.filter(r => r.status === "erro").length
    const pulados  = resultados.filter(r => r.status === "pulado").length

    return ok({ resultados, pagos, erros, pulados },
      `${pagos} pago${pagos !== 1 ? "s" : ""}, ${erros} erro${erros !== 1 ? "s" : ""}, ${pulados} pulado${pulados !== 1 ? "s" : ""}`)
  } catch (e: any) {
    console.error("[saques/pagar]", e)
    return err("Erro ao processar pagamentos", 500)
  }
}
