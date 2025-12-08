echo "🚀 OBTENDO SSL PARA CONTASK E MOODLE (via standalone)"
echo "======================================="

echo "1️⃣ Parando nginx..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml stop nginx

echo "2️⃣ Limpando certificados antigos (Garantia)..."
sudo rm -rf ./certbot/conf/live/contask.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/archive/contask.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/renewal/contask.canellahub.com.br.conf 2>/dev/null || true
# Limpa também qualquer tentativa anterior do moodle
sudo rm -rf ./certbot/conf/live/moodle.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/archive/moodle.canellahub.com.br/ 2>/dev/null || true
sudo rm -rf ./certbot/conf/renewal/moodle.canellahub.com.br.conf 2>/dev/null || true


echo "3️⃣ Obtendo SSL para AMBOS os domínios..."
# Este é o comando-chave:
docker run --rm -p 80:80 -v $(pwd)/certbot/conf:/etc/letsencrypt certbot/certbot \
    certonly --standalone \
    --email financeiro@canellaesantos.com.br \
    --agree-tos --no-eff-email \
    -d contask.canellahub.com.br \
    -d moodle.canellahub.com.br

if [ $? -eq 0 ]; then
    echo "✅ SSL obtido para AMBOS os domínios!"
    echo "ℹ️ O certificado está salvo em /etc/letsencrypt/live/contask.canellahub.com.br/"
    
    # NÃO vamos sobrescrever o default.conf. Já o arrumamos.

    echo "4️⃣ Reiniciando nginx com as novas configurações..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml start nginx
    sleep 5
    
    echo "5️⃣ Testando Contask..."
    if curl -f https://contask.canellahub.com.br/ >/dev/null 2>&1; then
        echo "✅ HTTPS Contask FUNCIONANDO!"
    else
        echo "❌ HTTPS Contask com problema"
    fi

    echo "6️⃣ Testando Moodle..."
    if curl -f https://moodle.canellahub.com.br/ >/dev/null 2>&1; then
        echo "✅ HTTPS Moodle FUNCIONANDO!"
    else
        echo "❌ HTTPS Moodle com problema"
    fi
else
    echo "❌ Obtenção do SSL via Standalone falhou"
    echo "ℹ️ Iniciando o nginx mesmo assim para diagnósticos..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml start nginx
fi
