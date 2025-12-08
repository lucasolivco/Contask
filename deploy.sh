#!/bin/bash

# --- Script de Deploy Padrão (Seguro e Simplificado) ---

set -e
PROD_ENV_FILE="./env/.env.production"

check_health() {
  local container_name=$1
  echo "⏳ Verificando a saúde do contêiner: ${container_name}..."

  for i in {1..9}; do
    if docker ps --filter "name=^${container_name}$" | grep -q "(healthy)"; then
      echo "✅ O contêiner ${container_name} está saudável!"
      return 0
    fi
    echo "  ...aguardando 10 segundos (tentativa ${i}/9)"
    sleep 10
  done

  echo "❌ ERRO: O contêiner ${container_name} não ficou saudável após 90 segundos."
  exit 1
}

echo "🚀 Iniciando o deploy da aplicação..."

# --- Fase 1: Puxar atualizações do Git ---
echo "🔄 Fase 1: Puxando atualizações do repositório Git..."
git pull origin main

# --- Fase 2: Reconstruir e reiniciar os serviços ---
echo "🏗️ Fase 2: Recriando e reiniciando os contêineres..."
docker-compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml up -d --build

# --- Fase 3: Backup do Banco de Dados ---
echo "🗄️ Fase 3: Criando backup do banco de dados de produção..."
docker-compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > ./backups/backup_$(date +%F_%H-%M-%S).sql

# --- Fase 4: Aplicar Migrações Pendentes ---
echo "🗃️ Fase 4: Aplicando migrações pendentes..."
docker-compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# --- Fases Finais ---
echo "🧹 Fase 5: Limpando imagens Docker antigas..."
docker image prune -f

echo "🩺 Fase 6: Verificando se os serviços principais estão funcionando..."
check_health "task_manager_backend"
check_health "task_manager_frontend"
check_health "task_manager-postgres-1"
check_health "task_manager-redis-1"

echo "✅ Deploy concluído e todos os serviços estão saudáveis!"
