/**
 * Chatbot Crédito Gold — Fluxo implementado diretamente
 * Sem dependência do Typebot para processar mensagens
 * Sessões persistidas no Supabase
 */

// ── Estados do fluxo ────────────────────────────────────────────────
export type ChatStep =
  | "MENU"
  | "IDENTIFICACAO"
  | "NOME"
  | "CPF"
  | "WHATSAPP"
  | "OUTRO_WHATSAPP"
  | "CIDADE"
  | "PERFIL"
  | "LGPD"
  | "FINALIZADO"

export interface ChatSession {
  phone:       string
  step:        ChatStep
  produto:     string
  produtoLabel:string
  tipoCliente: string
  nome:        string
  cpf:         string
  telefone:    string
  cidade:      string
  perfil:      string
  updatedAt:   string
}

// ── Supabase ────────────────────────────────────────────────────────
async function supabase(path: string, opts: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = (process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  return fetch(`${url}/rest/v1/${path}`, {
    ...opts,
    headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json", ...(opts.headers ?? {}) },
  })
}

async function getSession(phone: string): Promise<ChatSession | null> {
  const res  = await supabase(`chat_sessions?phone=eq.${encodeURIComponent(phone)}&select=*`)
  const rows = await res.json()
  if (!Array.isArray(rows) || rows.length === 0) return null
  const row = rows[0]
  // Expira após 30 min de inatividade
  if (new Date(row.updated_at + "Z") < new Date(Date.now() - 30 * 60 * 1000)) {
    await deleteSession(phone)
    return null
  }
  return {
    phone:       row.phone,
    step:        row.step,
    produto:     row.produto      ?? "",
    produtoLabel:row.produto_label ?? "",
    tipoCliente: row.tipo_cliente  ?? "",
    nome:        row.nome          ?? "",
    cpf:         row.cpf           ?? "",
    telefone:    row.telefone      ?? phone,
    cidade:      row.cidade        ?? "",
    perfil:      row.perfil        ?? "",
    updatedAt:   row.updated_at,
  }
}

async function saveSession(s: ChatSession): Promise<void> {
  await supabase("chat_sessions", {
    method:  "POST",
    headers: { "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({
      phone:         s.phone,
      step:          s.step,
      produto:       s.produto,
      produto_label: s.produtoLabel,
      tipo_cliente:  s.tipoCliente,
      nome:          s.nome,
      cpf:           s.cpf,
      telefone:      s.telefone,
      cidade:        s.cidade,
      perfil:        s.perfil,
      updated_at:    new Date().toISOString(),
    }),
  })
}

async function deleteSession(phone: string): Promise<void> {
  await supabase(`chat_sessions?phone=eq.${encodeURIComponent(phone)}`, { method: "DELETE" })
}

// ── Validação de CPF ─────────────────────────────────────────────────
function validarCPF(cpf: string): boolean {
  const c = cpf.replace(/\D/g, "")
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  let s1 = 0, s2 = 0
  for (let i = 0; i < 9; i++) s1 += +c[i] * (10 - i)
  let r1 = (s1 * 10) % 11; if (r1 >= 10) r1 = 0
  for (let i = 0; i < 10; i++) s2 += +c[i] * (11 - i)
  let r2 = (s2 * 10) % 11; if (r2 >= 10) r2 = 0
  return r1 === +c[9] && r2 === +c[10]
}

// ── Mapeamentos ───────────────────────────────────────────────────────
const PRODUTO_MAP: Record<string, { label: string; key: string }> = {
  "1": { label: "Empréstimo Consignado",    key: "CONSIGNADO"  },
  "2": { label: "Antecipação do FGTS",      key: "FGTS"        },
  "3": { label: "Empréstimo Pessoal",        key: "PESSOAL"     },
  "4": { label: "Crédito Empresarial (PJ)", key: "EMPRESARIAL" },
  "5": { label: "Crédito na Conta de Luz",  key: "ENERGIA"     },
  "6": { label: "Refinanciamento",           key: "GARANTIA"    },
  "7": { label: "Cartão de Crédito",         key: "PESSOAL"     },
  "8": { label: "Consultar Margem",          key: "CONSIGNADO"  },
  "9": { label: "Parceiro",                  key: "PARCEIRO"    },
  "10":{ label: "Especialista",              key: "ESPECIALISTA"},
}

