#!/bin/bash

echo "⏰ CONFIGURANDO BACKUP DIÁRIO AUTOMÁTICO"
echo "======================================="

# Obter caminho absoluto do script
SCRIPT_PATH="$(pwd)/auto-backup-postgresql.sh"
PROJECT_PATH="$(pwd)"

echo "📁 Caminho do projeto: $PROJECT_PATH"
echo "📄 Script de backup: $SCRIPT_PATH"

# Verificar se o script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script de backup não encontrado!"
    exit 1
fi

# Testar o script
echo ""
echo "🧪 Testando configurações..."
cd "$PROJECT_PATH" && ./auto-backup-postgresql.sh test

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Teste passou! Configurando cron..."
    
    # Backup da crontab atual
    crontab -l > /tmp/crontab-backup-$(date +%s) 2>/dev/null || true
    
    # Remover entradas antigas do backup (se existirem)
    (crontab -l 2>/dev/null | grep -v "auto-backup-postgresql.sh") | crontab -
    
    # Adicionar nova entrada para backup diário às 2:00 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * cd $PROJECT_PATH && ./auto-backup-postgresql.sh backup >> ./logs/cron-backup.log 2>&1") | crontab -
    
    # Adicionar entrada para relatório semanal (domingo às 8:00 AM)
    (crontab -l 2>/dev/null; echo "0 8 * * 0 cd $PROJECT_PATH && ./auto-backup-postgresql.sh status >> ./logs/cron-backup.log 2>&1") | crontab -
    
    echo ""
    echo "🎉 BACKUP AUTOMÁTICO CONFIGURADO!"
    echo "================================"
    echo ""
    echo "⏰ AGENDAMENTOS:"
    echo "• Backup diário: Todo dia às 02:00"
    echo "• Relatório semanal: Domingo às 08:00"
    echo ""
    echo "📁 CONFIGURAÇÕES:"
    echo "• Backups salvos em: ./backups/auto/"
    echo "• Logs em: ./logs/"
    echo "• Manter: 30 dias de backup"
    echo "• Compressão: Ativada"
    echo ""
    echo "🔍 VERIFICAR CRON:"
    echo "crontab -l"
    echo ""
    echo "📊 VER STATUS:"
    echo "./auto-backup-postgresql.sh status"
    echo ""
    echo "🧪 TESTAR BACKUP MANUAL:"
    echo "./auto-backup-postgresql.sh backup"
    
else
    echo ""
    echo "❌ Teste falhou! Verifique as configurações antes de configurar o cron."
    exit 1
fi
