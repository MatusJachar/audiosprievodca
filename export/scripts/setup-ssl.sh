#!/bin/bash
# ============================================
# SSL Certificate Setup for Spissky Hrad
# Using Let's Encrypt (Certbot)
# ============================================

set -e

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}

echo "========================================"
echo "  Spissky Hrad - SSL Certificate Setup"
echo "========================================"
echo ""
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# Step 1: Make sure Docker services are running
echo "[1/5] Starting services with HTTP-only config..."
cp docker/nginx.conf docker/nginx-active.conf
docker compose up -d mongodb backend nginx
sleep 5

# Step 2: Get SSL certificate from Let's Encrypt
echo "[2/5] Requesting SSL certificate from Let's Encrypt..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

# Step 3: Switch to SSL nginx config
echo "[3/5] Switching to HTTPS configuration..."
sed "s/YOUR_DOMAIN.com/$DOMAIN/g" docker/nginx-ssl.conf > docker/nginx.conf

# Step 4: Restart nginx with SSL
echo "[4/5] Restarting nginx with SSL..."
docker compose restart nginx

# Step 5: Verify
echo "[5/5] Verifying SSL..."
sleep 3
curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health"
echo ""

echo ""
echo "========================================"
echo "  SSL Setup Complete!"
echo "========================================"
echo ""
echo "Your API is now available at:"
echo "  https://$DOMAIN/api/"
echo ""
echo "SSL auto-renewal is configured via certbot."
echo "Certificates will renew automatically every 12 hours check."
echo ""
echo "Next steps:"
echo "  1. Update your mobile app API URL to: https://$DOMAIN"
echo "  2. Test: curl https://$DOMAIN/api/health"
echo "  3. Rebuild mobile app with EAS"
