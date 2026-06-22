import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

// Configurações padrão caso não existam no banco
const DEFAULTS: Record<string, string> = {
  TAXA_PESSOAL:     "2.89",
  TAXA_GARANTIA:    "0.89",
  TAXA_EMPRESARIAL: "1.49",
  TAXA_CONSIGNADO:  "1.45",
  TAXA_FGTS:        "1.80",
  TAXA_ENERGIA:     "3.49",
  VALOR_MIN_PESSOAL:     "500",
  VALOR_MAX_PESSOAL:     "50000",
  VALOR_MIN_GARANTIA:    "10000",
  VALOR_MAX_GARANTIA:    "500000",
  VALOR_MIN_EMPRESARIAL: "5000",
  VALOR_MAX_EMPRESARIAL: "200000",
  VALOR_MIN_CONSIGNADO:  "500",
  VALOR_MAX_CONSIGNADO:  "30000",
  VALOR_MIN_FGTS:        "500",
  VALOR_MAX_FGTS:        "15000",
  VALOR_MIN_ENERGIA:     "300",
  VALOR_MAX_ENERGIA:     "4000",
  PRAZO_MAX_PESSOAL:     "48",
  PRAZO_MAX_GARANTIA:    "120",
  PRAZO_MAX_EMPRESARIAL: "60",
  PRAZO_MAX_CONSIGNADO:  "84",
  PRAZO_MAX_FGTS:        "24",
  PRAZO_MAX_ENERGIA:     "24",
  COMISSAO_PESSOAL:      "100",
  COMISSAO_GARANTIA:     "350",
  COMISSAO_EMPRESARIAL:  "250",
  COMISSAO_CONSIGNADO:   "120",
  COMISSAO_FGTS:         "80",
  COMISSAO_ENERGIA:      "60",
}

export async function GET() {
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no-prisma")

    const configs = await prisma.config.findMany()
    const map: Record<string, string> = { ...DEFAULTS }
    configs.forEach((c: any) => { map[c.chave] = c.valor })

    return ok(map)
  } catch {
    return ok(DEFAULTS)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    // Upsert de cada chave
    await prisma.$transaction(
      Object.entries(body).map(([chave, valor]) =>
        prisma.config.upsert({
          where:  { chave },
          update: { valor: String(valor) },
          create: { chave, valor: String(valor) },
        })
      )
    )

    return ok(body, "Configurações salvas com sucesso!")
  } catch (e) {
    console.error("[admin/configs POST]", e)
    return err("Erro ao salvar configurações", 500)
  }
}
