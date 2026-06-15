/**
 * GET /api/csrf
 * Retorna um token CSRF válido para o frontend usar nas mutations
 */
import { NextRequest, NextResponse } from "next/server"
import { generateCsrfToken } from "@/lib/csrf"

export async function GET(req: NextRequest) {
  const token = generateCsrfToken()

  const response = NextResponse.json({ token })

  // Também seta como cookie HttpOnly como camada extra
  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   60 * 60, // 1 hora
    path:     "/",
  })

  return response
}
