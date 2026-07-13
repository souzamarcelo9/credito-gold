import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? undefined
  const status = searchParams.get("status") ?? undefined
  const tipo   = searchParams.get("tipo")   ?? undefined

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const where: any = {}
    if (status) where.status = status
    if (tipo)   where.tipo   = tipo
    if (search) where.OR = [
      { razaoSocial:  { contains: search, mode: "insensitive" } },
      { nomeFantasia: { contains: search, mode: "insensitive" } },
      { cnpj:         { contains: search } },
      { responsavel:  { contains: search, mode: "insensitive" } },
    ]

    const [clientes, total] = await prisma.$transaction([
      (prisma as any).clienteParceiro.findMany({ where, orderBy: { razaoSocial: "asc" } }),
      (prisma as any).clienteParceiro.count({ where }),
    ])

    const stats = {
      total:     await (prisma as any).clienteParceiro.count(),
      ativos:    await (prisma as any).clienteParceiro.count({ where: { status: "ATIVO" } }),
      inativos:  await (prisma as any).clienteParceiro.count({ where: { status: "INATIVO" } }),
      prospectos:await (prisma as any).clienteParceiro.count({ where: { status: "PROSPECTO" } }),
    }

    return ok({ clientes, total, stats })
  } catch { return ok({ clientes: [], total: 0, stats: { total:0, ativos:0, inativos:0, prospectos:0 } }) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { razaoSocial, cnpj, responsavel, email, telefone } = body
    if (!razaoSocial?.trim()) return err("Razão social obrigatória", 400)
    if (!cnpj?.trim())        return err("CNPJ obrigatório", 400)
    if (!responsavel?.trim()) return err("Responsável obrigatório", 400)
    if (!email?.trim())       return err("E-mail obrigatório", 400)

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const cliente = await (prisma as any).clienteParceiro.create({
      data: {
        razaoSocial:  razaoSocial.trim(),
        nomeFantasia: body.nomeFantasia?.trim() || null,
        cnpj:         cnpj.replace(/\D/g, "").replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5"),
        tipo:         body.tipo        ?? "EMPRESA",
        segmento:     body.segmento    || null,
        responsavel:  responsavel.trim(),
        email:        email.trim(),
        telefone:     telefone?.trim() || "",
        cidade:       body.cidade      || null,
        estado:       body.estado      || null,
        status:       body.status      ?? "ATIVO",
        observacoes:  body.observacoes || null,
      },
    })
    return ok(cliente, "Cliente parceiro cadastrado!", 201)
  } catch (e: any) {
    if (e?.code === "P2002") return err("CNPJ já cadastrado", 409)
    console.error("[clientes POST]", e)
    return err("Erro ao cadastrar", 500)
  }
}
