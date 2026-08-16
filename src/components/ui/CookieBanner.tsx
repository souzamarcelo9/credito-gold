"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const COOKIE_KEY = "cg_cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [details, setDetails] = useState(false)

  useEffect(() => {
    // Só mostra se ainda não aceitou
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) setVisible(true)
  }, [])

  function aceitar() {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({
      analytics:    true,
      marketing:    true,
      necessarios:  true,
      data:         new Date().toISOString(),
    }))
    setVisible(false)
  }

  function aceitarEssenciais() {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({
      analytics:    false,
      marketing:    false,
      necessarios:  true,
      data:         new Date().toISOString(),
    }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] p-4 md:p-6">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">

        {/* Barra de cor no topo */}
        <div className="h-1 w-full bg-gradient-to-r from-[#1DB954] via-[#FF6B00] to-[#1DB954]" />

        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">

            {/* Ícone + texto */}
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl flex-shrink-0 mt-0.5">🍪</span>
              <div>
                <h3 className="font-['Sora'] text-sm font-extrabold text-[#0D1B2A]">
                  Usamos cookies para melhorar sua experiência
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">
                  Utilizamos cookies essenciais para o funcionamento do site e, com seu consentimento,
                  cookies analíticos e de marketing para melhorar nossos serviços, em conformidade com
                  a <strong>LGPD (Lei nº 13.709/2018)</strong>.{" "}
                  <Link href="/ajuda#lgpd" className="text-[#1DB954] no-underline hover:underline font-semibold">
                    Saiba mais
                  </Link>
                </p>

                {/* Detalhes expandíveis */}
                {details && (
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {[
                      { icon:"🔒", titulo:"Essenciais", desc:"Necessários para o funcionamento do site. Não podem ser desativados.", sempre:true },
                      { icon:"📊", titulo:"Analíticos", desc:"Nos ajudam a entender como você usa o site (Google Analytics).", sempre:false },
                      { icon:"📣", titulo:"Marketing",  desc:"Usados para personalizar anúncios e medir campanhas.", sempre:false },
                    ].map(c => (
                      <div key={c.titulo} className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{c.icon}</span>
                            <span className="font-['Sora'] text-xs font-bold text-[#0D1B2A]">{c.titulo}</span>
                          </div>
                          {c.sempre
                            ? <span className="rounded-full bg-[#e8f8ee] px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold text-[#0f9c40]">Sempre ativo</span>
                            : <span className="rounded-full bg-[#f4f6f8] px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold text-[#9ca3af]">Opcional</span>
                          }
                        </div>
                        <p className="text-[0.65rem] text-[#9ca3af] leading-relaxed">{c.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setDetails(d => !d)}
                  className="mt-2 font-['Sora'] text-[0.7rem] text-[#9ca3af] hover:text-[#0D1B2A] transition-colors">
                  {details ? "▲ Ocultar detalhes" : "▼ Ver detalhes dos cookies"}
                </button>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-2 flex-shrink-0 min-w-[180px]">
              <button onClick={aceitar}
                className="w-full rounded-xl bg-[#1DB954] px-5 py-2.5 font-['Sora'] text-sm font-bold text-white transition-all hover:bg-[#0f9c40] hover:shadow-[0_4px_12px_rgba(29,185,84,0.3)]">
                ✓ Aceitar todos
              </button>
              <button onClick={aceitarEssenciais}
                className="w-full rounded-xl border-2 border-[#e5e7eb] px-5 py-2.5 font-['Sora'] text-xs font-semibold text-[#6b7280] transition-all hover:border-[#0D1B2A] hover:text-[#0D1B2A]">
                Só essenciais
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
