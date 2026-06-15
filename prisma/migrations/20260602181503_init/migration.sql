-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'FINANCEIRO', 'AFILIADO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "AfiliadoStatus" AS ENUM ('PENDENTE', 'ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "AfiliadoNivel" AS ENUM ('BRONZE', 'PRATA', 'GOLD', 'DIAMANTE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOVO', 'EM_ANALISE', 'PROPOSTA_ENVIADA', 'CONTRATO_ASSINADO', 'APROVADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "Produto" AS ENUM ('PESSOAL', 'GARANTIA', 'EMPRESARIAL', 'CONSIGNADO', 'FGTS');

-- CreateEnum
CREATE TYPE "Origem" AS ENUM ('ORGANICO', 'AFILIADO', 'WHATSAPP', 'DIRETO');

-- CreateEnum
CREATE TYPE "ComissaoStatus" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afiliados" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "slug" TEXT NOT NULL,
    "status" "AfiliadoStatus" NOT NULL DEFAULT 'PENDENTE',
    "nivel" "AfiliadoNivel" NOT NULL DEFAULT 'BRONZE',
    "codigoIndicacao" TEXT,
    "totalCliques" INTEGER NOT NULL DEFAULT 0,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalAprovados" INTEGER NOT NULL DEFAULT 0,
    "totalComissoes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "afiliados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "produto" "Produto" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "parcelas" INTEGER NOT NULL,
    "parcelaMensal" DOUBLE PRECISION NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NOVO',
    "origem" "Origem" NOT NULL DEFAULT 'ORGANICO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "afiliadoId" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" "ComissaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "pixChave" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanhoKb" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "targetId" TEXT,
    "targetType" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "details" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configs" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "afiliados_cpf_key" ON "afiliados"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "afiliados_slug_key" ON "afiliados"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "afiliados_userId_key" ON "afiliados"("userId");

-- CreateIndex
CREATE INDEX "leads_cpfHash_idx" ON "leads"("cpfHash");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_afiliadoId_idx" ON "leads"("afiliadoId");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "comissoes_leadId_key" ON "comissoes"("leadId");

-- CreateIndex
CREATE INDEX "comissoes_afiliadoId_idx" ON "comissoes"("afiliadoId");

-- CreateIndex
CREATE INDEX "comissoes_status_idx" ON "comissoes"("status");

-- CreateIndex
CREATE INDEX "documentos_leadId_idx" ON "documentos"("leadId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "configs_chave_key" ON "configs"("chave");

-- AddForeignKey
ALTER TABLE "afiliados" ADD CONSTRAINT "afiliados_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "afiliados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "afiliados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
