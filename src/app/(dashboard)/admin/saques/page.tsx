"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"
import { formatCurrency } from "@/lib/utils"

const STATUS_CONFIG = {
  SOLICITADO: { label:"Solicitado", color:"#1d4ed8", bg:"#dbeafe", icon:"📋" },
  APROVADO:   { label:"Aprovado",   color:"#0f9c40", bg:"#e8f8ee", icon:"✅" },
  PAGO:       { label:"Pago",       color:"#15803d", bg:"#dcfce7", icon:"💰" },
  REJEITADO:  { label:"Rejeitado",  color:"#dc2626", bg:"#fee2e2", icon:"❌" },
  PENDENTE:   { label:"Pendente",   color:"#92400e", bg:"#fef3c7", icon:"⏳" },
}

const TIPO_PIX = ["CPF","CNPJ","EMAIL","TELEFONE","ALEATORIA"]

interface Saque {
  id:string; afiliadoId:string; valor:number; pixChave:string; pixTipo:string
  status:string; asaasId?:string; observacao?:string; solicitadoEm:string; pagoEm?:string
  afiliado?: { nome:string; email:string; telefone:string }
}

export default function SaquesPage() {
  const [saques, setSaques]       = useState<Saque[]>([])
  const [stats, setStats]         = useState({ total:0, solicitados:0, aprovados:0, pagos:0 })
  const [saldoAsaas, setSaldo]    = useState<{saldo:number; bloqueado:number}|null>(null)
  const [loading, setLoading]     = useState(true)
  const [statusF, setStatusF]     = useState("")
  const [selecionados, setSel]    = useState<Set<string>>(new Set())
  const [pagando, setPagando]     = useState(false)
  const [msg, setMsg]             = useState("")
  const [resultados, setResult]   = useState<any[]>([])

  const fetchSaques = useCallback(async () => {
    setLoading(true)
    try {
      const p   = new URLSearchParams()
      if (statusF) p.set("status", statusF)
      const res  = await fetch(`/api/admin/saques?${p}`)
      const json = await res.json()
      if (json.success) {
        setSaques(json.data.saques ?? [])
        setStats(json.data.stats ?? { total:0, solicitados:0, aprovados:0, pagos:0 })
        setSaldo(json.data.saldoAsaas)
      }
    } finally { setLoading(false) }
  }, [statusF])

  useEffect(() => { fetchSaques() }, [fetchSaques])

  async function alterarStatus(id: string, status: string, observacao?: string) {
    await fetch(`/api/admin/saques/${id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ status, observacao }),
    })
    fetchSaques()
  }

  function toggleSel(id: string) {
    setSel(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  function toggleTodos() {
    const aprovados = saques.filter(s => s.status === "APROVADO").map(s => s.id)
    if (selecionados.size === aprovados.length) {
      setSel(new Set())
    } else {
      setSel(new Set(aprovados))
    }
  }

  async function pagarSelecionados() {
    if (selecionados.size === 0) return
    if (!confirm(`Confirma o pagamento de ${selecionados.size} saque(s) via PIX?`)) return
    setPagando(true); setMsg(""); setResult([])
    try {
      const res  = await fetch("/api/admin/saques/pagar", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ids: Array.from(selecionados) }),
      })
      const json = await res.json()
      if (json.success) {
        setMsg(`✅ ${json.message}`)
        setResult(json.data.resultados ?? [])
        setSel(new Set())
        fetchSaques()
      } else {
        setMsg(`❌ ${json.message}`)
      }
    } catch { setMsg("❌ Erro de conexão") }
    finally { setPagando(false) }
  }

  const aprovados = saques.filter(s => s.status === "APROVADO")

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">💰 Saques de Comissão</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Gerencie solicitações de saque e pagamentos via PIX</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchSaques}
              className="rounded-full border-2 border-[#e5e7eb] px-4 py-2 font-['Sora'] text-xs font-bold text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]">
              ↻ Atualizar
            </button>
            {selecionados.size > 0 && (
              <button onClick={pagarSelecionados} disabled={pagando}
                className="rounded-full bg-[#1DB954] px-5 py-2 font-['Sora'] text-sm font-bold text-white hover:bg-[#0f9c40] disabled:opacity-60">
                {pagando ? "Pagando..." : `💸 Pagar ${selecionados.size} selecionado${selecionados.size !== 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>

        {/* Saldo Asaas */}
        {saldoAsaas && (
          <div className="mb-5 rounded-2xl border border-[#1DB954]/30 bg-[#f0fdf4] p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="font-['Sora'] text-xs font-bold uppercase text-[#6b7280]">Saldo disponível Asaas</div>
                <div className="font-['Sora'] text-2xl font-extrabold text-[#0f9c40]">{formatCurrency(saldoAsaas.saldo)}</div>
              </div>
              <div>
                <div className="font-['Sora'] text-xs font-bold uppercase text-[#6b7280]">Saldo bloqueado</div>
                <div className="font-['Sora'] text-lg font-bold text-[#92400e]">{formatCurrency(saldoAsaas.bloqueado)}</div>
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label:"Total",      value:stats.total,      accent:"#1DB954", f:""           },
            { label:"Solicitados",value:stats.solicitados, accent:"#1d4ed8", f:"SOLICITADO" },
            { label:"Aprovados",  value:stats.aprovados,  accent:"#0f9c40", f:"APROVADO"   },
            { label:"Pagos",      value:stats.pagos,      accent:"#15803d", f:"PAGO"       },
          ].map(k => (
            <button key={k.label} onClick={() => setStatusF(statusF === k.f ? "" : k.f)}
              className={`relative overflow-hidden rounded-[14px] border-2 bg-white p-5 text-left transition-all hover:shadow-md ${statusF === k.f ? "border-[#0D1B2A]" : "border-[#e5e7eb]"}`}>
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-[14px]" style={{ background: k.accent }} />
              <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{k.label}</div>
              <div className="mt-1 font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">{loading ? "..." : k.value}</div>
            </button>
          ))}
        </div>

        {/* Resultado dos pagamentos */}
        {msg && (
          <div className={`mb-4 rounded-2xl p-4 font-['Sora'] text-sm font-bold ${msg.startsWith("✅") ? "bg-[#e8f8ee] text-[#0f9c40]" : "bg-red-50 text-red-600"}`}>
            {msg}
            {resultados.length > 0 && (
              <div className="mt-2 space-y-1">
                {resultados.map(r => (
                  <div key={r.id} className="font-normal text-xs">
                    {r.status === "pago" ? "✅" : r.status === "erro" ? "❌" : "⏭️"} {r.id.slice(0,8)}... — {r.status}{r.motivo ? `: ${r.motivo}` : r.asaasId ? ` (Asaas: ${r.asaasId})` : ""}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabela */}
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white shadow-sm">
          {aprovados.length > 0 && !statusF && (
            <div className="border-b border-[#e5e7eb] bg-[#f0fdf4] px-5 py-3">
              <div className="flex items-center justify-between">
                <span className="font-['Sora'] text-sm font-bold text-[#0f9c40]">
                  {aprovados.length} saque{aprovados.length !== 1 ? "s" : ""} aguardando pagamento
                </span>
                <button onClick={toggleTodos}
                  className="rounded-lg border border-[#1DB954] px-3 py-1 font-['Sora'] text-xs font-bold text-[#1DB954] hover:bg-[#1DB954] hover:text-white transition-all">
                  {selecionados.size === aprovados.length ? "Desmarcar todos" : "Selecionar todos aprovados"}
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f4f6f8]">
                  <th className="w-10 px-4 py-3"></th>
                  {["Afiliado","Valor","Chave PIX","Solicitado","Status","Ações"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array(4).fill(0).map((_,i) => (
                  <tr key={i} className="border-t border-[#e5e7eb]">
                    {Array(7).fill(0).map((_,j) => <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-[#e5e7eb]"/></td>)}
                  </tr>
                )) : saques.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <div className="text-4xl mb-3">💰</div>
                    <p className="text-sm text-[#9ca3af]">Nenhuma solicitação de saque</p>
                  </td></tr>
                ) : saques.map(s => {
                  const st = STATUS_CONFIG[s.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDENTE
                  const podeSelecionar = s.status === "APROVADO"
                  return (
                    <tr key={s.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                      <td className="px-4 py-3">
                        {podeSelecionar && (
                          <input type="checkbox" checked={selecionados.has(s.id)}
                            onChange={() => toggleSel(s.id)}
                            className="h-4 w-4 cursor-pointer accent-[#1DB954]" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-['Sora'] text-sm font-semibold text-[#0D1B2A]">{s.afiliado?.nome ?? s.afiliadoId}</div>
                        <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{s.afiliado?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-sm font-bold text-[#0D1B2A]">
                        {formatCurrency(s.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-['Sora'] text-xs text-[#0D1B2A]">{s.pixChave}</div>
                        <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">{s.pixTipo}</div>
                      </td>
                      <td className="px-4 py-3 font-['Sora'] text-xs text-[#9ca3af]">
                        {new Date(s.solicitadoEm).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold"
                          style={{ background: st.bg, color: st.color }}>
                          {st.icon} {st.label}
                        </span>
                        {s.observacao && <div className="mt-0.5 font-['Sora'] text-[0.6rem] text-[#9ca3af]">{s.observacao}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {s.status === "SOLICITADO" && (
                            <>
                              <button onClick={() => alterarStatus(s.id, "APROVADO")}
                                className="rounded-lg bg-[#e8f8ee] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-[#0f9c40] hover:bg-[#1DB954] hover:text-white transition-all">
                                Aprovar
                              </button>
                              <button onClick={() => { const obs = prompt("Motivo da rejeição:"); if (obs !== null) alterarStatus(s.id, "REJEITADO", obs) }}
                                className="rounded-lg bg-[#fee2e2] px-2.5 py-1 font-['Sora'] text-[0.65rem] font-bold text-red-600 hover:bg-red-500 hover:text-white transition-all">
                                Rejeitar
                              </button>
                            </>
                          )}
                          {s.asaasId && (
                            <span className="font-['Sora'] text-[0.6rem] text-[#9ca3af]">
                              Asaas: {s.asaasId.slice(0,8)}...
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}
