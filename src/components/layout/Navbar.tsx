"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavbarProps {
  onLoginClick?: () => void
}

const NAV_LINKS = [
  { label: "Sobre nós",    href: "/#sobre"           },
  { label: "Crédito",      href: "/#produtos"         },
  { label: "Como funciona",href: "/#produtos"         },
  { label: "Afiliados",    href: "/afiliados"         },
  { label: "Energia",      href: "/energia"           },
  { label: "Ajuda",        href: "/ajuda"             },
]

export function Navbar({ onLoginClick }: NavbarProps) {
  const pathname              = usePathname()
  const [open, setOpen]       = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Detecta scroll para mudar aparência da navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Fecha ao mudar de rota
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloqueia scroll quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* ── NAVBAR ── */}
      <header className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-white/95 shadow-[0_2px_20px_rgba(0,0,0,0.08)] backdrop-blur-md"
          : "bg-white/80 backdrop-blur-sm"
      }`}>
        <div className="flex h-[64px] items-center justify-between px-[5%]">

          {/* Logo */}
          <Link href="/" className="flex items-center no-underline">
            <img
              src="/logo-credito-gold.svg"
              alt="Crédito Gold"
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Links — Desktop */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="rounded-lg px-3 py-2 font-['Sora'] text-sm font-medium text-[#374151] no-underline transition-all hover:bg-[#f4f6f8] hover:text-[#0f3d22]">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Ações — Desktop */}
          <div className="hidden items-center gap-3 lg:flex">
            <a href="https://wa.me/5561982503427" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border-2 border-[#25D366] px-4 py-2 font-['Sora'] text-sm font-bold text-[#25D366] no-underline transition-all hover:bg-[#25D366] hover:text-white">
              💬 WhatsApp
            </a>
            <button
              onClick={onLoginClick ?? (() => window.location.href = "/login")}
              className="rounded-xl bg-[#0f3d22] px-5 py-2 font-['Sora'] text-sm font-bold text-white transition-all hover:bg-[#1a5c33] hover:shadow-[0_4px_16px_rgba(15,61,34,0.3)]">
              Entrar
            </button>
          </div>

          {/* Hambúrguer — Mobile */}
          <button
            onClick={() => setOpen(o => !o)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl bg-[#f4f6f8] transition-all hover:bg-[#e5e7eb] lg:hidden"
            aria-label="Menu">
            <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-[#0D1B2A] transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      {/* ── OVERLAY ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── DRAWER MOBILE ── */}
      <div className={`fixed left-0 right-0 top-[64px] z-40 bg-white shadow-xl transition-all duration-300 lg:hidden ${
        open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      }`}>
        <div className="flex flex-col divide-y divide-[#f4f6f8] px-5 py-2">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center py-4 font-['Sora'] text-base font-medium text-[#374151] no-underline transition-colors hover:text-[#0f3d22]">
              {l.label}
              <span className="ml-auto text-[#d1d5db]">›</span>
            </a>
          ))}
        </div>

        {/* Ações mobile */}
        <div className="flex flex-col gap-3 border-t border-[#f4f6f8] p-5">
          <a href="https://wa.me/5561982503427" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] py-3 font-['Sora'] text-sm font-bold text-[#25D366] no-underline transition-all hover:bg-[#25D366] hover:text-white">
            💬 Falar no WhatsApp
          </a>
          <button
            onClick={() => { setOpen(false); (onLoginClick ?? (() => window.location.href = "/login"))() }}
            className="w-full rounded-xl bg-[#0f3d22] py-3 font-['Sora'] text-sm font-bold text-white transition-all hover:bg-[#1a5c33]">
            Entrar na plataforma
          </button>
        </div>

        {/* Rodapé do drawer */}
        <div className="flex items-center justify-center gap-4 border-t border-[#f4f6f8] px-5 py-4">
          {["Blog", "Trabalhe Conosco", "Privacidade"].map(l => (
            <a key={l}
              href={l === "Blog" ? "/blog" : l === "Trabalhe Conosco" ? "/trabalhe-conosco" : "/ajuda#lgpd"}
              onClick={() => setOpen(false)}
              className="font-['Sora'] text-xs text-[#9ca3af] no-underline hover:text-[#0f3d22]">
              {l}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
