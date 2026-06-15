# Deploy no Google Cloud Run — Passo a Passo Completo

## Visão geral do que vamos criar

```
GitHub (código)
    ↓ push main
Cloud Build (CI/CD)
    ↓ build + push imagem
Artifact Registry (imagens Docker)
    ↓ deploy
Cloud Run (Next.js rodando)
    ↓ conecta via proxy seguro
Cloud SQL (PostgreSQL)
    ↓ secrets vêm de
Secret Manager (variáveis de ambiente)
```

---

## PARTE 1 — Criar e configurar o projeto

### 1.1 Login e criação do projeto

```bash
# Login no Google Cloud
gcloud auth login

# Cria o projeto (escolha um ID único e sem espaços)
gcloud projects create creditogold-app --name="Credito Gold"

# Define o projeto como padrão
gcloud config set project creditogold-app

# Vincula a conta de faturamento (obrigatório para Cloud Run)
# Liste suas contas de faturamento:
gcloud billing accounts list

# Vincule (substitua BILLING_ID pelo ID listado acima):
gcloud billing projects link creditogold-app \
  --billing-account=BILLING_ID
```

### 1.2 Habilitar as APIs necessárias

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com
```

> Aguarde ~1 minuto para as APIs ativarem.

---

## PARTE 2 — Banco de dados (Cloud SQL)

### 2.1 Criar instância PostgreSQL

```bash
gcloud sql instances create creditogold-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --enable-bin-log
```

> Isso leva ~5 minutos. Tome um café ☕

### 2.2 Criar banco e usuário

```bash
# Cria o banco de dados
gcloud sql databases create creditogold \
  --instance=creditogold-db

# Define senha do usuário postgres
gcloud sql users set-password postgres \
  --instance=creditogold-db \
  --password=ESCOLHA_UMA_SENHA_FORTE

# Cria usuário da aplicação (mais seguro que usar postgres)
gcloud sql users create creditogold_user \
  --instance=creditogold-db \
  --password=ESCOLHA_OUTRA_SENHA_FORTE
```

### 2.3 Pegar a Connection Name (para o .env)

```bash
gcloud sql instances describe creditogold-db \
  --format="value(connectionName)"
```

Anote o resultado, formato: `creditogold-app:us-central1:creditogold-db`

---

## PARTE 3 — Secret Manager (variáveis de ambiente)

> Nunca coloque secrets em variáveis de ambiente do Cloud Run diretamente.
> Use o Secret Manager — é criptografado e auditado.

```bash
# DATABASE_URL com o Cloud SQL Proxy
# Substitua SENHA pela senha que você criou no passo 2.2
echo -n "postgresql://creditogold_user:SENHA@localhost/creditogold?host=/cloudsql/creditogold-app:us-central1:creditogold-db" \
  | gcloud secrets create DATABASE_URL --data-file=-

# NextAuth Secret (gera um aleatório)
echo -n "$(openssl rand -base64 32)" \
  | gcloud secrets create NEXTAUTH_SECRET --data-file=-

# Chave de criptografia AES-256 (EXATAMENTE 32 caracteres)
echo -n "$(openssl rand -base64 24 | tr -d '=' | cut -c1-32)" \
  | gcloud secrets create ENCRYPTION_KEY --data-file=-

# Salt para hash do CPF
echo -n "$(openssl rand -hex 16)" \
  | gcloud secrets create CPF_HASH_SALT --data-file=-
```

---

## PARTE 4 — Artifact Registry (repositório de imagens)

```bash
# Cria o repositório de imagens Docker
gcloud artifacts repositories create creditogold \
  --repository-format=docker \
  --location=us-central1 \
  --description="Imagens do Crédito Gold"

# Configura autenticação do Docker com o Google
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## PARTE 5 — Build e push da imagem

```bash
# Na raiz do projeto (onde está o Dockerfile):
cd credito-gold

# Build da imagem
docker build -t us-central1-docker.pkg.dev/creditogold-app/creditogold/creditogold-app:latest .

# Push para o Artifact Registry
docker push us-central1-docker.pkg.dev/creditogold-app/creditogold/creditogold-app:latest
```

