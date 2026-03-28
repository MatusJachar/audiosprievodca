# Test Results

## User Problem Statement
Build a fully functional "Spissky hrad" free audio guide app with all features.

## Testing Protocol
DO NOT EDIT THIS SECTION

## What was implemented
1. Complete backend with Partners CRUD, Deep Linking, Content Management, QR Code generation
2. Partners page with category filters, ratings, discount banners, contact buttons
3. Full Admin Panel with tabs (Stats, Stops, Partners, QR Codes, Content, Deep Links)
4. GastroFlow deep linking integration
5. QR code generation for each tour stop (individual download + print sheet)

## Test Credentials
- Admin Password: castle2025
- Default User: default-user

## Backend Base URL
http://localhost:8001

## Key API Endpoints to Test
### Core
- GET /api/health
- GET /api/tour-stops
- GET /api/tour-stops/{id} (use first stop id from list)

### Partners CRUD
- GET /api/partners
- POST /api/admin/partners {"name":"Test Partner","category":"restaurant","description":"Test","phone":"+421111"}
- PUT /api/admin/partners/{id} {"name":"Updated Partner"}
- DELETE /api/admin/partners/{id}

### QR Codes (NEW)
- GET /api/qr/all?size=300 (should return all QR codes as base64)
- GET /api/qr/stop/{stop_id}?format=base64 (single QR as base64)
- GET /api/qr/stop/{stop_id}?format=png (single QR as PNG download)
- GET /api/qr/print-sheet (A4 print sheet with all QR codes)

### Deep Linking
- GET /api/deeplink/config
- POST /api/deeplink/referral {"source_app":"audioguide","target_app":"gastroflow","referral_type":"direct"}
- GET /api/deeplink/referrals/stats
- GET /api/deeplink/nearby-restaurants

### Content
- GET /api/content/travel-info
- PUT /api/content/travel-info {"location_name":"Spisske Podhradie Updated"}
- GET /api/content/shop
- GET /api/admin/stats
