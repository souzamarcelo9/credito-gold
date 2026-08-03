import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

// Helper para chamar Supabase REST diretamente (bypass do Prisma client desatualizado)
async function supabase(path: string, opts: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      "apikey":        key,
      "Authorization": `Bearer ${key}`,
      "Content-Type":  "application/json",
      "Prefer":        "return=representation",
      ...(opts.headers ?? {}),
    },
  })
  const text = await res.text()
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) } }
  catch { return { ok: res.ok, status: res.status, data: text } }
}

export async function GET() {
  try {
    const res = await supabase('correspondentes?select=*&order=nome.asc')
    if (!res.ok) {
      console.error("[correspondentes GET]", res.status, res.data)
      return ok([])
    }
    return ok(res.data)
  } catch (e: any) {
    console.error("[correspondentes GET]", e.message)
    return ok([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, telefone, cidade, estado } = body

    if (!nome?.trim()) return err("Nome obrigatório", 400)

    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const res = await supabase("correspondentes", {
      method:  "POST",
      headers: { "Prefer": "return=representation" },
      body: JSON.stringify({
        id, nome: nome.trim(),
        email:    email?.trim()    ?? "",
        telefone: telefone?.trim() ?? "",
        cidade:   cidade?.trim()   ?? "",
        estado:   estado?.trim()   ?? "",
        ativo:    true,
        peso:     1,
        "createdAt": now,
        "updatedAt": now,
      }),
    })

    if (!res.ok) {
      console.error("[correspondentes POST]", res.status, res.data)
      if (res.status === 409) return err("E-mail já cadastrado", 409)
      return err(`Erro ao cadastrar: ${JSON.stringify(res.data)}`, 500)
    }

    const created = Array.isArray(res.data) ? res.data[0] : res.data
    return ok(created, "Correspondente cadastrado!", 201)
  } catch (e: any) {
    console.error("[correspondentes POST]", e.message)
    return err(`Erro: ${e.message}`, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return err("ID obrigatório", 400)

    await supabase(`correspondentes?id=eq.${id}`, { method: "DELETE" })
    return ok(null, "Correspondente removido!")
  } catch (e: any) {
    return err(e.message, 500)
  }
}
