import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/validations"

// Mock users — em produção substitui pela query ao banco
const MOCK_USERS = [
  { id:"1", email:"admin@creditogold.com.br",       password:"Admin@123", name:"Administrador",  role:"ADMIN"      },
  { id:"2", email:"financeiro@creditogold.com.br",  password:"Fin@123",   name:"Financeiro",     role:"FINANCEIRO" },
  { id:"3", email:"afiliado@creditogold.com.br",    password:"Afil@123",  name:"João Afiliado",  role:"AFILIADO"   },
]

async function getUserFromDb(email: string, password: string) {
  try {
    const prisma = (await import("@/lib/prisma")).default
    if (!prisma) throw new Error("no prisma")
    const bcrypt = await import("bcryptjs")
    const user   = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.ativo) return null
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return null
    return { id: user.id, email: user.email, name: user.nome, role: user.role }
  } catch {
    // Fallback mock quando banco não disponível
    const u = MOCK_USERS.find(u => u.email === email && u.password === password)
    return u ? { id: u.id, email: u.email, name: u.name, role: u.role } : null
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label:"E-mail",  type:"email"    },
        password: { label:"Senha",   type:"password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        return getUserFromDb(parsed.data.email, parsed.data.password)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role
      return session
    },
  },
  pages:   { signIn:"/login", error:"/login" },
  session: { strategy:"jwt" },
  secret:  process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
})

export { handler as GET, handler as POST }
