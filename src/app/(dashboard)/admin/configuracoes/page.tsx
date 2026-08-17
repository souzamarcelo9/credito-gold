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
  const [activeTab, setActiveTab] = useState<"juros"|"limites"|"redes"|"sistema">("juros")

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

  const field = (label: string, key: string, suffix = "", placeholder = "", type = "number") => (
    <div key={key}>
      <label className="mb-1 block font-['Sora'] text-[0.65rem] font-bold uppercase tracking-[0.06em] text-[#6b7280]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type={type}
          step={type === "number" ? "0.01" : undefined}
          value={configs[key] ?? ""}
          placeholder={placeholder}
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
    { key:"redes",   label:"🌐 Redes Sociais"      },
    { key:"sistema", label:"🔒 Segurança"            },
  ]

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <Sidebar role="admin" />
      <main className="ml-0 pt-14 lg:ml-[240px] lg:pt-0 flex-1 p-8">

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

        {/* Redes Sociais */}
        {activeTab === "redes" && (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h3 className="mb-1 font-['Sora'] text-base font-bold text-[#0D1B2A]">🌐 Links das Redes Sociais</h3>
            <p className="mb-6 text-sm text-[#6b7280]">Configure os links que aparecerão na SocialBar do site. Deixe em branco para ocultar a rede.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { key:"instagram", icon:"📸", label:"Instagram",  placeholder:"https://instagram.com/creditogold"        },
                { key:"facebook",  icon:"👥", label:"Facebook",   placeholder:"https://facebook.com/creditogold"          },
                { key:"youtube",   icon:"▶️", label:"YouTube",    placeholder:"https://youtube.com/@creditogold"          },
                { key:"tiktok",    icon:"🎵", label:"TikTok",     placeholder:"https://tiktok.com/@creditogold"           },
                { key:"linkedin",  icon:"💼", label:"LinkedIn",   placeholder:"https://linkedin.com/company/creditogold"  },
                { key:"whatsapp",  icon:"💬", label:"WhatsApp",   placeholder:"https://wa.me/5561982503427"               },
              ].map(r => (
                <div key={r.key}>
                  <label className="mb-1.5 block font-['Sora'] text-xs font-bold uppercase tracking-[0.06em] text-[#374151]">
                    {r.icon} {r.label}
                  </label>
                  {field(r.label, `REDE_${r.key.toUpperCase()}`, "", r.placeholder, "text")}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#9ca3af]">
              💡 As alterações aparecem automaticamente no site após salvar.
            </p>
          </div>
        )}


        {/* Segurança — 2FA */}
        {activeTab === "sistema" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <div className="mb-1 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D1B2A] text-xl">🔐</div>
                <div>
                  <h3 className="font-[\'Sora\'] text-base font-bold text-[#0D1B2A]">Autenticação em 2 Etapas (2FA)</h3>
                  <p className="font-[\'Sora\'] text-xs text-[#9ca3af]">Exige um código de verificação ao fazer login no painel</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">

                {/* Ativar / Desativar */}
                <div className="flex items-center justify-between rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] p-4">
                  <div>
                    <div className="font-[\'Sora\'] text-sm font-bold text-[#0D1B2A]">Ativar 2FA</div>
                    <div className="font-[\'Sora\'] text-xs text-[#9ca3af]">Protege o acesso ao painel administrativo</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox"
                      checked={configs["2FA_ATIVO"] !== "false"}
                      onChange={e => update("2FA_ATIVO", e.target.checked ? "true" : "false")}
                      className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-[#e5e7eb] transition-all peer-checked:bg-[#1DB954] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>

                {/* Canal */}
                <div>
                  <label className="mb-2 block font-[\'Sora\'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">
                    Canal de envio do código
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val:"WHATSAPP", icon:"💬", label:"WhatsApp", desc:"Código via Z-API para o ADMIN_WHATSAPP" },
                      { val:"EMAIL",    icon:"📧", label:"E-mail",   desc:"Código via Resend para o e-mail do admin" },
                    ].map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => update("2FA_METODO", opt.val)}
                        className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          configs["2FA_METODO"] === opt.val || (!configs["2FA_METODO"] && opt.val === "WHATSAPP")
                            ? "border-[#1DB954] bg-[#f0fdf4]"
                            : "border-[#e5e7eb] bg-white hover:border-[#1DB954]/40"
                        }`}>
                        <span className="text-2xl">{opt.icon}</span>
                        <div>
                          <div className="font-[\'Sora\'] text-sm font-bold text-[#0D1B2A]">{opt.label}</div>
                          <div className="font-[\'Sora\'] text-xs text-[#9ca3af]">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
                  <div className="font-[\'Sora\'] text-xs text-[#6b7280] leading-relaxed">
                    <strong>📱 WhatsApp:</strong> O código é enviado para o número <code className="bg-[#e5e7eb] px-1 rounded">ADMIN_WHATSAPP</code> configurado no Vercel.<br/>
                    <strong>📧 E-mail:</strong> O código é enviado para o e-mail usado no login, via Resend.
                    <br/><br/>
                    <span className="text-[#FF6B00] font-semibold">⚠️ Afiliados não passam pelo 2FA.</span>
                  </div>
                </div>
              </div>
            </div>
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
