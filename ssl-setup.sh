!/bin/bash
# ARQUIVO: complete-ssl-setup.sh

echo "🔐 Setup completo de SSL..."

# 1. Verificar/instalar certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    sudo apt update
    sudo apt install certbot -y
fi

# 2. Criar diretórios necessários
sudo mkdir -p /var/www/html/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html

# 3. Configurar nginx para webroot temporariamente
echo "🔧 Configurando nginx para SSL..."
cat > nginx/nginx-ssl.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server task_manager_backend:3001;
    }

    upstream frontend {
        server task_manager_frontend:80;
    }

    # HTTP server para webroot e redirect
    server {
        listen 80;
        server_name contask.canellahub.com.br;
        
        # Webroot para certificados
        location /.well-known/acme-challenge/ {
            root /var/www/html;
            try_files $uri $uri/ =404;
        }
        
        # Temporariamente permitir HTTP para obter certificados
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 4. Atualizar docker-compose para incluir webroot
echo "🔧 Atualizando docker-compose..."
if ! grep -q "/var/www/html" docker-compose.prod.yml; then
    # Fazer backup
    cp docker-compose.prod.yml docker-compose.prod.yml.backup
    
    # Adicionar volume webroot ao nginx
    sed -i '/nginx:/,/networks:/ {
        /volumes:/a \      - /var/www/html:/var/www/html:ro
        /volumes:/!{
            /restart:/i \    volumes:\
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro\
      - /var/www/html:/var/www/html:ro
        }
    }' docker-compose.prod.yml
fi

# 5. Reiniciar nginx com configuração para SSL
cp nginx/nginx.conf nginx/nginx-backup.conf
cp nginx/nginx-ssl.conf nginx/nginx.conf

docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart nginx

# 6. Aguardar nginx
sleep 5

# 7. Testar webroot
echo "🔍 Testando webroot..."
echo "test-ssl" | sudo tee /var/www/html/.well-known/acme-challenge/test-file
curl -f http://contask.canellahub.com.br/.well-known/acme-challenge/test-file

# 8. Obter certificados SSL
echo "📜 Obtendo certificados SSL..."
sudo certbot certonly \
    --webroot \
    --webroot-path=/var/www/html \
    --email financeiro@canellaesantos.com.br \
    --agree-tos \
    --no-eff-email \
    --domains contask.canellahub.com.br \
    --verbose

# 9. Verificar se certificados foram criados
if [ -f "/etc/letsencrypt/live/contask.canellahub.com.br/fullchain.pem" ]; then
    echo "✅ Certificados SSL obtidos com sucesso!"
    
    # 10. Criar configuração nginx com SSL
    cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server task_manager_backend:3001;
    }

    upstream frontend {
        server task_manager_frontend:80;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name contask.canellahub.com.br;
        
        # Webroot para renovação
        location /.well-known/acme-challenge/ {
            root /var/www/html;
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
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;

        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location / {
            proxy_pass http://frontend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

    # 11. Atualizar docker-compose para SSL
    if ! grep -q "443:443" docker-compose.prod.yml; then
        sed -i '/80:80/a \      - "443:443"' docker-compose.prod.yml
        sed -i '/\/var\/www\/html/a \      - /etc/letsencrypt:/etc/letsencrypt:ro' docker-compose.prod.yml
    fi
    
    # 12. Reiniciar com SSL
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart nginx
    
    echo "🎉 SSL configurado com sucesso!"
    echo "🌐 HTTPS: https://contask.canellahub.com.br"
    
else
    echo "❌ Falha ao obter certificados SSL"
    echo "📋 Logs do certbot:"
    sudo cat /var/log/letsencrypt/letsencrypt.log | tail -20
    
    # Restaurar configuração original
    cp nginx/nginx-backup.conf nginx/nginx.conf
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart nginx
    
    echo "🌐 Mantendo HTTP: http://contask.canellahub.com.br"
fi

# 13. Limpar arquivo de teste
sudo rm -f /var/www/html/.well-known/acme-challenge/test-file

echo "✅ Setup SSL concluído!"
EOF
