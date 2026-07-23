"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"

const TIPO_CONFIG = {
  LEAD_NOVO:          { label:"Novo Lead",           icon:"👤", color:"#1d4ed8", bg:"#dbeafe" },
  LEAD_APROVADO:      { label:"Lead Aprovado",        icon:"✅", color:"#15803d", bg:"#dcfce7" },
  LEAD_RECUSADO:      { label:"Lead Recusado",        icon:"❌", color:"#dc2626", bg:"#fee2e2" },
  COMISSAO_GERADA:    { label:"Comissão Gerada",      icon:"💰", color:"#FF6B00", bg:"#fff3e8" },
  DOCUMENTO_VENCENDO: { label:"Documento Vencendo",   icon:"📋", color:"#92400e", bg:"#fef3c7" },
  SISTEMA:            { label:"Sistema",              icon:"🔔", color:"#475569", bg:"#f1f5f9" },
}

const CANAL_CONFIG = {
  WHATSAPP: { label:"WhatsApp", icon:"💬", color:"#25D366" },
  SISTEMA:  { label:"Sistema",  icon:"🔔", color:"#475569" },
  EMAIL:    { label:"E-mail",   icon:"✉️", color:"#1d4ed8" },
  TODOS:    { label:"Todos",    icon:"📣", color:"#FF6B00" },
}

interface Notificacao {
  id:string; tipo:string; titulo:string; mensagem:string
  canal:string; lida:boolean; enviadaZapi:boolean; zapiStatus?:string
  leadId?:string; createdAt:string
}

