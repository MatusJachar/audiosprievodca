#!/bin/bash
# Restore script for Spišský hrad MongoDB database

echo "=== Spišský hrad Database Restore ==="

# Check if archive exists
if [ ! -f "/docker-entrypoint-initdb.d/dump.archive" ]; then
    echo "Archive not found at /docker-entrypoint-initdb.d/dump.archive"
    exit 1
fi

echo "Restoring database from archive..."
mongorestore --archive=/docker-entrypoint-initdb.d/dump.archive --nsFrom="test_database.*" --nsTo="spis_castle_db.*"

if [ $? -eq 0 ]; then
    echo "=== Database restored successfully! ==="
else
    echo "ERROR: Database restore failed!"
    exit 1
fi
