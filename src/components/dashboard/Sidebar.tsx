"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

interface NavItem {
  icon: string
  label: string
  href: string
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
      { icon: "📊", label: "Dashboard",    href: "/admin" },
      { icon: "💰", label: "Financeiro",   href: "/financeiro" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { icon: "👥", label: "Clientes",     href: "/admin/clientes" },
      { icon: "🎯", label: "Leads",        href: "/admin/leads",     badge: 24 },
      { icon: "⚡", label: "Energia",      href: "/admin/energia"               },
      { icon: "🏦", label: "Bancos",         href: "/admin/bancos"       },
      { icon: "🔗", label: "Afiliados",      href: "/admin/afiliados"    },
      { icon: "🎯", label: "Distribuição",   href: "/admin/distribuicao" },
      { icon: "⚙️", label: "Configurações",  href: "/admin/configuracoes"},
      { icon: "📋", label: "Propostas",    href: "/admin/propostas" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: "⚙️", label: "Configurações", href: "/admin/configuracoes" },
      { icon: "📣", label: "Notificações",  href: "/admin/notificacoes", badge: 7 },
      { icon: "📑", label: "Relatórios",    href: "/admin/relatorios" },
    ],
  },
]

const AFILIADO_SECTIONS: SidebarSection[] = [
  {
    title: "Menu",
    items: [
      { icon: "📊", label: "Meu Painel",  href: "/afiliados/painel" },
      { icon: "🔗", label: "Meus Links",  href: "/afiliados/links" },
      { icon: "💸", label: "Comissões",   href: "/afiliados/comissoes" },
      { icon: "👥", label: "Minha Rede",  href: "/afiliados/rede" },
      { icon: "📚", label: "Materiais",   href: "/afiliados/materiais" },
    ],
  },
]

export function Sidebar({ role = "admin" }: SidebarProps) {
  const pathname = usePathname()
  const sections = role === "afiliado" ? AFILIADO_SECTIONS : ADMIN_SECTIONS
  const roleLabel = role === "afiliado" ? "Afiliados" : role === "financeiro" ? "Financeiro" : "Admin"

  return (
    <aside className="fixed bottom-0 left-0 top-0 flex w-[260px] flex-col overflow-y-auto bg-[#0D1B2A] px-5 py-6">
      {/* Brand */}
      <div className="mb-6 border-b border-white/10 pb-5">
        <div className="font-['Sora'] text-lg font-extrabold text-white">
          Crédito <span className="text-[#1DB954]">Gold</span>
        </div>
        <div className="mt-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-[#475569]">
          {roleLabel}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <div className="mb-2 px-3 font-['Sora'] text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#475569]">
              {section.title}
            </div>
            {section.items.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-0.5 flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-['Sora'] text-sm font-medium no-underline transition-all ${
                    isActive
                      ? "bg-[#1DB954]/15 text-[#1DB954]"
                      : "text-[#94a3b8] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 font-['Sora'] text-[0.62rem] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-0.5 border-t border-white/10 pt-4">
        <Link href="/" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-['Sora'] text-sm font-medium text-[#94a3b8] no-underline transition-all hover:bg-white/5 hover:text-white">
          <span className="w-5 text-center">🌐</span> Ver site
        </Link>
        <Link href="/login" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-['Sora'] text-sm font-medium text-[#94a3b8] no-underline transition-all hover:bg-white/5 hover:text-white">
          <span className="w-5 text-center">🚪</span> Sair
        </Link>
      </div>
    </aside>
  )
}
