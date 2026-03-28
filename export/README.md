# Spissky Hrad - Audio Tour Guide
## Complete Deployment Package for Hetzner Server

---

## Project Overview

**App Name:** Spissky hrad  
**Subtitle:** Audiosprievodca  
**Package ID (Android):** com.spiscastle.freetour  
**Package ID (iOS):** com.spiscastle.freetour  

### Features
- **8 Tour Stops** (Stops 1, 2, 4, 6, 8, 11, 12 + Legend 3)
- **9 Languages** (SK, EN, DE, PL, HU, RU, ES, ZH, FR)
- **Audio Player** with auto-advance and "Next Stop" button
- **Offline Mode** - Download tour for offline use
- **Local Business Partners** - Restaurant, hotel, shop listings with CRUD
- **GastroFlow Deep Linking** - Integration with restaurant apps
- **Admin Panel** - Full content management (tour stops, partners, content, deep links)
- **Progress Tracking** - Track completed stops
- **UNESCO Heritage** badge and branding

---

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- Domain pointed to server IP (optional, for HTTPS)
- MongoDB tools (for database restore)

### 1. Deploy

```bash
# Clone/copy project to server
cd /path/to/spissky-hrad

# Start all services
docker compose up -d

# Check services
docker compose ps
docker compose logs -f backend
```

### 2. Restore Database

```bash
# Install mongorestore if not available
apt-get install -y mongodb-database-tools

# Restore database
cd database/
chmod +x restore.sh
./restore.sh "mongodb://localhost:27017"
```

### 3. Verify

```bash
# Health check
curl http://localhost:8002/api/health

# Get tour stops
curl http://localhost:8002/api/tour-stops | python3 -m json.tool

# Get partners
curl http://localhost:8002/api/partners | python3 -m json.tool

# Admin stats
curl http://localhost:8002/api/admin/stats | python3 -m json.tool
```

---

## Deployment Commands for Hetzner

```bash
# 1. Connect to your Hetzner server
ssh root@YOUR_SERVER_IP

# 2. Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin mongodb-database-tools

# 3. Upload project
# From your local machine:
scp -r ./spissky-hrad-export root@YOUR_SERVER_IP:/opt/spissky-hrad

# 4. On server: Start services
cd /opt/spissky-hrad
docker compose up -d

# 5. Restore database
cd database/
./restore.sh "mongodb://localhost:27017"

# 6. Seed sample partners (optional)
curl -X POST http://localhost:8002/api/admin/partners/seed

# 7. Verify
curl http://localhost:8002/api/health
```

---

## Mobile App Build (EAS)

### Prerequisites
```bash
npm install -g eas-cli
cd frontend/
yarn install
```

### Configure for Production

1. Update `frontend/app.json`:
```json
{
  "expo": {
    "name": "Spissky hrad",
    "slug": "spissky-hrad",
    "scheme": "audioguide"
  }
}
```

2. Update API URL in all frontend files:
```
Replace: process.env.EXPO_PUBLIC_BACKEND_URL
With: http://YOUR_SERVER_IP:8002
```

Key files to update:
- `frontend/store/tourStore.ts`
- `frontend/store/languageStore.ts`
- `frontend/app/tour.tsx`
- `frontend/app/partners.tsx`
- `frontend/app/admin.tsx`
- `frontend/app/stop-detail.tsx`

### Quick EAS Build

```bash
cd frontend/

# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build iOS (requires Apple Developer Account)
eas build --platform ios --profile preview

# Build for stores
eas build --platform android --profile production
eas build --platform ios --profile production
```

### EAS Configuration (eas.json)
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "env": { "EXPO_PUBLIC_BACKEND_URL": "http://YOUR_SERVER_IP:8002" }
      },
      "ios": {
        "simulator": true,
        "env": { "EXPO_PUBLIC_BACKEND_URL": "http://YOUR_SERVER_IP:8002" }
      }
    },
    "production": {
      "android": {
        "env": { "EXPO_PUBLIC_BACKEND_URL": "http://YOUR_SERVER_IP:8002" }
      },
      "ios": {
        "env": { "EXPO_PUBLIC_BACKEND_URL": "http://YOUR_SERVER_IP:8002" }
      }
    }
  }
}
```

---

## API Documentation

### Base URL
```
http://YOUR_SERVER_IP:8002/api
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tour-stops` | List all tour stops |
| GET | `/api/tour-stops/{id}` | Get specific stop with audio |
| GET | `/api/tour-stops/{id}/audio/{lang}` | Get audio for stop |
| GET | `/api/audio/stream/{id}/{lang}` | Stream audio as MP3 |
| GET | `/api/uploads/audio/{filename}` | Serve audio file |
| POST | `/api/tour-stops` | Create tour stop |
| PUT | `/api/tour-stops/{id}` | Update tour stop |
| DELETE | `/api/tour-stops/{id}` | Delete tour stop |

### Audio Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audio/upload` | Upload audio (base64) |
| POST | `/api/admin/audio/upload-file` | Upload audio file (multipart) |

