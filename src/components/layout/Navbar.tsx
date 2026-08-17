"use client"

import { useState, useEffect, useRef } from "react"
import { signIn, getSession } from "next-auth/react"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname                      = usePathname()
  const [scrolled,  setScrolled]      = useState(false)
  const [dropdown,  setDropdown]      = useState<"login"|"cadastro"|null>(null)
  const [menuOpen,  setMenuOpen]      = useState(false)
  const [email,     setEmail]         = useState("")
  const [pass,      setPass]          = useState("")
  const [error,     setError]         = useState("")
  const [loading,   setLoading]       = useState(false)
  const [showPass,  setShowPass]      = useState(false)

  // 2FA state
  const [show2FA,   setShow2FA]       = useState(false)
  const [codigo,    setCodigo]        = useState(["","","","","",""])
  const [userId,    setUserId]        = useState("")
  const [telefone2FA, setTelefone2FA] = useState("")
  const [canal2FA,  setCanal2FA]      = useState<"WHATSAPP"|"EMAIL">("WHATSAPP")
  const [loading2FA, setLoading2FA]   = useState(false)
  const [error2FA,  setError2FA]      = useState("")
  const [countdown, setCountdown]     = useState(0)
  const inputRefs = useRef<(HTMLInputElement|null)[]>([])
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", h, { passive: true })
    return () => window.removeEventListener("scroll", h)
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropdown(null)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => { setDropdown(null); setMenuOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  // Countdown para reenvio
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Input OTP — avança campo automaticamente
  function handleOTPInput(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const novo = [...codigo]
    novo[i] = val
    setCodigo(novo)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
    if (!val && i > 0) inputRefs.current[i - 1]?.focus()
  }

  function handleOTPKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !codigo[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
    if (e.key === "Enter" && codigo.join("").length === 6) {
      verificar2FA()
    }
  }

  function handleOTPPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (digits.length === 6) {
      setCodigo(digits.split(""))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setLoading(true)
    const result = await signIn("credentials", { email, password: pass, redirect: false })
    setLoading(false)

    if (result?.error) { setError("E-mail ou senha incorretos."); return }

    // Busca sessão para obter userId e telefone
    const session = await getSession()
    const user    = session?.user as any
    const role    = user?.role

    // Verifica se 2FA está habilitado
    try {
      const cfgRes  = await fetch("/api/admin/configs")
      const cfgJson = await cfgRes.json()
      const cfg     = cfgJson.data ?? {}
      const use2FA  = cfg["2FA_ATIVO"] !== "false" // default: ativo

      if (use2FA && role !== "AFILIADO") {
        // Inicia fluxo 2FA
        const canal  = cfg["2FA_METODO"] ?? "WHATSAPP"
        setCanal2FA(canal)
        setUserId(user?.id ?? "")
        setTelefone2FA(user?.telefone ?? "")
        setShow2FA(true)
        setCountdown(60)

        // Envia código
        await fetch("/api/auth/2fa", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ userId: user?.id, email, telefone: user?.telefone, metodo: canal }),
        })
        return
      }
    } catch {}

    // Sem 2FA — redireciona direto
    redirecionar(role)
  }

  async function verificar2FA() {
    const code = codigo.join("")
    if (code.length !== 6) return
    setLoading2FA(true); setError2FA("")

    const res  = await fetch("/api/auth/2fa", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, codigo: code }),
    })
    const json = await res.json()
    setLoading2FA(false)

    if (!json.success) {
      setError2FA("Código inválido ou expirado. Tente novamente.")
      setCodigo(["","","","","",""])
      inputRefs.current[0]?.focus()
      return
    }

    // Código válido — redireciona
    const session = await getSession()
    redirecionar((session?.user as any)?.role)
  }

  async function reenviarCodigo() {
    if (countdown > 0) return
    setCountdown(60); setError2FA("")
    await fetch("/api/auth/2fa", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ userId, email, telefone: telefone2FA, metodo: canal2FA }),
    })
  }

  function redirecionar(role: string) {
    window.location.href =
      role === "AFILIADO"   ? "/painel-afiliado" :
      role === "FINANCEIRO" ? "/financeiro"       : "/admin"
  }

  const NAV_LINKS = [
    { label:"Início",     href:"/"          },
    { label:"Produtos",   href:"/#produtos"  },
    { label:"⚡ Energia", href:"/energia"   },
    { label:"Afiliados",  href:"/afiliados"  },
    { label:"Blog",       href:"/blog"       },
    { label:"Ajuda",      href:"/ajuda"      },
  ]

  // ── Modal 2FA ──────────────────────────────────────
  if (show2FA) return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-2xl">

        {/* Ícone */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f3d22]/10 text-3xl">
          {canal2FA === "WHATSAPP" ? "💬" : "📧"}
        </div>

        <h2 className="mb-1 text-center font-['Sora'] text-xl font-extrabold text-[#0D1B2A]">
          Verificação em 2 etapas
        </h2>
        <p className="mb-6 text-center font-['Sora'] text-sm text-[#6b7280]">
          {canal2FA === "WHATSAPP"
            ? "Enviamos um código de 6 dígitos para o seu WhatsApp."
            : `Enviamos um código de 6 dígitos para ${email}.`}
        </p>

        {/* OTP Inputs */}
        <div className="mb-4 flex justify-center gap-2">
          {codigo.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleOTPInput(i, e.target.value)}
              onKeyDown={e => handleOTPKeyDown(i, e)}
              onPaste={i === 0 ? handleOTPPaste : undefined}
              className={`h-12 w-10 rounded-xl border-2 text-center font-['Sora'] text-xl font-bold outline-none transition-all ${
                d ? "border-[#0f3d22] bg-[#f0fdf4] text-[#0f3d22]" : "border-[#e5e7eb] bg-[#f9fafb]"
              } focus:border-[#0f3d22]`}
            />
          ))}
        </div>

        {error2FA && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-600">
            {error2FA}
          </div>
        )}

        <button
          onClick={verificar2FA}
          disabled={loading2FA || codigo.join("").length !== 6}
          className="w-full rounded-xl bg-[#0f3d22] py-3 font-['Sora'] text-sm font-bold text-white transition-all hover:bg-[#1a5c33] disabled:opacity-50">
          {loading2FA ? "Verificando..." : "Verificar código →"}
        </button>

        {/* Reenviar */}
        <div className="mt-4 text-center">
          {countdown > 0 ? (
            <span className="font-['Sora'] text-xs text-[#9ca3af]">
              Reenviar em {countdown}s
            </span>
          ) : (
            <button onClick={reenviarCodigo}
              className="font-['Sora'] text-xs font-semibold text-[#0f3d22] hover:underline">
              Reenviar código
            </button>
          )}
          <span className="mx-2 text-[#e5e7eb]">·</span>
          <button
            onClick={() => { setShow2FA(false); setCodigo(["","","","","",""]); setError2FA("") }}
            className="font-['Sora'] text-xs text-[#9ca3af] hover:text-[#0D1B2A]">
            Voltar
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <nav className={`fixed left-0 right-0 top-0 z-50 flex h-[64px] items-center justify-between bg-white px-[5%] transition-all duration-300 ${
        scrolled || menuOpen ? "shadow-[0_4px_24px_rgba(0,0,0,0.10)]" : "border-b border-[#e5e7eb]"
      }`}>

        <a href="/" className="flex items-center no-underline">
          <img src="/logo-credito-gold.svg" alt="Crédito Gold" className="h-9 w-auto object-contain" />
        </a>

        <ul className="hidden list-none items-center gap-6 md:flex">
          {NAV_LINKS.map(item => (
            <li key={item.label}>
              <a href={item.href}
                className="font-['Sora'] text-sm font-semibold text-[#0D1B2A] no-underline transition-colors hover:text-[#1DB954]">
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="relative hidden items-center gap-2 md:flex" ref={dropRef}>
          <button onClick={() => { setDropdown(d => d === "cadastro" ? null : "cadastro"); setError("") }}
            className={`rounded-full border-2 px-4 py-1.5 font-['Sora'] text-xs font-bold transition-all ${
              dropdown === "cadastro" ? "border-[#1DB954] bg-[#1DB954] text-white" : "border-[#1DB954] text-[#1DB954] hover:bg-[#1DB954] hover:text-white"
            }`}>Cadastrar</button>

          <button onClick={() => { setDropdown(d => d === "login" ? null : "login"); setError("") }}
            className={`rounded-full px-5 py-1.5 font-['Sora'] text-xs font-bold transition-all ${
              dropdown === "login" ? "bg-[#e06000] text-white shadow-[0_4px_16px_rgba(255,107,0,0.4)]" : "bg-[#FF6B00] text-white hover:bg-[#e06000]"
            }`}>Entrar</button>

          {/* Dropdown LOGIN com 2FA integrado */}
          {dropdown === "login" && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-[320px] rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
              <div className="absolute -top-2 right-16 h-4 w-4 rotate-45 border-l border-t border-[#e5e7eb] bg-white" />
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1 w-6 rounded-full bg-[#FF6B00]" />
                <div className="h-1 w-3 rounded-full bg-[#1DB954]" />
              </div>
              <h3 className="mb-4 mt-2 font-['Sora'] text-base font-extrabold text-[#0D1B2A]">Acessar minha conta</h3>

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">E-mail</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" required
                    className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none transition-all focus:border-[#FF6B00] focus:bg-white" />
                </div>
                <div>
                  <label className="mb-1 block font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#374151]">Senha</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 pr-10 text-sm outline-none transition-all focus:border-[#FF6B00] focus:bg-white" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9ca3af] hover:text-[#FF6B00] transition-colors">
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</div>
                )}
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-[#FF6B00] py-2.5 font-['Sora'] text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)] transition-all hover:bg-[#e06000] disabled:opacity-60">
                  {loading ? "Verificando..." : "Entrar →"}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => { setDropdown(null); window.location.href = "/login?tab=afiliado" }}
                    className="font-['Sora'] text-xs text-[#9ca3af] transition-colors hover:text-[#1DB954]">
                    Sou afiliado
                  </button>
                  {" · "}
                  <a href="/login" className="font-['Sora'] text-xs text-[#9ca3af] no-underline hover:text-[#1DB954]">
                    Esqueci minha senha
                  </a>
                </div>
              </form>
            </div>
          )}

          {/* Dropdown CADASTRAR */}
          {dropdown === "cadastro" && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-[320px] rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
              <div className="absolute -top-2 right-24 h-4 w-4 rotate-45 border-l border-t border-[#e5e7eb] bg-white" />
              <div className="mb-1 flex items-center gap-2">
                <div className="h-1 w-6 rounded-full bg-[#1DB954]" />
                <div className="h-1 w-3 rounded-full bg-[#FF6B00]" />
              </div>
              <h3 className="mb-1 mt-2 font-['Sora'] text-base font-extrabold text-[#0D1B2A]">Criar minha conta</h3>
              <p className="mb-4 font-['Sora'] text-xs text-[#9ca3af]">Escolha como quer se cadastrar</p>
              <div className="space-y-3">
                <button onClick={() => { setDropdown(null); window.location.href = "/#simulador" }}
                  className="group flex w-full items-center gap-3 rounded-xl border-2 border-[#e5e7eb] bg-white p-3.5 text-left transition-all hover:border-[#1DB954]/40 hover:bg-[#f0fdf4]">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#e8f8ee] text-xl transition-transform group-hover:scale-110">💰</div>
                  <div>
                    <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Quero crédito</div>
                    <div className="font-['Sora'] text-xs text-[#9ca3af]">Simule e solicite seu empréstimo</div>
                  </div>
                  <span className="ml-auto text-[#1DB954]">→</span>
                </button>
                <button onClick={() => { setDropdown(null); window.location.href = "/afiliados" }}
                  className="group flex w-full items-center gap-3 rounded-xl border-2 border-[#e5e7eb] bg-white p-3.5 text-left transition-all hover:border-[#FF6B00]/40 hover:bg-[#fff8f3]">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff3e8] text-xl transition-transform group-hover:scale-110">🔗</div>
                  <div>
                    <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Quero ser afiliado</div>
                    <div className="font-['Sora'] text-xs text-[#9ca3af]">Indique e ganhe comissões</div>
                  </div>
                  <span className="ml-auto text-[#FF6B00]">→</span>
                </button>
              </div>
              <div className="mt-4 text-center">
                <span className="font-['Sora'] text-xs text-[#9ca3af]">Já tem conta? </span>
                <button onClick={() => setDropdown("login")}
                  className="font-['Sora'] text-xs font-bold text-[#1DB954] hover:underline">
                  Entrar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hambúrguer mobile */}
        <button onClick={() => setMenuOpen(o => !o)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl bg-[#f4f6f8] transition-all hover:bg-[#e5e7eb] md:hidden"
          aria-label="Menu">
          <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <div className={`fixed left-0 right-0 top-[64px] z-40 bg-white shadow-xl transition-all duration-300 md:hidden ${
        menuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 pointer-events-none opacity-0"
      }`}>
        <div className="flex flex-col divide-y divide-[#f4f6f8] px-5 py-2">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              className="flex items-center py-4 font-['Sora'] text-base font-medium text-[#374151] no-underline hover:text-[#1DB954]">
              {l.label}<span className="ml-auto text-[#d1d5db]">›</span>
            </a>
          ))}
        </div>
        <div className="border-t border-[#f4f6f8] p-5">
          <p className="mb-3 font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Acessar conta</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#FF6B00]" />
            <input type="password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm outline-none focus:border-[#FF6B00]" />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#FF6B00] py-2.5 font-['Sora'] text-sm font-bold text-white disabled:opacity-60">
              {loading ? "Verificando..." : "Entrar →"}
            </button>
          </form>
          <div className="mt-3 flex gap-3">
            <button onClick={() => { setMenuOpen(false); window.location.href = "/afiliados" }}
              className="flex-1 rounded-xl border-2 border-[#1DB954] py-2.5 font-['Sora'] text-xs font-bold text-[#1DB954] hover:bg-[#1DB954] hover:text-white transition-all">
              🔗 Ser afiliado
            </button>
            <button onClick={() => { setMenuOpen(false); window.location.href = "/#simulador" }}
              className="flex-1 rounded-xl border-2 border-[#e5e7eb] py-2.5 font-['Sora'] text-xs font-bold text-[#374151] hover:border-[#1DB954] transition-all">
              💰 Quero crédito
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
