"use client"

import {
  FacebookIcon, InstagramIcon, LinkedinIcon,
  YoutubeIcon, TiktokIcon, WhatsappIcon
} from "@/components/ui/SocialIcons"

const REDES = [
  { nome:"YouTube",   Icon:YoutubeIcon,   href:"https://youtube.com/@creditogold",       color:"#FF0000" },
  { nome:"Facebook",  Icon:FacebookIcon,  href:"https://facebook.com/creditogold",        color:"#1877F2" },
  { nome:"Instagram", Icon:InstagramIcon, href:"https://instagram.com/creditogold",       color:"#E1306C" },
  { nome:"LinkedIn",  Icon:LinkedinIcon,  href:"https://linkedin.com/company/creditogold",color:"#0A66C2" },
  { nome:"WhatsApp",  Icon:WhatsappIcon,  href:"https://wa.me/5521999999999",             color:"#25D366" },
]

interface SocialBarProps {
  label?: string
  dark?:  boolean   // fundo escuro → ícones claros
  size?:  "sm"|"md" // sm = pequenos como no exemplo, md = padrão
}

export function SocialBar({ label = "Acompanhe nas redes sociais", dark = false, size = "sm" }: SocialBarProps) {
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
        {REDES.map(rede => (
          <a key={rede.nome} href={rede.href} target="_blank" rel="noopener noreferrer"
            title={rede.nome}
            className={`group flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md ${btnSize} ${
              dark ? "bg-white/10 hover:bg-white/20" : "bg-[#f4f6f8] hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            }`}>
            <rede.Icon className={`${iconSize} transition-colors ${dark ? "text-white/80" : "text-[#374151]"} group-hover:text-[${rede.color}]`} />
          </a>
        ))}
      </div>
    </div>
  )
}
