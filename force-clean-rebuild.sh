#!/bin/bash
# force-clean-rebuild.sh

echo "🧹 LIMPEZA TOTAL - removendo TUDO..."

# Parar e remover containers
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml down --volumes --remove-orphans

# ✅ REMOVER IMAGENS ESPECÍFICAS DO PROJETO
echo "🗑️ Removendo imagens do projeto..."
docker rmi $(docker images | grep -E "(task_manager|frontend|backend)" | awk '{print $3}') 2>/dev/null || true

# ✅ REMOVER IMAGENS SEM TAG
docker rmi $(docker images | grep "<none>" | awk '{print $3}') 2>/dev/null || true

# ✅ LIMPAR CACHE DE BUILD
docker builder prune -f

# ✅ REMOVER VOLUMES ÓRFÃOS
docker volume prune -f

# ✅ REMOVER REDES ÓRFÃS
docker network prune -f

# ✅ LIMPAR SISTEMA COMPLETO
docker system prune -af

echo "✅ Limpeza total concluída!"

# Verificar se arquivos estão corretos
echo "🔍 Verificando arquivos..."

if grep -q "ssl\|443\|certificate" frontend/default.conf; then
    echo "❌ ERRO: frontend/default.conf contém SSL!"
    exit 1
else
    echo "✅ frontend/default.conf OK (sem SSL)"
fi

if grep -q "/health" frontend/Dockerfile.prod; then
    echo "✅ frontend/Dockerfile.prod OK (health check correto)"
else
    echo "⚠️ frontend/Dockerfile.prod precisa de correção no health check"
fi

echo ""
echo "🚀 Agora execute o build forçado:"
echo "docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache frontend"

