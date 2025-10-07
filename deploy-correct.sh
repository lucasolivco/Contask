#!/bin/bash

echo "🚀 DEPLOY CONTASK - ESTRUTURA CORRETA"
echo "===================================="

# 1. Verificar estrutura existente
echo "🔍 Verificando sua estrutura:"
echo "✅ docker/nginx/nginx.conf: $(test -f docker/nginx/nginx.conf && echo "OK" || echo "FALTA")"
echo "✅ docker/nginx/conf.d/default.conf: $(test -f docker/nginx/conf.d/default.conf && echo "OK" || echo "FALTA")"
echo "✅ env/.env.production: $(test -f env/.env.production && echo "OK" || echo "FALTA")"

# 2. Parar containers
echo "⏹️ Parando containers..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml down

# 3. Rebuild frontend com URL corrigida
echo "🔄 Rebuild frontend com URL corrigida..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache frontend

# 4. Subir em ordem
echo "🗄️ Iniciando database..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d postgres redis
sleep 20

echo "⚙️ Iniciando backend..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d backend
sleep 30

echo "🎨 Iniciando frontend..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d frontend
sleep 20

echo "🌐 Iniciando nginx..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d nginx
sleep 10

# 5. Testar API
echo "🔍 Testando correção da API..."
echo "URL que vai ser testada: http://contask.canellahub.com.br/api/health"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://contask.canellahub.com.br/api/health 2>/dev/null || echo "000")
echo "Status da API: $API_STATUS"

if [ "$API_STATUS" = "200" ]; then
    echo "✅ API funcionando! Problema /api/api RESOLVIDO!"
else
    echo "❌ API ainda com problema. Vamos debugar:"
    echo "🔍 Logs do nginx:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=5 nginx
    echo "🔍 Logs do backend:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=5 backend
fi

# 6. SSL se API estiver funcionando
if [ "$API_STATUS" = "200" ]; then
    echo "🔐 Configurando SSL..."
    
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email financeiro@canellaesantos.com.br \
        --agree-tos --no-eff-email \
        -d contask.canellahub.com.br

    if [ $? -eq 0 ]; then
        echo "✅ SSL obtido! Configurando HTTPS..."
        
        # Criar configuração HTTPS
        cat > docker/nginx/conf.d/default.conf << 'HTTPS_EOF'
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name contask.canellahub.com.br;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name contask.canellahub.com.br;

    resolver 127.0.0.11 valid=30s ipv6=off;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/contask.canellahub.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contask.canellahub.com.br/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # ✅ API corrigida
    location /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        
        set $backend http://task_manager_backend:3001;
        proxy_pass $backend;
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
        set $frontend http://task_manager_frontend:80;
        proxy_pass $frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
    return 444;
}
HTTPS_EOF

        # Recarregar nginx
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
        
        sleep 10
        
        # Testar HTTPS
        if curl -f https://contask.canellahub.com.br/ >/dev/null 2>&1; then
            echo "🎉 HTTPS funcionando!"
            echo "🌐 Site: https://contask.canellahub.com.br"
            echo "🔧 API: https://contask.canellahub.com.br/api/"
        else
            echo "⚠️ HTTPS com problema"
        fi
    else
        echo "❌ SSL falhou"
    fi
fi

echo ""
echo "📊 Status final:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps

echo ""
echo "🔍 Links para testar:"
echo "HTTP: http://contask.canellahub.com.br"
echo "API: http://contask.canellahub.com.br/api/health"
