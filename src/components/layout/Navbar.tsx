"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { label: "Sobre nós",     href: "/#sobre"    },
  { label: "Produtos",      href: "/#produtos"  },
  { label: "Afiliados",     href: "/afiliados"  },
  { label: "Energia",       href: "/energia"    },
  { label: "Ajuda",         href: "/ajuda"      },
]

export function Navbar() {
  const pathname               = usePathname()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const loginRef                  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false); setLoginOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <>
      <header className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-white/98 shadow-[0_2px_20px_rgba(0,0,0,0.08)] backdrop-blur-md"
          : "bg-white/85 backdrop-blur-sm"
      }`}>
        <div className="flex h-[64px] items-center justify-between px-[5%]">

          {/* Logo */}
          <Link href="/" className="flex items-center no-underline">
            <img src="/logo-credito-gold.svg" alt="Crédito Gold" className="h-9 w-auto object-contain" />
          </Link>

          {/* Links desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="rounded-lg px-3 py-2 font-['Sora'] text-sm font-medium text-[#374151] no-underline transition-all hover:bg-[#f4f6f8] hover:text-[#0f3d22]">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Ações desktop */}
          <div className="hidden items-center gap-3 lg:flex">
            {/* Dropdown login */}
            <div className="relative" ref={loginRef}>
              <button
                onClick={() => setLoginOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0f3d22] px-5 py-2 font-['Sora'] text-sm font-bold text-white transition-all hover:bg-[#1a5c33] hover:shadow-[0_4px_16px_rgba(15,61,34,0.3)]">
                Entrar
                <span className={`text-xs transition-transform duration-200 ${loginOpen ? "rotate-180" : ""}`}>▾</span>
              </button>

              {/* Dropdown */}
              {loginOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[240px] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
                  <div className="border-b border-[#f4f6f8] px-4 py-3">
                    <div className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Acessar plataforma</div>
                  </div>

                  {/* Admin / Financeiro */}
                  <a href="/login"
                    className="flex items-center gap-3 px-4 py-3.5 no-underline transition-all hover:bg-[#f4f6f8]"
                    onClick={() => setLoginOpen(false)}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#0D1B2A]">
                      <span className="text-sm">🏦</span>
                    </div>
                    <div>
                      <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Administrador</div>
                      <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">Acesso ao painel admin</div>
                    </div>
                  </a>

                  {/* Afiliado */}
                  <a href="/login?tab=afiliado"
                    className="flex items-center gap-3 border-t border-[#f4f6f8] px-4 py-3.5 no-underline transition-all hover:bg-[#f4f6f8]"
                    onClick={() => setLoginOpen(false)}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f3d22]">
                      <span className="text-sm">🔗</span>
                    </div>
                    <div>
                      <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Sou Afiliado</div>
                      <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">Acesso ao painel afiliado</div>
                    </div>
                  </a>

                  {/* Cadastrar afiliado */}
                  <div className="border-t border-[#f4f6f8] px-4 py-3">
                    <a href="/afiliados"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#0f3d22] py-2.5 font-['Sora'] text-sm font-bold text-[#0f3d22] no-underline transition-all hover:bg-[#0f3d22] hover:text-white"
                      onClick={() => setLoginOpen(false)}>
                      ✨ Quero ser afiliado
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hambúrguer mobile */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl bg-[#f4f6f8] transition-all hover:bg-[#e5e7eb] lg:hidden"
            aria-label="Menu">
            <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      {/* Overlay mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)} />
      )}

      {/* Drawer mobile */}
      <div className={`fixed left-0 right-0 top-[64px] z-40 bg-white shadow-xl transition-all duration-300 lg:hidden ${
        menuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      }`}>
        <div className="flex flex-col divide-y divide-[#f4f6f8] px-5 py-2">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              className="flex items-center py-4 font-['Sora'] text-base font-medium text-[#374151] no-underline transition-colors hover:text-[#0f3d22]">
              {l.label}
              <span className="ml-auto text-[#d1d5db]">›</span>
            </a>
          ))}
        </div>

        {/* Login mobile */}
        <div className="border-t border-[#f4f6f8] p-5 space-y-3">
          <p className="font-['Sora'] text-[0.7rem] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">Acessar plataforma</p>
          <a href="/login" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl border-2 border-[#e5e7eb] px-4 py-3 no-underline transition-all hover:border-[#0f3d22]">
            <span className="text-xl">🏦</span>
            <div>
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Administrador</div>
              <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">Acesso ao painel admin</div>
            </div>
          </a>
          <a href="/login?tab=afiliado" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl border-2 border-[#e5e7eb] px-4 py-3 no-underline transition-all hover:border-[#0f3d22]">
            <span className="text-xl">🔗</span>
            <div>
              <div className="font-['Sora'] text-sm font-bold text-[#0D1B2A]">Sou Afiliado</div>
              <div className="font-['Sora'] text-[0.65rem] text-[#9ca3af]">Acesso ao painel afiliado</div>
            </div>
          </a>
          <a href="/afiliados" onClick={() => setMenuOpen(false)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#0f3d22] py-3 font-['Sora'] text-sm font-bold text-white no-underline">
            ✨ Quero ser afiliado
          </a>
        </div>

        {/* Links secundários */}
        <div className="flex items-center justify-center gap-4 border-t border-[#f4f6f8] px-5 py-4">
          {[["Blog","/blog"],["Trabalhe Conosco","/trabalhe-conosco"],["Privacidade","/ajuda#lgpd"]].map(([l,h]) => (
            <a key={l} href={h} onClick={() => setMenuOpen(false)}
              className="font-['Sora'] text-xs text-[#9ca3af] no-underline hover:text-[#0f3d22]">{l}</a>
          ))}
        </div>
      </div>
    </>
  )
}
