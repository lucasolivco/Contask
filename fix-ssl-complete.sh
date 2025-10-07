#!/bin/bash

echo "🚀 CONTASK - CORREÇÃO COMPLETA SSL + FRONTEND"
echo "============================================="

echo "✅ API já está funcionando via HTTP!"
echo "Agora vamos configurar SSL e corrigir frontend..."

# PASSO 1: Obter certificados SSL
echo ""
echo "🔐 PASSO 1: Obtendo certificados SSL..."

if [ -f "./certbot/conf/live/contask.canellahub.com.br/fullchain.pem" ]; then
    echo "✅ Certificados SSL já existem!"
else
    echo "📜 Obtendo novos certificados..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email financeiro@canellaesantos.com.br \
        --agree-tos --no-eff-email \
        -d contask.canellahub.com.br
fi

# PASSO 2: Configurar HTTPS no nginx
echo ""
echo "🌐 PASSO 2: Configurando HTTPS..."

if [ -f "./certbot/conf/live/contask.canellahub.com.br/fullchain.pem" ]; then
    echo "✅ Configurando nginx para HTTPS..."
    
    cat > docker/nginx/conf.d/default.conf << 'HTTPS_CONFIG'
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name contask.canellahub.com.br;

    # Webroot para renovação de certificados
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
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
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # API - configuração que funcionou
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
HTTPS_CONFIG

    # Recarregar nginx
    echo "🔄 Recarregando nginx..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
    
else
    echo "❌ Certificados não foram obtidos. Mantendo HTTP."
fi

# PASSO 3: Corrigir frontend para usar HTTPS
echo ""
echo "🎨 PASSO 3: Corrigindo frontend para HTTPS..."

# Verificar se .env.production está correto
echo "✅ Verificando .env.production:"
grep "VITE_API_URL" env/.env.production

# Rebuild frontend com URL HTTPS
echo "🔄 Rebuild frontend com HTTPS..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache frontend
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart frontend

# Aguardar frontend reiniciar
echo "⏳ Aguardando frontend..."
sleep 20

# PASSO 4: Testar tudo
echo ""
echo "🔍 PASSO 4: Testando configuração final..."

echo "Testando HTTP redirect:"
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://contask.canellahub.com.br/ 2>/dev/null)
echo "HTTP Status: $HTTP_REDIRECT (deve ser 301)"

echo "Testando HTTPS site:"
HTTPS_SITE=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/ 2>/dev/null || echo "000")
echo "HTTPS Site: $HTTPS_SITE"

echo "Testando HTTPS API:"
HTTPS_API=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/api/health 2>/dev/null || echo "000")
echo "HTTPS API: $HTTPS_API"

# RESULTADO FINAL
echo ""
echo "📊 RESULTADO FINAL:"
echo "=================="

if [ "$HTTPS_SITE" = "200" ] && [ "$HTTPS_API" = "200" ]; then
    echo "🎉 SUCESSO TOTAL!"
    echo "🌐 Site: https://contask.canellahub.com.br"
    echo "🔧 API: https://contask.canellahub.com.br/api/health"
    echo "📧 SSL: financeiro@canellaesantos.com.br"
    echo ""
    echo "✅ PRÓXIMOS PASSOS:"
    echo "1. Acesse https://contask.canellahub.com.br"
    echo "2. Teste login/cadastro"
    echo "3. Sistema está 100% funcionando!"
    
elif [ "$HTTPS_SITE" = "200" ]; then
    echo "✅ HTTPS site funcionando"
    echo "⚠️ API via HTTPS com problema (Status: $HTTPS_API)"
    echo "🌐 Site: https://contask.canellahub.com.br"
    echo "🔧 Teste API: https://contask.canellahub.com.br/api/health"
    
else
    echo "❌ HTTPS com problemas"
    echo "🔍 Logs do nginx:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=5 nginx
    echo ""
    echo "📋 Verifique se:"
    echo "- Certificados foram obtidos"
    echo "- Nginx recarregou corretamente"
    echo "- Frontend foi rebuilded"
fi

echo ""
echo "📱 Status dos containers:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps
