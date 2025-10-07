#!/bin/bash

echo "🔍 DEBUG SSL - CONTASK"
echo "====================="

echo "1️⃣ Verificando se o domínio resolve corretamente:"
nslookup contask.canellahub.com.br
echo ""

echo "2️⃣ Testando acesso HTTP direto:"
curl -I http://contask.canellahub.com.br/
echo ""

echo "3️⃣ Verificando se a porta 80 está acessível externamente:"
wget -qO- http://contask.canellahub.com.br/.well-known/acme-challenge/test 2>/dev/null || echo "Pasta acme-challenge não acessível"
echo ""

echo "4️⃣ Verificando configuração atual do nginx:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -t
echo ""

echo "5️⃣ Verificando logs do certbot:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs certbot
echo ""

echo "6️⃣ Tentando obter SSL com debug verbose:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot --webroot-path=/var/www/certbot \
    --email financeiro@canellaesantos.com.br \
    --agree-tos --no-eff-email \
    --verbose --dry-run \
    -d contask.canellahub.com.br

echo ""
echo "7️⃣ Se dry-run funcionar, tentar real:"
read -p "Dry-run funcionou? (s/n): " dryrun_ok

if [ "$dryrun_ok" = "s" ]; then
    echo "🔄 Tentando obter certificados reais..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email financeiro@canellaesantos.com.br \
        --agree-tos --no-eff-email \
        --verbose \
        -d contask.canellahub.com.br
        
    if [ $? -eq 0 ]; then
        echo "✅ SSL obtido! Configurando HTTPS..."
        
        # Aplicar configuração HTTPS
        cat > docker/nginx/conf.d/default.conf << 'HTTPS_EOF'
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

server {
    listen 443 ssl http2;
    server_name contask.canellahub.com.br;

    ssl_certificate /etc/letsencrypt/live/contask.canellahub.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contask.canellahub.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

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
HTTPS_EOF

        # Recarregar nginx
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
        
        sleep 5
        
        # Testar HTTPS
        if curl -f https://contask.canellahub.com.br/ >/dev/null 2>&1; then
            echo "🎉 HTTPS FUNCIONANDO!"
            echo "🌐 Site: https://contask.canellahub.com.br"
        else
            echo "❌ HTTPS ainda com problema"
        fi
    else
        echo "❌ Erro ao obter certificados"
    fi
else
    echo "❌ Dry-run falhou. Verificar configuração."
fi
