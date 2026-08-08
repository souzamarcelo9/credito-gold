"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

interface NavItem {
  icon:   string
  label:  string
  href:   string
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
      { icon: "📊", label: "Dashboard",   href: "/financeiro"       },
      { icon: "💸", label: "Despesas",    href: "/admin/despesas"   },
      { icon: "💰", label: "Saques",      href: "/admin/saques"     },
      { icon: "📊", label: "Relatórios",  href: "/admin/relatorios" },
    ],
  },
]

const AFILIADO_SECTIONS: SidebarSection[] = [
  {
    title: "Meu Painel",
    items: [
      { icon: "📊", label: "Dashboard",        href: "/painel-afiliado"          },
    ],
  },
  {
    title: "Minha Conta",
    items: [
      { icon: "🔗", label: "Meu Link",         href: "/painel-afiliado#link"      },
      { icon: "🎯", label: "Meus Leads",       href: "/painel-afiliado#leads"     },
      { icon: "💰", label: "Comissões",        href: "/painel-afiliado#comissoes" },
      { icon: "💸", label: "Solicitar Saque",  href: "/painel-afiliado#saque"     },
    ],
  },
]

export function Sidebar({ role = "admin" }: SidebarProps) {
  const pathname      = usePathname()
  const [open, setOpen]       = useState(false)
  const [naoLidas, setNaoLidas] = useState(0)

  // Fecha o menu ao mudar de rota
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloqueia scroll do body quando menu aberto no mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

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

  const roleLabel =
    role === "admin"      ? "Administrador" :
    role === "financeiro" ? "Financeiro"    : "Afiliado"

  const isActive = (href: string) => {
    const base = href.split("#")[0]
    if (base === "/admin") return pathname === "/admin"
    return pathname.startsWith(base)
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-[64px] items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo-credito-gold.svg"
            alt="Crédito Gold"
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="font-['Sora'] text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white/30">
          {roleLabel}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {sections.map(section => (
          <div key={section.title} className="mb-4">
            <div className="mb-1 px-3 font-['Sora'] text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white/30">
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
                      <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 font-['Sora'] text-[0.6rem] font-bold text-white">
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
      <div className="border-t border-white/10 p-3 space-y-0.5">
        <Link href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2 font-['Sora'] text-sm font-medium text-white/40 no-underline transition-all hover:bg-white/8 hover:text-white/80">
          <span>🌐</span><span>Ver site</span>
        </Link>
        <Link href="/logout"
          className="flex items-center gap-3 rounded-xl px-3 py-2 font-['Sora'] text-sm font-medium text-white/40 no-underline transition-all hover:bg-white/8 hover:text-white/80">
          <span>🚪</span><span>Sair</span>
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* ── DESKTOP: sidebar fixo ── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] flex-col bg-[#0D1B2A] lg:flex">
        <NavContent />
      </aside>

      {/* ── MOBILE: header + drawer ── */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between bg-[#0D1B2A] px-4 shadow-lg lg:hidden">
        {/* Logo mobile */}
        <img
          src="/logo-credito-gold.svg"
          alt="Crédito Gold"
          className="h-7 w-auto object-contain"
        />

        {/* Hambúrguer */}
        <button
          onClick={() => setOpen(o => !o)}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg bg-white/10 transition-all hover:bg-white/20"
          aria-label="Menu">
          <span className={`block h-0.5 w-5 bg-white transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Overlay escuro */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer mobile */}
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col bg-[#0D1B2A] shadow-2xl transition-transform duration-300 lg:hidden ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        <NavContent />
      </aside>
    </>
  )
}
