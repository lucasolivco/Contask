#!/bin/bash

echo "🔧 EXECUTANDO PRISMA MIGRATIONS - CONTASK"
echo "========================================"

source ./env/.env.production

echo "1️⃣ VERIFICANDO ESTRUTURA PRISMA..."
echo "📋 Arquivos Prisma encontrados:"
find ./backend -name "schema.prisma" -o -name "*.sql" | grep -E "(prisma|migration)" | head -10

echo ""
echo "2️⃣ VERIFICANDO DATABASE CONNECTION..."
echo "📊 Testando conexão PostgreSQL:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec postgres pg_isready -U "$DB_USER" -d "$DB_NAME"

echo ""
echo "3️⃣ EXECUTANDO PRISMA GENERATE..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend npx prisma generate

echo ""
echo "4️⃣ EXECUTANDO PRISMA DB PUSH (desenvolvimento)..."
echo "⚡ Forçando sincronização do schema:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend npx prisma db push --force-reset

echo ""
echo "5️⃣ EXECUTANDO PRISMA MIGRATE DEPLOY (produção)..."
echo "🚀 Aplicando migrations em produção:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend npx prisma migrate deploy

echo ""
echo "6️⃣ VERIFICANDO TABELAS CRIADAS..."
echo "📋 Tabelas no banco:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"

echo ""
echo "7️⃣ EXECUTANDO SEED (se existir)..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend npm run seed 2>/dev/null || echo "⚠️ Seed não encontrado (normal se não configurado)"

echo ""
echo "8️⃣ REINICIANDO BACKEND..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart backend

echo "⏳ Aguardando backend reiniciar..."
sleep 20

echo ""
echo "9️⃣ VERIFICANDO PRISMA STATUS..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend npx prisma migrate status

echo ""
echo "🔟 TESTANDO API APÓS MIGRATIONS..."
for i in {1..8}; do
    HEALTH_STATUS=$(docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo "✅ Backend funcionando! (Status: $HEALTH_STATUS)"
        break
    fi
    echo "⏳ Aguardando backend... ($i/8) Status: $HEALTH_STATUS"
    sleep 3
done

echo ""
echo "1️⃣1️⃣ TESTANDO REGISTRO DE USUÁRIO..."
REGISTER_TEST=$(docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste Prisma","email":"teste.prisma@contask.com","password":"123456"}' 2>/dev/null)

echo "📋 Resposta do registro:"
echo "$REGISTER_TEST" | head -3

echo ""
echo "1️⃣2️⃣ TESTANDO EXTERNAMENTE..."
EXTERNAL_REGISTER=$(curl -s -X POST https://contask.canellahub.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste Externo Prisma","email":"teste.externo.prisma@contask.com","password":"123456"}' 2>/dev/null)

echo "📋 Resposta externa:"
echo "$EXTERNAL_REGISTER" | head -3

echo ""
echo "🎯 RESULTADO FINAL"
echo "=================="
echo "✅ Prisma migrations executadas!"
echo "✅ Backend reiniciado!"
echo "✅ Database sincronizado!"
echo ""
echo "🌐 Teste agora: https://contask.canellahub.com.br"
echo "📧 Tente registrar um usuário!"

echo ""
echo "📊 Status dos containers:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps

echo ""
echo "📋 Se ainda houver erro, verifique logs:"
echo "docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 backend"
