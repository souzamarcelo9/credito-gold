# Setup do projeto — Crédito Gold

## Pré-requisitos
- Node.js 18+
- Docker + Docker Compose
- npm

---

## 1. Instalar dependências

```bash
npm install
```

---

## 2. Subir o banco PostgreSQL com Docker

```bash
npm run db:up
```

Isso sobe:
- **PostgreSQL 16** na porta `5432`
- **Adminer** (interface visual) em `http://localhost:8080`
  - Sistema: PostgreSQL
  - Servidor: postgres
  - Usuário: creditogold
  - Senha: creditogold_dev_pass
  - Banco: creditogold

---

## 3. Criar as tabelas (migration)

```bash
npm run db:migrate
```

Quando perguntar o nome da migration, digite: `init`

---

## 4. Popular com dados de exemplo

```bash
npm run db:seed
```

Isso cria:
- **Admin:** admin@creditogold.com.br / Admin@123
- **Financeiro:** financeiro@creditogold.com.br / Fin@123
- **Afiliado de exemplo:** slug `joao123`
- **5 leads de exemplo** com status variados

---

## 5. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Rotas disponíveis

| URL | Descrição |
|-----|-----------|
| `localhost:3000` | Landing page + simulador |
| `localhost:3000/afiliados` | Cadastro de afiliados |
| `localhost:3000/login` | Login admin/afiliado |
| `localhost:3000/admin` | Dashboard admin |
| `localhost:8080` | Adminer (visualizar banco) |

---

## Comandos úteis

```bash
npm run db:studio    # Abre interface gráfica do Prisma
npm run db:reset     # Apaga tudo e recria o banco do zero
npm run db:down      # Para o container Docker
```

---

## Variáveis de ambiente importantes para produção

Copie `.env.example` para `.env.local` e preencha:

```
DATABASE_URL="postgresql://user:pass@host:5432/creditogold"
NEXTAUTH_SECRET="gere com: openssl rand -base64 32"
ENCRYPTION_KEY="exatamente 32 caracteres para AES-256"
CPF_HASH_SALT="string aleatória para hash do CPF"
```

> ⚠️ **Nunca** commite `.env.local` no Git. Ele já está no `.gitignore`.
