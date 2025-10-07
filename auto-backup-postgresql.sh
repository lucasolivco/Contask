#!/bin/bash

# =================================================
# 📦 BACKUP AUTOMÁTICO POSTGRESQL - PRODUÇÃO
# =================================================
# Autor: Sistema de Task Manager
# Versão: 1.0
# Descrição: Backup automático diário com rotação

# =================================================
# ⚙️ CONFIGURAÇÕES
# =================================================

# Carregar variáveis de ambiente
if [ -f "./env/.env.production" ]; then
    source ./env/.env.production
else
    echo "❌ ERRO: Arquivo .env.production não encontrado!"
    exit 1
fi

# Configurações do backup
BACKUP_DIR="./backups/auto"
LOG_DIR="./logs"
CONTAINER_NAME="task_manager-postgres-1"
MAX_BACKUPS=10  # Manter 10 dias de backup
COMPRESS_BACKUPS=true  # Comprimir backups para economizar espaço

# Criar diretórios necessários
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# Arquivos de log
LOG_FILE="$LOG_DIR/backup-$(date +%Y%m).log"
ERROR_LOG="$LOG_DIR/backup-errors-$(date +%Y%m).log"

# Nome do arquivo de backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"
BACKUP_FILE_COMPRESSED="$BACKUP_DIR/backup-$TIMESTAMP.sql.gz"

# =================================================
# 📝 FUNÇÕES AUXILIARES
# =================================================

log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_error() {
    local message=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [ERROR] $message" | tee -a "$LOG_FILE" | tee -a "$ERROR_LOG"
}

check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container PostgreSQL '$CONTAINER_NAME' não está rodando!"
        return 1
    fi
    return 0
}

check_database_connection() {
    if ! docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" >/dev/null 2>&1; then
        log_error "PostgreSQL não está aceitando conexões!"
        return 1
    fi
    return 0
}

get_database_size() {
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs
}

verify_backup() {
    local backup_file=$1
    
    # Verificar se o arquivo existe e não está vazio
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        log_error "Arquivo de backup '$backup_file' está vazio ou não existe!"
        return 1
    fi
    
    # Verificar se o backup é um arquivo SQL válido
    if [ "$COMPRESS_BACKUPS" = true ] && [[ "$backup_file" == *.gz ]]; then
        # Para arquivos comprimidos, verificar se podem ser descomprimidos
        if ! gunzip -t "$backup_file" >/dev/null 2>&1; then
            log_error "Arquivo de backup comprimido '$backup_file' está corrompido!"
            return 1
        fi
    else
        # Para arquivos não comprimidos, verificar conteúdo SQL
        if ! head -n 10 "$backup_file" | grep -q "PostgreSQL database dump" >/dev/null 2>&1; then
            log_error "Arquivo de backup '$backup_file' não parece ser um dump PostgreSQL válido!"
            return 1
        fi
    fi
    
    return 0
}

cleanup_old_backups() {
    log_message "INFO" "Iniciando limpeza de backups antigos (mantendo $MAX_BACKUPS mais recentes)..."
    
    # Contar backups atuais
    local current_backups=$(find "$BACKUP_DIR" -name "backup-*.sql*" | wc -l)
    log_message "INFO" "Backups atuais encontrados: $current_backups"
    
    if [ "$current_backups" -gt "$MAX_BACKUPS" ]; then
        local to_remove=$((current_backups - MAX_BACKUPS))
        log_message "INFO" "Removendo $to_remove backup(s) antigo(s)..."
        
        # Listar arquivos mais antigos e remover
        find "$BACKUP_DIR" -name "backup-*.sql*" -type f -printf '%T@ %p\n' | \
        sort -n | \
        head -n "$to_remove" | \
        cut -d' ' -f2- | \
        while read file; do
            log_message "INFO" "Removendo backup antigo: $(basename "$file")"
            rm -f "$file"
        done
    else
        log_message "INFO" "Não há backups antigos para remover."
    fi
}

send_notification() {
    local status=$1
    local message=$2
    
    # Aqui você pode adicionar notificações via email, Slack, Discord, etc.
    # Exemplo para futuro:
    # curl -X POST -H 'Content-type: application/json' \
    #   --data '{"text":"'"$message"'"}' \
    #   YOUR_WEBHOOK_URL
    
    log_message "INFO" "Notificação: $status - $message"
}

# =================================================
# 🎯 FUNÇÃO PRINCIPAL DE BACKUP
# =================================================

