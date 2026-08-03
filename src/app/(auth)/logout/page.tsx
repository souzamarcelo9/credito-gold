"use client"

import { signOut } from "next-auth/react"
import { useEffect } from "react"

export default function LogoutPage() {
  // Faz logout automático após 0.5s para dar tempo de renderizar
  useEffect(() => {
    const timer = setTimeout(() => {
      signOut({ callbackUrl: "/" })
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#1a3040]">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-sm">

        {/* Logo */}
        <img
          src="/logo-credito-gold.svg"
          alt="Crédito Gold"
          className="mx-auto mb-8 h-10 w-auto brightness-0 invert"
        />

        {/* Ícone */}
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B00]/15">
          <span className="text-3xl">👋</span>
        </div>

        <h1 className="font-['Sora'] text-2xl font-extrabold text-white">
          Até logo!
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Encerrando sua sessão com segurança...
        </p>

        {/* Loading */}
        <div className="mt-8 flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i}
              className="h-2 w-2 rounded-full bg-[#1DB954] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Botão manual caso não redirecione */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-8 w-full rounded-xl bg-[#FF6B00] py-3 font-['Sora'] text-sm font-bold text-white transition-all hover:bg-[#e06000]">
          Sair agora
        </button>

        <a href="/"
          className="mt-3 block font-['Sora'] text-xs text-white/40 no-underline hover:text-white/70 transition-colors">
          ← Voltar ao site
        </a>
      </div>
    </div>
  )
}
