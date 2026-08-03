"use client"

import { useRouter } from "next/navigation"

import { useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { SocialBar } from "@/components/ui/SocialBar"
import { formatCPF, formatPhone } from "@/lib/utils"

const VAGAS = [
  { titulo:"Correspondente Bancário", area:"Comercial", tipo:"CLT / PJ", local:"Remoto ou Presencial", descricao:"Atendimento e prospecção de clientes para produtos de crédito. Experiência no setor financeiro é um diferencial." },
  { titulo:"Analista de Crédito",     area:"Financeiro", tipo:"CLT",     local:"Brasília - DF",        descricao:"Análise de propostas de crédito, relacionamento com bancos parceiros e gestão de carteira." },
  { titulo:"Consultor Comercial",     area:"Comercial",  tipo:"PJ",      local:"Remoto",               descricao:"Expansão da base de clientes e parceiros. Comissão atrativa sobre produção." },
  { titulo:"Desenvolvedor Full Stack",area:"Tecnologia", tipo:"PJ",      local:"Remoto",               descricao:"Desenvolvimento e manutenção da plataforma digital. Stack: Next.js, TypeScript, PostgreSQL." },
]

export default function TrabalheConoscoPage() {
  const [form, setForm]       = useState({ nome:"", email:"", telefone:"", area:"", mensagem:"" })
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function enviar() {
    if (!form.nome || !form.email || !form.telefone) return
    setLoading(true)
    // Simula envio — integrar com Resend futuramente
    await new Promise(r => setTimeout(r, 1000))
    setEnviado(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLoginClick={() => window.location.href = "/login"} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1B2A] to-[#1a3040] px-[7%] pb-16 pt-[100px]">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-block rounded-full bg-[#FF6B00]/15 px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#FF6B00]">Carreiras</div>
          <h1 className="font-['Sora'] text-4xl font-extrabold text-white">Trabalhe <span className="text-[#1DB954]">Conosco</span></h1>
          <p className="mt-4 text-lg text-white/70">Faça parte do time que está transformando o acesso ao crédito no Brasil.</p>
        </div>
      </section>

      {/* Por que trabalhar */}
      <section className="bg-[#f4f6f8] px-[7%] py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Por que a <span className="text-[#1DB954]">Crédito Gold</span>?</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon:"🚀", titulo:"Crescimento",    texto:"Empresa em expansão com oportunidades reais de crescimento profissional." },
              { icon:"💰", titulo:"Remuneração",    texto:"Salários competitivos e comissões atrativas baseadas em resultados." },
              { icon:"🏠", titulo:"Flexibilidade",  texto:"Modelo remoto ou híbrido para a maioria das posições." },
              { icon:"🤝", titulo:"Cultura",        texto:"Ambiente colaborativo, ético e focado em resultados com propósito." },
            ].map(b => (
              <div key={b.titulo} className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-center shadow-sm">
                <div className="text-4xl mb-3">{b.icon}</div>
                <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">{b.titulo}</div>
                <p className="mt-2 text-sm text-[#6b7280]">{b.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vagas */}
      <section className="px-[7%] py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Vagas abertas</h2>
          <div className="space-y-4">
            {VAGAS.map(v => (
              <div key={v.titulo} className="rounded-2xl border-2 border-[#e5e7eb] bg-white p-6 transition-all hover:border-[#1DB954]/40 hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-['Sora'] text-lg font-bold text-[#0D1B2A]">{v.titulo}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40]">{v.area}</span>
                      <span className="rounded-full bg-[#dbeafe] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#1d4ed8]">{v.tipo}</span>
                      <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#475569]">📍 {v.local}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior:"smooth" })}
                    className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40] transition-colors">
                    Candidatar-se
                  </button>
                </div>
                <p className="mt-3 text-sm text-[#6b7280]">{v.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section id="formulario" className="bg-[#f4f6f8] px-[7%] py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Envie seu currículo</h2>
          <p className="mb-8 text-[#6b7280]">Não encontrou a vaga ideal? Envie seu currículo e entraremos em contato quando surgir uma oportunidade.</p>

          {enviado ? (
            <div className="rounded-2xl bg-[#e8f8ee] p-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-['Sora'] text-xl font-bold text-[#0f9c40]">Candidatura recebida!</h3>
              <p className="mt-2 text-[#374151]">Obrigado pelo interesse! Analisaremos seu perfil e entraremos em contato em breve.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-sm">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nome completo *</label>
                    <input type="text" placeholder="Seu nome" value={form.nome}
                      onChange={e => setForm(f => ({...f, nome: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">E-mail *</label>
                    <input type="email" placeholder="seu@email.com" value={form.email}
                      onChange={e => setForm(f => ({...f, email: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Telefone *</label>
                    <input type="tel" placeholder="(61) 9 9999-9999" value={form.telefone}
                      onChange={e => setForm(f => ({...f, telefone: formatPhone(e.target.value)}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Área de interesse</label>
                    <select value={form.area} onChange={e => setForm(f => ({...f, area: e.target.value}))}
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white">
                      <option value="">Selecione...</option>
                      <option>Comercial</option>
                      <option>Financeiro</option>
                      <option>Tecnologia</option>
                      <option>Operações</option>
                      <option>Outros</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Mensagem / Experiência</label>
                  <textarea rows={4} placeholder="Conte um pouco sobre sua experiência e por que quer fazer parte do time..." value={form.mensagem}
                    onChange={e => setForm(f => ({...f, mensagem: e.target.value}))}
                    className="w-full resize-none rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none focus:border-[#1DB954] focus:bg-white" />
                </div>
                <button onClick={enviar} disabled={loading || !form.nome || !form.email || !form.telefone}
                  className="w-full rounded-xl bg-[#1DB954] py-3 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40] disabled:opacity-60 transition-all">
                  {loading ? "Enviando..." : "📩 Enviar candidatura"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-[#1a1a2e] px-[7%] py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#6b7280]">© 2026 Crédito Gold Soluções Financeiras</p>
          <SocialBar label="" dark={true} size="sm" />
        </div>
      </footer>
    </div>
  )
}
