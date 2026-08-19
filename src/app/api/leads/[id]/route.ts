import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }      = await params
    const body        = await req.json()
    const { status, bancoId, observacao } = body

    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)

    const lead = await prisma.lead.update({
      where: { id },
      data:  {
        status,
        ...(bancoId     ? { bancoId }     : {}),
        ...(observacao  ? { observacao }  : {}),
      },
      include: {
        afiliado: { select: { id:true, nome:true, email:true } },
      },
    })

    // ── Dispara e-mails conforme status ───────────────────────────
    try {
      const { emailLeadAprovado, emailLeadRecusado, emailLeadAprovadoAfiliado } =
        await import("@/lib/services/email.service")

      const email   = (lead as any).email
      const nome    = (lead as any).nome
      const produto = (lead as any).produto ?? "Crédito"

      if (status === "APROVADO") {
        // E-mail para o cliente
        if (email) {
          await emailLeadAprovado({ email, nome, produto, valor: (lead as any).valor })
        }

        // E-mail para o afiliado (se existir comissão)
        const afiliado = (lead as any).afiliado
        if (afiliado?.email) {
          const comissao = await prisma.comissao.findFirst({
            where: { leadId: id },
            select: { valor: true },
          })
          if (comissao) {
            await emailLeadAprovadoAfiliado({
              email:       afiliado.email,
              nomeAfil:    afiliado.nome,
              nomeCliente: nome,
              produto,
              comissao:    comissao.valor,
            })
          }
        }
      }

      if (status === "RECUSADO" && email) {
        await emailLeadRecusado({ email, nome, produto, motivo: observacao })
      }
    } catch (emailErr: any) {
      // Não falha a API por causa do e-mail
      console.error("[leads PATCH] Erro ao enviar e-mail:", emailErr.message)
    }

    return ok(lead, `Lead ${status.toLowerCase()}!`)
  } catch (e: any) {
    console.error("[leads PATCH]", e)
    return err("Erro ao atualizar lead", 500)
  }
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }  = await params
    const prisma  = (await import("@/lib/prisma")).default
    if (!prisma) return err("Banco não disponível", 503)
    const lead    = await prisma.lead.findUnique({ where: { id } })
    if (!lead) return err("Lead não encontrado", 404)

    // Descriptografa CPF para exibição
    let cpfDecrypted = "—"
    try {
      if ((lead as any).cpf) {
        const { decrypt, maskCpf } = await import("@/lib/crypto")
        const raw = decrypt((lead as any).cpf)
        // Formata: 000.000.000-00
        cpfDecrypted = raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
      }
    } catch {
      cpfDecrypted = "***.***.***-**"
    }

    return ok({ ...lead, cpf: cpfDecrypted })
  } catch {
    return err("Lead não encontrado", 404)
  }
}