> O build leva ~3-5 minutos na primeira vez.

---

## PARTE 6 — Permissões do Cloud Run

```bash
# Pega o email da service account do Cloud Run
PROJECT_NUMBER=$(gcloud projects describe creditogold-app --format="value(projectNumber)")

# Dá permissão para acessar os secrets
gcloud projects add-iam-policy-binding creditogold-app \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Dá permissão para conectar ao Cloud SQL
gcloud projects add-iam-policy-binding creditogold-app \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

---

## PARTE 7 — Deploy no Cloud Run

```bash
gcloud run deploy creditogold-app \
  --image=us-central1-docker.pkg.dev/creditogold-app/creditogold/creditogold-app:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --add-cloudsql-instances=creditogold-app:us-central1:creditogold-db \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,ENCRYPTION_KEY=ENCRYPTION_KEY:latest,CPF_HASH_SALT=CPF_HASH_SALT:latest \
  --set-env-vars=NODE_ENV=production,NEXTAUTH_URL=https://SEU-URL.run.app,NEXT_PUBLIC_BASE_URL=https://SEU-URL.run.app
```

> Após o deploy, o Google gera uma URL no formato:
> `https://creditogold-app-XXXXXXXX-uc.a.run.app`
> 
> Copie essa URL e re-faça o deploy substituindo `SEU-URL.run.app` pela URL real.

---

## PARTE 8 — Rodar as migrations em produção

```bash
# Conecta ao Cloud SQL via proxy para rodar as migrations
# Instale o proxy se não tiver:
# curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.linux.amd64
# chmod +x cloud-sql-proxy

# Em um terminal, sobe o proxy:
./cloud-sql-proxy creditogold-app:us-central1:creditogold-db &

# Em outro terminal, com DATABASE_URL apontando para localhost:
DATABASE_URL="postgresql://creditogold_user:SENHA@localhost/creditogold" \
  npx prisma migrate deploy

# Seed inicial (só na primeira vez)
DATABASE_URL="postgresql://creditogold_user:SENHA@localhost/creditogold" \
  npx prisma db seed
```

---

## PARTE 9 — CI/CD automático com Cloud Build (opcional)

Para que cada `git push` na branch `main` faça deploy automático:

```bash
# Conecta o repositório GitHub ao Cloud Build
# (faça pelo Console: Cloud Build > Triggers > Connect Repository)

# Ou via CLI:
gcloud builds triggers create github \
  --repo-name=SEU-REPO \
  --repo-owner=SEU-USUARIO \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

---

## Resumo de custos estimados

| Serviço | Tier | Custo estimado |
|---------|------|----------------|
| Cloud Run | 0 instâncias quando inativo | ~$0-30/mês |
| Cloud SQL | db-f1-micro (1 vCPU, 614MB RAM) | ~$15-25/mês |
| Artifact Registry | primeiros 0.5GB grátis | ~$0-2/mês |
| Secret Manager | primeiros 6 acessos/mês grátis | ~$0/mês |
| **Total** | | **~$15-57/mês** |

> O Cloud Run escala para zero quando não há requisições —
> você só paga quando o sistema está sendo usado.

---

## Verificar se está funcionando

```bash
# Testa a API de saúde
curl https://SEU-URL.run.app/api/simulador \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"produto":"pessoal","valor":10000,"parcelas":24}'

# Deve retornar JSON com parcela, taxa, CET, etc.
```

---

## Problemas comuns

**Erro: "Cloud SQL connection failed"**
→ Verifique se o `--add-cloudsql-instances` está correto no deploy

**Erro: "Secret not found"**
→ Verifique se a service account tem a role `secretmanager.secretAccessor`

**Erro: "Migration failed"**
→ Rode as migrations manualmente via Cloud SQL Proxy (Parte 8)

**Imagem não encontrada**
→ Verifique se o `docker push` foi concluído antes do deploy
