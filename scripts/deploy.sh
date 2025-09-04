#!/bin/bash

# 🚀 SCRIPT DE DEPLOY PARA PRODUÇÃO

set -e  # Sair se algum comando falhar

echo "🚀 Iniciando deploy para produção..."

# Verificações pré-deploy
echo "✅ Verificando environment..."
if [ ! -f "./env/.env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado!"
    exit 1
fi

# Backup do banco atual
echo "💾 Fazendo backup do banco..."
./scripts/backup.sh

# Pull do repositório
echo "📦 Atualizando código..."
git pull origin main

# Build das imagens
echo "🏗️ Buildando imagens..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Migração do banco
echo "🗄️ Rodando migrações..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Deploy
echo "🚀 Fazendo deploy..."
docker-compose -f docker-compose.prod.yml up -d

# Verificações pós-deploy
echo "🔍 Verificando serviços..."
sleep 30

if curl -f https://api.yourdomain.com/api/health; then
    echo "✅ Deploy realizado com sucesso!"
    
    # Limpeza de imagens antigas
    docker image prune -f
    
    # Logs
    docker-compose -f docker-compose.prod.yml logs --tail=50
else
    echo "❌ Deploy falhou! Fazendo rollback..."
    ./scripts/rollback.sh
    exit 1
fi