### Partner Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/partners` | List partners (with filters) |
| GET | `/api/partners/{id}` | Get partner details |
| POST | `/api/admin/partners` | Create partner |
| PUT | `/api/admin/partners/{id}` | Update partner |
| DELETE | `/api/admin/partners/{id}` | Delete partner |
| POST | `/api/admin/partners/{id}/logo` | Upload partner logo |
| POST | `/api/admin/partners/seed` | Seed sample partners |

### QR Code Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/qr/all?size=300` | All QR codes as base64 JSON |
| GET | `/api/qr/stop/{id}?format=base64` | Single QR as base64 JSON |
| GET | `/api/qr/stop/{id}?format=png&size=600` | Single QR as downloadable PNG |
| GET | `/api/qr/print-sheet` | A4 print sheet with all QR codes (PNG) |

### Deep Linking / GastroFlow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deeplink/config` | Get deep link config |
| PUT | `/api/admin/deeplink/config` | Update deep link config |
| POST | `/api/deeplink/referral` | Track referral |
| GET | `/api/deeplink/referrals/stats` | Get referral stats |
| GET | `/api/deeplink/nearby-restaurants` | Nearby restaurants |

### Content Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content/travel-info` | Get travel info |
| PUT | `/api/content/travel-info` | Update travel info |
| GET | `/api/content/shop` | Get shop/tickets info |
| PUT | `/api/content/shop` | Update shop info |
| GET | `/api/content/discover` | Get discover region info |
| PUT | `/api/content/discover` | Update discover info |

### User Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress/{user_id}` | Get user progress |
| POST | `/api/progress/{user_id}/complete/{stop_id}` | Mark stop complete |
| POST | `/api/progress/{user_id}/reset` | Reset progress |

### Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/images/background` | Get background image |
| POST | `/api/images/background` | Upload background image |
| POST | `/api/images/tour-stop/{id}` | Upload stop image |

### Admin Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |

---

## Database Schema

### Collections

**tour_stops** (17 documents)
```json
{
  "id": "uuid",
  "stop_number": 1,
  "stop_name": "Welcome",
  "image_base64": "...",
  "content": {
    "sk": { "title": "Vitajte", "description": "..." },
    "en": { "title": "Welcome", "description": "..." }
  }
}
```

**tour_audio** (154 documents)
```json
{
  "id": "uuid",
  "stop_id": "uuid (references tour_stops.id)",
  "language": "en",
  "audio_base64": "base64 encoded MP3"
}
```

**partners** (4+ documents)
```json
{
  "id": "uuid",
  "name": "Restaurant Name",
  "category": "restaurant|hotel|shop|attraction|service",
  "description": "...",
  "address": "...",
  "phone": "...",
  "email": "...",
  "website": "...",
  "opening_hours": "...",
  "price_range": "EUR EUR",
  "rating": 4.5,
  "discount_text": "10% discount for app users",
  "is_active": true,
  "sort_order": 1
}
```

**referrals** (tracking deep link referrals)
```json
{
  "id": "uuid",
  "source_app": "audioguide|gastroflow",
  "target_app": "gastroflow|audioguide",
  "referral_type": "direct|referral|embed",
  "created_at": "2026-01-01T00:00:00"
}
```

**app_content** (travel_info, shop, discover)
**app_settings** (background image, global settings)
**user_progress** (completed stops per user)

---

## Deep Linking Architecture

### URL Schemes
- `audioguide://` - Audio guide app
- `gastroflow://` - GastroFlow restaurant app

### Link Types

| Type | URL | Description |
|------|-----|-------------|
| DIRECT | `gastroflow://restaurant/{id}` | Open restaurant in GastroFlow |
| REFERRAL | `audioguide://partner/{id}?ref=gastroflow` | Open partner with referral tracking |
| EMBED | WebView | Embedded content in app |

### Web Fallback
- `https://spisskyhrad.sk` (configure in admin)

---

## Revenue Projections

### AdMob (Banner Ads)
- **Estimated CPM:** $1-3 (Central European traffic)
- **Daily active users target:** 100-500
- **Monthly revenue estimate:** $3-45/month

### Partner Listings
- **Monthly fee per partner:** 20-50 EUR
- **Target partners:** 10-20 businesses
- **Monthly revenue estimate:** 200-1000 EUR/month

### GastroFlow Referrals
- **Commission per referral:** 5-15%
- **Monthly referrals target:** 50-200
- **Monthly revenue estimate:** 100-600 EUR/month

