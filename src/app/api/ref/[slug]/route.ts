import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Cloud Run injeta x-forwarded-host com o domínio público real
  // Fallback para x-forwarded-proto + host, depois origin
  const forwardedHost  = req.headers.get("x-forwarded-host")
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https"
  const host           = req.headers.get("host")

  let origin: string
  if (forwardedHost) {
    origin = `${forwardedProto}://${forwardedHost}`
  } else if (host && !host.includes("0.0.0.0")) {
    origin = `${forwardedProto}://${host}`
  } else {
    // Último recurso — usa a variável de ambiente server-side (sem NEXT_PUBLIC_)
    origin = process.env.APP_URL ?? "https://creditogold-app-805299899347.us-central1.run.app"
  }

  // Registra clique no banco
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (prisma) {
      await prisma.afiliado.update({
        where: { slug },
        data:  { totalCliques: { increment: 1 } },
      })
    }
  } catch { /* silencioso */ }

  return NextResponse.redirect(`${origin}/?ref=${slug}`, { status: 302 })
}
