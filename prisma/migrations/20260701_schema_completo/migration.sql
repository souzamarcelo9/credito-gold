-- Correspondentes
CREATE TABLE IF NOT EXISTS "correspondentes" (
  "id" TEXT NOT NULL, "nome" TEXT NOT NULL, "email" TEXT, "telefone" TEXT,
  "cidade" TEXT, "estado" TEXT, "ativo" BOOLEAN NOT NULL DEFAULT true,
  "peso" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "correspondentes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "leads_correspondentes" (
  "id" TEXT NOT NULL, "atribuidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leadId" TEXT NOT NULL, "correspondenteId" TEXT NOT NULL,
  CONSTRAINT "leads_correspondentes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "leads_correspondentes_leadId_key" ON "leads_correspondentes"("leadId");

-- Bancos e Promotoras
DO $$ BEGIN CREATE TYPE "TipoBanco" AS ENUM ('BANCO','PROMOTORA'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "bancos_promotoras" (
  "id" TEXT NOT NULL, "nome" TEXT NOT NULL, "tipo" "TipoBanco" NOT NULL DEFAULT 'BANCO',
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bancos_promotoras_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "produtos_banco" (
  "id" TEXT NOT NULL, "produto" "Produto" NOT NULL, "comissaoCG" DOUBLE PRECISION NOT NULL,
  "percentualAfiliado" DOUBLE PRECISION NOT NULL, "percentualCorrespondente" DOUBLE PRECISION NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "bancoId" TEXT NOT NULL, CONSTRAINT "produtos_banco_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "produtos_banco_bancoId_produto_key" ON "produtos_banco"("bancoId","produto");

-- Adiciona bancoId no Lead
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "bancoId" TEXT;

-- Despesas
DO $$ BEGIN CREATE TYPE "CategoriaDespesa" AS ENUM ('OPERACIONAL','PESSOAL','MARKETING','TECNOLOGIA','JURIDICO','IMPOSTOS','OUTROS'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "despesas" (
  "id" TEXT NOT NULL, "descricao" TEXT NOT NULL,
  "categoria" "CategoriaDespesa" NOT NULL DEFAULT 'OPERACIONAL',
  "valor" DOUBLE PRECISION NOT NULL, "parcelado" BOOLEAN NOT NULL DEFAULT false,
  "totalParcelas" INTEGER NOT NULL DEFAULT 1, "parcelaAtual" INTEGER NOT NULL DEFAULT 1,
  "valorParcela" DOUBLE PRECISION, "dataPrimeiraParcela" TIMESTAMP(3),
  "formaPagamento" TEXT NOT NULL DEFAULT 'À vista', "observacao" TEXT,
  "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "despesas_pkey" PRIMARY KEY ("id")
);

-- Documentos Internos
DO $$ BEGIN CREATE TYPE "CategoriaDocumento" AS ENUM ('EMPRESA','CORRESPONDENTE','AFILIADO','BANCO_PARCEIRO','JURIDICO','CONTABIL','OUTROS'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "StatusDocumento" AS ENUM ('VALIDO','VENCENDO','VENCIDO','ARQUIVADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "documentos_internos" (
  "id" TEXT NOT NULL, "titulo" TEXT NOT NULL,
  "categoria" "CategoriaDocumento" NOT NULL DEFAULT 'EMPRESA',
  "descricao" TEXT, "arquivoUrl" TEXT, "arquivoNome" TEXT, "responsavel" TEXT,
  "dataEmissao" TIMESTAMP(3), "dataVencimento" TIMESTAMP(3),
  "status" "StatusDocumento" NOT NULL DEFAULT 'VALIDO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documentos_internos_pkey" PRIMARY KEY ("id")
);

-- Saques
DO $$ BEGIN CREATE TYPE "TipoChavePix" AS ENUM ('CPF','CNPJ','EMAIL','TELEFONE','ALEATORIA'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "StatusSaque" AS ENUM ('SOLICITADO','APROVADO','PAGO','REJEITADO','PENDENTE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "saques_comissao" (
  "id" TEXT NOT NULL, "afiliadoId" TEXT NOT NULL, "valor" DOUBLE PRECISION NOT NULL,
  "pixChave" TEXT NOT NULL, "pixTipo" "TipoChavePix" NOT NULL DEFAULT 'CPF',
  "status" "StatusSaque" NOT NULL DEFAULT 'SOLICITADO',
  "asaasId" TEXT, "observacao" TEXT,
  "solicitadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pagoEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saques_comissao_pkey" PRIMARY KEY ("id")
);

-- saqueId na comissao
ALTER TABLE "comissoes" ADD COLUMN IF NOT EXISTS "saqueId" TEXT;

-- Tabelas do chatbot WhatsApp
CREATE TABLE IF NOT EXISTS typebot_sessions (
  phone TEXT NOT NULL PRIMARY KEY, session_id TEXT NOT NULL,
  result_id TEXT, expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  phone TEXT NOT NULL PRIMARY KEY, step TEXT NOT NULL DEFAULT 'MENU',
  produto TEXT, produto_label TEXT, tipo_cliente TEXT,
  nome TEXT, cpf TEXT, telefone TEXT, cidade TEXT, perfil TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
