import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Crédito Gold — Soluções Financeiras",
  description: "Crédito rápido, seguro e transparente. Simule agora e descubra a melhor oferta personalizada para você.",
  keywords: ["crédito", "empréstimo", "financeiro", "consignado", "FGTS"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
