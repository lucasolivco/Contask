#!/bin/bash

# =================================================
# 🔄 RESTAURAÇÃO DE BACKUP POSTGRESQL - PRODUÇÃO
# =================================================

source ./env/.env.production

BACKUP_DIR="./backups/auto"
LOG_DIR="./logs"
CONTAINER_NAME="task_manager-postgres-1"

# Criar diretório de logs
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/restore-$(date +%Y%m%d-%H%M%S).log"

log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

show_available_backups() {
    echo "📦 BACKUPS DISPONÍVEIS"
    echo "====================="
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ Diretório de backup não encontrado: $BACKUP_DIR"
        return 1
    fi
    
    local backups=$(find "$BACKUP_DIR" -name "backup-*.sql*" -type f)
    
    if [ -z "$backups" ]; then
        echo "❌ Nenhum backup encontrado em $BACKUP_DIR"
        return 1
    fi
    
    echo "📋 Backups encontrados:"
    echo ""
    
    local count=1
    find "$BACKUP_DIR" -name "backup-*.sql*" -type f -printf '%T@ %p\n' | \
    sort -nr | while read timestamp file; do
        local date_formatted=$(date -d "@$timestamp" '+%Y-%m-%d %H:%M:%S')
        local size=$(du -h "$file" | cut -f1)
        local filename=$(basename "$file")
        
        echo "$count. $date_formatted - $filename ($size)"
        count=$((count + 1))
    done
    
    echo ""
    return 0
}

verify_backup_file() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Arquivo de backup não encontrado: $backup_file"
        return 1
    fi
    
    # Verificar se é arquivo comprimido
    if [[ "$backup_file" == *.gz ]]; then
        if ! gunzip -t "$backup_file" >/dev/null 2>&1; then
            echo "❌ Arquivo comprimido corrompido: $backup_file"
            return 1
        fi
        echo "✅ Arquivo comprimido válido"
    else
        if ! head -n 10 "$backup_file" | grep -q "PostgreSQL database dump" >/dev/null 2>&1; then
            echo "❌ Arquivo não parece ser um backup PostgreSQL válido"
            return 1
        fi
        echo "✅ Arquivo de backup válido"
    fi
    
    return 0
}

create_backup_before_restore() {
    log_message "INFO" "Criando backup de segurança antes da restauração..."
    
    local safety_backup="./backups/safety-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$safety_backup"; then
        gzip "$safety_backup"
        log_message "SUCCESS" "Backup de segurança criado: $safety_backup.gz"
        echo "✅ Backup de segurança salvo em: $safety_backup.gz"
        return 0
    else
        log_message "ERROR" "Falha ao criar backup de segurança!"
        echo "❌ Falha ao criar backup de segurança!"
        return 1
    fi
}

