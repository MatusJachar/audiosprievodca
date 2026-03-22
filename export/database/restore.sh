#!/bin/bash

# MongoDB Restore Script for Spišský hrad Audio Tour
# Run this inside the MongoDB container or with mongorestore installed

echo "=== Spišský hrad Database Restore ==="
echo "Restoring database from dump..."

# Check if dump directory exists
if [ ! -d "/dump/test_database" ]; then
    echo "ERROR: Dump directory not found at /dump/test_database"
    echo "Please ensure the dump folder is mounted correctly"
    exit 1
fi

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
sleep 5

# Restore the database
mongorestore --db spis_castle_db /dump/test_database --drop

if [ $? -eq 0 ]; then
    echo "=== Database restored successfully! ==="
    echo ""
    echo "Collections restored:"
    mongosh --eval "db = db.getSiblingDB('spis_castle_db'); db.getCollectionNames().forEach(c => print('  - ' + c + ': ' + db.getCollection(c).countDocuments() + ' documents'))"
else
    echo "ERROR: Database restore failed!"
    exit 1
fi
