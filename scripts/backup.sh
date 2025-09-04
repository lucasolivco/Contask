#!/bin/bash

# 💾 SCRIPT DE BACKUP

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

echo "💾 Iniciando backup..."

# Backup do banco
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./uploads

# Backup das configurações
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz ./env ./docker

echo "✅ Backup concluído: $BACKUP_DIR"

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete