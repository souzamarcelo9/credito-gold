import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

// Helper Supabase REST
async function sb(path: string, opts: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = (process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "apikey": key, "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json", "Prefer": "return=representation",
      ...(opts.headers ?? {}),
    },
  })
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

/**
 * POST /api/admin/distribuir
 * Fisher-Yates shuffle + Round-Robin proporcional
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const somenteNovos = body.somenteNovos !== false

    // 1. Busca correspondentes ativos
    const corrRes = await sb("correspondentes?ativo=eq.true&order=nome.asc&select=id,nome,email,peso")
    if (!corrRes.ok || !Array.isArray(corrRes.data) || corrRes.data.length === 0) {
      return err("Nenhum correspondente ativo cadastrado.", 400)
    }
    const correspondentes = corrRes.data

    // 2. Busca leads sem correspondente
    // Primeiro pega IDs de leads já distribuídos
    const distRes = await sb("leads_correspondentes?select=leadId")
    const idsDistribuidos = Array.isArray(distRes.data)
      ? distRes.data.map((r: any) => r.leadId)
      : []

    // Monta filtro de leads
    let leadsQuery = "leads?select=id"
    if (somenteNovos) leadsQuery += "&status=eq.NOVO"
    if (idsDistribuidos.length > 0) {
      leadsQuery += `&id=not.in.(${idsDistribuidos.map((id: string) => `"${id}"`).join(",")})`
    }

    const leadsRes = await sb(leadsQuery)
    if (!leadsRes.ok || !Array.isArray(leadsRes.data) || leadsRes.data.length === 0) {
      return ok({ distribuidos: 0, msg: "Nenhum lead sem correspondente encontrado." })
    }
    const leads = leadsRes.data

    // 3. Fisher-Yates shuffle
    const shuffled = [...leads]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // 4. Round-Robin proporcional pelo peso
    const distribuicao: Array<{ leadId: string; correspondenteId: string }> = []
    const contagens: Record<string, number> = {}

    // Expande lista por peso (ex: peso 2 = aparece 2x)
    const pool: string[] = []
    correspondentes.forEach((c: any) => {
      for (let w = 0; w < (c.peso ?? 1); w++) pool.push(c.id)
    })

    shuffled.forEach((lead, idx) => {
      const correspondenteId = pool[idx % pool.length]
      distribuicao.push({ leadId: lead.id, correspondenteId })
      contagens[correspondenteId] = (contagens[correspondenteId] ?? 0) + 1
    })

    // 5. Salva vínculos em lote
    const agora = new Date().toISOString()
    const registros = distribuicao.map(d => ({
      id:               crypto.randomUUID(),
      leadId:           d.leadId,
      correspondenteId: d.correspondenteId,
      atribuidoEm:      agora,
    }))

    // Upsert em lote — insere novos, ignora duplicatas pelo leadId
    const insertRes = await sb("leads_correspondentes", {
      method:  "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body:    JSON.stringify(registros),
    })

    if (!insertRes.ok) {
      console.error("[distribuir] Erro ao inserir vínculos:", insertRes.data)
      return err("Erro ao salvar distribuição no banco", 500)
    }

    // 6. Resumo por correspondente
    const resumo = correspondentes.map((c: any) => ({
      nome:    c.nome,
      email:   c.email,
      recebeu: contagens[c.id] ?? 0,
    })).filter((r: any) => r.recebeu > 0)

    return ok({
      distribuidos:    leads.length,
      correspondentes: correspondentes.length,
      resumo,
    }, `${leads.length} leads distribuídos entre ${correspondentes.length} correspondentes.`)

  } catch (e: any) {
    console.error("[distribuir POST]", e.message)
    return err("Erro ao distribuir leads", 500)
  }
}

/**
 * GET /api/admin/distribuir
 * Retorna estado atual da distribuição por correspondente
 */
export async function GET() {
  try {
    // Busca correspondentes ativos
    const corrRes = await sb("correspondentes?ativo=eq.true&order=nome.asc&select=id,nome,email,ativo")
    if (!corrRes.ok) return ok([])
    const correspondentes = Array.isArray(corrRes.data) ? corrRes.data : []

    // Para cada correspondente, busca seus leads
    const resultado = await Promise.all(
      correspondentes.map(async (c: any) => {
        const leadsRes = await sb(
          `leads_correspondentes?correspondenteId=eq.${c.id}` +
          `&select=leadId,atribuidoEm,leads(id,nome,produto,valor,status,createdAt)` +
          `&order=atribuidoEm.desc&limit=10`
        )
        const leadsData = Array.isArray(leadsRes.data) ? leadsRes.data : []
        return {
          ...c,
          leads: leadsData,
          _count: { leads: leadsData.length },
        }
      })
    )

    return ok(resultado)
  } catch (e: any) {
    console.error("[distribuir GET]", e.message)
    return ok([])
  }
}
