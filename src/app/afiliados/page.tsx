"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { useApi } from "@/hooks/useApi"
import { formatCPF, formatPhone, formatCurrency } from "@/lib/utils"

export default function AfiliadosPage() {
  const [form, setForm]       = useState({ nome: "", cpf: "", telefone: "", email: "", codigoIndicacao: "", senha: "", confirmarSenha: "" })
  const [hasCode, setHasCode] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [link, setLink]       = useState("")
  const [success, setSuccess] = useState(false)
  const [showSenha, setShowSenha]           = useState(false)
  const [showConfirmar, setShowConfirmar]   = useState(false)

  // Comissões dinâmicas do banco
  const [comissoes, setComissoes] = useState<Record<string,number>>({
    GARANTIA: 350, EMPRESARIAL: 250, CONSIGNADO: 120, PESSOAL: 100, FGTS: 80, ENERGIA: 60,
  })

  useEffect(() => {
    fetch("/api/admin/configs")
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          const d = json.data
          setComissoes({
            GARANTIA:    parseFloat(d.COMISSAO_GARANTIA)    || 350,
            EMPRESARIAL: parseFloat(d.COMISSAO_EMPRESARIAL) || 250,
            CONSIGNADO:  parseFloat(d.COMISSAO_CONSIGNADO)  || 120,
            PESSOAL:     parseFloat(d.COMISSAO_PESSOAL)     || 100,
            FGTS:        parseFloat(d.COMISSAO_FGTS)        || 80,
            ENERGIA:     parseFloat(d.COMISSAO_ENERGIA)     || 60,
          })
        }
      })
      .catch(() => {})
  }, [])
  const { post, loading }     = useApi()

  function validate() {
    const e: Record<string, string> = {}
    if (form.nome.trim().length < 3)                         e.nome          = "Nome obrigatório"
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(form.cpf))     e.cpf           = "CPF inválido"
    if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(form.telefone)) e.telefone      = "Telefone inválido"
    if (form.senha.length < 8)                               e.senha         = "Senha deve ter pelo menos 8 caracteres"
    if (form.senha !== form.confirmarSenha)                  e.confirmarSenha= "As senhas não coincidem"
    return e
  }
  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    const res = await post<{ link: string }>("/api/afiliados", {
      ...form,
      codigoIndicacao: hasCode ? form.codigoIndicacao : undefined,
    })
    if (res.success && res.data?.link) {
      setLink(res.data.link)
      setSuccess(true)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://${link}`)
  }

  return (
    <div className="min-h-screen">
      {/* Navbar padrão */}
      <Navbar onLoginClick={() => window.location.href = "/login"} />

      {/* Hero dividido — igual à home mas adaptado */}
      <div className="grid min-h-screen pt-[70px] md:grid-cols-2">

        {/* ESQUERDA — fundo cinza claro com bloco verde */}
        <div className="relative flex flex-col justify-center overflow-hidden bg-white px-[8%] py-16">
          <div className="relative z-10">
            {/* Ícones */}
            <div className="mb-6 flex gap-3">
              <div className="flex h-14 w-14 -rotate-6 items-center justify-center rounded-2xl bg-[#1DB954] text-2xl shadow-[0_6px_20px_rgba(29,185,84,0.35)]">💬</div>
              <div className="mt-3 flex h-14 w-14 rotate-6 items-center justify-center rounded-2xl bg-[#FF6B00] text-2xl shadow-[0_6px_20px_rgba(255,107,0,0.35)]">🔗</div>
            </div>

            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e8f8ee] px-4 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#0f9c40]">
              ✦ Programa de Afiliados
            </div>

            <h1 className="font-['Sora'] text-[clamp(2.8rem,5vw,4rem)] font-extrabold leading-[1.05] text-[#0D1B2A]">
              Indique<br />
              e <span className="text-[#1DB954]">ganhe</span>
            </h1>

            <p className="mt-5 max-w-[380px] text-base leading-relaxed text-[#374151]">
              Para criar seu{" "}
              <strong className="text-[#FF6B00]">link de indicação exclusivo</strong>,
              preencha suas informações ao lado e comece a ganhar comissões agora mesmo.
            </p>

            {/* Benefícios */}
            <ul className="mt-6 space-y-3">
              {[
                { text: "Comissão de até R$ 350 por aprovação", color: "#1DB954" },
                { text: "Pagamento semanal via PIX",             color: "#FF6B00" },
                { text: "Dashboard com relatórios em tempo real",color: "#1DB954" },
              ].map(item => (
                <li key={item.text} className="flex items-center gap-3 text-sm text-[#374151]">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-bold text-white text-[0.65rem]"
                    style={{ background: item.color }}>✓</span>
                  {item.text}
                </li>
              ))}
            </ul>

            {/* Separador decorativo */}
            <div className="mt-8 flex gap-2">
              <div className="h-1 w-12 rounded-full bg-[#1DB954]" />
              <div className="h-1 w-6  rounded-full bg-[#FF6B00]" />
              <div className="h-1 w-3  rounded-full bg-[#e5e7eb]" />
            </div>
          </div>
        </div>

        {/* DIREITA — formulário em card */}
        <div className="flex items-center justify-center bg-white px-6 py-16 md:px-12">
          <div className="w-full max-w-[500px] rounded-3xl bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[#e5e7eb] border-t-4 border-t-[#1DB954]">

            {success ? (
              /* Sucesso */
              <div className="py-8 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f8ee] text-4xl">🎉</div>
                <h2 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Link gerado!</h2>
                <p className="mt-2 text-sm text-[#6b7280]">Compartilhe e comece a ganhar comissões.</p>
                <div className="mt-6 flex items-center gap-2 rounded-xl border-2 border-[#1DB954]/30 bg-[#e8f8ee] p-3">
                  <span className="flex-1 truncate text-left font-['Sora'] text-sm font-bold text-[#1DB954]">{link}</span>
                  <button onClick={copyLink}
                    className="flex-shrink-0 rounded-lg bg-[#1DB954] px-4 py-2 font-['Sora'] text-xs font-bold text-white hover:bg-[#0f9c40]">
                    Copiar
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a href={`https://wa.me/?text=Precisa de crédito? Acesse: https://${link}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 font-['Sora'] text-sm font-bold text-white no-underline">
                    💬 WhatsApp
                  </a>
                  <button onClick={copyLink}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#e5e7eb] py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A] hover:border-[#1DB954]">
                    🔗 Copiar link
                  </button>
                </div>
                <a href="/" className="mt-6 inline-block text-sm text-[#6b7280] no-underline hover:text-[#1DB954]">
                  ← Voltar para o site
                </a>
              </div>
            ) : (
              /* Formulário */
              <>
                <h2 className="font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">Crie seu link gratuito</h2>
                <p className="mb-6 mt-1 text-sm text-[#6b7280]">Preencha os dados abaixo para gerar seu link de indicação</p>

                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="mb-1.5 block font-['Sora'] text-xs font-bold uppercase tracking-[0.06em] text-[#374151]">Nome Completo</label>
                    <div className="relative">
                      <input type="text" placeholder="João da Silva" value={form.nome}
                        onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                        className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-3 pr-12 font-sans text-sm text-[#0D1B2A] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#1DB954] focus:bg-white ${errors.nome ? "border-red-400" : "border-[#e5e7eb]"}`} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#d1d5db]">👤</span>
                    </div>
                    {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome}</p>}
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="mb-1.5 block font-['Sora'] text-xs font-bold uppercase tracking-[0.06em] text-[#374151]">CPF</label>
                    <div className="relative">
                      <input type="text" placeholder="000.000.000-00" value={form.cpf} maxLength={14}
                        onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
                        className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-3 pr-12 font-sans text-sm text-[#0D1B2A] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#1DB954] focus:bg-white ${errors.cpf ? "border-red-400" : "border-[#e5e7eb]"}`} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#d1d5db]">🪪</span>
                    </div>
                    {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf}</p>}
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="mb-1.5 block font-['Sora'] text-xs font-bold uppercase tracking-[0.06em] text-[#374151]">Telefone</label>
                    <div className="relative">
                      <input type="tel" placeholder="(00) 0 0000-0000" value={form.telefone} maxLength={16}
                        onChange={e => setForm(f => ({ ...f, telefone: formatPhone(e.target.value) }))}
                        className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-3 pr-12 font-sans text-sm text-[#0D1B2A] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#1DB954] focus:bg-white ${errors.telefone ? "border-red-400" : "border-[#e5e7eb]"}`} />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#d1d5db]">📱</span>
                    </div>
                    {errors.telefone && <p className="mt-1 text-xs text-red-500">{errors.telefone}</p>}
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="mb-1.5 block font-['Sora'] text-xs font-bold uppercase tracking-[0.06em] text-[#374151]">
                      E-mail <span className="font-normal normal-case tracking-normal text-[#9ca3af]">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <input type="email" placeholder="email@mail.com.br" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 pr-12 font-sans text-sm text-[#0D1B2A] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#1DB954] focus:bg-white" />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#d1d5db]">✉️</span>
                    </div>
                  </div>

                  {/* Senha */}
                  <div>
                    <label className="mb-1.5 block font-['Sora'] text-xs font-bold uppercase tracking-[0.06em] text-[#374151]">Senha</label>
                    <div className="relative">
                      <input
                        type={showSenha ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={form.senha}
                        onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                        className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-3 pr-12 font-sans text-sm text-[#0D1B2A] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#1DB954] focus:bg-white ${errors.senha ? "border-red-400" : "border-[#e5e7eb]"}`} />
                      <button type="button" onClick={() => setShowSenha(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#1DB954] transition-colors">
                        {showSenha ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {errors.senha && <p className="mt-1 text-xs text-red-500">{errors.senha}</p>}
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label className="mb-1.5 block font-['Sora'] text-xs font-bold uppercase tracking-[0.06em] text-[#374151]">Confirmar Senha</label>
                    <div className="relative">
                      <input
                        type={showConfirmar ? "text" : "password"}
                        placeholder="Repita a senha"
                        value={form.confirmarSenha}
                        onChange={e => setForm(f => ({ ...f, confirmarSenha: e.target.value }))}
                        className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-3 pr-12 font-sans text-sm text-[#0D1B2A] outline-none transition-all placeholder:text-[#9ca3af] focus:border-[#1DB954] focus:bg-white ${errors.confirmarSenha ? "border-red-400" : form.confirmarSenha && form.senha === form.confirmarSenha ? "border-[#1DB954]" : "border-[#e5e7eb]"}`} />
                      <button type="button" onClick={() => setShowConfirmar(s => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#1DB954] transition-colors">
                        {showConfirmar ? "🙈" : "👁️"}
                      </button>
                    </div>
                    {errors.confirmarSenha && <p className="mt-1 text-xs text-red-500">{errors.confirmarSenha}</p>}
                    {form.confirmarSenha && form.senha === form.confirmarSenha && (
                      <p className="mt-1 text-xs font-semibold text-[#1DB954]">✓ Senhas coincidem</p>
                    )}
                  </div>

                  {/* Checkbox código */}
                  <div className="flex items-start gap-3 rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3.5">
                    <input type="checkbox" id="has-code" checked={hasCode}
                      onChange={e => setHasCode(e.target.checked)}
                      className="mt-0.5 h-5 w-5 cursor-pointer rounded accent-[#1DB954]" />
                    <label htmlFor="has-code" className="cursor-pointer text-sm leading-relaxed text-[#374151]">
                      Tenho um código de indicação{" "}
                      <span className="text-xs text-[#9ca3af]">(exclusivo para consultores e parceiros)</span>
                    </label>
                  </div>

                  {hasCode && (
                    <input type="text" placeholder="Digite seu código de parceiro"
                      value={form.codigoIndicacao}
                      onChange={e => setForm(f => ({ ...f, codigoIndicacao: e.target.value }))}
                      className="w-full rounded-xl border-2 border-[#1DB954]/40 bg-[#f9fafb] px-4 py-3 font-sans text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white" />
                  )}

                  {/* Botão + link */}
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSubmit} disabled={loading}
                      className="rounded-xl bg-[#1DB954] py-3.5 font-['Sora'] text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(29,185,84,0.3)] transition-all hover:bg-[#0f9c40] disabled:opacity-60">
                      {loading ? "Gerando..." : "Gerar Link"}
                    </button>
                    <div className="flex items-center rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3">
                      <span className="truncate font-['Sora'] text-xs text-[#9ca3af]">Seu link aparecerá aqui</span>
                    </div>
                  </div>

                  <p className="text-[0.72rem] leading-relaxed text-[#6b7280]">
                    Ao gerar o link, você concorda com os{" "}
                    <a href="/termos" className="font-semibold text-[#1DB954] no-underline hover:underline">Termos de uso e Política de Privacidade</a>.{" "}
                    <a href="/regulamento" className="font-semibold text-[#1DB954] no-underline hover:underline">Confira aqui o regulamento da campanha</a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-white px-[7%] py-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-3 inline-block rounded-full bg-[#e8f8ee] px-4 py-1 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#0f9c40]">Como funciona</span>
          <h2 className="font-['Sora'] text-3xl font-extrabold text-[#0D1B2A]">Simples, rápido e lucrativo</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n:"01", color:"#1DB954", icon:"📝", title:"Cadastre-se",      desc:"Preencha o formulário acima com seus dados. É gratuito e sem burocracia." },
              { n:"02", color:"#FF6B00", icon:"🔗", title:"Compartilhe",      desc:"Receba seu link exclusivo e compartilhe com amigos e nas redes sociais." },
              { n:"03", color:"#1DB954", icon:"💰", title:"Receba comissões", desc:"A cada cliente aprovado, você recebe até R$350 via PIX direto na sua conta." },
            ].map(s => (
              <div key={s.n} className="relative overflow-hidden rounded-2xl border-2 p-8 transition-all hover:-translate-y-1"
                style={{ borderColor: s.color + "30", background: s.color + "08" }}>
                <span className="absolute right-5 top-3 font-['Sora'] text-5xl font-extrabold opacity-10" style={{ color: s.color }}>{s.n}</span>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: s.color }}>
                  <span>{s.icon}</span>
                </div>
                <h3 className="mb-2 font-['Sora'] text-lg font-bold text-[#0D1B2A]">{s.title}</h3>
                <p className="text-sm leading-relaxed text-[#6b7280]">{s.desc}</p>
                <div className="absolute bottom-0 left-0 h-1 w-full" style={{ background: s.color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabela de comissões */}
      <section className="bg-[#f4f6f8] px-[7%] py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="font-['Sora'] text-3xl font-extrabold text-[#0D1B2A]">Tabela de comissões</h2>
            <p className="mt-2 text-[#6b7280]">Quanto você ganha por produto aprovado</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f4f6f8]">
                  <th className="px-6 py-4 text-left font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">Produto</th>
                  <th className="px-6 py-4 text-left font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">Comissão</th>
                  <th className="px-6 py-4 text-left font-['Sora'] text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key:"GARANTIA",    produto:"Com Garantia de Imóvel",  top:true  },
                  { key:"EMPRESARIAL", produto:"Crédito Empresarial",      top:false },
                  { key:"CONSIGNADO",  produto:"Consignado",               top:false },
                  { key:"PESSOAL",     produto:"Crédito Pessoal",          top:false },
                  { key:"FGTS",        produto:"Antecipação FGTS",         top:false },
                  { key:"ENERGIA",     produto:"Empréstimo Conta de Luz",  top:false },
                ]
                  .sort((a, b) => (comissoes[b.key] ?? 0) - (comissoes[a.key] ?? 0))
                  .map((row, i) => (
                  <tr key={row.produto} className={`border-t border-[#e5e7eb] ${row.top ? "bg-[#e8f8ee]" : i%2===0 ? "bg-white" : "bg-[#f9fafb]"}`}>
                    <td className="px-6 py-4 font-medium text-[#0D1B2A]">
                      {i === 0 && <span className="mr-2 rounded-full bg-[#FF6B00] px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold text-white">TOP</span>}
                      {row.produto}
                    </td>
                    <td className="px-6 py-4 font-['Sora'] font-bold text-[#1DB954]">
                      {formatCurrency(comissoes[row.key] ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6b7280]">30 dias após aprovação</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center font-['Sora'] text-xs text-[#9ca3af]">
            * Comissões sujeitas a alteração. Valores pagos via PIX após confirmação do crédito.
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden bg-[#f9fafb] px-[7%] py-16 text-center">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#1DB954] via-[#FF6B00] to-[#1DB954]" />
        <h2 className="font-['Sora'] text-3xl font-extrabold text-[#0D1B2A]">Pronto para começar a ganhar?</h2>
        <p className="mx-auto mt-3 max-w-[440px] text-[#6b7280]">Cadastre-se agora, é gratuito. Seu primeiro link em menos de 2 minutos.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FF6B00] px-8 py-4 font-['Sora'] text-base font-bold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(255,107,0,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#e06000]">
          Criar meu link agora →
        </button>
      </section>

      {/* Footer simples */}
      <footer className="bg-[#1a1a2e] px-[7%] py-6 text-center">
        <p className="text-xs text-[#6b7280]">
          © 2026 Crédito Gold Soluções Financeiras ·{" "}
          <a href="/termos" className="text-[#1DB954] no-underline hover:underline">Termos de uso</a>
          {" "}·{" "}
          <a href="/privacidade" className="text-[#1DB954] no-underline hover:underline">Privacidade</a>
          {" "}·{" "}
          <a href="/" className="text-[#475569] no-underline hover:text-white">← Voltar ao site</a>
        </p>
      </footer>
    </div>
  )
}
