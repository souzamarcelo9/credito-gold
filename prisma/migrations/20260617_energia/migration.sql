-- Adiciona cidade e estado na tabela leads
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "cidade" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "estado" TEXT;
ALTER TABLE "leads" ALTER COLUMN "email" SET DEFAULT '';
ALTER TABLE "leads" ALTER COLUMN "parcelas" SET DEFAULT 0;
ALTER TABLE "leads" ALTER COLUMN "parcelaMensal" SET DEFAULT 0;

-- Adiciona ENERGIA ao enum Produto
ALTER TYPE "Produto" ADD VALUE IF NOT EXISTS 'ENERGIA';

-- Índice por produto
CREATE INDEX IF NOT EXISTS "leads_produto_idx" ON "leads"("produto");

-- Tabela de dados complementares de energia
CREATE TABLE IF NOT EXISTS "leads_energia" (
  "id"                   TEXT NOT NULL,
  "concessionaria"       TEXT,
  "numeroInstalacao"     TEXT,
  "numeroCliente"        TEXT,
  "titularConta"         TEXT,
  "cpfTitular"           TEXT,
  "valorMedioFatura"     DOUBLE PRECISION,
  "possuiDebitos"        BOOLEAN NOT NULL DEFAULT false,
  "dataVencimento"       TEXT,
  "observacoesInternas"  TEXT,
  "preenchidoPor"        TEXT,
  "preenchidoEm"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leadId"               TEXT NOT NULL,
  CONSTRAINT "leads_energia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "leads_energia_leadId_key" ON "leads_energia"("leadId");

ALTER TABLE "leads_energia"
  ADD CONSTRAINT "leads_energia_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
