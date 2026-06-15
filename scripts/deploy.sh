#!/bin/bash
set -e

PROJECT_ID="creditogold-app"
REGION="us-central1"
SERVICE="creditogold-app"
REPO="creditogold"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}"

echo "🚀 Iniciando deploy do Crédito Gold..."
gcloud config set project ${PROJECT_ID}

echo "📦 Build da imagem..."
docker build -t ${IMAGE}:latest -t ${IMAGE}:$(git rev-parse --short HEAD) .

echo "⬆️  Push para Artifact Registry..."
docker push ${IMAGE}:latest

echo "🌐 Deploy no Cloud Run..."
gcloud run deploy ${SERVICE} \
  --image=${IMAGE}:latest \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --add-cloudsql-instances=${PROJECT_ID}:${REGION}:creditogold-db \
  --set-secrets=DATABASE_URL=DATABASE_URL:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,ENCRYPTION_KEY=ENCRYPTION_KEY:latest,CPF_HASH_SALT=CPF_HASH_SALT:latest \
  --set-env-vars=NODE_ENV=production

URL=$(gcloud run services describe ${SERVICE} --region=${REGION} --format="value(status.url)")
echo ""
echo "✅ Deploy concluído! Acesse: ${URL}"
