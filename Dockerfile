# ── Estágio 1: dependências ──────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Instala openssl para o Prisma
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instala apenas dependências de produção
RUN npm ci --legacy-peer-deps

# Gera o Prisma Client para o target correto (linux-musl = Alpine)
RUN npx prisma generate

# ── Estágio 2: build ─────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma       ./prisma
COPY . .

# Variáveis dummy só para o build não falhar
# Os valores reais vêm do Secret Manager em runtime
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost/dummy"
ENV NEXTAUTH_SECRET="build-time-secret"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV ENCRYPTION_KEY="build-time-key-32-chars-exactly!!"
ENV CPF_HASH_SALT="build-salt"
ENV NEXT_PUBLIC_BASE_URL="http://localhost:3000"

RUN npm run build

# ── Estágio 3: runner (imagem final enxuta) ──────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copia apenas o necessário para rodar
COPY --from=builder /app/public         ./public
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/package.json   ./package.json

# Copia o build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Copia o node_modules com o Prisma Client gerado
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Roda migrations e inicia o servidor
CMD ["node" ,"server.js"]

