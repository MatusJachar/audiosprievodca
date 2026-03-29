#!/bin/bash
# ============================================
# Complete Deployment Script for Spissky Hrad
# One-command deployment on Hetzner Server
# ============================================

set -e

echo "========================================"
echo "  Spissky Hrad - Complete Deployment"
echo "========================================"
echo ""

# Step 1: Install dependencies
echo "[1/6] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq docker.io docker-compose-plugin mongodb-database-tools curl
systemctl enable docker
systemctl start docker

# Step 2: Start Docker services
echo "[2/6] Starting Docker services..."
docker compose up -d --build
sleep 10

# Step 3: Verify services are running
echo "[3/6] Checking service status..."
docker compose ps

# Step 4: Wait for MongoDB to be ready
echo "[4/6] Waiting for MongoDB..."
for i in {1..30}; do
  if docker exec spissky-hrad-db mongosh --eval 'db.runCommand({ping:1})' --quiet 2>/dev/null; then
    echo "  MongoDB is ready!"
    break
  fi
  sleep 1
  echo "  Waiting... ($i/30)"
done

# Step 5: Restore database
echo "[5/6] Restoring database..."
cd database/
chmod +x restore.sh
./restore.sh "mongodb://localhost:27017"
cd ..

# Step 6: Seed sample partners (if needed)
echo "[6/6] Seeding sample data..."
curl -s -X POST http://localhost:8002/api/admin/partners/seed | python3 -m json.tool 2>/dev/null || echo "Partners already seeded"

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Services running:"
docker compose ps
echo ""
echo "API Health Check:"
curl -s http://localhost:8002/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8002/api/health
echo ""
echo "Admin Stats:"
curl -s http://localhost:8002/api/admin/stats | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8002/api/admin/stats
echo ""
echo "Next steps:"
echo "  1. Set up SSL: ./scripts/setup-ssl.sh your-domain.com admin@your-domain.com"
echo "  2. Update mobile app API URL"
echo "  3. Build mobile app: cd frontend && eas build --platform android"
echo ""
echo "Quick URLs:"
echo "  API:    http://$(hostname -I | awk '{print $1}'):8002/api/"
echo "  Health: http://$(hostname -I | awk '{print $1}'):8002/api/health"
echo "  Admin:  Via mobile app -> Settings -> Admin Login"
