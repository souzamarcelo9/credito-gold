import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mes      = searchParams.get("mes")
  const cat      = searchParams.get("categoria")
  const preview  = searchParams.get("preview") // "true" = próximos 3 meses

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const where: any = {}
    if (cat) where.categoria = cat

    if (preview === "true") {
      // Previsão: próximos 3 meses
      const hoje  = new Date()
      const fim   = new Date(hoje.getFullYear(), hoje.getMonth() + 4, 0)
      where.data  = { gte: hoje, lte: fim }
    } else if (mes) {
      const [year, month] = mes.split("-").map(Number)
      where.data = {
        gte: new Date(year, month - 1, 1),
        lt:  new Date(year, month, 1),
      }
    }

    const despesas = await (prisma as any).despesa.findMany({
      where,
      orderBy: { data: "asc" },
    })

    // Agrupa por despesaPaiId para visualização
    const total = despesas.reduce((s: number, d: any) => s + (d.valorParcela ?? d.valor), 0)

    return ok({ despesas, total })
  } catch (e: any) {
    console.error("[despesas GET]", e.message)
    return ok({ despesas: [], total: 0 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      descricao, categoria, valor, data,
      parcelado, totalParcelas, formaPagamento,
      dataPrimeiraParcela, observacao,
    } = body

    if (!descricao?.trim())   return err("Descrição obrigatória", 400)
    if (!valor || valor <= 0) return err("Valor inválido", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const isParceled   = parcelado && parseInt(totalParcelas) > 1
    const nParcelas    = isParceled ? parseInt(totalParcelas) : 1
    const valorTotal   = parseFloat(valor)
    const valorParcela = isParceled
      ? parseFloat((valorTotal / nParcelas).toFixed(2))
      : valorTotal

    // Data base: dataPrimeiraParcela ou data ou hoje
    const dataBase = dataPrimeiraParcela
      ? new Date(dataPrimeiraParcela + "T12:00:00")
      : data
      ? new Date(data + "T12:00:00")
      : new Date()

    if (isParceled) {
      // Gera um registro por parcela com data de vencimento correta
      const registros = []
      for (let i = 0; i < nParcelas; i++) {
        const dataParcela = new Date(dataBase)
        dataParcela.setMonth(dataBase.getMonth() + i)

        // Ajuste de dia: se dia 31 em mês com 30 dias, vai para o último dia
        if (dataParcela.getDate() !== dataBase.getDate()) {
          dataParcela.setDate(0) // último dia do mês anterior
        }

        registros.push({
          descricao:           `${descricao.trim()} (${i + 1}/${nParcelas})`,
          categoria:           categoria        ?? "OPERACIONAL",
          valor:               valorTotal,       // valor total do contrato
          parcelado:           true,
          totalParcelas:       nParcelas,
          parcelaAtual:        i + 1,
          valorParcela,                          // valor desta parcela
          formaPagamento:      formaPagamento    ?? "Parcelado",
          dataPrimeiraParcela: dataBase,
          observacao:          observacao        ?? null,
          data:                dataParcela,      // data de vencimento desta parcela
          updatedAt:           new Date(),
        })
      }

      // Cria todos os registros em transação
      const criados = await prisma.$transaction(
        registros.map((r: any) => (prisma as any).despesa.create({ data: r }))
      )

      return ok(
        { parcelas: criados.length, valorParcela, valorTotal },
        `${nParcelas} parcelas lançadas com sucesso!`,
        201
      )
    } else {
      // À vista — cria 1 registro normal
      const despesa = await (prisma as any).despesa.create({
        data: {
          descricao:      descricao.trim(),
          categoria:      categoria       ?? "OPERACIONAL",
          valor:          valorTotal,
          parcelado:      false,
          totalParcelas:  1,
          parcelaAtual:   1,
          valorParcela:   null,
          formaPagamento: formaPagamento  ?? "À vista",
          observacao:     observacao      ?? null,
          data:           dataBase,
          updatedAt:      new Date(),
        },
      })
      return ok(despesa, "Despesa cadastrada!", 201)
    }
  } catch (e: any) {
    console.error("[despesas POST]", e.message)
    return err("Erro ao cadastrar despesa", 500)
  }
}
