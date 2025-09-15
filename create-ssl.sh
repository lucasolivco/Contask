#!/bin/bash

echo "🌟 Configurando CONTASK SSL para contask.canellahub.com.br"
echo "📧 Email: financeiro@canellaesantos.com.br"

# Limpar tudo
echo "🧹 Limpando ambiente..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml down --volumes
docker system prune -f
docker network prune -f

# Criar estrutura
mkdir -p ./certbot/conf ./certbot/www ./docker/nginx/conf.d ./docker/nginx/html

# Página de manutenção
cat > ./docker/nginx/html/maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Contask - Inicializando</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
        h1 { color: #333; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <h1>🚀 Contask está inicializando...</h1>
    <div class="spinner"></div>
    <p>Aguarde alguns instantes enquanto os serviços são carregados.</p>
</body>
</html>
EOF

# Configuração nginx temporária
cat > ./docker/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name contask.canellahub.com.br;
    
    resolver 127.0.0.11 valid=30s ipv6=off;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        set $frontend http://task_manager_frontend:80;
        proxy_pass $frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
        error_page 502 503 504 /maintenance.html;
    }
    
    location /api {
        set $backend http://task_manager_backend:3001;
        proxy_pass $backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        error_page 502 503 504 /maintenance.html;
    }
    
    location = /maintenance.html {
        root /usr/share/nginx/html;
        internal;
    }
}

server {
    listen 80 default_server;
    server_name _;
    return 444;
}
EOF

echo "🚀 Iniciando serviços em ordem..."

# 1. Database primeiro
echo "📊 Iniciando database..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d postgres redis
sleep 20

# 2. Verificar database
echo "🔍 Verificando database..."
# Carregar variáveis do .env para usar nos health checks
source ./env/.env.production
echo "📋 Usando DB_USER: $DB_USER, DB_NAME: $DB_NAME"

for i in {1..10}; do
    if docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        echo "✅ Database pronto!"
        break
    fi
    echo "⏳ Aguardando database... ($i/10)"
    sleep 3
done

# 3. Backend
echo "⚙️ Iniciando backend..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d backend
sleep 30

# 4. Verificar backend
echo "🔍 Verificando backend..."
for i in {1..15}; do
    if docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend funcionando!"
        break
    fi
    echo "⏳ Aguardando backend... ($i/15)"
    sleep 5
done

# 5. Frontend
echo "🎨 Iniciando frontend..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d frontend
sleep 20

# 6. Verificar frontend
echo "🔍 Verificando frontend..."
for i in {1..10}; do
    if docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec frontend curl -f http://localhost:80/health >/dev/null 2>&1; then
        echo "✅ Frontend funcionando!"
        break
    fi
    echo "⏳ Aguardando frontend... ($i/10)"
    sleep 3
done

# 7. Verificar conectividade interna
echo "🔗 Testando conectividade interna..."
echo "Backend → Frontend:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend curl -f http://task_manager_frontend:80/health || echo "⚠️ Backend não consegue acessar frontend"

echo "Listando containers ativos:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps

# 8. Nginx
echo "🌐 Iniciando nginx..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d nginx
sleep 15

# 9. Teste externo
echo "🔍 Testando acesso externo..."
for i in {1..5}; do
    if curl -f http://contask.canellahub.com.br/ >/dev/null 2>&1; then
        echo "✅ Site acessível!"
        break
    fi
    echo "⏳ Tentativa $i/5..."
    sleep 5
    
    # Debug se falhar
    if [ $i -eq 3 ]; then
        echo "🔍 Debug - Status dos containers:"
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps
        echo "🔍 Debug - Logs do nginx:"
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=5 nginx
    fi
done

# Verificar se o site responde antes de prosseguir com SSL
if ! curl -f http://contask.canellahub.com.br/ >/dev/null 2>&1; then
    echo "❌ Site não está respondendo. Não é possível prosseguir com SSL."
    echo "📋 Logs detalhados:"
    echo "=== NGINX ==="
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 nginx
    echo "=== FRONTEND ==="
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 frontend
    echo "=== BACKEND ==="
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 backend
    exit 1
fi

# 10. SSL
echo "🔐 Obtendo certificados SSL..."
echo "📧 Usando email: financeiro@canellaesantos.com.br"

docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot --webroot-path=/var/www/certbot \
    --email financeiro@canellaesantos.com.br \
    --agree-tos --no-eff-email \
    -d contask.canellahub.com.br

if [ $? -eq 0 ]; then
    echo "✅ SSL obtido! Configurando HTTPS..."
    
    # Configuração final com SSL
    cat > ./docker/nginx/conf.d/default.conf << 'EOF'
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
    listen 443 ssl;
    http2 on;
    server_name contask.canellahub.com.br;
    
    resolver 127.0.0.11 valid=30s ipv6=off;
    
    ssl_certificate /etc/letsencrypt/live/contask.canellahub.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contask.canellahub.com.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        set $frontend http://task_manager_frontend:80;
        proxy_pass $frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
    
    location /api {
        set $backend http://task_manager_backend:3001;
        proxy_pass $backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Headers específicos para API
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
}

server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
    return 444;
}
EOF
    
    echo "🔄 Recarregando nginx com SSL..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
    
    sleep 5
    
    # Teste final
    echo "🔍 Testando HTTPS..."
    if curl -f https://contask.canellahub.com.br/ >/dev/null 2>&1; then
        echo "🎉 SUCESSO! Contask disponível em:"
        echo "🌐 HTTPS: https://contask.canellahub.com.br"
        echo "📧 Certificado para: financeiro@canellaesantos.com.br"
        echo ""
        echo "✅ Próximos passos:"
        echo "   1. Acesse https://contask.canellahub.com.br"
        echo "   2. Teste o login/cadastro"
        echo "   3. Configure renovação automática do SSL"
    else
        echo "⚠️ HTTPS não está respondendo, mas HTTP funciona"
        echo "🔍 Verifique logs do nginx:"
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 nginx
    fi
    
else
    echo "❌ Erro ao obter certificados SSL"
    echo "📋 Logs do certbot:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=20 certbot
    echo "📋 Logs do nginx:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=20 nginx
    echo ""
    echo "✅ Mesmo assim, o site está disponível em:"
    echo "🌐 HTTP: http://contask.canellahub.com.br"
fi

echo ""
echo "📊 Status final dos containers:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps
