DO $$ BEGIN
  CREATE TYPE "TipoClienteParceiro" AS ENUM ('EMPRESA','CORRETORA','ESCRITORIO','COOPERATIVA','OUTROS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusParceiro" AS ENUM ('ATIVO','INATIVO','PROSPECTO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "clientes_parceiros" (
  "id"           TEXT NOT NULL,
  "razaoSocial"  TEXT NOT NULL,
  "nomeFantasia" TEXT,
  "cnpj"         TEXT NOT NULL,
  "tipo"         "TipoClienteParceiro" NOT NULL DEFAULT 'EMPRESA',
  "segmento"     TEXT,
  "responsavel"  TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "telefone"     TEXT NOT NULL,
  "cidade"       TEXT,
  "estado"       TEXT,
  "status"       "StatusParceiro" NOT NULL DEFAULT 'ATIVO',
  "observacoes"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clientes_parceiros_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "clientes_parceiros_cnpj_key" ON "clientes_parceiros"("cnpj");
CREATE INDEX IF NOT EXISTS "clientes_parceiros_status_idx" ON "clientes_parceiros"("status");
CREATE INDEX IF NOT EXISTS "clientes_parceiros_tipo_idx"   ON "clientes_parceiros"("tipo");