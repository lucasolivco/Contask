#!/bin/bash

echo "🚀 MÉTODO STANDALONE - ÚLTIMA TENTATIVA"
echo "======================================="

echo "1️⃣ Parando nginx..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml stop nginx

echo "2️⃣ Limpando certificados antigos..."
sudo rm -rf ./certbot/conf/live/contask.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/archive/contask.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/renewal/contask.canellahub.com.br.conf 2>/dev/null || true

echo "3️⃣ Obtendo SSL via standalone..."
docker run --rm -p 80:80 -v $(pwd)/certbot/conf:/etc/letsencrypt certbot/certbot \
    certonly --standalone \
    --email financeiro@canellaesantos.com.br \
    --agree-tos --no-eff-email \
    -d contask.canellahub.com.br

if [ $? -eq 0 ]; then
    echo "✅ SSL obtido via standalone!"
    
    # Configurar nginx final com SSL
    cat > docker/nginx/conf.d/default.conf << 'STANDALONE_SSL_EOF'
server {
    listen 80;
    server_name contask.canellahub.com.br;
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
STANDALONE_SSL_EOF

    # Reiniciar nginx
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml start nginx
    sleep 5
    
    # Testar
    if curl -f https://contask.canellahub.com.br/ >/dev/null 2>&1; then
        echo "🎉 HTTPS FUNCIONANDO VIA STANDALONE!"
    else
        echo "❌ HTTPS ainda com problema"
    fi
else
    echo "❌ Standalone também falhou"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml start nginx
fi
