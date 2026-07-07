"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { AnimatedSection } from "@/components/ui/AnimatedSection"
import { SimuladorEnergia } from "@/components/simulator/SimuladorEnergia"
import { SocialBar } from "@/components/ui/SocialBar"
import { formatCPF, formatPhone, formatCurrency } from "@/lib/utils"
import Link from "next/link"

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
]


export default function EnergiaPage() {
  const [step, setStep]       = useState<"simular"|"dados">("simular")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [refSlug, setRefSlug] = useState<string|null>(null)
  const [simulacao, setSimulacao] = useState({ valor: 1500, parcelas: 12, parcelaMensal: 0 })
  const [form, setForm] = useState({
    nome:"", cpf:"", telefone:"", email:"", cidade:"", estado:"SP",
  })
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref) setRefSlug(ref)
  }, [])

  function validate() {
    const e: Record<string,string> = {}
    if (form.nome.trim().length < 3)              e.nome     = "Nome obrigatório"
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(form.cpf)) e.cpf = "CPF inválido"
    if (form.telefone.length < 14)                e.telefone = "WhatsApp inválido"
    if (!form.cidade.trim())                      e.cidade   = "Cidade obrigatória"
    return e
  }

  function handleSolicitarSimulacao(dados: { valor: number; parcelas: number; parcelaMensal: number }) {
    setSimulacao(dados)
    setStep("dados")
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({}); setLoading(true)

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          nome:      form.nome,
          email:     form.email || "nao-informado@energia.com",
          cpf:       form.cpf,
          telefone:  form.telefone,
          produto:   "energia",
          valor:     simulacao.valor,
          parcelas:  simulacao.parcelas,
          parcelaMensal: simulacao.parcelaMensal,
          cidade:    form.cidade,
          estado:    form.estado,
          origem:    refSlug ? "afiliado" : "organico",
          afiliadoSlug: refSlug ?? undefined,
        }),
      })
      setSuccess(true)
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLoginClick={() => window.location.href = "/login"} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden pt-[70px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e1a] via-[#0f3d22] to-[#051a0e]" />
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-[#1DB954]/8" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 animate-[pulse_5s_ease-in-out_infinite_1s] rounded-full bg-[#FF6B00]/8" />

        <div className="relative z-10 grid min-h-[calc(100vh-70px)] grid-cols-1 items-center gap-8 px-[7%] py-16 md:grid-cols-2">

          {/* Esquerda — copy */}
          <div style={{ animation:"fadeUp 0.8s ease both" }}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/40 bg-[#FF6B00]/15 px-4 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#FF6B00]">
              ⚡ Novidade Exclusiva Crédito Gold
            </div>

            <h1 className="mb-4 font-['Sora'] text-[clamp(2.4rem,4.5vw,4rem)] font-extrabold leading-[1.05] text-white">
              Empréstimo na<br />
              <span className="text-[#1DB954]">Conta de Luz</span>
            </h1>

            <p className="mb-8 max-w-[480px] text-lg leading-relaxed text-white/75">
              Use sua conta de energia para solicitar crédito rápido, seguro e sem burocracia. Aprovação facilitada direto na sua fatura.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:"✅", text:"Aprovação facilitada"      },
                { icon:"✅", text:"Processo 100% online"      },
                { icon:"✅", text:"Dinheiro direto na conta"  },
                { icon:"✅", text:"Sem filas e sem burocracia"},
                { icon:"✅", text:"Atendimento especializado" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2.5 rounded-xl bg-white/8 px-3 py-2.5 backdrop-blur-sm">
                  <span className="text-[#1DB954] font-bold">{item.icon}</span>
                  <span className="font-['Sora'] text-sm font-medium text-white/90">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-6">
              {[
                { value:"R$ 300", label:"Mínimo" },
                { value:"R$ 4mil", label:"Máximo" },
                { value:"3,49%", label:"Taxa a.m." },
              ].map(s => (
                <div key={s.label}>
                  <div className="font-['Sora'] text-xl font-extrabold text-[#1DB954]">{s.value}</div>
                  <div className="font-['Sora'] text-xs text-white/50">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Direita — Simulador / Formulário */}
          <div style={{ animation:"fadeUp 0.9s 0.2s ease both" }}>
            {success ? (
              <div className="rounded-3xl bg-white p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f8ee] text-4xl">🎉</div>
                <h2 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">Solicitação recebida!</h2>
                <p className="mt-2 text-[#6b7280]">Nossa equipe entrará em contato em breve pelo WhatsApp informado.</p>
                <div className="mt-6 rounded-xl bg-[#e8f8ee] p-4">
                  <div className="font-['Sora'] text-sm font-bold text-[#0f9c40]">✓ Solicitação realizada com sucesso</div>
                  <div className="mt-1 font-['Sora'] text-xs text-[#6b7280]">Você receberá uma confirmação no WhatsApp</div>
                </div>
                <button onClick={() => { setSuccess(false); setStep("simular"); setForm({ nome:"", cpf:"", telefone:"", email:"", cidade:"", estado:"SP" }) }}
                  className="mt-6 font-['Sora'] text-sm text-[#9ca3af] hover:text-[#1DB954]">
                  Fazer nova solicitação
                </button>
              </div>
            ) : step === "simular" ? (
              <SimuladorEnergia onSolicitar={handleSolicitarSimulacao} />
            ) : (
              <div className="rounded-3xl bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#FF6B00]">Proposta Online</div>
                    <h2 className="font-['Sora'] text-lg font-extrabold text-[#0D1B2A]">Seus dados de contato</h2>
                  </div>
                  <button onClick={() => setStep("simular")}
                    className="rounded-full border-2 border-[#e5e7eb] px-3 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
                    ← Voltar
                  </button>
                </div>

                <div className="mb-4 mt-3 flex items-center justify-between rounded-xl bg-[#f0fdf4] px-4 py-3">
                  <div>
                    <div className="font-['Sora'] text-[0.6rem] font-bold uppercase text-[#9ca3af]">Valor solicitado</div>
                    <div className="font-['Sora'] text-base font-extrabold text-[#0D1B2A]">{formatCurrency(simulacao.valor)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-['Sora'] text-[0.6rem] font-bold uppercase text-[#9ca3af]">{simulacao.parcelas}x de</div>
                    <div className="font-['Sora'] text-base font-extrabold text-[#1DB954]">{formatCurrency(simulacao.parcelaMensal)}</div>
                  </div>
                </div>

                <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-[#f4f6f8]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#1DB954] to-[#FF6B00] transition-all duration-500" style={{ width:"100%" }} />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Nome Completo</label>
                    <input type="text" placeholder="Ex: João da Silva" value={form.nome}
                      onChange={e => setForm(f => ({...f, nome: e.target.value}))}
                      className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white ${errors.nome ? "border-red-400" : "border-[#e5e7eb]"}`} />
                    {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">CPF</label>
                    <input type="text" placeholder="000.000.000-00" value={form.cpf} maxLength={14}
                      onChange={e => setForm(f => ({...f, cpf: formatCPF(e.target.value)}))}
                      className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white ${errors.cpf ? "border-red-400" : "border-[#e5e7eb]"}`} />
                    {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">WhatsApp</label>
                    <input type="tel" placeholder="(00) 0 0000-0000" value={form.telefone} maxLength={16}
                      onChange={e => setForm(f => ({...f, telefone: formatPhone(e.target.value)}))}
                      className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white ${errors.telefone ? "border-red-400" : "border-[#e5e7eb]"}`} />
                    {errors.telefone && <p className="mt-1 text-xs text-red-500">{errors.telefone}</p>}
                  </div>

                  <div className="grid grid-cols-[1fr_100px] gap-3">
                    <div>
                      <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Cidade</label>
                      <input type="text" placeholder="Sua cidade" value={form.cidade}
                        onChange={e => setForm(f => ({...f, cidade: e.target.value}))}
                        className={`w-full rounded-xl border-2 bg-[#f9fafb] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white ${errors.cidade ? "border-red-400" : "border-[#e5e7eb]"}`} />
                      {errors.cidade && <p className="mt-1 text-xs text-red-500">{errors.cidade}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Estado</label>
                      <select value={form.estado} onChange={e => setForm(f => ({...f, estado: e.target.value}))}
                        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white">
                        {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>

                  <button onClick={handleSubmit} disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-[#1DB954] to-[#FF6B00] py-3.5 font-['Sora'] text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(29,185,84,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(29,185,84,0.4)] disabled:opacity-60">
                    {loading ? "Enviando..." : "Solicitar Empréstimo →"}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-center">
                    <span className="text-[#9ca3af] text-xs">🔒</span>
                    <p className="font-['Sora'] text-xs text-[#9ca3af]">Criptografia Segura SSL — Seus dados estão protegidos</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="bg-[#f9fafb] px-[7%] py-20">
        <AnimatedSection animation="fade-up" className="mb-12 text-center">
          <div className="mb-3 inline-block rounded-full bg-[#e8f8ee] px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#0f9c40]">
            Como funciona
          </div>
          <h2 className="font-['Sora'] text-3xl font-extrabold text-[#0D1B2A]">
            Simples, rápido e <span className="text-[#1DB954]">sem burocracia</span>
          </h2>
        </AnimatedSection>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { n:"01", icon:"📝", color:"#1DB954", title:"Preencha o formulário", desc:"Simule e informe nome, CPF, WhatsApp e cidade. Leva menos de 2 minutos.", delay:0   },
            { n:"02", icon:"📞", color:"#FF6B00", title:"Nossa equipe entra em contato", desc:"Um especialista entrará em contato pelo WhatsApp para orientar o processo.", delay:150 },
            { n:"03", icon:"📄", color:"#1DB954", title:"Dados da conta de luz", desc:"O correspondente coleta os dados da sua conta de energia durante o atendimento.", delay:300 },
            { n:"04", icon:"💰", color:"#FF6B00", title:"Crédito liberado", desc:"Aprovado, o valor é descontado diretamente na sua fatura de energia.", delay:450 },
          ].map(step => (
            <AnimatedSection key={step.n} animation="fade-up" delay={step.delay}>
              <div className="group relative h-full rounded-2xl border-2 border-[#e5e7eb] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
                style={{ borderTopColor: step.color, borderTopWidth:"3px" }}>
                <span className="absolute right-4 top-3 font-['Sora'] text-4xl font-extrabold opacity-[0.06]" style={{ color:step.color }}>{step.n}</span>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform group-hover:scale-110 group-hover:rotate-6"
                  style={{ background: step.color + "15" }}>{step.icon}</div>
                <h3 className="mb-1 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{step.title}</h3>
                <p className="text-xs leading-relaxed text-[#6b7280]">{step.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── BENEFÍCIOS ── */}
      <section className="bg-white px-[7%] py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <AnimatedSection animation="fade-left">
            <div className="mb-3 inline-block rounded-full bg-[#fff3e8] px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#FF6B00]">
              Por que escolher
            </div>
            <h2 className="mb-5 font-['Sora'] text-3xl font-extrabold leading-tight text-[#0D1B2A]">
              Crédito acessível para <span className="text-[#1DB954]">quem mais precisa</span>
            </h2>
            <ul className="space-y-4">
              {[
                { icon:"⚡", title:"Sem consulta ao SPC/Serasa",    desc:"Aprovação baseada no histórico de pagamento da sua conta de energia.", color:"#1DB954" },
                { icon:"💳", title:"Desconto direto na fatura",     desc:"O valor é descontado automaticamente, sem risco de esquecimento.",     color:"#FF6B00" },
                { icon:"🏠", title:"Para todas as concessionárias", desc:"Atendemos clientes de mais de 15 concessionárias em todo o Brasil.",   color:"#1DB954" },
                { icon:"📱", title:"Atendimento humanizado",        desc:"Um especialista acompanha cada etapa do processo pelo WhatsApp.",      color:"#FF6B00" },
              ].map(item => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ background: item.color + "15" }}>{item.icon}</span>
                  <div>
                    <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{item.title}</div>
                    <div className="text-xs leading-relaxed text-[#6b7280]">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection animation="fade-right">
            <div className="rounded-2xl bg-gradient-to-br from-[#0a2e1a] to-[#0f3d22] p-8 text-white">
              <div className="mb-6 font-['Sora'] text-lg font-bold">Condições do Empréstimo</div>
              <div className="space-y-4">
                {[
                  { label:"Valor mínimo",  value:"R$ 300,00"  },
                  { label:"Valor máximo",  value:"R$ 4.000,00" },
                  { label:"Taxa a partir de", value:"3,49% a.m." },
                  { label:"Prazo",         value:"6 a 24 meses" },
                  { label:"Liberação",     value:"Após faturamento" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <span className="font-['Sora'] text-sm text-white/60">{item.label}</span>
                    <span className="font-['Sora'] text-sm font-bold text-[#1DB954]">{item.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#1DB954] to-[#FF6B00] py-3 font-['Sora'] text-sm font-bold text-white transition-all hover:-translate-y-0.5">
                Solicitar agora →
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

       <footer className="bg-gradient-to-br from-[#0a2e1a] to-[#0f3d22] px-[7%] py-10">
        <div className="mb-12 flex h-1.5 overflow-hidden rounded-full">
          <div className="flex-1 bg-[#1DB954]" /><div className="flex-1 bg-[#FF6B00]" /><div className="flex-1 bg-[#1DB954]" />
        </div>
        <div className="mb-12 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="font-['Sora'] text-xl font-extrabold">
              Crédito <span className="text-[#1DB954]">Gold</span><span className="text-[#FF6B00]">®</span>
            </div>
            <div className="mt-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-[#6b7280]">Soluções Financeiras</div>
            <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-[#9ca3af]">Crédito rápido, seguro e transparente. Regulamentado pelo Banco Central do Brasil.</p>
          </div>
          {[
            { title:"Produtos", links:["Crédito Pessoal","Com Garantia","Empresarial","Consignado","Antecipação FGTS"] },
            { title:"Empresa",  links:["Sobre nós","Programa de Afiliados","Blog","Trabalhe Conosco"] },
            { title:"Suporte",  links:["Central de Ajuda","Privacidade (LGPD)","Termos de Uso","WhatsApp"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="mb-4 font-['Sora'] text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}><a href="#" className="text-sm text-[#9ca3af] no-underline transition-colors hover:text-[#1DB954]">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-['Sora'] text-lg font-bold text-white">Siga a <span className="text-[#FF6B00]">Crédito Gold</span></h3>
            <p className="font-['Sora'] text-sm text-white/60">Acompanhe nossas redes e fique por dentro das melhores oportunidades.</p>
          </div>
          <SocialBar label="" dark={true} size="sm" />
          <div className="flex gap-2">
              {["🔒 SSL","🏦 Bacen","📋 LGPD"].map(b => (
                <span key={b} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-['Sora'] text-[0.68rem] text-[#6b7280]">{b}</span>
              ))}
        </div>
        </div>              
      </footer>
      
       {/* Footer simples */}
      <footer className="bg-[#1a1a2e] px-[7%] py-6 text-center">        
           <p className="text-xs text-[#6b7280]">© 2026 Crédito Gold Soluções Financeiras CNPJ 00.000.000/0001-00. Todos os direitos reservados. ·{" "}
            <a href="/termos" className="text-[#1DB954] no-underline hover:underline">Termos de uso</a>
          {" · "}          
          </p>
      </footer>

      {/* ── REDES SOCIAIS — compacto ── */}
      {/* <section className="bg-gradient-to-br from-[#0a2e1a] to-[#0f3d22] px-[7%] py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-['Sora'] text-lg font-bold text-white">Siga a <span className="text-[#FF6B00]">Crédito Gold</span></h3>
            <p className="font-['Sora'] text-sm text-white/60">Acompanhe nossas redes e fique por dentro das melhores oportunidades.</p>
          </div>
          <SocialBar label="" dark={true} size="sm" />
        </div>
      </section> */}

      {/* Footer simples */}
      {/* <footer className="bg-[#1a1a2e] px-[7%] py-6 text-center">
        <p className="text-xs text-[#6b7280]">
          © 2026 Crédito Gold Soluções Financeiras CNPJ 00.000.000/0001-00·{" "}
          <a href="/termos" className="text-[#1DB954] no-underline hover:underline">Termos de uso</a>
          {" · "}
          <Link href="/" className="text-[#6b7280] no-underline hover:text-white">← Voltar ao site</Link>
        </p>
      </footer> */}
    </div>
  )
}
