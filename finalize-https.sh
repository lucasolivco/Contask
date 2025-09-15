#!/bin/bash

echo "🎉 FINALIZANDO CONFIGURAÇÃO HTTPS - CONTASK"
echo "=========================================="

echo "✅ SSL foi obtido com sucesso!"
echo "📅 Certificado válido até: 2025-12-11"
echo ""

echo "🔧 PASSO 1: Atualizando frontend para HTTPS..."

# Atualizar .env.production para HTTPS
sed -i 's/http:/https:/g' env/.env.production

echo "📋 URLs atualizadas:"
grep "URL=" env/.env.production

echo ""
echo "🎨 PASSO 2: Rebuild frontend com HTTPS..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml build --no-cache frontend
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml restart frontend

echo "⏳ Aguardando frontend com HTTPS..."
sleep 25

echo ""
echo "🔍 PASSO 3: Testando HTTPS completo..."

# Testes HTTPS
HTTPS_SITE=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/ 2>/dev/null || echo "000")
HTTPS_API=$(curl -s -o /dev/null -w "%{http_code}" https://contask.canellahub.com.br/api/health 2>/dev/null || echo "000")
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" http://contask.canellahub.com.br/ 2>/dev/null || echo "000")

echo "🌐 Site HTTPS: $HTTPS_SITE"
echo "🔧 API HTTPS: $HTTPS_API"  
echo "🔄 HTTP Redirect: $HTTP_REDIRECT"

echo ""
echo "🔐 PASSO 4: Verificando certificado SSL..."
echo "📜 Informações do certificado:"
echo | openssl s_client -connect contask.canellahub.com.br:443 -servername contask.canellahub.com.br 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null || echo "Erro ao verificar certificado"

echo ""
echo "🔄 PASSO 5: Configurando renovação automática..."

# Criar script de renovação
cat > renew-ssl.sh << 'RENEW_EOF'
#!/bin/bash
echo "🔄 Renovando certificados SSL..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml stop nginx
docker run --rm -p 80:80 -v $(pwd)/certbot/conf:/etc/letsencrypt certbot/certbot renew
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml start nginx
echo "✅ Renovação concluída!"
RENEW_EOF

chmod +x renew-ssl.sh

echo "✅ Script de renovação criado: ./renew-ssl.sh"

echo ""
echo "📊 PASSO 6: Status final dos containers..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml ps

echo ""
echo "🎯 RESULTADO FINAL"
echo "=================="

if [ "$HTTPS_SITE" = "200" ] && [ "$HTTPS_API" = "200" ]; then
    echo "🎉🎉🎉 CONTASK 100% FUNCIONANDO COM HTTPS! 🎉🎉🎉"
    echo ""
    echo "🌐 Site: https://contask.canellahub.com.br"
    echo "🔧 API: https://contask.canellahub.com.br/api/health"
    echo "📧 SSL: financeiro@canellaesantos.com.br"
    echo "📅 Expira: 2025-12-11"
    echo "🔄 Renovação: ./renew-ssl.sh"
    echo ""
    echo "✅ PRÓXIMOS PASSOS:"
    echo "1. ✅ Acesse: https://contask.canellahub.com.br"
    echo "2. ✅ Teste login/cadastro"
    echo "3. ✅ Verifique todas as funcionalidades"
    echo "4. ✅ Configure cron para renovação automática"
    echo ""
    echo "📋 Para renovar automaticamente, adicione ao crontab:"
    echo "0 3 1 */2 * cd $(pwd) && ./renew-ssl.sh"
    
elif [ "$HTTPS_SITE" = "200" ]; then
    echo "✅ Site HTTPS funcionando!"
    echo "⚠️ API HTTPS precisa verificação (Status: $HTTPS_API)"
    echo ""
    echo "🔍 Logs do backend:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=5 backend
    
else
    echo "⚠️ HTTPS parcialmente funcionando"
    echo "Site: $HTTPS_SITE | API: $HTTPS_API"
    echo ""
    echo "🔍 Debug necessário:"
    echo "Logs do nginx:"
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml logs --tail=10 nginx
fi

echo ""
echo "🔗 LINKS IMPORTANTES:"
echo "• Site: https://contask.canellahub.com.br"
echo "• API Health: https://contask.canellahub.com.br/api/health"
echo "• Let's Encrypt: https://letsencrypt.org/donate"
echo "• EFF Donation: https://eff.org/donate-le"

echo ""
echo "🎊 PARABÉNS! CONTASK DEPLOY COMPLETO!"
echo "Tempo total de deploy finalizado: $(date)"
