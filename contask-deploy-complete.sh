#!/bin/bash

echo "🌟 CONTASK DEPLOY COMPLETO - VERSÃO CORRIGIDA"
echo "============================================"
echo "📧 Email: financeiro@canellaesantos.com.br"
echo "🌐 Domínio: contask.canellahub.com.br"

# ============================================================================
# PASSO 1: LIMPEZA E PREPARAÇÃO
# ============================================================================
echo ""
echo "🧹 PASSO 1: Limpando ambiente..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml down --volumes
docker system prune -f
docker network prune -f

# Criar estruturas necessárias
mkdir -p ./certbot/conf ./certbot/www ./docker/nginx/conf.d ./docker/nginx/html

# ============================================================================
# PASSO 2: CORRIGIR ARQUIVOS DE CONFIGURAÇÃO
# ============================================================================
echo ""
echo "🔧 PASSO 2: Corrigindo arquivos de configuração..."

# Backup dos arquivos originais
echo "💾 Criando backups..."
cp docker-compose.prod.yml docker-compose.prod.yml.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Corrigir docker-compose.prod.yml
echo "📝 Corrigindo docker-compose.prod.yml..."
cat > docker-compose.prod.yml << 'COMPOSE_EOF'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: always
    env_file:
      - ./env/.env.production
    volumes:
      - ./uploads:/app/uploads:rw
      - ./logs:/app/logs:rw
    networks:
      - prod-network
    container_name: task_manager_backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        - VITE_API_URL=${VITE_API_URL}
    restart: always
    networks:
      - prod-network
    container_name: task_manager_frontend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    env_file:
      - ./env/.env.production
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - prod-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    env_file:
      - ./env/.env.production
    volumes:
      - redis_prod_data:/data
    networks:
      - prod-network
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # ✅ NGINX CORRIGIDO
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./docker/nginx/html:/usr/share/nginx/html:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    networks:
      - prod-network
    container_name: task_manager_nginx
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    command: '/bin/sh -c ''while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g "daemon off;"'''

  certbot:
    image: certbot/certbot
    restart: unless-stopped
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    networks:
      - prod-network
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  prod-network:
    driver: bridge
    name: contask_network

volumes:
  postgres_prod_data:
    name: contask_postgres_data
  redis_prod_data:
    name: contask_redis_data
COMPOSE_EOF

echo "✅ docker-compose.prod.yml corrigido!"

# ============================================================================
# PASSO 3: CONFIGURAÇÕES NGINX
# ============================================================================
echo ""
echo "🌐 PASSO 3: Configurando nginx..."

