-- Enum TipoBanco
DO $$ BEGIN
  CREATE TYPE "TipoBanco" AS ENUM ('BANCO', 'PROMOTORA');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tabela bancos_promotoras
CREATE TABLE IF NOT EXISTS "bancos_promotoras" (
  "id"        TEXT NOT NULL,
  "nome"      TEXT NOT NULL,
  "tipo"      "TipoBanco" NOT NULL DEFAULT 'BANCO',
  "ativo"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bancos_promotoras_pkey" PRIMARY KEY ("id")
);

-- Tabela produtos_banco
CREATE TABLE IF NOT EXISTS "produtos_banco" (
  "id"                       TEXT NOT NULL,
  "produto"                  "Produto" NOT NULL,
  "comissaoCG"               DOUBLE PRECISION NOT NULL,
  "percentualAfiliado"       DOUBLE PRECISION NOT NULL,
  "percentualCorrespondente" DOUBLE PRECISION NOT NULL,
  "ativo"                    BOOLEAN NOT NULL DEFAULT true,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "bancoId"                  TEXT NOT NULL,
  CONSTRAINT "produtos_banco_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "produtos_banco_bancoId_produto_key"
  ON "produtos_banco"("bancoId", "produto");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'produtos_banco_bancoId_fkey'
  ) THEN
    ALTER TABLE "produtos_banco"
      ADD CONSTRAINT "produtos_banco_bancoId_fkey"
      FOREIGN KEY ("bancoId") REFERENCES "bancos_promotoras"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Adiciona bancoId na tabela leads
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bancoId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_bancoId_fkey'
  ) THEN
    ALTER TABLE "leads"
      ADD CONSTRAINT "leads_bancoId_fkey"
      FOREIGN KEY ("bancoId") REFERENCES "bancos_promotoras"("id")
      ON UPDATE CASCADE;
  END IF;
END $$;
