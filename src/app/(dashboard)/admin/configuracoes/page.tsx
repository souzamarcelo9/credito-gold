"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/Sidebar"

const PRODUTOS = [
  { key:"PESSOAL",     label:"Crédito Pessoal",            color:"#1DB954" },
  { key:"GARANTIA",   label:"Com Garantia de Imóvel",      color:"#FF6B00" },
  { key:"EMPRESARIAL",label:"Crédito Empresarial",         color:"#1DB954" },
  { key:"CONSIGNADO", label:"Consignado",                  color:"#FF6B00" },
  { key:"FGTS",       label:"Antecipação FGTS",            color:"#1DB954" },
  { key:"ENERGIA",    label:"Empréstimo na Conta de Luz",  color:"#FF6B00" },
]

interface Configs { [key: string]: string }

export default function ConfiguracoesPage() {
  const [configs, setConfigs]   = useState<Configs>({})
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState("")
  const [activeTab, setActiveTab] = useState<"juros"|"limites">("juros")

  useEffect(() => {
    fetch("/api/admin/configs")
      .then(r => r.json())
      .then(j => { if (j.success) setConfigs(j.data) })
      .finally(() => setLoading(false))
  }, [])

  function update(key: string, value: string) {
    setConfigs(c => ({ ...c, [key]: value }))
  }

  async function save() {
    setSaving(true); setMsg("")
    try {
      const res  = await fetch("/api/admin/configs", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(configs),
      })
      const json = await res.json()
      setMsg(json.success ? "✅ " + json.message : "❌ " + json.message)
    } catch {
      setMsg("❌ Erro de conexão")
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(""), 3000)
    }
  }

  const field = (label: string, key: string, suffix = "") => (
    <div key={key}>
      <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#6b7280]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={configs[key] ?? ""}
          onChange={e => update(key, e.target.value)}
          className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-4 py-2.5 text-sm outline-none transition-all focus:border-[#1DB954] focus:bg-white"
        />
        {suffix && <span className="flex-shrink-0 font-['Sora'] text-sm text-[#9ca3af]">{suffix}</span>}
      </div>
    </div>
  )

  const TABS = [
    { key:"juros",   label:"⚡ Taxas de Juros"   },
    { key:"limites", label:"📊 Limites e Prazos"  },
  ]

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-[260px] flex-1 p-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Sora'] text-2xl font-extrabold text-[#0D1B2A]">⚙️ Configurações</h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">Gerencie taxas, comissões e condições de cada produto</p>
          </div>
          <div className="flex items-center gap-3">
            {msg && (
              <span className={`font-['Sora'] text-sm font-bold ${msg.startsWith("✅") ? "text-[#0f9c40]" : "text-red-500"}`}>
                {msg}
              </span>
            )}
            <button onClick={save} disabled={saving || loading}
              className="rounded-full bg-[#1DB954] px-6 py-2 font-['Sora'] text-sm font-bold text-white shadow-[0_4px_16px_rgba(29,185,84,0.25)] transition-all hover:bg-[#0f9c40] disabled:opacity-60">
              {saving ? "Salvando..." : "💾 Salvar alterações"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`rounded-full px-5 py-2 font-['Sora'] text-sm font-bold transition-all ${
                activeTab === t.key
                  ? "bg-[#0D1B2A] text-white shadow-sm"
                  : "border-2 border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#1DB954] hover:text-[#1DB954]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_,i) => (
              <div key={i} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
                <div className="mb-4 h-4 w-32 animate-pulse rounded bg-[#e5e7eb]" />
                <div className="space-y-3">
                  {Array(3).fill(0).map((_,j) => <div key={j} className="h-10 animate-pulse rounded-xl bg-[#e5e7eb]" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRODUTOS.map(p => (
              <div key={p.key} className="rounded-2xl border-2 border-[#e5e7eb] bg-white p-6 shadow-sm"
                style={{ borderTopColor: p.color, borderTopWidth:"3px" }}>
                <h3 className="mb-4 font-['Sora'] text-sm font-bold text-[#0D1B2A]">{p.label}</h3>
                <div className="space-y-3">

                  {/* Taxas de Juros */}
                  {activeTab === "juros" && field(
                    "Taxa de juros (% a.m.)",
                    `TAXA_${p.key}`, "% a.m."
                  )}

                  {/* Limites e Prazos */}
                  {activeTab === "limites" && (
                    <>
                      {field("Valor mínimo (R$)", `VALOR_MIN_${p.key}`, "R$")}
                      {field("Valor máximo (R$)", `VALOR_MAX_${p.key}`, "R$")}
                      {field("Prazo máximo (meses)", `PRAZO_MAX_${p.key}`, "x")}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Aviso */}
        <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Importante</div>
              <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">
                Alterações nas taxas de juros afetam imediatamente os simuladores públicos e as novas simulações.
                Leads já criados não são afetados. As comissões são aplicadas a partir da data de salvar — aprovações anteriores mantêm o valor original.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
