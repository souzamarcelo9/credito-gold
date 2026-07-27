-- Tabela de sessões do Typebot (usada pelo webhook Z-API)
CREATE TABLE IF NOT EXISTS "typebot_sessions" (
  "phone"      TEXT NOT NULL PRIMARY KEY,
  "session_id" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
