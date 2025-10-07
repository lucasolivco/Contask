#!/bin/bash

# --- Script de Deploy Automatizado com Verificação de Saúde (Versão Final) ---

# Interrompe o script se qualquer comando falhar
set -e

# Define o arquivo de ambiente de produção como uma variável para fácil reutilização
PROD_ENV_FILE="./env/.env.production"

# Função para verificar a saúde de um contêiner
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

# --- Fase 1: Puxar as atualizações do código-fonte ---
echo "🔄 Fase 1: Puxando atualizações do repositório Git..."
git pull origin producao-contask

# --- Fase 2: Reconstruir e reiniciar os serviços com Docker Compose ---
echo "🏗️ Fase 2: Recriando e reiniciando os contêineres..."
# ✅ ATUALIZADO: Adicionado --env-file para carregar as variáveis de produção
docker-compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml up -d --build

# --- Fase 3: Rodar migrações do banco de dados ---
echo "🗃️ Fase 3: Aplicando migrações do banco de dados..."
# ✅ ATUALIZADO: Adicionado --env-file também aqui para consistência
docker-compose --env-file ${PROD_ENV_FILE} -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# --- Fase 4: Limpeza de imagens Docker antigas ---
echo "🧹 Fase 4: Limpando imagens Docker antigas..."
docker image prune -f

# --- Fase 5: Verificação de Saúde dos Serviços ---
echo "🩺 Fase 5: Verificando se os serviços principais estão funcionando..."
check_health "task_manager_backend"
check_health "task_manager_frontend"
# Os nomes dos contêineres de DB e Redis podem variar um pouco se não definidos explicitamente
# O seu docker ps mostrou 'task_manager-postgres-1' e 'task_manager-redis-1', vamos usar esses
check_health "task_manager-postgres-1"
check_health "task_manager-redis-1"

echo "✅ Deploy concluído e todos os serviços estão saudáveis!"
