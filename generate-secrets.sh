#!/bin/bash
# generate-secrets.sh - SCRIPT PARA GERAR SENHAS FORTES

echo "🔐 Gerando senhas seguras..."
echo ""
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo ""
echo "✅ Copie essas senhas para seu arquivo .env"
echo "⚠️  NUNCA compartilhe essas senhas!"