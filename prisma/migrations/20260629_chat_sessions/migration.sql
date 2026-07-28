CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "phone"         TEXT NOT NULL PRIMARY KEY,
  "step"          TEXT NOT NULL DEFAULT 'MENU',
  "produto"       TEXT,
  "produto_label" TEXT,
  "tipo_cliente"  TEXT,
  "nome"          TEXT,
  "cpf"           TEXT,
  "telefone"      TEXT,
  "cidade"        TEXT,
  "perfil"        TEXT,
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
