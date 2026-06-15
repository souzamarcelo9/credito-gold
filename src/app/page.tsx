"use client"

import { useState } from "react"
import { Navbar }          from "@/components/layout/Navbar"
import { SimuladorCard }   from "@/components/simulator/SimuladorCard"
import { LeadModal }       from "@/components/leads/LeadModal"
import { AnimatedSection } from "@/components/ui/AnimatedSection"
import { StatsCounter }    from "@/components/ui/StatsCounter"
import { FloatingParticles } from "@/components/ui/FloatingParticles"
import type { ProdutoKey } from "@/types"

interface SimulacaoSolicitada {
  produto: ProdutoKey; valor: number; parcelas: number; parcelaMensal: number
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [simulacao, setSimulacao] = useState<SimulacaoSolicitada | undefined>()

  function handleSolicitar(dados: SimulacaoSolicitada) {
    setSimulacao(dados); setModalOpen(true)
  }

  return (
    <>
      <Navbar onLoginClick={() => window.location.href = "/login"} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[#0D1B2A]" />
        {/* Fundo verde diagonal */}
        <div className="absolute left-0 top-0 h-full w-[52%] bg-[#1DB954]"
          style={{ clipPath:"polygon(0 0,100% 0,88% 100%,0 100%)" }} />
        {/* Barra laranja topo */}
        <div className="absolute right-0 top-0 h-2 w-full bg-[#FF6B00]" />
        {/* Partículas animadas */}
        <FloatingParticles />
        {/* Círculos decorativos pulsantes */}
        <div className="absolute -left-16 -top-16 h-64 w-64 animate-[pulse_4s_ease-in-out_infinite] rounded-full bg-white/5" />
        <div className="absolute bottom-20 left-[30%] h-48 w-48 animate-[pulse_6s_ease-in-out_infinite_1s] rounded-full bg-[#FF6B00]/10" />
        <div className="absolute right-10 top-32 h-32 w-32 animate-[pulse_5s_ease-in-out_infinite_2s] rounded-full bg-white/5" />

        <div className="relative z-10 grid min-h-screen grid-cols-1 items-center gap-8 px-[7%] pb-16 pt-[90px] md:grid-cols-2">
          {/* Left */}
          <div className="animate-[fadeUp_0.8s_ease_both]">
            <div className="mb-4 inline-flex animate-[fadeUp_0.6s_ease_both] items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
              ✦ Confiança & Agilidade
            </div>
            <h1 className="mb-5 font-['Sora'] text-[clamp(2.4rem,4vw,3.8rem)] font-extrabold leading-[1.05] text-white"
              style={{ animation:"fadeUp 0.8s 0.1s ease both" }}>
              Soluções<br />Financeiras<br />
              <span className="text-[#FF6B00] drop-shadow-sm">na palma da sua mão.</span>
            </h1>
            <p className="mb-8 max-w-[480px] text-lg leading-relaxed text-white/85"
              style={{ animation:"fadeUp 0.8s 0.2s ease both" }}>
              Crédito rápido, seguro e transparente para realizar seus sonhos.
              Simule agora e descubra a melhor oferta personalizada para você.
            </p>
            <div className="flex flex-wrap gap-3" style={{ animation:"fadeUp 0.8s 0.3s ease both" }}>
              {["100% Digital","Sem Burocracia","Aprovação Rápida"].map((label, i) => (
                <div key={label}
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 font-['Sora'] text-sm font-semibold text-white backdrop-blur-sm transition-transform hover:scale-105"
                  style={{ animationDelay:`${i*0.1}s` }}>
                  <span className="font-bold text-[#FF6B00]">✓</span> {label}
                </div>
              ))}
            </div>
          </div>
          {/* Right — Simulador */}
          <div style={{ animation:"fadeUp 0.9s 0.3s ease both" }}>
            <SimuladorCard onSolicitar={handleSolicitar} />
          </div>
        </div>

        {/* Seta animada para baixo */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-white backdrop-blur-sm">
            ↓
          </div>
        </div>
      </section>

      {/* ── STATS com contador animado ── */}
      <section className="bg-[#FF6B00] px-[7%] py-10">
        <StatsCounter stats={[
          { value:12500, prefix:"+",  suffix:"",   label:"Clientes atendidos",  decimals:0 },
          { value:48,    prefix:"R$ ", suffix:"M",  label:"Em crédito liberado", decimals:0 },
          { value:48,    prefix:"",    suffix:" ★", label:"Avaliação média",     decimals:1 },
          { value:98,    prefix:"",    suffix:"%",  label:"Taxa de aprovação",   decimals:0 },
        ]} />
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="bg-white px-[7%] py-20">
        <AnimatedSection animation="fade-up" className="mb-12 text-center">
          <div className="mb-3 inline-block rounded-full bg-[#e8f8ee] px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#0f9c40]">
            Como funciona
          </div>
          <h2 className="font-['Sora'] text-4xl font-extrabold text-[#0D1B2A]">
            Crédito aprovado em <span className="text-[#1DB954]">3 passos</span> simples
          </h2>
        </AnimatedSection>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { n:"01", color:"#1DB954", bg:"#e8f8ee", icon:"🖥️", title:"Simule online",      desc:"Use nosso simulador para descobrir as melhores condições e envie sua solicitação em minutos.", delay:0   },
            { n:"02", color:"#FF6B00", bg:"#fff3e8", icon:"📋", title:"Análise inteligente", desc:"Nossa equipe analisa seu perfil com tecnologia de ponta, garantindo a melhor oferta para você.",  delay:150 },
            { n:"03", color:"#1DB954", bg:"#e8f8ee", icon:"💰", title:"Receba seu crédito",  desc:"Com aprovação confirmada, o dinheiro é liberado na sua conta bancária em até 24 horas.",           delay:300 },
          ].map(step => (
            <AnimatedSection key={step.n} animation="fade-up" delay={step.delay}>
              <div className="group relative h-full overflow-hidden rounded-[20px] border-2 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
                style={{ borderColor:step.color+"30", background:step.bg }}>
                <span className="absolute right-6 top-4 font-['Sora'] text-6xl font-extrabold opacity-10 transition-all duration-300 group-hover:opacity-20 group-hover:scale-110"
                  style={{ color:step.color }}>{step.n}</span>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{ background:step.color }}>
                  <span>{step.icon}</span>
                </div>
                <h3 className="mb-2 font-['Sora'] text-lg font-bold text-[#0D1B2A]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[#6b7280]">{step.desc}</p>
                <div className="absolute bottom-0 left-0 h-1 w-0 rounded-full transition-all duration-500 group-hover:w-full"
                  style={{ background:step.color }} />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── PRODUTOS ── */}
      <section className="bg-[#0D1B2A] px-[7%] py-20">
        <AnimatedSection animation="fade-up" className="mb-12 text-center">
          <div className="mb-3 inline-block rounded-full bg-[#1DB954]/15 px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1DB954]">
            Nossos Produtos
          </div>
          <h2 className="font-['Sora'] text-4xl font-extrabold text-white">
            Soluções para <span className="text-[#FF6B00]">cada momento</span> da sua vida
          </h2>
        </AnimatedSection>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon:"👤", title:"Crédito Pessoal",      taxa:"1,99% a.m.", dest:false, delay:0   },
            { icon:"🏠", title:"Com Garantia",          taxa:"0,89% a.m.", dest:true,  delay:100 },
            { icon:"💼", title:"Crédito Empresarial",   taxa:"1,49% a.m.", dest:false, delay:200 },
            { icon:"🚗", title:"Financiamento Veículo", taxa:"0,99% a.m.", dest:false, delay:0   },
            { icon:"📱", title:"Antecipação FGTS",      taxa:"Sem juros",  dest:false, delay:100 },
            { icon:"🩺", title:"Consignado",             taxa:"1,45% a.m.", dest:false, delay:200 },
          ].map(p => (
            <AnimatedSection key={p.title} animation="zoom-in" delay={p.delay}>
              <div className={`group relative cursor-pointer rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] ${
                p.dest
                  ? "bg-[#1DB954]"
                  : "bg-white/5 border border-white/10 hover:border-[#1DB954]/50 hover:bg-white/8"
              }`}>
                {p.dest && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-[#FF6B00] px-3 py-0.5 font-['Sora'] text-[0.65rem] font-bold text-white whitespace-nowrap">
                    🏆 Mais Solicitado
                  </div>
                )}
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                  p.dest ? "bg-white/20" : "bg-[#1DB954]/10"
                }`}>{p.icon}</div>
                <h3 className="mb-1 font-['Sora'] text-lg font-bold text-white">{p.title}</h3>
                <p className={`font-['Sora'] text-sm font-bold ${p.dest ? "text-white/80" : "text-[#1DB954]"}`}>
                  A partir de {p.taxa}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── POR QUE ESCOLHER ── */}
      <section className="relative overflow-hidden bg-[#1DB954] px-[7%] py-20">
        <div className="absolute -right-20 -top-20 h-72 w-72 animate-[pulse_5s_ease-in-out_infinite] rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 animate-[pulse_7s_ease-in-out_infinite_1s] rounded-full bg-[#FF6B00]/20" />

        <div className="relative z-10 grid items-center gap-12 md:grid-cols-2">
          <AnimatedSection animation="fade-left">
            <div className="mb-3 inline-block rounded-full bg-white/20 px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white">
              Por que nos escolher
            </div>
            <h2 className="mb-5 font-['Sora'] text-4xl font-extrabold leading-tight text-white">
              Sua melhor opção em <span className="text-[#FF6B00]">crédito digital</span>
            </h2>
            <p className="text-lg leading-relaxed text-white/85">
              Combinamos tecnologia, transparência e agilidade para oferecer a melhor experiência financeira do mercado.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-right">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon:"⚡", title:"Aprovação Rápida",  desc:"Resposta em até 2 horas úteis",  delay:0   },
                { icon:"🔒", title:"100% Seguro",        desc:"Criptografia de ponta a ponta",  delay:100 },
                { icon:"📱", title:"100% Digital",       desc:"Sem papelada, sem filas",        delay:200 },
                { icon:"💳", title:"Sem Burocracia",     desc:"Processo simples e transparente",delay:300 },
              ].map(item => (
                <div key={item.title}
                  className="group rounded-2xl border border-white/20 bg-white/15 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
                  style={{ animationDelay:`${item.delay}ms` }}>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B00] text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {item.icon}
                  </div>
                  <div className="font-['Sora'] text-sm font-bold text-white">{item.title}</div>
                  <div className="mt-1 text-xs text-white/75">{item.desc}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── LEADS / CONTATO ── */}
      <section className="bg-white px-[7%] py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <AnimatedSection animation="fade-left">
            <div className="mb-3 inline-block rounded-full bg-[#fff3e8] px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#FF6B00]">
              Fale Conosco
            </div>
            <h2 className="mb-4 font-['Sora'] text-4xl font-extrabold leading-tight text-[#0D1B2A]">
              Receba a melhor oferta{" "}
              <span className="text-[#1DB954]">personalizada</span> para você
            </h2>
            <p className="mb-6 leading-relaxed text-[#6b7280]">
              Nossos especialistas entrarão em contato para encontrar a solução de crédito ideal para o seu perfil.
            </p>
            <ul className="space-y-3">
              {[
                "Atendimento personalizado por especialistas",
                "Resposta em até 2 horas úteis",
                "Sem consulta ao SPC/Serasa para simulação",
                "Proposta sem compromisso de aceite",
                "Dados protegidos pela LGPD",
              ].map((item, i) => (
                <li key={item}
                  className="flex items-center gap-3 text-sm text-[#374151]"
                  style={{ animation:`fadeUp 0.5s ${i*0.08}s ease both` }}>
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1DB954] text-xs font-bold text-white">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection animation="fade-right">
            <div className="rounded-3xl border-2 border-[#e5e7eb] bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_16px_60px_rgba(0,0,0,0.12)]">
              <h3 className="mb-5 font-['Sora'] text-xl font-bold text-[#0D1B2A]">Solicitar análise gratuita</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[#0D1B2A]">Nome</label>
                    <input className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f4f6f8] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white" placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[#0D1B2A]">WhatsApp</label>
                    <input className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f4f6f8] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white" placeholder="(21) 99999-9999" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[#0D1B2A]">E-mail</label>
                  <input type="email" className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f4f6f8] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white" placeholder="seu@email.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[#0D1B2A]">Produto</label>
                    <select className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f4f6f8] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white">
                      <option>Crédito Pessoal</option>
                      <option>Com Garantia</option>
                      <option>Empresarial</option>
                      <option>Consignado</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-['Sora'] text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[#0D1B2A]">Valor</label>
                    <input className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f4f6f8] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white" placeholder="R$ 10.000" />
                  </div>
                </div>
                <button onClick={() => setModalOpen(true)}
                  className="w-full rounded-xl bg-[#FF6B00] py-3.5 font-['Sora'] text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_16px_rgba(255,107,0,0.35)] transition-all hover:-translate-y-0.5 hover:bg-[#e06000] hover:shadow-[0_8px_24px_rgba(255,107,0,0.45)] active:translate-y-0">
                  Receber proposta gratuita →
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── AFILIADOS ── */}
      <section id="afiliados" className="relative overflow-hidden bg-[#0D1B2A] px-[7%] py-24">
        <div className="absolute right-0 top-0 h-full w-[45%] bg-[#FF6B00]/5"
          style={{ clipPath:"polygon(15% 0,100% 0,100% 100%,0 100%)" }} />
        <div className="absolute -left-20 bottom-0 h-72 w-72 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-[#1DB954]/8" />

        <AnimatedSection animation="fade-up" className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center gap-3">
            <div className="flex h-14 w-14 -rotate-6 items-center justify-center rounded-2xl bg-[#1DB954] text-2xl shadow-[0_6px_20px_rgba(29,185,84,0.4)] transition-transform hover:rotate-0 hover:scale-110">💬</div>
            <div className="mt-4 flex h-14 w-14 rotate-6 items-center justify-center rounded-2xl bg-[#FF6B00] text-2xl shadow-[0_6px_20px_rgba(255,107,0,0.4)] transition-transform hover:rotate-0 hover:scale-110">🔗</div>
          </div>
          <span className="mb-4 inline-block rounded-full bg-[#1DB954]/15 px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#1DB954]">
            Programa de Afiliados
          </span>
          <h2 className="mt-3 font-['Sora'] text-[clamp(2.4rem,4vw,3.5rem)] font-extrabold leading-tight text-white">
            Indique e <span className="text-[#1DB954]">ganhe</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-lg leading-relaxed text-[#94a3b8]">
            Junte-se a mais de 3.400 afiliados que geram renda extra. Cadastre-se, receba seu link exclusivo e comece a ganhar agora.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {[
              { icon:"💸", text:"Até R$ 350 por aprovação", bg:"#1DB954", delay:0   },
              { icon:"📅", text:"Pagamento semanal via PIX", bg:"#FF6B00", delay:100 },
              { icon:"📊", text:"Dashboard em tempo real",   bg:"#1DB954", delay:200 },
              { icon:"🔗", text:"Link exclusivo rastreado",  bg:"#FF6B00", delay:300 },
            ].map(b => (
              <div key={b.text}
                className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-105"
                style={{ animationDelay:`${b.delay}ms` }}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm" style={{ background:b.bg }}>{b.icon}</span>
                <span className="font-['Sora'] text-sm font-medium text-[#cbd5e1]">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href="/afiliados"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1DB954] px-8 py-4 font-['Sora'] text-base font-bold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(29,185,84,0.4)] no-underline transition-all hover:-translate-y-1 hover:bg-[#0f9c40] hover:shadow-[0_8px_32px_rgba(29,185,84,0.5)]">
              Quero ser afiliado →
            </a>
            <a href="/afiliados#como-funciona"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#FF6B00] bg-transparent px-8 py-4 font-['Sora'] text-base font-bold uppercase tracking-wide text-[#FF6B00] no-underline transition-all hover:-translate-y-1 hover:bg-[#FF6B00] hover:text-white">
              Saiba mais
            </a>
          </div>
        </AnimatedSection>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#060e18] px-[7%] pb-8 pt-16 text-white">
        <div className="mb-12 flex h-1.5 overflow-hidden rounded-full">
          <div className="flex-1 bg-[#1DB954]" /><div className="flex-1 bg-[#FF6B00]" /><div className="flex-1 bg-[#1DB954]" />
        </div>
        <div className="mb-12 grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <div className="font-['Sora'] text-xl font-extrabold">
              Crédito <span className="text-[#1DB954]">Gold</span><span className="text-[#FF6B00]">®</span>
            </div>
            <div className="mt-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.12em] text-[#475569]">Soluções Financeiras</div>
            <p className="mt-4 max-w-[280px] text-sm leading-relaxed text-[#94a3b8]">Crédito rápido, seguro e transparente. Regulamentado pelo Banco Central do Brasil.</p>
          </div>
          {[
            { title:"Produtos", links:["Crédito Pessoal","Com Garantia","Empresarial","Consignado","Antecipação FGTS"] },
            { title:"Empresa",  links:["Sobre nós","Programa de Afiliados","Blog","Trabalhe Conosco"] },
            { title:"Suporte",  links:["Central de Ajuda","Privacidade (LGPD)","Termos de Uso","WhatsApp"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="mb-4 font-['Sora'] text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}><a href="#" className="text-sm text-[#cbd5e1] no-underline transition-colors hover:text-[#1DB954]">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-[#475569]">© 2026 Crédito Gold. CNPJ 00.000.000/0001-00. Todos os direitos reservados.</p>
          <div className="flex gap-2">
            {["🔒 SSL","🏦 Bacen","📋 LGPD"].map(b => (
              <span key={b} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 font-['Sora'] text-[0.68rem] text-[#94a3b8]">{b}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* WhatsApp flutuante com pulso */}
      <a href="https://wa.me/5521999999999" target="_blank" rel="noopener noreferrer"
        className="fixed bottom-8 left-8 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 font-['Sora'] text-sm font-bold text-white shadow-[0_4px_20px_rgba(37,211,102,0.4)] no-underline transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(37,211,102,0.6)]"
        style={{ animation:"pulse 2.5s ease-in-out infinite" }}>
        💬 Falar no WhatsApp
      </a>

      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} simulacao={simulacao} />
    </>
  )
}
