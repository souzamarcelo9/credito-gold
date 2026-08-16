import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

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

export async function POST(req: NextRequest) {
  try {
    const body         = await req.json().catch(() => ({}))
    const somenteNovos = body.somenteNovos !== false

    // 1. Correspondentes ativos
    const corrRes = await sb("correspondentes?ativo=eq.true&order=nome.asc&select=id,nome,email,peso")
    if (!corrRes.ok || !Array.isArray(corrRes.data) || corrRes.data.length === 0)
      return err("Nenhum correspondente ativo cadastrado.", 400)
    const correspondentes = corrRes.data

    // 2. Leads sem correspondente
    const distRes     = await sb("leads_correspondentes?select=leadId")
    const distribuidos = Array.isArray(distRes.data) ? distRes.data.map((r: any) => r.leadId) : []

    let leadsQuery = "leads?select=id,nome,telefone,produto,cidade,valor"
    if (somenteNovos) leadsQuery += "&status=eq.NOVO"
    if (distribuidos.length > 0)
      leadsQuery += `&id=not.in.(${distribuidos.map((id: string) => `"${id}"`).join(",")})`

    const leadsRes = await sb(leadsQuery)
    if (!leadsRes.ok || !Array.isArray(leadsRes.data) || leadsRes.data.length === 0)
      return ok({ distribuidos: 0, msg: "Nenhum lead sem correspondente encontrado." })

    const leads = leadsRes.data

    // 3. Fisher-Yates shuffle
    const shuffled = [...leads]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // 4. Round-Robin proporcional por peso
    const pool: string[] = []
    correspondentes.forEach((c: any) => {
      for (let w = 0; w < (c.peso ?? 1); w++) pool.push(c.id)
    })

    const distribuicao: Array<{ lead: any; correspondenteId: string }> = []
    shuffled.forEach((lead, idx) => {
      distribuicao.push({ lead, correspondenteId: pool[idx % pool.length] })
    })

    // 5. Salva vínculos
    const agora     = new Date().toISOString()
    const registros = distribuicao.map(d => ({
      id:               crypto.randomUUID(),
      leadId:           d.lead.id,
      correspondenteId: d.correspondenteId,
      atribuidoEm:      agora,
    }))

    const insertRes = await sb("leads_correspondentes", {
      method:  "POST",
      headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
      body:    JSON.stringify(registros),
    })

    if (!insertRes.ok) {
      console.error("[distribuir] Erro ao inserir vínculos:", insertRes.data)
      return err("Erro ao salvar distribuição no banco", 500)
    }

    // 6. Agrupa leads por correspondente para enviar e-mail
    const leadsCorr: Record<string, any[]> = {}
    distribuicao.forEach(({ lead, correspondenteId }) => {
      if (!leadsCorr[correspondenteId]) leadsCorr[correspondenteId] = []
      leadsCorr[correspondenteId].push(lead)
    })

    // 7. Dispara e-mails para cada correspondente
    let emailsEnviados = 0
    try {
      const { emailLeadAtribuidoCorrespondente } = await import("@/lib/services/email.service")

      await Promise.all(
        correspondentes
          .filter((c: any) => c.email && leadsCorr[c.id]?.length > 0)
          .map(async (c: any) => {
            try {
              await emailLeadAtribuidoCorrespondente({
                email:     c.email,
                nomeCorr:  c.nome,
                leads:     leadsCorr[c.id].map((l: any) => ({
                  nome:     l.nome,
                  telefone: l.telefone,
                  produto:  l.produto,
                  cidade:   l.cidade,
                  valor:    l.valor,
                })),
              })
              emailsEnviados++
              console.log(`[distribuir] E-mail enviado para ${c.nome} (${leadsCorr[c.id].length} leads)`)
            } catch (emailErr: any) {
              console.error(`[distribuir] Erro e-mail ${c.email}:`, emailErr.message)
            }
          })
      )
    } catch (emailErr: any) {
      console.error("[distribuir] Erro ao importar email.service:", emailErr.message)
    }

    // 8. Resumo
    const resumo = correspondentes.map((c: any) => ({
      nome:    c.nome,
      email:   c.email,
      recebeu: leadsCorr[c.id]?.length ?? 0,
    })).filter((r: any) => r.recebeu > 0)

    return ok({
      distribuidos:    leads.length,
      correspondentes: correspondentes.length,
      emailsEnviados,
      resumo,
    }, `${leads.length} leads distribuídos — ${emailsEnviados} e-mail${emailsEnviados !== 1 ? "s" : ""} enviado${emailsEnviados !== 1 ? "s" : ""}.`)

  } catch (e: any) {
    console.error("[distribuir POST]", e.message)
    return err("Erro ao distribuir leads", 500)
  }
}

export async function GET() {
  try {
    const corrRes = await sb("correspondentes?ativo=eq.true&order=nome.asc&select=id,nome,email,ativo")
    if (!corrRes.ok) return ok([])
    const correspondentes = Array.isArray(corrRes.data) ? corrRes.data : []

    const resultado = await Promise.all(
      correspondentes.map(async (c: any) => {
        const leadsRes = await sb(
          `leads_correspondentes?correspondenteId=eq.${c.id}` +
          `&select=leadId,atribuidoEm,leads(id,nome,produto,valor,status,createdAt)` +
          `&order=atribuidoEm.desc&limit=10`
        )
        const leadsData = Array.isArray(leadsRes.data) ? leadsRes.data : []
        return { ...c, leads: leadsData, _count: { leads: leadsData.length } }
      })
    )

    return ok(resultado)
  } catch (e: any) {
    console.error("[distribuir GET]", e.message)
    return ok([])
  }
}
