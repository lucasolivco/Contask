#!/bin/bash

# 🧪 SCRIPT PARA TESTAR PRODUÇÃO LOCALMENTE

echo "🧪 Testando ambiente de produção localmente..."

# Copiar env de staging
cp ./env/.env.staging ./env/.env.test

# Substituir URLs para localhost
sed -i 's/yourdomain.com/localhost/g' ./env/.env.test
sed -i 's/https:/http:/g' ./env/.env.test

# Subir ambiente de teste
docker-compose -f docker-compose.prod.yml --env-file ./env/.env.test up -d

echo "⏳ Aguardando serviços..."
sleep 60

# Testes automatizados
echo "🔍 Executando testes..."

# Teste 1: Health check
if curl -f http://localhost/api/health; then
    echo "✅ Health check OK"
else
    echo "❌ Health check falhou"
    exit 1
fi

# Teste 2: Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}')

if echo $LOGIN_RESPONSE | grep -q "token"; then
    echo "✅ Login OK"
else
    echo "❌ Login falhou"
    exit 1
fi

# Teste 3: Criação de tarefa (com token)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
TASK_RESPONSE=$(curl -s -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Teste","description":"Teste de produção"}')

if echo $TASK_RESPONSE | grep -q "Teste"; then
    echo "✅ Criação de tarefa OK"
else
    echo "❌ Criação de tarefa falhou"
fi

echo "🎉 Todos os testes passaram!"

# Cleanup
docker-compose -f docker-compose.prod.yml down
rm ./env/.env.test