DO $$ BEGIN
  CREATE TYPE "CategoriaDocumento" AS ENUM (
    'EMPRESA','CORRESPONDENTE','AFILIADO','BANCO_PARCEIRO','JURIDICO','CONTABIL','OUTROS'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusDocumento" AS ENUM ('VALIDO','VENCENDO','VENCIDO','ARQUIVADO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "documentos_internos" (
  "id"             TEXT NOT NULL,
  "titulo"         TEXT NOT NULL,
  "categoria"      "CategoriaDocumento" NOT NULL DEFAULT 'EMPRESA',
  "descricao"      TEXT,
  "arquivoUrl"     TEXT,
  "arquivoNome"    TEXT,
  "responsavel"    TEXT,
  "dataEmissao"    TIMESTAMP(3),
  "dataVencimento" TIMESTAMP(3),
  "status"         "StatusDocumento" NOT NULL DEFAULT 'VALIDO',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documentos_internos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "documentos_internos_status_idx"          ON "documentos_internos"("status");
CREATE INDEX IF NOT EXISTS "documentos_internos_dataVencimento_idx"  ON "documentos_internos"("dataVencimento");
CREATE INDEX IF NOT EXISTS "documentos_internos_categoria_idx"       ON "documentos_internos"("categoria");