restore_full_database() {
    local backup_file=$1
    local skip_safety_backup=$2
    
    log_message "INFO" "=== INICIANDO RESTAURAÇÃO COMPLETA ==="
    log_message "INFO" "Backup: $backup_file"
    
    # Verificar arquivo de backup
    if ! verify_backup_file "$backup_file"; then
        return 1
    fi
    
    # Criar backup de segurança (a menos que seja pulado)
    if [ "$skip_safety_backup" != "true" ]; then
        if ! create_backup_before_restore; then
            read -p "⚠️ Continuar sem backup de segurança? (y/N): " continue_without_safety
            if [ "$continue_without_safety" != "y" ]; then
                echo "❌ Restauração cancelada"
                return 1
            fi
        fi
    fi
    
    echo ""
    echo "⚠️ ATENÇÃO: RESTAURAÇÃO COMPLETA"
    echo "================================"
    echo "Isso irá:"
    echo "• 🗑️ APAGAR todos os dados atuais"
    echo "• 🔄 SUBSTITUIR por dados do backup"
    echo "• ⏹️ PARAR a aplicação temporariamente"
    echo ""
    echo "📁 Backup: $(basename "$backup_file")"
    echo "📅 Data: $(stat -c %y "$backup_file" | cut -d'.' -f1)"
    echo ""
    read -p "🚨 Tem CERTEZA que deseja continuar? (digite 'CONFIRMO'): " confirmation
    
    if [ "$confirmation" != "CONFIRMO" ]; then
        echo "❌ Restauração cancelada"
        return 1
    fi
    
    log_message "INFO" "Confirmação recebida. Iniciando restauração..."
    
    # Parar aplicação
    echo "⏹️ Parando aplicação..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml stop app
    
    # Aguardar conexões fecharem
    sleep 10
    
    # Finalizar conexões ativas
    log_message "INFO" "Finalizando conexões ativas..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
    
    # Dropar e recriar banco
    log_message "INFO" "Recriando banco de dados..."
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
    
    # Restaurar backup
    log_message "INFO" "Iniciando restauração dos dados..."
    
    if [[ "$backup_file" == *.gz ]]; then
        # Arquivo comprimido
        if gunzip -c "$backup_file" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"; then
            log_message "SUCCESS" "Dados restaurados com sucesso!"
        else
            log_message "ERROR" "Falha na restauração dos dados!"
            return 1
        fi
    else
        # Arquivo não comprimido
        if docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$backup_file"; then
            log_message "SUCCESS" "Dados restaurados com sucesso!"
        else
            log_message "ERROR" "Falha na restauração dos dados!"
            return 1
        fi
    fi
    
    # Verificar restauração
    log_message "INFO" "Verificando dados restaurados..."
    local user_count=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    local task_count=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM tasks;" 2>/dev/null | xargs)
    
    if [ -n "$user_count" ] && [ -n "$task_count" ]; then
        log_message "SUCCESS" "Verificação OK - Usuários: $user_count, Tasks: $task_count"
        echo "✅ Dados verificados: $user_count usuários, $task_count tasks"
    else
        log_message "ERROR" "Falha na verificação dos dados restaurados!"
        echo "❌ Problema na verificação dos dados!"
    fi
    
    # Reiniciar aplicação
    echo "🚀 Reiniciando aplicação..."
    docker-compose --env-file ./env/.env.production -f docker-compose.prod.yml up -d app
    
    sleep 15
    
    # Verificar se aplicação subiu
    if docker ps --format '{{.Names}}' | grep -q "task_manager.*app"; then
        log_message "SUCCESS" "Aplicação reiniciada com sucesso!"
        echo "✅ Aplicação reiniciada!"
    else
        log_message "ERROR" "Problema ao reiniciar aplicação!"
        echo "⚠️ Verifique a aplicação: docker-compose logs app"
    fi
    
    echo ""
    echo "🎉 RESTAURAÇÃO COMPLETA FINALIZADA!"
    echo "=================================="
    echo "📊 Resumo:"
    echo "• Usuários: $user_count"
    echo "• Tasks: $task_count"
    echo "• Log: $LOG_FILE"
    echo ""
    echo "🔍 Verificar aplicação:"
    echo "• Status: docker-compose ps"
    echo "• Logs: docker-compose logs app"
}

restore_table_only() {
    local backup_file=$1
    local table_name=$2
    
    echo "🔄 RESTAURAÇÃO DE TABELA ESPECÍFICA"
    echo "=================================="
    echo "⚠️ Esta função irá substituir dados da tabela '$table_name'"
    echo "📁 Backup: $(basename "$backup_file")"
    echo ""
    read -p "Continuar? (y/N): " confirm
    
    if [ "$confirm" != "y" ]; then
        echo "❌ Cancelado"
        return 1
    fi
    
    # Fazer backup da tabela atual
    log_message "INFO" "Fazendo backup da tabela atual..."
    local table_backup="./backups/table-backup-$table_name-$(date +%Y%m%d-%H%M%S).sql"
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -t "$table_name" "$DB_NAME" > "$table_backup"
    
    # Extrair e restaurar apenas a tabela específica
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | grep -A 10000 "CREATE TABLE.*$table_name" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    else
        grep -A 10000 "CREATE TABLE.*$table_name" "$backup_file" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"
    fi
    
    echo "✅ Tabela '$table_name' restaurada"
    echo "💾 Backup anterior salvo em: $table_backup"
}

