"use client"

import { useState, useEffect } from "react"
import {
  FacebookIcon, InstagramIcon, LinkedinIcon,
  YoutubeIcon, TiktokIcon, WhatsappIcon
} from "@/components/ui/SocialIcons"

const ICON_MAP: Record<string, any> = {
  youtube:   YoutubeIcon,
  facebook:  FacebookIcon,
  instagram: InstagramIcon,
  linkedin:  LinkedinIcon,
  tiktok:    TiktokIcon,
  whatsapp:  WhatsappIcon,
}

const COLOR_MAP: Record<string, string> = {
  youtube:   "#FF0000",
  facebook:  "#1877F2",
  instagram: "#E1306C",
  linkedin:  "#0A66C2",
  tiktok:    "#010101",
  whatsapp:  "#25D366",
}

const DEFAULT_REDES = [
  { nome:"YouTube",   key:"youtube",   href:"https://youtube.com/@creditogold"         },
  { nome:"Facebook",  key:"facebook",  href:"https://facebook.com/creditogold"          },
  { nome:"Instagram", key:"instagram", href:"https://instagram.com/creditogold"         },
  { nome:"LinkedIn",  key:"linkedin",  href:"https://linkedin.com/company/creditogold"  },
  { nome:"WhatsApp",  key:"whatsapp",  href:"https://wa.me/5561982503427"               },
]

interface SocialBarProps {
  label?: string
  dark?:  boolean
  size?:  "sm"|"md"
}

export function SocialBar({ label = "Acompanhe nas redes sociais", dark = false, size = "sm" }: SocialBarProps) {
  const [redes, setRedes] = useState(DEFAULT_REDES)

  useEffect(() => {
    fetch("/api/admin/configs")
      .then(r => r.json())
      .then(json => {
        if (!json.success) return
        const cfg = json.data as Record<string, string>
        const updated = DEFAULT_REDES
          .map(r => ({
            ...r,
            href: cfg[`REDE_${r.key.toUpperCase()}`] || r.href,
          }))
          // Oculta se admin deixou em branco explicitamente (string vazia)
          .filter(r => cfg[`REDE_${r.key.toUpperCase()}`] !== "")
        setRedes(updated)
      })
      .catch(() => {})
  }, [])

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5"
  const btnSize  = size === "sm" ? "h-7 w-7"  : "h-9 w-9"

  return (
    <div className="flex flex-wrap items-center gap-3">
      {label && (
        <span className={`font-['Sora'] text-sm font-semibold ${dark ? "text-white/70" : "text-[#6b7280]"}`}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        {redes.map(rede => {
          const Icon  = ICON_MAP[rede.key]
          const color = COLOR_MAP[rede.key]
          if (!Icon) return null
          return (
            <a key={rede.key} href={rede.href} target="_blank" rel="noopener noreferrer"
              title={rede.nome}
              className={`group flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md ${btnSize} ${
                dark ? "bg-white/10 hover:bg-white/20" : "bg-[#f4f6f8] hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              }`}>
              <Icon className={`${iconSize} transition-colors ${dark ? "text-white/80" : "text-[#374151]"}`}
                style={{ color: undefined }}
                onMouseEnter={e => (e.currentTarget.style.color = color)}
                onMouseLeave={e => (e.currentTarget.style.color = "")} />
            </a>
          )
        })}
      </div>
    </div>
  )
}
