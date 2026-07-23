DO $$ BEGIN
  CREATE TYPE "TipoNotificacao" AS ENUM (
    'LEAD_NOVO','LEAD_APROVADO','LEAD_RECUSADO','COMISSAO_GERADA','DOCUMENTO_VENCENDO','SISTEMA'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CanalNotificacao" AS ENUM ('SISTEMA','WHATSAPP','EMAIL','TODOS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "notificacoes" (
  "id"           TEXT NOT NULL,
  "tipo"         "TipoNotificacao" NOT NULL,
  "titulo"       TEXT NOT NULL,
  "mensagem"     TEXT NOT NULL,
  "destinatario" TEXT NOT NULL,
  "canal"        "CanalNotificacao" NOT NULL DEFAULT 'SISTEMA',
  "lida"         BOOLEAN NOT NULL DEFAULT false,
  "enviadaZapi"  BOOLEAN NOT NULL DEFAULT false,
  "zapiStatus"   TEXT,
  "leadId"       TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "notificacoes_dest_lida_idx" ON "notificacoes"("destinatario","lida");
CREATE INDEX IF NOT EXISTS "notificacoes_createdAt_idx" ON "notificacoes"("createdAt");
