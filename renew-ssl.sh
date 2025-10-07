#!/bin/bash
echo "🔄 Renovando certificados SSL..."
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml stop nginx
docker run --rm -p 80:80 -v $(pwd)/certbot/conf:/etc/letsencrypt certbot/certbot renew
docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml start nginx
echo "✅ Renovação concluída!"