const PERFIL_MAP: Record<string, string> = {
  "1":"CLT", "2":"Servidor Público", "3":"Aposentado", "4":"Pensionista",
  "5":"Empresário", "6":"MEI", "7":"Autônomo", "8":"Outro",
}

// ── Mensagens ────────────────────────────────────────────────────────
const MSG = {
  MENU: `👋 Olá! Seja bem-vindo(a) à *Crédito Gold®*.

É um prazer ter você conosco! 😊

Somos especialistas em encontrar as melhores soluções de crédito para pessoas físicas e empresas.

Para começar, digite o número do serviço desejado:

1️⃣ Empréstimo Consignado
2️⃣ Antecipação do FGTS
3️⃣ Empréstimo Pessoal
4️⃣ Crédito Empresarial (PJ)
5️⃣ Crédito na Conta de Luz
6️⃣ Refinanciamento
7️⃣ Cartão de Crédito
8️⃣ Consultar Margem de Crédito
9️⃣ Seja um Parceiro
🔟 Falar com um Especialista`,

  MENU_INVALIDO: "⚠️ Opção inválida. Por favor, digite um número de *1 a 10*.",

  IDENTIFICACAO: (produto: string) => `Perfeito! 😊

Você selecionou: *${produto}*

Antes de continuarmos, informe:

1️⃣ Já sou cliente da Crédito Gold
2️⃣ Sou um novo cliente`,

  NOME: "📝 Por favor, informe seu *Nome Completo*.",

  CPF: "🔢 Agora informe seu *CPF* (somente números).",

  CPF_INVALIDO: "❌ CPF inválido. Por favor, informe um CPF válido com 11 dígitos (somente números).",

  WHATSAPP: "📱 Este número é o melhor WhatsApp para contato?\n\n1️⃣ Sim\n2️⃣ Não, desejo informar outro número",

  OUTRO_WHATSAPP: "📲 Informe o número de WhatsApp para contato com DDD (somente números):\n\nEx: 21999999999",

  CIDADE: "📍 Informe sua *cidade e estado*.\n\nExemplo: *Brasília - DF*",

  PERFIL: `👤 Para encontrarmos as melhores opções de crédito para você, informe seu perfil:

1️⃣ CLT
2️⃣ Servidor Público
3️⃣ Aposentado
4️⃣ Pensionista
5️⃣ Empresário
6️⃣ MEI
7️⃣ Autônomo
8️⃣ Outro`,

  LGPD: `🔒 *Autorização para Tratamento de Dados (LGPD)*

Para que a Crédito Gold possa identificar as melhores opções de crédito disponíveis para o seu perfil, será necessário realizar o tratamento dos dados informados e, quando necessário, consultas junto às instituições financeiras parceiras e bases autorizadas, sempre em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

Seus dados serão utilizados exclusivamente para análise e oferta de produtos financeiros, sendo armazenados de forma segura.

✅ Você autoriza o tratamento dos seus dados para análise de crédito?

1️⃣ Sim, autorizo.
2️⃣ Não autorizo.`,

  LGPD_RECUSADO: `Entendemos sua decisão.

Sem essa autorização não será possível realizar a análise de crédito ou consultar as melhores ofertas disponíveis.

Caso mude de ideia, estaremos à disposição.

Obrigado por entrar em contato com a Crédito Gold®. 💚`,

  FINALIZADO: (nome: string) => `✅ *Obrigado, ${nome}!*

Recebemos todas as suas informações com sucesso.

Seu cadastro foi encaminhado para um de nossos especialistas, que realizará uma análise do seu perfil e entrará em contato o mais breve possível para apresentar as melhores opções de crédito disponíveis.

Agradecemos a confiança na *Crédito Gold®*.

Até breve! 💚`,

  REDES: `📲 Enquanto isso, acompanhe nossas redes sociais e fique por dentro das melhores oportunidades!

📸 Instagram: https://instagram.com/creditogold
🎵 TikTok: https://tiktok.com/@creditogold
💼 LinkedIn: https://linkedin.com/company/creditogold
▶️ YouTube: https://youtube.com/@creditogold

Até logo! 💛`,
}

