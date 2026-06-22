-- Tabela de correspondentes
CREATE TABLE IF NOT EXISTS "correspondentes" (
  "id"         TEXT NOT NULL,
  "nome"       TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "telefone"   TEXT NOT NULL,
  "ativo"      BOOLEAN NOT NULL DEFAULT true,
  "totalLeads" INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "correspondentes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "correspondentes_email_key" ON "correspondentes"("email");

-- Tabela de vínculo lead-correspondente
CREATE TABLE IF NOT EXISTS "lead_correspondentes" (
  "id"               TEXT NOT NULL,
  "distribuidoEm"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leadId"           TEXT NOT NULL,
  "correspondenteId" TEXT NOT NULL,
  CONSTRAINT "lead_correspondentes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lead_correspondentes_leadId_key"
  ON "lead_correspondentes"("leadId");
CREATE INDEX IF NOT EXISTS "lead_correspondentes_correspondenteId_idx"
  ON "lead_correspondentes"("correspondenteId");

-- Foreign keys (sem IF NOT EXISTS — não suportado no PostgreSQL)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lead_correspondentes_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_correspondentes"
      ADD CONSTRAINT "lead_correspondentes_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'lead_correspondentes_correspondenteId_fkey'
  ) THEN
    ALTER TABLE "lead_correspondentes"
      ADD CONSTRAINT "lead_correspondentes_correspondenteId_fkey"
      FOREIGN KEY ("correspondenteId") REFERENCES "correspondentes"("id")
      ON UPDATE CASCADE;
  END IF;
END $$;