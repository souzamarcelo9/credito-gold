"use client"

import { useRouter } from "next/navigation"

import { Navbar } from "@/components/layout/Navbar"
import { SocialBar } from "@/components/ui/SocialBar"

const POSTS = [
  { slug:"fgts",        titulo:"Como antecipar seu FGTS de forma segura",             resumo:"Entenda como funciona a antecipação do FGTS, quais são os requisitos e como aproveitar essa modalidade com as melhores taxas.", categoria:"Educação Financeira", data:"15 Jan 2026", tempo:"5 min", icon:"💰", cor:"#1DB954" },
  { slug:"consignado",  titulo:"Crédito Consignado x Pessoal: qual escolher?",         resumo:"Descubra as diferenças entre as duas modalidades, taxas de juros, prazos e qual é a melhor opção para o seu perfil.", categoria:"Comparativos",        data:"08 Jan 2026", tempo:"7 min", icon:"⚖️", cor:"#FF6B00" },
  { slug:"conta-luz",   titulo:"Empréstimo na Conta de Luz: como funciona?",           resumo:"Uma modalidade inovadora que usa a conta de energia como garantia. Sem consulta ao SPC/Serasa e com aprovação rápida.", categoria:"Produtos",            data:"02 Jan 2026", tempo:"4 min", icon:"⚡", cor:"#1DB954" },
  { slug:"score",       titulo:"Score de crédito: como melhorar sua pontuação",        resumo:"Dicas práticas para aumentar seu score e conseguir melhores condições de crédito no mercado financeiro.", categoria:"Dicas",               data:"28 Dez 2025", tempo:"6 min", icon:"📈", cor:"#FF6B00" },
  { slug:"empresarial", titulo:"Crédito empresarial para pequenas e médias empresas", resumo:"Como acessar crédito para capital de giro, expansão ou equipamentos. Guia completo para PMEs.", categoria:"Empresarial",         data:"20 Dez 2025", tempo:"8 min", icon:"🏢", cor:"#1DB954" },
  { slug:"refinanciamento", titulo:"Refinanciamento com garantia de imóvel: vale a pena?", resumo:"Entenda como usar seu imóvel como garantia para obter crédito com taxas muito menores.", categoria:"Produtos",            data:"12 Dez 2025", tempo:"5 min", icon:"🏠", cor:"#FF6B00" },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar onLoginClick={() => window.location.href = "/login"} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1B2A] to-[#1a3040] px-[7%] pb-16 pt-[100px]">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 inline-block rounded-full bg-[#1DB954]/15 px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1DB954]">Blog</div>
          <h1 className="font-['Sora'] text-4xl font-extrabold text-white">Educação <span className="text-[#1DB954]">Financeira</span></h1>
          <p className="mt-4 text-lg text-white/70">Dicas, guias e novidades para você tomar as melhores decisões financeiras.</p>
        </div>
      </section>

      {/* Posts */}
      <section className="px-[7%] py-16">
        <div className="mx-auto max-w-5xl">

          {/* Destaque */}
          <div className="mb-10 overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-sm hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all">
            <div className="grid md:grid-cols-[1fr_1.2fr]">
              <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#1a3040] p-10">
                <div className="text-center">
                  <div className="text-6xl mb-4">{POSTS[0].icon}</div>
                  <span className="rounded-full bg-[#1DB954]/20 px-3 py-1 font-['Sora'] text-xs font-bold text-[#1DB954]">Em destaque</span>
                </div>
              </div>
              <div className="p-8">
                <span className="rounded-full bg-[#e8f8ee] px-3 py-1 font-['Sora'] text-xs font-bold text-[#1DB954]">{POSTS[0].categoria}</span>
                <h2 className="mt-3 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{POSTS[0].titulo}</h2>
                <p className="mt-2 text-[#6b7280]">{POSTS[0].resumo}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-[#9ca3af]">
                  <span>📅 {POSTS[0].data}</span><span>⏱️ {POSTS[0].tempo} de leitura</span>
                </div>
                <div className="mt-5">
                  <span className="inline-block rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-sm font-bold text-white cursor-pointer hover:bg-[#0f9c40] transition-colors">
                    Ler artigo →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {POSTS.slice(1).map(post => (
              <div key={post.slug} className="group overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] cursor-pointer">
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#1a3040]">
                  <div className="text-4xl">{post.icon}</div>
                </div>
                <div className="p-5">
                  <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                    style={{ background: post.cor === "#1DB954" ? "#e8f8ee" : "#fff3e8", color: post.cor }}>
                    {post.categoria}
                  </span>
                  <h3 className="mt-3 font-['Sora'] text-base font-bold text-[#0D1B2A] group-hover:text-[#1DB954] transition-colors">{post.titulo}</h3>
                  <p className="mt-2 text-sm text-[#9ca3af] line-clamp-2">{post.resumo}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#9ca3af]">
                    <span>{post.data}</span><span>{post.tempo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-3xl bg-gradient-to-br from-[#0D1B2A] to-[#1a3040] p-10 text-center">
            <h2 className="font-['Sora'] text-2xl font-extrabold text-white">Fique por dentro das <span className="text-[#1DB954]">novidades</span></h2>
            <p className="mt-2 text-white/60">Dicas financeiras e ofertas exclusivas direto no seu WhatsApp.</p>
            <a href="https://wa.me/5561982503427" target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-[#25D366] px-8 py-3 font-['Sora'] text-sm font-bold text-white no-underline hover:bg-[#1db954] transition-colors">
              💬 Seguir no WhatsApp
            </a>
          </div>
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
