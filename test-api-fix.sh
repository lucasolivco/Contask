#!/bin/bash

echo "🔍 TESTANDO CORREÇÕES DA API"
echo "============================"

echo "1️⃣ Testando backend diretamente:"
echo "Health sem /api:"
docker exec task_manager_backend curl -s http://localhost:3001/health || echo "❌ Falhou"

echo "Health com /api:"
docker exec task_manager_backend curl -s http://localhost:3001/api/health || echo "❌ Falhou"

echo ""
echo "2️⃣ Testando via nginx:"
echo "Teste 1 - URL atual:"
curl -s http://contask.canellahub.com.br/api/health || echo "❌ Falhou"

echo ""
echo "3️⃣ Aplicando correção nginx simples..."

cat > docker/nginx/conf.d/default.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name contask.canellahub.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Testar sem rewrite primeiro
    location /api/ {
        proxy_pass http://task_manager_backend:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://task_manager_frontend:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
sleep 3

echo "4️⃣ Testando após correção:"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://contask.canellahub.com.br/api/health)
echo "Status: $API_STATUS"

if [ "$API_STATUS" = "200" ]; then
    echo "✅ API funcionando!"
else
    echo "❌ Ainda com problema, vamos tentar sem rewrite:"
    
    cat > docker/nginx/conf.d/default.conf << 'NGINX_EOF2'
server {
    listen 80;
    server_name contask.canellahub.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Se backend usa /api na rota
    location /api {
        proxy_pass http://task_manager_backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://task_manager_frontend:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF2

    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
    sleep 3
    
    API_STATUS2=$(curl -s -o /dev/null -w "%{http_code}" http://contask.canellahub.com.br/api/health)
    echo "Status após 2ª tentativa: $API_STATUS2"
fi