function tempoRelativo(data: string) {
  const diff = Date.now() - new Date(data).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return "Agora"
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h}h atrás`
  const d = Math.floor(h / 24)
  return `${d}d atrás`
}

export default function NotificacoesPage() {
  const [notifs, setNotifs]       = useState<Notificacao[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroLida, setFiltroLida] = useState("")
  const [testando, setTestando]   = useState(false)
  const [msgTeste, setMsgTeste]   = useState("")

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/notificacoes?dest=admin")
      const json = await res.json()
      if (json.success) {
        setNotifs(json.data.notificacoes ?? [])
        setTotal(json.data.totalNaoLidas ?? 0)
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  async function marcarLida(id: string) {
    await fetch(`/api/admin/notificacoes/${id}`, { method:"PATCH" })
    setNotifs(prev => prev.map(n => n.id === id ? {...n, lida:true} : n))
    setTotal(t => Math.max(0, t - 1))
  }

  async function lerTodas() {
    await fetch("/api/admin/notificacoes/ler-todas", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ dest:"admin" }),
    })
    setNotifs(prev => prev.map(n => ({...n, lida:true})))
    setTotal(0)
  }

  async function excluir(id: string) {
    await fetch(`/api/admin/notificacoes/${id}`, { method:"DELETE" })
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  async function testarZapi() {
    setTestando(true); setMsgTeste("")
    try {
      const res  = await fetch("/api/admin/notificacoes/check-documentos", {
        method:"POST",
        headers:{"x-cron-secret": "test"},
      })
      const json = await res.json()
      setMsgTeste(json.success ? `✅ ${json.message}` : `❌ ${json.message}`)
      if (json.success) fetchNotifs()
    } catch { setMsgTeste("❌ Erro de conexão") }
    finally { setTestando(false) }
  }

  const filtradas = notifs.filter(n => {
    if (filtroTipo && n.tipo   !== filtroTipo)           return false
    if (filtroLida === "nao"   && n.lida)                return false
    if (filtroLida === "lidas" && !n.lida)               return false
    return true
  })

  const naoLidas = notifs.filter(n => !n.lida).length

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">
              🔔 Notificações
              {naoLidas > 0 && (
                <span className="ml-2 rounded-full bg-[#FF6B00] px-2 py-0.5 font-['Sora'] text-sm text-white">
                  {naoLidas}
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Central de notificações e alertas do sistema</p>
          </div>
          <div className="flex gap-2">
            {naoLidas > 0 && (
              <button onClick={lerTodas}
                className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
                ✓ Marcar todas como lidas
              </button>
            )}
            <button onClick={fetchNotifs}
              className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
              ↻ Atualizar
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Total",         value: notifs.length,                                       accent:"#1DB954" },
            { label:"Não lidas",     value: naoLidas,                                             accent:"#FF6B00" },
            { label:"Via WhatsApp",  value: notifs.filter(n => n.canal === "WHATSAPP").length,    accent:"#25D366" },
            { label:"Documentos",    value: notifs.filter(n => n.tipo === "DOCUMENTO_VENCENDO").length, accent:"#92400e" },
          ].map(k => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white p-5">
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{loading ? "..." : k.value}</div>
            </div>
          ))}
        </div>

        {/* Config Z-API */}
        <div className="mb-5 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">💬 Integração Z-API (WhatsApp)</div>
              <div className="mt-0.5 font-['Sora'] text-xs text-[#9ca3af]">
                Configure as variáveis de ambiente no Vercel para ativar os envios automáticos
              </div>
            </div>
            <div className="flex items-center gap-3">
              {msgTeste && (
                <span className={`font-['Sora'] text-xs font-bold ${msgTeste.startsWith("✅") ? "text-[#0f9c40]" : "text-red-500"}`}>
                  {msgTeste}
                </span>
              )}
              <button onClick={testarZapi} disabled={testando}
                className="rounded-full bg-[#25D366] px-4 py-2 font-['Sora'] text-xs font-bold text-white hover:bg-[#1db954] disabled:opacity-60">
                {testando ? "Testando..." : "🧪 Testar envio"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { var:"ZAPI_INSTANCE_ID",  desc:"ID da instância"       },
              { var:"ZAPI_TOKEN",         desc:"Token de autenticação" },
              { var:"ZAPI_CLIENT_TOKEN",  desc:"Client-Token (security)"},
              { var:"ADMIN_WHATSAPP",     desc:"Número do admin (DDI+DDD+número)" },
            ].map(v => (
              <div key={v.var} className="rounded-xl bg-[#f4f6f8] px-3 py-2.5">
                <div className="font-mono text-[0.65rem] font-bold text-[#0D1B2A]">{v.var}</div>
                <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_CONFIG).map(([k,v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          <select value={filtroLida} onChange={e => setFiltroLida(e.target.value)}
            className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 text-sm outline-none focus:border-[#1DB954]">
            <option value="">Todas</option>
            <option value="nao">Não lidas</option>
            <option value="lidas">Lidas</option>
          </select>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {loading ? Array(6).fill(0).map((_,i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white border border-[#e5e7eb]" />
          )) : filtradas.length === 0 ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white py-20 text-center">
              <div className="text-4xl mb-3">🔔</div>
              <p className="font-['Sora'] text-sm text-[#9ca3af]">Nenhuma notificação encontrada</p>
            </div>
          ) : filtradas.map(n => {
            const tc   = TIPO_CONFIG[n.tipo as keyof typeof TIPO_CONFIG] ?? TIPO_CONFIG.SISTEMA
            const canal = CANAL_CONFIG[n.canal as keyof typeof CANAL_CONFIG] ?? CANAL_CONFIG.SISTEMA
            return (
              <div key={n.id}
                className={`flex items-start gap-4 rounded-2xl border-2 bg-white p-4 transition-all ${
                  !n.lida ? "border-[#FF6B00]/30 bg-[#fff8f3]" : "border-[#e5e7eb]"
                }`}>

                {/* Ícone tipo */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ background: tc.bg }}>
                  {tc.icon}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">{n.titulo}</span>
                      {!n.lida && (
                        <span className="ml-2 rounded-full bg-[#FF6B00] px-1.5 py-0.5 font-['Sora'] text-[0.55rem] font-bold text-white">
                          NOVA
                        </span>
                      )}
                    </div>
                    <span className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">
                      {tempoRelativo(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 font-['Sora'] text-xs text-[#6b7280]">{n.mensagem}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold"
                      style={{ background: tc.bg, color: tc.color }}>
                      {tc.label}
                    </span>
                    <span className="font-['Sora'] text-[0.6rem] font-bold" style={{ color: canal.color }}>
                      {canal.icon} {canal.label}
                    </span>
                    {n.enviadaZapi && (
                      <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold text-[#15803d]">
                        ✓ Enviada
                      </span>
                    )}
                    {n.leadId && (
                      <a href={`/admin/leads?id=${n.leadId}`}
                        className="font-['Sora'] text-[0.6rem] font-bold text-[#1DB954] hover:underline">
                        Ver lead →
                      </a>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-shrink-0 flex-col gap-1.5">
                  {!n.lida && (
                    <button onClick={() => marcarLida(n.id)}
                      className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all">
                      ✓ Lida
                    </button>
                  )}
                  <button onClick={() => excluir(n.id)}
                    className="rounded-lg bg-[#fee2e2] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-all">
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>

      </main>
    </div>
  )
}
