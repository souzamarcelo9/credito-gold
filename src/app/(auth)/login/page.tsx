"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

type Tab = "login" | "cadastro" | "afiliado"

export default function LoginPage() {
  const [tab, setTab]   = useState<Tab>("login")
  const [email, setEmail] = useState("")
  const [pass, setPass]   = useState("")
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
  setError("")
  setLoading(true)

  const result = await signIn("credentials", {
    email,
    password: pass,
    redirect: false,
  })

  setLoading(false)

  if (result?.error) {
    setError("E-mail ou senha incorretos.")
    return
  }

  // Redireciona por role
  const { getSession } = await import("next-auth/react")
  const session = await getSession()
  const role = (session?.user as any)?.role

  if (role === "AFILIADO") {
    window.location.href = "/painel-afiliado"
  } else if (role === "FINANCEIRO") {
    window.location.href = "/financeiro"
  } else {
    window.location.href = "/admin"
  }
}

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Esquerda */}
      <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-b from-[#0D1B2A] to-[#0a2540] px-16 py-20 md:flex">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#1DB954]/10" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#FF6B00]/10" />
        <div className="relative z-10">
          <div className="mb-12 font-['Sora'] text-2xl font-extrabold text-white">
            Crédito <span className="text-[#1DB954]">Gold</span>
          </div>
          <h2 className="font-['Sora'] text-[2.5rem] font-extrabold leading-tight text-white">
            Acesse sua<br /><span className="text-[#1DB954]">conta segura</span>
          </h2>
          <p className="mt-4 max-w-[380px] leading-relaxed text-[#94a3b8]">
            Gerencie seus créditos, acompanhe suas propostas e controle suas finanças com total segurança.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Dashboard completo em tempo real",
              "Gestão de leads e afiliados",
              "Relatórios financeiros detalhados",
              "Ambiente 100% seguro (SSL/TLS)",
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#cbd5e1]">
                <span className="text-[0.7rem] text-[#1DB954]">✦</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Direita */}
      <div className="flex flex-col items-center justify-center px-8 py-16 md:px-16">
        <div className="w-full max-w-[400px]">
          <h3 className="font-['Sora'] text-3xl font-extrabold text-[#0D1B2A]">Bem-vindo de volta</h3>
          <p className="mb-6 mt-1 text-sm text-[#6b7280]">Entre na sua conta para continuar</p>

          {/* Tabs */}
          <div className="mb-7 flex rounded-[14px] bg-[#f4f6f8] p-1">
            {(["login","cadastro","afiliado"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 rounded-[10px] py-2.5 font-['Sora'] text-sm font-semibold capitalize transition-all ${
                  tab === t ? "bg-white text-[#0D1B2A] shadow-sm" : "text-[#6b7280] hover:text-[#0D1B2A]"
                }`}>
                {t === "login" ? "Entrar" : t === "cadastro" ? "Cadastrar" : "Afiliado"}
              </button>
            ))}
          </div>

         {tab === "login" && (
          <div className="space-y-4">
            <div><Label className="mb-1.5">E-mail</Label>
              <Input type="email" placeholder="seu@email.com" icon="📧" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label className="mb-1.5">Senha</Label>
              <Input type="password" placeholder="••••••••" icon="🔒" value={pass} onChange={e => setPass(e.target.value)} />
              <a href="#" className="mt-1 block text-right text-sm font-semibold text-[#1DB954]">Esqueci minha senha</a>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <Button variant="default" size="full" className="mt-2" onClick={handleLogin} disabled={loading}>
              {loading ? "Entrando..." : "Entrar na minha conta →"}
            </Button>
            <div className="flex items-center gap-3 text-sm text-[#6b7280]">
              <div className="h-px flex-1 bg-[#e5e7eb]" />ou continue com<div className="h-px flex-1 bg-[#e5e7eb]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline">🔍 Google</Button>
              <Button variant="outline">💬 WhatsApp</Button>
            </div>
          </div>
        )}

          {tab === "cadastro" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="mb-1.5">Nome</Label><Input placeholder="Seu nome" /></div>
                <div><Label className="mb-1.5">Sobrenome</Label><Input placeholder="Sobrenome" /></div>
              </div>
              <div><Label className="mb-1.5">E-mail</Label><Input type="email" placeholder="seu@email.com" /></div>
              <div><Label className="mb-1.5">WhatsApp</Label><Input placeholder="(21) 99999-9999" /></div>
              <div><Label className="mb-1.5">CPF</Label><Input placeholder="000.000.000-00" /></div>
              <div><Label className="mb-1.5">Senha</Label><Input type="password" placeholder="Mínimo 8 caracteres" /></div>
              <Button variant="default" size="full" className="mt-2">Criar conta →</Button>
            </div>
          )}

          {tab === "afiliado" && (
            <div className="space-y-4">
              <div><Label className="mb-1.5">E-mail do afiliado</Label>
                <Input type="email" placeholder="afiliado@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div><Label className="mb-1.5">Senha</Label>
                <Input type="password" placeholder="••••••••"
                  value={pass} onChange={e => setPass(e.target.value)} />
              </div>
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}
              <Button variant="orange" size="full" className="mt-2"
                onClick={handleLogin} disabled={loading}>
                {loading ? "Entrando..." : "Acessar painel de afiliado →"}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[#6b7280] no-underline hover:text-[#1DB954]">← Voltar para o site</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
