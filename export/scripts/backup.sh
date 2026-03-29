#!/bin/bash
# ============================================
# Database Backup Script for Spissky Hrad
# ============================================

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/spissky_hrad_$DATE.archive"

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_FILE"
mongodump --uri="mongodb://localhost:27017" --db=spissky_hrad --archive=$BACKUP_FILE

echo "Backup complete: $BACKUP_FILE"
echo "Size: $(du -h $BACKUP_FILE | cut -f1)"

# Keep only last 7 backups
ls -t $BACKUP_DIR/spissky_hrad_*.archive | tail -n +8 | xargs rm -f 2>/dev/null
echo "Old backups cleaned (keeping last 7)"
