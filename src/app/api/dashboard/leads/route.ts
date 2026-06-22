import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"
import { maskCpf } from "@/lib/crypto"

const MOCK_LEADS = [
  { id:"1", nome:"Marcos Alves",   email:"marcos@email.com",   telefone:"(21) 98821-3344", produto:"PESSOAL",    valor:8000,  parcelas:24, parcelaMensal:465, status:"NOVO",             origem:"AFILIADO",  afiliado:{slug:"joao123",nome:"João Silva"}, createdAt: new Date().toISOString() },
  { id:"2", nome:"Ana Rodrigues",  email:"ana@email.com",      telefone:"(11) 98765-4321", produto:"GARANTIA",   valor:45000, parcelas:60, parcelaMensal:983, status:"EM_ANALISE",       origem:"AFILIADO",  afiliado:{slug:"maria456",nome:"Maria Santos"}, createdAt: new Date().toISOString() },
  { id:"3", nome:"Carlos Mendes",  email:"carlos@email.com",   telefone:"(31) 97654-3210", produto:"CONSIGNADO", valor:12000, parcelas:48, parcelaMensal:352, status:"APROVADO",         origem:"ORGANICO",  afiliado:null, createdAt: new Date().toISOString() },
  { id:"4", nome:"Fernanda Lima",  email:"fernanda@email.com", telefone:"(85) 99234-5678", produto:"FGTS",       valor:3200,  parcelas:12, parcelaMensal:298, status:"APROVADO",         origem:"WHATSAPP",  afiliado:null, createdAt: new Date().toISOString() },
  { id:"5", nome:"Roberto Costa",  email:"roberto@email.com",  telefone:"(71) 98123-4567", produto:"EMPRESARIAL",valor:80000, parcelas:36, parcelaMensal:2840,status:"PROPOSTA_ENVIADA", origem:"AFILIADO",  afiliado:{slug:"joao123",nome:"João Silva"}, createdAt: new Date().toISOString() },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status  = searchParams.get("status")  ?? undefined
  const search  = searchParams.get("search")  ?? undefined
  const produto = searchParams.get("produto") ?? undefined
  const page    = parseInt(searchParams.get("page")  ?? "1")
  const limit   = parseInt(searchParams.get("limit") ?? "20")

  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const where: any = {}
    if (status)  where.status  = status.toUpperCase()
    if (produto) where.produto = produto.toUpperCase()
    if (search) where.OR = [
      { nome:    { contains: search, mode: "insensitive" } },
      { email:   { contains: search, mode: "insensitive" } },
      { telefone:{ contains: search } },
    ]

    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          afiliado:     { select: { slug: true, nome: true } },
          dadosEnergia: true,
        },
      }),
      prisma.lead.count({ where }),
    ])

    const safe = (leads as any[]).map(l => ({ ...l, cpf: maskCpf("") }))
    return ok({ data: safe, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    let data = MOCK_LEADS
    if (status) data = data.filter(l => l.status === status.toUpperCase())
    if (search) data = data.filter(l => l.nome.toLowerCase().includes(search.toLowerCase()))
    return ok({ data, total: data.length, page: 1, totalPages: 1 })
  }
}
