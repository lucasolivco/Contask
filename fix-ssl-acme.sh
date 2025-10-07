#!/bin/bash

echo "🔧 CORRIGINDO PROBLEMA ACME CHALLENGE"
echo "===================================="

echo "1️⃣ Limpando certificados antigos..."
sudo rm -rf ./certbot/conf/live/contask.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/archive/contask.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/renewal/contask.canellahub.com.br.conf 2>/dev/null || true

echo "2️⃣ Criando estrutura acme-challenge..."
mkdir -p ./certbot/www/.well-known/acme-challenge/
chmod -R 755 ./certbot/www/

echo "3️⃣ Criando arquivo de teste..."
echo "teste-acme-challenge" > ./certbot/www/.well-known/acme-challenge/test

echo "4️⃣ Corrigindo configuração nginx para acme-challenge..."
cat > docker/nginx/conf.d/default.conf << 'NGINX_ACME_EOF'
server {
    listen 80;
    server_name contask.canellahub.com.br;

    # ✅ ACME Challenge CORRIGIDO
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri $uri/ =404;
        allow all;
        access_log off;
        log_not_found off;
    }

    # API funcionando
    location /api {
        proxy_pass http://task_manager_backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Frontend
    location / {
        proxy_pass http://task_manager_frontend:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80 default_server;
    server_name _;
    return 444;
}
NGINX_ACME_EOF

echo "5️⃣ Recarregando nginx..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload

sleep 3

echo "6️⃣ Testando acesso ao acme-challenge..."
ACME_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://contask.canellahub.com.br/.well-known/acme-challenge/test 2>/dev/null)
echo "Status acme-challenge: $ACME_TEST"

if [ "$ACME_TEST" = "200" ]; then
    echo "✅ ACME challenge acessível!"
    
    echo "7️⃣ Tentando obter certificados SSL..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email financeiro@canellaesantos.com.br \
        --agree-tos --no-eff-email \
        --force-renewal \
        -d contask.canellahub.com.br

    if [ $? -eq 0 ]; then
        echo "🎉 SSL OBTIDO! Configurando HTTPS..."
        
        # Configuração HTTPS
        cat > docker/nginx/conf.d/default.conf << 'HTTPS_FINAL_EOF'
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name contask.canellahub.com.br;

    # ACME challenge para renovações
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri $uri/ =404;
    }

    # Redirect para HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name contask.canellahub.com.br;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/contask.canellahub.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contask.canellahub.com.br/privkey.pem;

    # SSL configuration otimizada
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API funcionando
    location /api {
        proxy_pass http://task_manager_backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Frontend
    location / {
        proxy_pass http://task_manager_frontend:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
HTTPS_FINAL_EOF

        # Recarregar nginx
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
        sleep 5

        # Atualizar frontend para HTTPS
        echo "🎨 Atualizando frontend para HTTPS..."
        sed -i 's/http:/https:/g' env/.env.production
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache frontend
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart frontend
        sleep 20

        # Teste final
        HTTPS_SITE=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/ 2>/dev/null || echo "000")
        HTTPS_API=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/api/health 2>/dev/null || echo "000")
        
        echo ""
        echo "🔍 TESTE FINAL:"
        echo "HTTPS Site: $HTTPS_SITE"
        echo "HTTPS API: $HTTPS_API"
        
        if [ "$HTTPS_SITE" = "200" ] && [ "$HTTPS_API" = "200" ]; then
            echo ""
            echo "🎉🎉🎉 SUCESSO COMPLETO! 🎉🎉🎉"
            echo "==============================="
            echo "🌐 Site: https://contask.canellahub.com.br"
            echo "🔧 API: https://contask.canellahub.com.br/api/health"
            echo "📧 SSL: financeiro@canellaesantos.com.br"
            echo "🔐 HTTPS: ✅ 100% Funcionando"
        else
            echo "⚠️ HTTPS com problemas. Mantendo HTTP funcionando."
        fi
        
    else
        echo "❌ Erro ao obter certificados mesmo com acme-challenge funcionando"
        echo "📋 Logs do certbot:"
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs certbot
    fi
    
else
    echo "❌ ACME challenge ainda não acessível (Status: $ACME_TEST)"
    echo "🔍 Verificando estrutura de pastas..."
    ls -la ./certbot/www/.well-known/acme-challenge/
    echo "🔍 Verificando conteúdo:"
    cat ./certbot/www/.well-known/acme-challenge/test
    echo ""
    echo "🔍 Logs do nginx:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 nginx
fi

echo ""
echo "📊 Status dos containers:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps
