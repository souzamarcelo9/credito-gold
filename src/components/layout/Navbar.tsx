"use client"

import { useState, useEffect } from "react"

interface NavbarProps {
  onLoginClick?: () => void
}

export function Navbar({ onLoginClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 flex h-[70px] items-center justify-between px-[5%] bg-white transition-shadow ${
      scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.12)]" : "border-b border-[#e5e7eb]"
    }`}>

      {/* Logo com cores da marca */}
      <a href="/" className="flex items-center gap-2.5 no-underline">
        {/* Ícone CG */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1DB954]">
          <span className="font-['Sora'] text-sm font-extrabold text-white">CG</span>
        </div>
        <div className="flex flex-col">
          <span className="font-['Sora'] text-lg font-extrabold leading-none">
            <span className="text-[#1DB954]">Crédito</span>{" "}
            <span className="text-[#FF6B00]">Gold</span>
            <span className="text-[#FF6B00] text-xs">®</span>
          </span>
          <span className="text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
            Soluções Financeiras
          </span>
        </div>
      </a>

      {/* Links de navegação */}
      <ul className="hidden items-center gap-8 list-none md:flex">
        {[
          { label: "Início",    href: "/"           },
          { label: "Crédito",   href: "#produtos"    },
          { label: "Afiliados", href: "/afiliados"   },
          { label: "Blog",      href: "/blog"        },
          { label: "Ajuda",     href: "/ajuda"       },
        ].map(item => (
          <li key={item.label}>
            <a href={item.href}
              className="font-['Sora'] text-sm font-semibold text-[#0D1B2A] no-underline transition-colors hover:text-[#1DB954]">
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Ações */}
      <div className="flex items-center gap-2">
        <a href="/login"
          className="rounded-full border-2 border-[#1DB954] px-4 py-1.5 font-['Sora'] text-xs font-bold text-[#1DB954] no-underline transition-all hover:bg-[#1DB954] hover:text-white">
          Cadastrar
        </a>
        <a href="/login"
          className="rounded-full bg-[#FF6B00] px-5 py-1.5 font-['Sora'] text-xs font-bold text-white no-underline transition-all hover:bg-[#e06000] hover:shadow-[0_4px_16px_rgba(255,107,0,0.4)]">
          Entrar
        </a>
      </div>
    </nav>
  )
}
