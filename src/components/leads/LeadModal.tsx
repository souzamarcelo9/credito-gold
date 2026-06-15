"use client"

import { useState, useEffect } from "react"
import { formatCurrency, formatCPF, formatPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/useApi"
import { PRODUTOS } from "@/config/produtos"
import type { ProdutoKey } from "@/types"

interface LeadModalProps {
  open: boolean
  onClose: () => void
  simulacao?: {
    produto: ProdutoKey
    valor: number
    parcelas: number
    parcelaMensal: number
  }
}

export function LeadModal({ open, onClose, simulacao }: LeadModalProps) {
  const [form, setForm]     = useState({ nome: "", cpf: "", telefone: "", email: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [refSlug, setRefSlug] = useState<string | null>(null)
  const { post, loading, error: apiError } = useApi()

  // Captura o parâmetro ?ref= da URL ao abrir o modal
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get("ref")
      if (ref) setRefSlug(ref)
    }
  }, [])

  if (!open) return null

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.nome.trim() || form.nome.length < 3) errs.nome = "Nome obrigatório"
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(form.cpf)) errs.cpf = "CPF inválido"
    if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(form.telefone)) errs.telefone = "Telefone inválido"
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "E-mail inválido"
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const res = await post("/api/leads", {
      ...form,
      produto:       simulacao?.produto ?? "pessoal",
      valor:         simulacao?.valor ?? 0,
      parcelas:      simulacao?.parcelas ?? 12,
      parcelaMensal: simulacao?.parcelaMensal ?? 0,
      origem:        refSlug ? "afiliado" : "organico",
      afiliadoSlug:  refSlug ?? undefined,
    })
    if (res.success) setSuccess(true)
  }

  const produtoLabel = simulacao ? PRODUTOS[simulacao.produto]?.label : ""

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-[92%] max-w-[460px] animate-[fadeUp_0.3s_ease] rounded-3xl bg-white p-8 shadow-[0_24px_64px_rgba(0,0,0,0.25)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f6f8] text-[#6b7280] hover:bg-[#e5e7eb]"
        >
          ✕
        </button>

        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f8ee] text-3xl">✅</div>
            <h3 className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">Solicitação enviada!</h3>
            <p className="mt-2 text-sm text-[#6b7280]">Nossa equipe entrará em contato em até 2 horas úteis.</p>
            <Button variant="default" size="lg" className="mt-6" onClick={onClose}>Fechar</Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff3e8] text-2xl">💰</div>
              <h3 className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">Solicitar este crédito</h3>
              <p className="mt-1 text-sm text-[#6b7280]">Preencha seus dados e nossa equipe entrará em contato em até 2 horas.</p>
            </div>

            {simulacao && (
              <div className="mb-5 flex items-center justify-between rounded-[14px] bg-[#e8f8ee] px-4 py-3">
                <div>
                  <div className="font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.07em] text-[#6b7280]">Produto</div>
                  <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{produtoLabel}</div>
                </div>
                <div className="text-center">
                  <div className="font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.07em] text-[#6b7280]">Valor</div>
                  <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{formatCurrency(simulacao.valor)}</div>
                </div>
                <div className="text-right">
                  <div className="font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.07em] text-[#6b7280]">Parcela</div>
                  <div className="font-['Sora'] text-base font-extrabold text-[#1DB954]">{formatCurrency(simulacao.parcelaMensal)}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5">Nome completo</Label>
                <Input placeholder="Seu nome completo" value={form.nome} error={errors.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5">CPF</Label>
                  <Input placeholder="000.000.000-00" value={form.cpf} error={errors.cpf} maxLength={14}
                    onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))} />
                </div>
                <div>
                  <Label className="mb-1.5">Telefone</Label>
                  <Input placeholder="(21) 99999-9999" value={form.telefone} error={errors.telefone} maxLength={16}
                    onChange={e => setForm(f => ({ ...f, telefone: formatPhone(e.target.value) }))} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5">E-mail</Label>
                <Input type="email" placeholder="seu@email.com" value={form.email} error={errors.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            <Button variant="orange" size="full" className="mt-5" onClick={handleSubmit} disabled={loading}>
              {loading ? "Enviando..." : "Solicitar análise gratuita →"}
            </Button>
            <p className="mt-2 text-center text-[0.68rem] text-[#9ca3af]">
              🔒 Seus dados estão protegidos pela LGPD
            </p>
          </>
        )}
      </div>
    </div>
  )
}