# Página de manutenção
cat > ./docker/nginx/html/maintenance.html << 'MAINTENANCE_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Contask - Inicializando</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 20px; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        p { color: #666; line-height: 1.6; }
        .status { color: #007bff; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Contask está inicializando...</h1>
        <div class="spinner"></div>
        <p>Aguarde alguns instantes enquanto os serviços são carregados.</p>
        <p class="status">Sistema de gestão de tarefas em preparação</p>
    </div>
</body>
</html>
MAINTENANCE_EOF

# Configuração nginx inicial (HTTP)
cat > ./docker/nginx/conf.d/default.conf << 'NGINX_HTTP_EOF'
server {
    listen 80;
    server_name contask.canellahub.com.br;

    # Webroot para certbot
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # ✅ API corrigida - SEM variáveis $backend
    location /api {
        proxy_pass http://task_manager_backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        error_page 502 503 504 /maintenance.html;
    }

    # Frontend
    location / {
        proxy_pass http://task_manager_frontend:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
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
NGINX_HTTP_EOF

echo "✅ Configurações nginx preparadas!"

# ============================================================================
# PASSO 4: BUILD E INICIALIZAÇÃO DOS SERVIÇOS
# ============================================================================
echo ""
echo "🚀 PASSO 4: Iniciando serviços em ordem..."

# Carregar variáveis do .env
source ./env/.env.production
echo "📋 Usando DB_USER: $DB_USER, DB_NAME: $DB_NAME"

# 1. Database primeiro
echo "📊 Iniciando database e redis..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d postgres redis
sleep 20

# Verificar database
echo "🔍 Verificando database..."
for i in {1..12}; do
    if docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        echo "✅ Database pronto!"
        break
    fi
    echo "⏳ Aguardando database... ($i/12)"
    sleep 5
done

# 2. Build e iniciar backend
echo "⚙️ Building e iniciando backend..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache backend
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d backend
sleep 30

# Verificar backend
echo "🔍 Verificando backend..."
for i in {1..20}; do
    if docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec backend curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo "✅ Backend funcionando!"
        break
    fi
    echo "⏳ Aguardando backend... ($i/20)"
    sleep 5
done

# 3. Build e iniciar frontend
echo "🎨 Building e iniciando frontend..."
echo "📋 Frontend será buildado com VITE_API_URL=$VITE_API_URL"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache frontend
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d frontend
sleep 25

# Verificar frontend
echo "🔍 Verificando frontend..."
for i in {1..12}; do
    if docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec frontend curl -f http://localhost:80/health >/dev/null 2>&1; then
        echo "✅ Frontend funcionando!"
        break
    fi
    echo "⏳ Aguardando frontend... ($i/12)"
    sleep 5
done

# 4. Iniciar nginx
echo "🌐 Iniciando nginx..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d nginx
sleep 15

# ============================================================================
# PASSO 5: TESTES INICIAIS
# ============================================================================
echo ""
echo "🔍 PASSO 5: Testando configuração HTTP..."

# Verificar conectividade interna
echo "🔗 Testando conectividade interna..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps

# Teste externo HTTP
echo "🌐 Testando acesso HTTP externo..."
for i in {1..8}; do
    if curl -f http://contask.canellahub.com.br/ >/dev/null 2>&1; then
        echo "✅ Site HTTP acessível!"
        break
    fi
    echo "⏳ Tentativa $i/8..."
    sleep 5
    
    if [ $i -eq 4 ]; then
        echo "🔍 Debug - Status dos containers:"
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps
        echo "🔍 Debug - Logs do nginx:"
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=5 nginx
    fi
done

# Testar API
echo "🔧 Testando API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://contask.canellahub.com.br/api/health 2>/dev/null || echo "000")
echo "Status da API: $API_STATUS"

if [ "$API_STATUS" != "200" ]; then
    echo "❌ API com problema. Logs do backend:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 backend
    echo "❌ Logs do nginx:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 nginx
    exit 1
fi

echo "✅ HTTP funcionando! Prosseguindo com SSL..."

# ============================================================================
# PASSO 6: CONFIGURAÇÃO SSL
# ============================================================================
echo ""
echo "🔐 PASSO 6: Configurando SSL..."

# Verificar se já temos certificados
if [ -f "./certbot/conf/live/contask.canellahub.com.br/fullchain.pem" ]; then
    echo "✅ Certificados SSL já existem!"
else
    echo "📜 Obtendo certificados SSL..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email financeiro@canellaesantos.com.br \
        --agree-tos --no-eff-email \
        -d contask.canellahub.com.br
fi

if [ -f "./certbot/conf/live/contask.canellahub.com.br/fullchain.pem" ]; then
    echo "✅ SSL obtido! Configurando HTTPS..."

    # Configuração final nginx com SSL
    cat > ./docker/nginx/conf.d/default.conf << 'NGINX_HTTPS_EOF'
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

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/contask.canellahub.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/contask.canellahub.com.br/privkey.pem;

    # SSL configuration
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

    # ✅ API funcionando
    location /api {
        proxy_pass http://task_manager_backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }

        # Headers específicos para API
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
    }

    # Frontend
    location / {
        proxy_pass http://task_manager_frontend:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}

server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
    return 444;
}
NGINX_HTTPS_EOF

    echo "🔄 Recarregando nginx com SSL..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml exec nginx nginx -s reload
    sleep 10

    # ============================================================================
    # PASSO 7: REBUILD FRONTEND PARA HTTPS
    # ============================================================================
    echo ""
    echo "🎨 PASSO 7: Rebuild frontend para HTTPS..."
    
    # Atualizar .env.production para HTTPS
    sed -i 's/http:/https:/g' env/.env.production
    
    echo "🔄 Rebuild frontend com URLs HTTPS..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache frontend
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart frontend
    
    sleep 25

    # ============================================================================
    # PASSO 8: TESTES FINAIS
    # ============================================================================
    echo ""
    echo "🔍 PASSO 8: Testes finais..."

    # Testar HTTPS
    echo "🔍 Testando HTTPS..."
    HTTPS_SITE=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/ 2>/dev/null || echo "000")
    HTTPS_API=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/api/health 2>/dev/null || echo "000")
    
    echo "HTTPS Site: $HTTPS_SITE"
    echo "HTTPS API: $HTTPS_API"

    if [ "$HTTPS_SITE" = "200" ] && [ "$HTTPS_API" = "200" ]; then
        echo ""
        echo "🎉🎉🎉 SUCESSO TOTAL! 🎉🎉🎉"
        echo "=================================="
        echo "🌐 Site: https://contask.canellahub.com.br"
        echo "🔧 API: https://contask.canellahub.com.br/api/health"
        echo "📧 SSL: financeiro@canellaesantos.com.br"
        echo "🔐 HTTPS: ✅ Funcionando"
        echo "🔄 Auto-renewal: ✅ Configurado"
        echo ""
        echo "✅ PRÓXIMOS PASSOS:"
        echo "1. Acesse https://contask.canellahub.com.br"
        echo "2. Teste todas as funcionalidades"
        echo "3. Sistema 100% operacional!"
        
    else
        echo "⚠️ HTTPS parcialmente funcionando"
        echo "Site HTTPS: $HTTPS_SITE"
        echo "API HTTPS: $HTTPS_API"
        echo ""
        echo "🔍 Logs para debug:"
        docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 nginx
    fi
    
else
    echo "❌ Erro ao obter certificados SSL"
    echo "📋 Mantendo funcionamento HTTP:"
    echo "🌐 Site: http://contask.canellahub.com.br"
    echo "🔧 API: http://contask.canellahub.com.br/api/health"
fi

# ============================================================================
# RESULTADO FINAL
# ============================================================================
echo ""
echo "📊 RESULTADO FINAL"
echo "=================="
echo "📱 Status dos containers:"
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps

echo ""
echo "🔗 Links importantes:"
echo "• Site: https://contask.canellahub.com.br"
echo "• API Health: https://contask.canellahub.com.br/api/health"
echo "• Email SSL: financeiro@canellaesantos.com.br"

echo ""
echo "✅ Deploy completo finalizado!"
echo "Tempo total: $(date)"
