import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

/**
 * POST /api/admin/distribuir
 * Distribui todos os leads sem correspondente atribuído
 * entre os correspondentes ativos, de forma proporcional aleatória.
 *
 * Algoritmo: Fisher-Yates shuffle dos leads, depois
 * distribui em round-robin pelos correspondentes (garante
 * distribuição proporcional: |leads| / |correspondentes|).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const somenteNovos = body.somenteNovos !== false // default true

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    // Busca correspondentes ativos
    const correspondentes = await prisma.correspondente.findMany({
      where: { ativo: true },
      orderBy: { totalLeads: "asc" }, // começa pelos que têm menos
    })

    if (correspondentes.length === 0) {
      return err("Nenhum correspondente ativo cadastrado.", 400)
    }

    // Busca leads sem correspondente atribuído
    const leads = await prisma.lead.findMany({
      where: {
        correspondente: null,
        ...(somenteNovos ? { status: "NOVO" } : {}),
      },
      select: { id: true },
    })

    if (leads.length === 0) {
      return ok({ distribuidos: 0, msg: "Nenhum lead sem correspondente encontrado." })
    }

    // Fisher-Yates shuffle
    const shuffled = [...leads]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // Distribuição round-robin
    const distribuicao: Array<{ leadId: string; correspondenteId: string }> = []
    shuffled.forEach((lead, idx) => {
      const correspondente = correspondentes[idx % correspondentes.length]
      distribuicao.push({ leadId: lead.id, correspondenteId: correspondente.id })
    })

    // Salva no banco em transação
    const contagens: Record<string, number> = {}
    distribuicao.forEach(d => {
      contagens[d.correspondenteId] = (contagens[d.correspondenteId] ?? 0) + 1
    })

    await prisma.$transaction([
      // Cria os vínculos
      ...distribuicao.map(d =>
        prisma.leadCorrespondente.upsert({
          where:  { leadId: d.leadId },
          update: { correspondenteId: d.correspondenteId, distribuidoEm: new Date() },
          create: { leadId: d.leadId, correspondenteId: d.correspondenteId },
        })
      ),
      // Atualiza contadores dos correspondentes
      ...Object.entries(contagens).map(([id, count]) =>
        prisma.correspondente.update({
          where: { id },
          data:  { totalLeads: { increment: count } },
        })
      ),
    ])

    // Retorna resumo
    const resumo = correspondentes.map(c => ({
      nome:    c.nome,
      email:   c.email,
      recebeu: contagens[c.id] ?? 0,
    })).filter(r => r.recebeu > 0)

    return ok({
      distribuidos: leads.length,
      correspondentes: correspondentes.length,
      resumo,
    }, `${leads.length} leads distribuídos entre ${correspondentes.length} correspondentes.`)
  } catch (e) {
    console.error("[distribuir POST]", e)
    return err("Erro ao distribuir leads", 500)
  }
}

/**
 * GET /api/admin/distribuir
 * Retorna o estado atual da distribuição
 */
export async function GET() {
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return ok([])

    const distribuicao = await prisma.correspondente.findMany({
      where:   { ativo: true },
      orderBy: { nome: "asc" },
      include: {
        leads: {
          include: {
            lead: {
              select: {
                id: true, nome: true, produto: true,
                valor: true, status: true, createdAt: true,
              },
            },
          },
          orderBy: { distribuidoEm: "desc" },
          take: 10, // últimos 10 por correspondente
        },
        _count: { select: { leads: true } },
      },
    })

    return ok(distribuicao)
  } catch {
    return ok([])
  }
}