perform_backup() {
    log_message "INFO" "=== INICIANDO BACKUP AUTOMÁTICO ==="
    log_message "INFO" "Timestamp: $TIMESTAMP"
    log_message "INFO" "Banco: $DB_NAME"
    log_message "INFO" "Usuário: $DB_USER"
    log_message "INFO" "Container: $CONTAINER_NAME"
    
    # Verificar se o container está rodando
    if ! check_container; then
        send_notification "ERRO" "Container PostgreSQL não está rodando"
        exit 1
    fi
    
    # Verificar conexão com o banco
    if ! check_database_connection; then
        send_notification "ERRO" "Não foi possível conectar ao PostgreSQL"
        exit 1
    fi
    
    # Obter tamanho do banco antes do backup
    local db_size=$(get_database_size)
    log_message "INFO" "Tamanho do banco: $db_size"
    
    # Verificar espaço em disco
    local available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    log_message "INFO" "Espaço disponível: $(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')"
    
    # Executar backup
    log_message "INFO" "Iniciando dump do banco de dados..."
    
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>>"$ERROR_LOG"; then
        log_message "SUCCESS" "Dump criado com sucesso: $BACKUP_FILE"
        
        # Comprimir backup se configurado
        if [ "$COMPRESS_BACKUPS" = true ]; then
            log_message "INFO" "Comprimindo backup..."
            if gzip "$BACKUP_FILE"; then
                BACKUP_FILE="$BACKUP_FILE_COMPRESSED"
                log_message "SUCCESS" "Backup comprimido: $BACKUP_FILE"
            else
                log_error "Falha ao comprimir backup!"
                # Continuar com arquivo não comprimido
            fi
        fi
        
        # Verificar integridade do backup
        if verify_backup "$BACKUP_FILE"; then
            # Obter tamanho do arquivo de backup
            local backup_size=$(du -h "$BACKUP_FILE" | cut -f1)
            log_message "SUCCESS" "Backup verificado com sucesso!"
            log_message "INFO" "Tamanho do backup: $backup_size"
            
            # Limpeza de backups antigos
            cleanup_old_backups
            
            # Estatísticas finais
            local total_backups=$(find "$BACKUP_DIR" -name "backup-*.sql*" | wc -l)
            local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
            
            log_message "SUCCESS" "=== BACKUP CONCLUÍDO COM SUCESSO ==="
            log_message "INFO" "Arquivo: $(basename "$BACKUP_FILE")"
            log_message "INFO" "Tamanho: $backup_size"
            log_message "INFO" "Total de backups: $total_backups"
            log_message "INFO" "Espaço usado pelos backups: $total_size"
            
            send_notification "SUCESSO" "Backup concluído: $(basename "$BACKUP_FILE") ($backup_size)"
            
        else
            log_error "Backup criado mas falhou na verificação de integridade!"
            rm -f "$BACKUP_FILE"
            send_notification "ERRO" "Backup falhou na verificação de integridade"
            exit 1
        fi
        
    else
        log_error "Falha ao criar dump do banco de dados!"
        send_notification "ERRO" "Falha ao criar backup do banco de dados"
        exit 1
    fi
}

# =================================================
# 🔍 FUNÇÃO DE STATUS E RELATÓRIOS
# =================================================

show_backup_status() {
    echo "📊 STATUS DOS BACKUPS"
    echo "===================="
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        local total_backups=$(find "$BACKUP_DIR" -name "backup-*.sql*" | wc -l)
        local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
        local newest_backup=$(find "$BACKUP_DIR" -name "backup-*.sql*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        local oldest_backup=$(find "$BACKUP_DIR" -name "backup-*.sql*" -type f -printf '%T@ %p\n' | sort -n | head -1 | cut -d' ' -f2-)
        
        echo "📁 Diretório: $BACKUP_DIR"
        echo "📦 Total de backups: $total_backups"
        echo "💾 Espaço usado: $total_size"
        echo "🆕 Backup mais recente: $(basename "$newest_backup" 2>/dev/null || echo "Nenhum")"
        echo "📅 Backup mais antigo: $(basename "$oldest_backup" 2>/dev/null || echo "Nenhum")"
        echo ""
        
        if [ "$total_backups" -gt 0 ]; then
            echo "📋 ÚLTIMOS 5 BACKUPS:"
            find "$BACKUP_DIR" -name "backup-*.sql*" -type f -printf '%T@ %p\n' | \
            sort -nr | head -5 | while read timestamp file; do
                local date_formatted=$(date -d "@$timestamp" '+%Y-%m-%d %H:%M:%S')
                local size=$(du -h "$file" | cut -f1)
                echo "  $date_formatted - $(basename "$file") ($size)"
            done
        fi
    else
        echo "❌ Diretório de backup não encontrado: $BACKUP_DIR"
    fi
    
    echo ""
    echo "📝 LOGS:"
    echo "  Backup: $LOG_FILE"
    echo "  Erros: $ERROR_LOG"
}

# =================================================
# 🚀 EXECUÇÃO PRINCIPAL
# =================================================

case "${1:-backup}" in
    "backup")
        perform_backup
        ;;
    "status")
        show_backup_status
        ;;
    "cleanup")
        log_message "INFO" "Limpeza manual solicitada"
        cleanup_old_backups
        ;;
    "test")
        log_message "INFO" "Testando configurações..."
        check_container && check_database_connection && echo "✅ Tudo OK para backup!" || echo "❌ Problemas encontrados!"
        ;;
    *)
        echo "🛠️ USO: $0 [backup|status|cleanup|test]"
        echo ""
        echo "  backup  - Executar backup (padrão)"
        echo "  status  - Mostrar status dos backups"
        echo "  cleanup - Limpar backups antigos"
        echo "  test    - Testar configurações"
        ;;
esac
