#!/bin/bash
# Restore MongoDB database from archive
# Usage: ./restore.sh [mongodb_uri]

MONGO_URI=${1:-"mongodb://localhost:27017"}
DB_NAME="spissky_hrad"

echo "=== Spissky Hrad Database Restore ==="
echo "URI: $MONGO_URI"
echo "Database: $DB_NAME"
echo ""

# Restore from archive
echo "Restoring from archive..."
mongorestore --uri="$MONGO_URI" --archive=spissky_hrad.archive --nsFrom='test_database.*' --nsTo="${DB_NAME}.*" --drop

echo ""
echo "=== Restore complete! ==="
echo "Collections restored:"
mongosh "$MONGO_URI/$DB_NAME" --eval 'db.getCollectionNames().forEach(c => print("  " + c + ": " + db[c].countDocuments() + " docs"))' --quiet