# Menu principal
show_restore_menu() {
    echo "🔄 MENU DE RESTAURAÇÃO POSTGRESQL"
    echo "================================"
    echo ""
    echo "1. 📋 Listar backups disponíveis"
    echo "2. 🔄 Restauração completa do banco"
    echo "3. 📊 Restaurar apenas uma tabela"
    echo "4. 🧪 Testar backup (sem restaurar)"
    echo "5. 📁 Buscar backup por data"
    echo "6. 🚨 Restauração de emergência"
    echo "0. ❌ Sair"
    echo ""
    read -p "Escolha uma opção: " option
    
    case $option in
        1)
            show_available_backups
            ;;
        2)
            show_available_backups
            echo ""
            read -p "📁 Digite o nome completo do arquivo de backup: " backup_file
            if [ -n "$backup_file" ]; then
                if [[ "$backup_file" != /* ]]; then
                    backup_file="$BACKUP_DIR/$backup_file"
                fi
                restore_full_database "$backup_file"
            fi
            ;;
        3)
            show_available_backups
            echo ""
            read -p "📁 Nome do arquivo de backup: " backup_file
            read -p "📋 Nome da tabela: " table_name
            if [ -n "$backup_file" ] && [ -n "$table_name" ]; then
                if [[ "$backup_file" != /* ]]; then
                    backup_file="$BACKUP_DIR/$backup_file"
                fi
                restore_table_only "$backup_file" "$table_name"
            fi
            ;;
        4)
            show_available_backups
            echo ""
            read -p "📁 Nome do arquivo para testar: " backup_file
            if [ -n "$backup_file" ]; then
                if [[ "$backup_file" != /* ]]; then
                    backup_file="$BACKUP_DIR/$backup_file"
                fi
                verify_backup_file "$backup_file"
            fi
            ;;
        5)
            read -p "📅 Digite a data (YYYYMMDD): " date_search
            echo "🔍 Backups da data $date_search:"
            find "$BACKUP_DIR" -name "backup-$date_search*.sql*" -exec basename {} \;
            ;;
        6)
            echo "🚨 RESTAURAÇÃO DE EMERGÊNCIA"
            echo "============================"
            echo "Isto irá:"
            echo "• Usar o backup mais recente"
            echo "• Pular backup de segurança"
            echo "• Executar restauração imediata"
            echo ""
            read -p "🚨 Confirmar emergência? (digite 'EMERGENCIA'): " emergency_confirm
            if [ "$emergency_confirm" = "EMERGENCIA" ]; then
                local latest_backup=$(find "$BACKUP_DIR" -name "backup-*.sql*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
                if [ -n "$latest_backup" ]; then
                    echo "📁 Usando backup: $(basename "$latest_backup")"
                    restore_full_database "$latest_backup" "true"
                else
                    echo "❌ Nenhum backup encontrado!"
                fi
            fi
            ;;
        0)
            echo "👋 Saindo..."
            exit 0
            ;;
        *)
            echo "❌ Opção inválida"
            ;;
    esac
}

# Execução
if [ $# -eq 0 ]; then
    show_restore_menu
else
    case $1 in
        "list")
            show_available_backups
            ;;
        "restore")
            if [ -z "$2" ]; then
                echo "❌ Especifique o arquivo de backup"
                echo "💡 Uso: $0 restore <arquivo_backup>"
                exit 1
            fi
            restore_full_database "$2"
            ;;
        "emergency")
            echo "🚨 RESTAURAÇÃO DE EMERGÊNCIA AUTOMÁTICA"
            local latest_backup=$(find "$BACKUP_DIR" -name "backup-*.sql*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
            if [ -n "$latest_backup" ]; then
                echo "📁 Backup mais recente: $(basename "$latest_backup")"
                restore_full_database "$latest_backup" "true"
            else
                echo "❌ Nenhum backup encontrado!"
                exit 1
            fi
            ;;
        *)
            echo "🛠️ USO: $0 [list|restore <file>|emergency]"
            echo ""
            echo "  list           - Listar backups"
            echo "  restore <file> - Restaurar backup específico"
            echo "  emergency      - Restauração de emergência"
            echo "  (sem parâmetros) - Menu interativo"
            ;;
    esac
fi
