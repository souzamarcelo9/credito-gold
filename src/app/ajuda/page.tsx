"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { SocialBar } from "@/components/ui/SocialBar"

const SECOES = [
  { key:"geral",     label:"❓ Perguntas Gerais"     },
  { key:"afiliados", label:"🔗 Programa de Afiliados" },
  { key:"credito",   label:"💰 Crédito e Produtos"    },
  { key:"conta",     label:"👤 Minha Conta"           },
  { key:"lgpd",      label:"🔒 Privacidade e LGPD"    },
  { key:"contato",   label:"📞 Fale Conosco"          },
]

const FAQS: Record<string, Array<{ q: string; a: string }>> = {
  geral: [
    { q:"O que é a Crédito Gold?", a:"A Crédito Gold é uma plataforma digital de soluções financeiras que conecta pessoas e empresas às melhores opções de crédito do mercado. Trabalhamos com bancos e promotoras parceiras para oferecer crédito pessoal, consignado, com garantia de imóvel, empresarial, antecipação de FGTS e empréstimo na conta de luz." },
    { q:"A Crédito Gold é regulamentada?", a:"Sim. Atuamos em conformidade com as normas do Banco Central do Brasil (Bacen) e seguimos todas as diretrizes da Lei Geral de Proteção de Dados (LGPD). Nossos parceiros bancários são instituições financeiras devidamente autorizadas pelo Bacen." },
    { q:"Como funciona o processo de solicitação de crédito?", a:"É simples: (1) Simule online e descubra as melhores condições; (2) Preencha o formulário com seus dados; (3) Nossa equipe analisa seu perfil e apresenta uma proposta; (4) Com a aprovação, o crédito é liberado na sua conta. Tudo 100% digital, sem filas e sem papelada." },
    { q:"Quanto tempo demora para receber a resposta?", a:"Nossa equipe retorna em até 2 horas úteis após o envio da solicitação. Após a aprovação, o crédito é liberado em até 24 horas dependendo do produto e do banco parceiro." },
    { q:"Preciso consultar o SPC/Serasa para fazer uma simulação?", a:"Não. A simulação é gratuita e sem consulta ao SPC/Serasa. A análise de crédito só é realizada após você aceitar uma proposta e avançar no processo." },
    { q:"Quais documentos são necessários?", a:"Os documentos variam por produto, mas geralmente são: RG ou CNH, CPF, comprovante de renda (holerite, extrato bancário ou declaração de IR) e comprovante de residência. Para crédito com garantia de imóvel, também é necessária a matrícula do imóvel." },
  ],
  afiliados: [
    { q:"O que é o Programa de Afiliados?", a:"O Programa de Afiliados permite que qualquer pessoa ganhe comissões ao indicar clientes para a Crédito Gold. Você recebe um link exclusivo e rastreado — cada cliente que contratar crédito pelo seu link gera uma comissão para você, paga via PIX." },
    { q:"Como me cadastrar como afiliado?", a:"Acesse a página Afiliados, preencha o formulário com seus dados (nome, CPF, telefone e e-mail), crie uma senha e clique em 'Gerar link'. Após a aprovação do seu cadastro, seu link já estará ativo e pronto para compartilhar." },
    { q:"Como e quando recebo minha comissão?", a:"As comissões são pagas via PIX em até 30 dias após a confirmação da liberação do crédito ao cliente indicado. Você acompanha o status de cada indicação e o saldo de comissões diretamente no seu painel." },
    { q:"Como funciona o rastreamento das minhas indicações?", a:"Cada afiliado recebe um link único (ex: creditogold.com.br/ref/seulink). Quando alguém acessa pelo seu link e contrata um produto, a indicação é registrada automaticamente, vinculando o lead ao seu perfil." },
    { q:"Existe um limite de indicações?", a:"Não há limite. Quanto mais você indicar, mais você ganha. Não há teto de comissões." },
    { q:"Posso acompanhar minhas indicações em tempo real?", a:"Sim. No painel do afiliado você visualiza: total de cliques no seu link, leads gerados, quantos foram aprovados, o valor acumulado em comissões e o status de cada indicação." },
  ],
  credito: [
    { q:"Quais produtos de crédito a Crédito Gold oferece?", a:"Oferecemos: Crédito Pessoal, Crédito com Garantia de Imóvel, Crédito Empresarial, Consignado, Antecipação de FGTS e Empréstimo na Conta de Luz." },
    { q:"Qual é o valor mínimo e máximo de crédito?", a:"Os valores variam por produto: Crédito Pessoal (R$ 500 a R$ 50.000), Com Garantia (R$ 10.000 a R$ 500.000), Empresarial (R$ 5.000 a R$ 200.000), Consignado (R$ 500 a R$ 30.000), FGTS (R$ 500 a R$ 15.000) e Empréstimo na Conta de Luz (R$ 300 a R$ 4.000)." },
    { q:"Quais são as taxas de juros?", a:"As taxas variam por produto, perfil do cliente e banco parceiro. No simulador você consegue uma estimativa personalizada. As taxas partem de 0,89% a.m. para crédito com garantia de imóvel e vão até 3,49% a.m. para o empréstimo na conta de luz." },
    { q:"O que é o Empréstimo na Conta de Luz?", a:"É um produto inovador que utiliza sua conta de energia elétrica como garantia. Não precisa de consulta ao SPC/Serasa — a análise é feita com base no histórico de pagamento da sua conta. O valor é descontado diretamente nas faturas seguintes." },
    { q:"Posso quitar o crédito antes do prazo?", a:"Sim. A quitação antecipada é um direito garantido pelo Código de Defesa do Consumidor e pelo Banco Central. Ao quitar antecipadamente, você recebe desconto proporcional nos juros." },
    { q:"O crédito é liberado direto na minha conta?", a:"Sim, na maioria dos produtos o valor é depositado diretamente na sua conta bancária. No Empréstimo na Conta de Luz, o crédito é concedido via desconto na fatura de energia." },
  ],
  conta: [
    { q:"Como acesso minha conta?", a:"Clique em 'Entrar' no menu superior, informe seu e-mail e senha cadastrados. Se for afiliado, use a aba 'Afiliado' no login." },
    { q:"Esqueci minha senha. O que faço?", a:"Na tela de login, clique em 'Esqueci minha senha'. Você receberá um e-mail com as instruções para redefinir. Se não receber, verifique a pasta de spam ou entre em contato pelo WhatsApp." },
    { q:"Como atualizo meus dados cadastrais?", a:"No painel do afiliado, acesse 'Meu Perfil' para atualizar seus dados. Para alterações em dados sensíveis (CPF, conta bancária), entre em contato com nossa equipe pelo WhatsApp para verificação de segurança." },
    { q:"Meus dados estão seguros?", a:"Sim. Utilizamos criptografia AES-256 para dados sensíveis como CPF, comunicação via HTTPS/SSL e seguimos rigorosamente a LGPD. Nunca compartilhamos seus dados com terceiros sem sua autorização." },
    { q:"Como solicito a exclusão da minha conta?", a:"Você pode solicitar a exclusão dos seus dados a qualquer momento, conforme previsto na LGPD. Envie sua solicitação para privacidade@creditogold.com.br. Processamos em até 15 dias úteis." },
  ],
  lgpd: [
    { q:"O que é a LGPD?", a:"A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) é a legislação brasileira que regula o tratamento de dados pessoais, com o objetivo de proteger os direitos fundamentais de liberdade, privacidade e o livre desenvolvimento da personalidade." },
    { q:"Quais dados a Crédito Gold coleta?", a:"Coletamos apenas os dados necessários para a prestação dos nossos serviços: dados de identificação (nome, CPF, RG), dados de contato (e-mail, telefone), dados financeiros (renda, finalidade do crédito) e dados de uso da plataforma. CPFs são armazenados criptografados com AES-256." },
    { q:"Para que usamos seus dados?", a:"Utilizamos seus dados para: análise e concessão de crédito, comunicação sobre sua solicitação, cumprimento de obrigações legais e regulatórias, prevenção à fraude e, com seu consentimento, envio de ofertas e novidades." },
    { q:"Quais são meus direitos como titular dos dados?", a:"Pela LGPD, você tem direito a: (1) Confirmação da existência de tratamento; (2) Acesso aos seus dados; (3) Correção de dados incompletos; (4) Anonimização, bloqueio ou eliminação; (5) Portabilidade; (6) Eliminação dos dados; (7) Informação sobre compartilhamento; (8) Revogação do consentimento." },
    { q:"A Crédito Gold compartilha meus dados com terceiros?", a:"Compartilhamos seus dados apenas com nossos bancos e promotoras parceiros para análise de crédito, e quando obrigados por lei. Nunca vendemos seus dados. Todos os parceiros são contratualmente obrigados a seguir a LGPD." },
    { q:"Por quanto tempo meus dados são armazenados?", a:"Mantemos seus dados pelo tempo necessário à prestação do serviço e pelo prazo legal exigido pelas autoridades regulatórias (geralmente 5 anos para dados financeiros, conforme resolução do Bacen)." },
    { q:"Como exercer meus direitos de titular?", a:"Envie sua solicitação para privacidade@creditogold.com.br informando: nome completo, CPF e tipo de solicitação (acesso, correção, exclusão, etc.). Respondemos em até 15 dias úteis." },
    { q:"Quem é o Encarregado de Proteção de Dados (DPO)?", a:"O DPO da Crédito Gold pode ser contatado pelo e-mail dpo@creditogold.com.br. Ele é responsável por receber comunicações da ANPD e dos titulares de dados." },
  ],
  contato: [],
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`overflow-hidden rounded-2xl border-2 transition-all duration-200 ${open ? "border-[#1DB954]" : "border-[#e5e7eb]"}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className={`font-['Sora'] text-sm font-semibold leading-snug ${open ? "text-[#1DB954]" : "text-[#0D1B2A]"}`}>{q}</span>
        <span className={`flex-shrink-0 text-xl font-light transition-transform duration-200 ${open ? "rotate-45 text-[#1DB954]" : "text-[#9ca3af]"}`}>+</span>
      </button>
      {open && (
        <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-5 py-4">
          <p className="text-sm leading-relaxed text-[#374151]">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function AjudaPage() {
  const [secao, setSecao] = useState("geral")

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLoginClick={() => window.location.href = "/login"} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1B2A] to-[#1a3040] px-[7%] pb-16 pt-[100px]">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-block rounded-full bg-[#1DB954]/15 px-5 py-1.5 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#1DB954]">
            Central de Ajuda
          </div>
          <h1 className="font-['Sora'] text-4xl font-extrabold text-white">
            Como podemos <span className="text-[#1DB954]">ajudar?</span>
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Encontre respostas rápidas sobre crédito, afiliados, privacidade e muito mais.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5">
            <span className="text-white/40">🔍</span>
            <span className="font-['Sora'] text-sm text-white/40">Navegue pelas categorias abaixo...</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="sticky top-[70px] z-30 border-b border-[#e5e7eb] bg-white px-[7%]">
        <div className="flex gap-1 overflow-x-auto py-2">
          {SECOES.map(s => (
            <button key={s.key} onClick={() => setSecao(s.key)}
              className={`flex-shrink-0 rounded-full px-4 py-2 font-['Sora'] text-sm font-bold transition-all ${
                secao === s.key
                  ? "bg-[#0D1B2A] text-white"
                  : "text-[#6b7280] hover:bg-[#f4f6f8] hover:text-[#0D1B2A]"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-[7%] py-16">
        <div className="mx-auto max-w-3xl">

          {/* FAQ padrão */}
          {secao !== "contato" && secao !== "lgpd" && (
            <div>
              <h2 className="mb-6 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">
                {SECOES.find(s => s.key === secao)?.label}
              </h2>
              <div className="space-y-3">
                {(FAQS[secao] ?? []).map((item, i) => (
                  <FAQItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          )}

          {/* LGPD — layout especial */}
          {secao === "lgpd" && (
            <div>
              <div className="mb-8 rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#1a3040] p-6 text-white">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1DB954]/20 text-2xl">🔒</div>
                  <div>
                    <div className="font-['Sora'] text-lg font-extrabold">Privacidade e LGPD</div>
                    <div className="font-['Sora'] text-sm text-white/60">Lei nº 13.709/2018</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/75">
                  Levamos a proteção dos seus dados a sério. Esta seção explica como tratamos suas informações em conformidade com a Lei Geral de Proteção de Dados Pessoais.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Transparência", "Segurança", "Seus Direitos", "Sem venda de dados"].map(t => (
                    <span key={t} className="rounded-full bg-[#1DB954]/20 px-3 py-1 font-['Sora'] text-xs font-bold text-[#1DB954]">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {FAQS.lgpd.map((item, i) => (
                  <FAQItem key={i} q={item.q} a={item.a} />
                ))}
              </div>

              {/* 8 direitos */}
              <div className="mt-8 rounded-2xl border-2 border-[#1DB954]/30 bg-[#f0fdf4] p-6">
                <div className="mb-4 font-['Sora'] text-base font-bold text-[#0D1B2A]">
                  📋 Seus 8 direitos garantidos pela LGPD
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Confirmar se seus dados são tratados",
                    "Acessar seus dados pessoais",
                    "Corrigir dados incompletos ou errados",
                    "Anonimizar ou bloquear dados desnecessários",
                    "Portabilidade para outro fornecedor",
                    "Eliminação dos dados com consentimento",
                    "Saber com quem compartilhamos seus dados",
                    "Revogar o consentimento a qualquer momento",
                  ].map((d, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#1DB954] font-['Sora'] text-[0.65rem] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-['Sora'] text-sm text-[#374151]">{d}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-[#1DB954]/20 pt-4 font-['Sora'] text-xs text-[#6b7280]">
                  Para exercer qualquer direito:{" "}
                  <a href="mailto:privacidade@creditogold.com.br" className="font-bold text-[#1DB954] hover:underline">
                    privacidade@creditogold.com.br
                  </a>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5">
                <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">🏛️ Autoridade Nacional de Proteção de Dados (ANPD)</div>
                <p className="mt-2 font-['Sora'] text-xs text-[#6b7280]">
                  Se entender que seus direitos não foram atendidos, você pode registrar reclamação junto à ANPD em{" "}
                  <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer"
                    className="font-bold text-[#1DB954] hover:underline">
                    www.gov.br/anpd
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Contato */}
          {secao === "contato" && (
            <div>
              <h2 className="mb-2 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">📞 Fale Conosco</h2>
              <p className="mb-8 text-[#6b7280]">Não encontrou o que procurava? Nossa equipe está pronta para ajudar.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon:"💬", title:"WhatsApp",         desc:"Atendimento de seg. a sex., 9h às 18h",  action:"Conversar agora",    href:"https://wa.me/5521999999999",             bg:"#e8f8ee", color:"#1DB954" },
                  { icon:"✉️", title:"E-mail",            desc:"Respondemos em até 1 dia útil",           action:"Enviar e-mail",      href:"mailto:contato@creditogold.com.br",       bg:"#e8f8ee", color:"#1DB954" },
                  { icon:"🔒", title:"Privacidade / LGPD",desc:"Solicitações de dados e direitos LGPD",  action:"Enviar solicitação", href:"mailto:privacidade@creditogold.com.br",   bg:"#e0f2fe", color:"#0891b2" },
                  { icon:"📋", title:"DPO",                desc:"Encarregado de Proteção de Dados",       action:"Contatar DPO",       href:"mailto:dpo@creditogold.com.br",          bg:"#ede9fe", color:"#6d28d9" },
                ].map(c => (
                  <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer"
                    className="group flex flex-col rounded-2xl border-2 border-[#e5e7eb] bg-white p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-[#1DB954]/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: c.bg }}>
                      {c.icon}
                    </div>
                    <div className="font-['Sora'] text-base font-bold text-[#0D1B2A]">{c.title}</div>
                    <div className="mt-1 flex-1 font-['Sora'] text-sm text-[#6b7280]">{c.desc}</div>
                    <div className="mt-4 font-['Sora'] text-sm font-bold" style={{ color: c.color }}>
                      {c.action} →
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-5">
                <div className="mb-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">🕐 Horário de atendimento</div>
                <div className="space-y-2">
                  {[
                    { dia:"Segunda a Sexta",    hora:"09h às 18h"      },
                    { dia:"Sábado",             hora:"09h às 13h"      },
                    { dia:"Domingo e Feriados", hora:"Sem atendimento" },
                  ].map(h => (
                    <div key={h.dia} className="flex justify-between font-['Sora'] text-sm">
                      <span className="text-[#6b7280]">{h.dia}</span>
                      <span className="font-bold text-[#0D1B2A]">{h.hora}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <footer className="bg-[#1a1a2e] px-[7%] py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#6b7280]">
            © 2026 Crédito Gold Soluções Financeiras · CNPJ 00.000.000/0001-00
          </p>
          <SocialBar label="" dark={true} size="sm" />
        </div>
      </footer>
    </div>
  )
}