// ── Cria lead no sistema ──────────────────────────────────────────────
async function criarLead(session: ChatSession): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://credito-gold-pi.vercel.app"
    await fetch(`${baseUrl}/api/webhook/typebot`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "x-typebot-secret": process.env.TYPEBOT_SECRET ?? "cg-typebot-2026" },
      body: JSON.stringify({
        nome:              session.nome,
        cpf:               session.cpf,
        telefone:          session.telefone,
        cidade:            session.cidade,
        produto:           session.produto,
        produtoLabel:      session.produtoLabel,
        perfil:            session.perfil,
        tipoCliente:       session.tipoCliente,
        consentimentoLGPD: true,
        consentimentoData: new Date().toISOString(),
        canal:             "WHATSAPP",
        origem:            "whatsapp",
      }),
    })
    console.log("[chatbot] Lead criado:", session.nome)
  } catch (e: any) {
    console.error("[chatbot] Erro ao criar lead:", e.message)
  }
}

// ── Processador principal ────────────────────────────────────────────
export async function processarMensagem(phone: string, texto: string): Promise<string[]> {
  const msg   = texto.trim()
  let session = await getSession(phone)

  // Sem sessão ou digitou "menu" → inicia do zero
  if (!session || msg.toLowerCase() === "menu") {
    const nova: ChatSession = {
      phone, step: "MENU", produto: "", produtoLabel: "",
      tipoCliente: "", nome: "", cpf: "", telefone: phone,
      cidade: "", perfil: "", updatedAt: new Date().toISOString(),
    }
    await saveSession(nova)
    return [MSG.MENU]
  }

  // Processa de acordo com o step atual
  switch (session.step) {

    case "MENU": {
      const prod = PRODUTO_MAP[msg]
      if (!prod) return [MSG.MENU_INVALIDO]
      session.produto     = prod.key
      session.produtoLabel = prod.label
      session.step        = "IDENTIFICACAO"
      await saveSession(session)
      return [MSG.IDENTIFICACAO(prod.label)]
    }

    case "IDENTIFICACAO": {
      if (msg !== "1" && msg !== "2") return ["Por favor, digite *1* ou *2*."]
      session.tipoCliente = msg === "1" ? "CLIENTE" : "NOVO"
      session.step        = "NOME"
      await saveSession(session)
      return [MSG.NOME]
    }

    case "NOME": {
      if (msg.length < 3) return ["Por favor, informe seu nome completo."]
      session.nome = msg
      session.step = "CPF"
      await saveSession(session)
      return [MSG.CPF]
    }

    case "CPF": {
      if (!validarCPF(msg)) return [MSG.CPF_INVALIDO]
      session.cpf  = msg.replace(/\D/g, "")
      session.step = "WHATSAPP"
      await saveSession(session)
      return [MSG.WHATSAPP]
    }

    case "WHATSAPP": {
      if (msg === "1") {
        session.telefone = phone
        session.step     = "CIDADE"
        await saveSession(session)
        return [MSG.CIDADE]
      }
      if (msg === "2") {
        session.step = "OUTRO_WHATSAPP"
        await saveSession(session)
        return [MSG.OUTRO_WHATSAPP]
      }
      return ["Por favor, digite *1* ou *2*."]
    }

    case "OUTRO_WHATSAPP": {
      const tel = msg.replace(/\D/g, "")
      if (tel.length < 10) return ["Número inválido. Por favor, informe com DDD. Ex: 21999999999"]
      session.telefone = tel
      session.step     = "CIDADE"
      await saveSession(session)
      return [MSG.CIDADE]
    }

    case "CIDADE": {
      if (msg.length < 3) return ["Por favor, informe sua cidade e estado. Ex: *São Paulo - SP*"]
      session.cidade = msg
      session.step   = "PERFIL"
      await saveSession(session)
      return [MSG.PERFIL]
    }

    case "PERFIL": {
      const perfil = PERFIL_MAP[msg]
      if (!perfil) return ["Por favor, digite um número de *1 a 8*."]
      session.perfil = perfil
      session.step   = "LGPD"
      await saveSession(session)
      return [MSG.LGPD]
    }

    case "LGPD": {
      if (msg === "2") {
        await deleteSession(phone)
        return [MSG.LGPD_RECUSADO]
      }
      if (msg !== "1") return ["Por favor, digite *1* para autorizar ou *2* para recusar."]
      // Cria lead e finaliza
      session.step = "FINALIZADO"
      await saveSession(session)
      await criarLead(session)
      await deleteSession(phone)
      return [MSG.FINALIZADO(session.nome), MSG.REDES]
    }

    default:
      await deleteSession(phone)
      return [MSG.MENU]
  }
}
