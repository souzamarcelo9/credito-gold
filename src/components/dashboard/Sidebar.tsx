"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

interface NavItem {
  icon:   string
  label:  string
  href:   string
  badge?: number
}

interface SidebarSection {
  title: string
  items: NavItem[]
}

interface SidebarProps {
  role?: "admin" | "financeiro" | "afiliado"
}

const ADMIN_SECTIONS: SidebarSection[] = [
  {
    title: "Principal",
    items: [
      { icon: "📊", label: "Dashboard",      href: "/admin"               },
      { icon: "💵", label: "Financeiro",     href: "/financeiro"          },
    ],
  },
  {
    title: "Operacional",
    items: [
      { icon: "🎯", label: "Leads",          href: "/admin/leads"         },
      { icon: "⚡", label: "Energia",        href: "/admin/energia"       },
      { icon: "🔗", label: "Afiliados",      href: "/admin/afiliados"     },
      { icon: "🔀", label: "Distribuição",   href: "/admin/distribuicao"  },
      { icon: "🏦", label: "Bancos",         href: "/admin/bancos"        },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: "💰", label: "Saques",         href: "/admin/saques"        },
      { icon: "💸", label: "Despesas",       href: "/admin/despesas"      },
    ],
  },
  {
    title: "Gestão",
    items: [
      { icon: "🏢", label: "Clientes",       href: "/admin/clientes"      },
      { icon: "📋", label: "Documentos",     href: "/admin/documentos"    },
      { icon: "📊", label: "Relatórios",     href: "/admin/relatorios"    },
      { icon: "📣", label: "Notificações",   href: "/admin/notificacoes"  },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: "⚙️", label: "Configurações", href: "/admin/configuracoes" },
    ],
  },
]

const FINANCEIRO_SECTIONS: SidebarSection[] = [
  {
    title: "Principal",
    items: [
      { icon: "📊", label: "Dashboard",      href: "/financeiro"          },
      { icon: "💸", label: "Despesas",       href: "/admin/despesas"      },
      { icon: "💰", label: "Saques",         href: "/admin/saques"        },
      { icon: "📊", label: "Relatórios",     href: "/admin/relatorios"    },
    ],
  },
]

const AFILIADO_SECTIONS: SidebarSection[] = [
  {
    title: "Meu Painel",
    items: [
      { icon: "📊", label: "Dashboard",       href: "/painel-afiliado"          },
    ],
  },
  {
    title: "Minha Conta",
    items: [
      { icon: "🔗", label: "Meu Link",        href: "/painel-afiliado#link"      },
      { icon: "🎯", label: "Meus Leads",      href: "/painel-afiliado#leads"     },
      { icon: "💰", label: "Comissões",       href: "/painel-afiliado#comissoes" },
      { icon: "💸", label: "Solicitar Saque", href: "/painel-afiliado#saque"     },
    ],
  },
]

export function Sidebar({ role = "admin" }: SidebarProps) {
  const pathname   = usePathname()
  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(() => {
    if (role !== "admin") return
    const fetch_ = async () => {
      try {
        const res  = await fetch("/api/admin/notificacoes?dest=admin&naoLidas=true")
        const json = await res.json()
        if (json.success) setNaoLidas(json.data.totalNaoLidas ?? 0)
      } catch {}
    }
    fetch_()
    const interval = setInterval(fetch_, 60000)
    return () => clearInterval(interval)
  }, [role])

  const sections =
    role === "financeiro" ? FINANCEIRO_SECTIONS :
    role === "afiliado"   ? AFILIADO_SECTIONS   :
    ADMIN_SECTIONS

  const isActive = (href: string) => {
    const base = href.split("#")[0]
    if (base === "/admin") return pathname === "/admin"
    return pathname.startsWith(base)
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col bg-[#0D1B2A]">

      {/* Logo */}
      <div className="flex h-[70px] items-center justify-center border-b border-white/10 px-5">
        <Image
          src="/logo-credito-gold.svg"
          alt="Crédito Gold"
          width={160}
          height={48}
          priority
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Role label */}
      <div className="px-5 pb-1 pt-3">
        <div className="font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/30">
          {role === "admin" ? "Administrador" : role === "financeiro" ? "Financeiro" : "Afiliado"}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map(section => (
          <div key={section.title} className="mb-4">
            <div className="mb-1.5 px-3 font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white/30">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link key={item.href} href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-['Sora'] text-sm font-medium transition-all no-underline ${
                      active
                        ? "bg-[#1DB954] text-white shadow-[0_4px_12px_rgba(29,185,84,0.3)]"
                        : "text-white/60 hover:bg-white/8 hover:text-white"
                    }`}>
                    <span className="w-5 text-center text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/admin/notificacoes" && naoLidas > 0 && (
                      <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 font-['Sora'] text-[0.62rem] font-bold text-white">
                        {naoLidas}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 space-y-0.5">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 font-['Sora'] text-sm font-medium text-white/40 no-underline transition-all hover:bg-white/8 hover:text-white/80">
          <span>🌐</span><span>Ver site</span>
        </Link>
        <Link href="/api/auth/signout" className="flex items-center gap-3 rounded-xl px-3 py-2 font-['Sora'] text-sm font-medium text-white/40 no-underline transition-all hover:bg-white/8 hover:text-white/80">
          <span>🚪</span><span>Sair</span>
        </Link>
      </div>
    </aside>
  )
}
