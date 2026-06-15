"use client"

import { useState } from "react"
import { formatCPF, formatPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AfiliadosForm() {
  const [form, setForm]     = useState({ nome: "", cpf: "", telefone: "", email: "", codigoIndicacao: "" })
  const [hasCode, setHasCode] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [link, setLink]     = useState("")

  function validate() {
    const errs: Record<string, string> = {}
    if (form.nome.trim().length < 3) errs.nome = "Nome obrigatório"
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(form.cpf)) errs.cpf = "CPF inválido"
    if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(form.telefone)) errs.telefone = "Telefone inválido"
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await fetch("/api/afiliados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, codigoIndicacao: hasCode ? form.codigoIndicacao : undefined }),
      })
      const json = await res.json()
      if (json.success) setLink(json.data.link)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[440px]">
      <h3 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Crie seu link gratuito</h3>
      <p className="mb-6 mt-1 text-sm text-[#6b7280]">Preencha os dados abaixo para gerar seu link de indicação</p>

      <div className="space-y-4">
        <div>
          <Label className="mb-1.5">Nome Completo</Label>
          <Input placeholder="João da Silva" icon="👤" value={form.nome} error={errors.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1.5">CPF</Label>
          <Input placeholder="000.000.000-00" icon="🪪" value={form.cpf} error={errors.cpf} maxLength={14}
            onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))} />
        </div>
        <div>
          <Label className="mb-1.5">Telefone</Label>
          <Input placeholder="(00) 0 0000-0000" icon="📱" value={form.telefone} error={errors.telefone} maxLength={16}
            onChange={e => setForm(f => ({ ...f, telefone: formatPhone(e.target.value) }))} />
        </div>
        <div>
          <Label className="mb-1.5">
            E-mail <span className="font-normal normal-case tracking-normal text-[#6b7280]">(Opcional)</span>
          </Label>
          <Input type="email" placeholder="email@mail.com.br" icon="✉️" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>

        {/* Checkbox código */}
        <div className="flex items-start gap-3 rounded-[14px] bg-[#f4f6f8] p-3">
          <input type="checkbox" id="has-code" checked={hasCode} onChange={e => setHasCode(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-[#1DB954]" />
          <label htmlFor="has-code" className="cursor-pointer text-sm leading-relaxed text-[#0D1B2A]">
            Tenho um código de indicação{" "}
            <span className="text-xs text-[#6b7280]">(exclusivo para consultores e parceiros)</span>
          </label>
        </div>

        {hasCode && (
          <Input placeholder="Digite seu código de parceiro" value={form.codigoIndicacao}
            onChange={e => setForm(f => ({ ...f, codigoIndicacao: e.target.value }))} />
        )}

        {/* Botão + link gerado */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="default" onClick={handleSubmit} disabled={loading} className="h-[50px]">
            {loading ? "Gerando..." : "Gerar Link"}
          </Button>
          <div className="flex items-center rounded-[14px] border-2 border-[#e5e7eb] bg-[#f4f6f8] px-3">
            {link ? (
              <button
                onClick={() => navigator.clipboard.writeText(`https://${link}`)}
                className="truncate font-['Sora'] text-xs font-bold text-[#1DB954]"
                title={link}
              >
                {link}
              </button>
            ) : (
              <span className="font-['Sora'] text-xs text-[#9ca3af]">Seu link aparecerá aqui</span>
            )}
          </div>
        </div>

        <p className="text-[0.72rem] leading-relaxed text-[#6b7280]">
          Ao gerar o link, você concorda com os{" "}
          <a href="#" className="font-semibold text-[#1DB954]">Termos de uso e Política de Privacidade</a>.{" "}
          <a href="#" className="font-semibold text-[#1DB954]">Confira aqui o regulamento da campanha</a>
        </p>
      </div>
    </div>
  )
}
