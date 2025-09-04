#!/bin/bash

# 📊 SCRIPT DE MONITORAMENTO

echo "📊 Status dos Serviços:"
docker-compose -f docker-compose.prod.yml ps

echo -e "\n💾 Uso de Disco:"
df -h

echo -e "\n🧠 Uso de Memória:"
free -h

echo -e "\n⚡ CPU:"
top -bn1 | grep "Cpu(s)"

echo -e "\n🌐 Conectividade:"
curl -s -o /dev/null -w "Frontend: %{http_code} (%{time_total}s)\n" https://yourdomain.com
curl -s -o /dev/null -w "API: %{http_code} (%{time_total}s)\n" https://api.yourdomain.com/api/health

echo -e "\n📦 Docker Stats:"
docker stats --no-stream