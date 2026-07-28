/**
 * Asaas Payment Service — PIX de comissões
 *
 * Variáveis no Vercel:
 *   ASAAS_API_KEY   — $aact_... (sandbox ou produção)
 *   ASAAS_ENV       — "sandbox" | "production"
 */

const ASAAS_BASE = () =>
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3"

const ASAAS_HEADERS = () => ({
  "Content-Type": "application/json",
  "access_token": process.env.ASAAS_API_KEY ?? "",
})

export interface PixTransferResult {
  id:          string
  status:      string
  value:       number
  transferDate:string
}

/**
 * Envia PIX para um afiliado via Asaas
 */
export async function enviarPixAfiliado(params: {
  valor:       number
  pixChave:    string
  pixTipo:     string   // CPF | CNPJ | EMAIL | TELEFONE | ALEATORIA
  descricao:   string
  saqueId:     string
}): Promise<PixTransferResult> {
  if (!process.env.ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY não configurado")
  }

  // Mapeia tipo de chave para o formato do Asaas
  const TIPO_MAP: Record<string, string> = {
    CPF:       "CPF",
    CNPJ:      "CNPJ",
    EMAIL:     "EMAIL",
    TELEFONE:  "PHONE",
    ALEATORIA: "EVP",
  }

  const res = await fetch(`${ASAAS_BASE()}/transfers`, {
    method:  "POST",
    headers: ASAAS_HEADERS(),
    body: JSON.stringify({
      value:             params.valor,
      pixAddressKey:     params.pixChave,
      pixAddressKeyType: TIPO_MAP[params.pixTipo] ?? "CPF",
      description:       params.descricao,
      externalReference: params.saqueId, // nosso ID interno
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error("[asaas] Erro na transferência:", JSON.stringify(data))
    throw new Error(data?.errors?.[0]?.description ?? `Asaas erro ${res.status}`)
  }

  console.log("[asaas] PIX enviado:", data.id, "| status:", data.status, "| valor:", data.value)
  return {
    id:           data.id,
    status:       data.status,
    value:        data.value,
    transferDate: data.transferDate ?? new Date().toISOString(),
  }
}

/**
 * Consulta saldo disponível na conta Asaas
 */
export async function consultarSaldo(): Promise<{ saldo: number; bloqueado: number }> {
  const res  = await fetch(`${ASAAS_BASE()}/finance/balance`, {
    headers: ASAAS_HEADERS(),
  })
  const data = await res.json()
  return {
    saldo:    data.balance         ?? 0,
    bloqueado:data.blockedBalance  ?? 0,
  }
}

/**
 * Consulta status de uma transferência
 */
export async function consultarTransferencia(asaasId: string): Promise<string> {
  const res  = await fetch(`${ASAAS_BASE()}/transfers/${asaasId}`, {
    headers: ASAAS_HEADERS(),
  })
  const data = await res.json()
  return data.status ?? "UNKNOWN"
}