### Total Estimated Revenue
- **Conservative:** 300-500 EUR/month
- **Optimistic:** 1000-1600 EUR/month

---

## File Structure

```
spissky-hrad-export/
├── docker-compose.yml          # Docker orchestration
├── README.md                   # This file
├── backend/
│   ├── server.py               # FastAPI application
│   ├── Dockerfile              # Docker build
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment template
├── frontend/
│   ├── app/                    # Expo Router screens
│   │   ├── _layout.tsx         # Root layout + deep linking
│   │   ├── index.tsx           # Home page
│   │   ├── language-select.tsx # Language picker (9 langs)
│   │   ├── tour.tsx            # Tour stops list
│   │   ├── stop-detail.tsx     # Audio player + auto-advance
│   │   ├── partners.tsx        # Partner listings
│   │   ├── admin.tsx           # Admin panel (full CRUD)
│   │   ├── admin-content.tsx   # Content management
│   │   ├── admin-login.tsx     # Admin authentication
│   │   ├── settings.tsx        # App settings
│   │   ├── shop.tsx            # Tickets & shop
│   │   ├── travel-info.tsx     # Travel information
│   │   └── discover-region.tsx # Discover region
│   ├── store/                  # Zustand state management
│   │   ├── tourStore.ts        # Tour data store
│   │   ├── tourTypeStore.ts    # Tour filtering config
│   │   └── languageStore.ts    # Language preferences
│   ├── constants/
│   │   └── colors.ts           # Color scheme
│   ├── components/
│   │   └── BackgroundWrapper.tsx
│   ├── utils/
│   │   └── offlineCacheManager.ts
│   ├── app.json                # Expo configuration
│   ├── package.json            # Node dependencies
│   └── metro.config.js         # Metro bundler config
├── database/
│   ├── spissky_hrad.archive    # MongoDB dump (archive format)
│   ├── json_dump/              # JSON format dump
│   └── restore.sh              # Restore script
├── docker/
│   ├── nginx.conf              # Nginx reverse proxy
│   └── ssl/                    # SSL certificates (add yours)
└── media/
    └── audio/                  # Audio files directory
```

---

## Admin Panel Access

- **URL:** `http://YOUR_SERVER_IP/admin-login` (via mobile app)
- **Password:** `castle2025`
- **Tabs:**
  - **Prehlad** - Dashboard statistics (stops, audio files, languages, partners, referrals, users)
  - **Zastavky** - Edit tour stop names and descriptions (all 9 languages), delete/add stops
  - **Partneri** - Full partner CRUD (add, edit, toggle visibility, delete)
  - **QR Kody** - QR code generation per stop, individual download, A4 print sheet
  - **Obsah** - Content management (travel info, tickets, region info)
  - **Links** - Deep linking configuration and referral stats

### QR Code Feature
- Each tour stop gets a unique QR code with stop name and URL
- Individual QR codes downloadable as high-resolution PNG (up to 1000px)
- Full A4 print sheet with ALL QR codes - one-click download
- Print and place at physical tour stop locations on the castle
- Visitors scan with smartphone camera to access audio guide

---

## Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#4A90D9` | Buttons, links, badges |
| Secondary Purple | `#7B68EE` | Gradients, accents |
| Gold Accent | `#E8B923` | UNESCO badge, highlights |
| Dark Background | `#1a1a2e` | App background |
| Darker Background | `#0f0f1a` | Deep sections |
| Card Background | `#252542` | Content cards |

---

## Notes

1. **Audio Format:** All audio is stored as base64 in MongoDB (tour_audio collection). Can also be served as MP3 files from `/api/uploads/audio/` directory.

2. **Tour Stop Filtering:** The free app shows 8 stops (1, 2, 4, 6, 8, 11, 12 + Legend 3). This is configured in `frontend/store/tourTypeStore.ts`. Edit `TOUR_NUMBERS` and `LEGEND_INDEXES` to change which stops appear.

3. **Language Support:** 9 languages configured. Audio must exist in `tour_audio` collection for each language/stop combination to work.

4. **Cleartext Traffic:** Android `usesCleartextTraffic: true` is enabled in app.json for HTTP backend communication. For production, set up HTTPS with SSL certificates.

5. **Deep Linking:** URL scheme `audioguide://` is registered in app.json. GastroFlow integration requires the GastroFlow app to implement the `gastroflow://` scheme on their end.

6. **Admin Password:** Hardcoded in `frontend/app/admin-login.tsx`. Change before production deployment.

---

**Built with:** Expo (React Native) + FastAPI + MongoDB  
**Version:** 2.0  
**Last Updated:** March 2026
