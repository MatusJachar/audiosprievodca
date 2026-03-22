# Spišský hrad - Audio Tour Application

## Complete Export Package for Hetzner Deployment

This package contains everything needed to deploy the Spišský hrad Audio Tour application.

---

## 📦 Package Contents

```
spissky-hrad-export/
├── docker-compose.yml         # One-command deployment
├── docker/
│   └── nginx.conf             # Reverse proxy configuration
├── backend/
│   ├── server.py              # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend container
│   └── .env.example           # Environment template
├── frontend/                  # Complete Expo React Native app
│   ├── app/                   # All screens
│   ├── assets/                # Images, logo
│   ├── store/                 # State management
│   ├── app.json               # Expo configuration
│   └── package.json           # Dependencies
├── database/
│   ├── dump/                  # MongoDB backup
│   │   └── test_database/     # 154 audio files, 17 stops
│   └── restore.sh             # Database restore script
└── README.md                  # This file
```

---

## 🏰 Tour Configuration

### Tour Stops (8 total)
| # | Stop Name |
|---|-----------|
| 1 | Welcome / Vitajte |
| 2 | In Front of the Castle Photography |
| 4 | In the Kitchen |
| 6 | On the Romanesque Forecourt |
| 8 | Lower Courtyard |
| 11 | Tower |
| 12 | Romanesque Palace |
| L3 | 👻 The Ghost of Spiš Castle (Legend) |

### Languages (9 total)
| Code | Language | Flag |
|------|----------|------|
| sk | Slovak | 🇸🇰 |
| en | English | 🇬🇧 |
| de | German | 🇩🇪 |
| pl | Polish | 🇵🇱 |
| hu | Hungarian | 🇭🇺 |
| ru | Russian | 🇷🇺 |
| es | Spanish | 🇪🇸 |
| zh | Chinese | 🇨🇳 |
| fr | French | 🇫🇷 |

---

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- 2GB+ RAM available
- 1GB+ disk space

### Deployment

```bash
# 1. Extract the package
unzip spissky-hrad-export.zip
cd export

# 2. Start all services
docker-compose up -d

# 3. Wait for services to initialize (~30 seconds)
docker-compose logs -f

# 4. Test the API
curl http://localhost:8001/api/tour-stops
```

**API available at:** http://localhost:8001/api/

---

## 📱 Mobile App Build (EAS)

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g eas-cli`
- Expo account: https://expo.dev

### Build Commands

```bash
cd frontend

# Install dependencies
yarn install

# Login to Expo
eas login

# Build Android APK (testing)
eas build --platform android --profile preview

# Build Android AAB (Google Play)
eas build --platform android --profile production

# Build iOS (App Store)
eas build --platform ios --profile production
```

### Configure API URL
Update `frontend/.env` before building:
```
EXPO_PUBLIC_BACKEND_URL=https://your-server.com
```

---

## 🗄️ Database

### Collections
| Collection | Documents | Description |
|------------|-----------|-------------|
| tour_stops | 17 | Tour stop metadata & 9-language translations |
| tour_audio | 154 | Audio files (17 stops × 9 languages) |
| app_settings | 1 | Background image, site settings |
| user_progress | 1 | User progress tracking |

### Audio Files
- **Total:** 154 MP3 files
- **Formula:** 17 stops × 9 languages = 153 (+ 1 extra)
- **Displayed:** 8 stops (7 numbered + 1 legend)
- **Languages:** sk, en, de, pl, hu, ru, es, zh, fr

### Manual Restore
```bash
docker exec -it spissky-hrad-mongodb bash
mongorestore --db spis_castle_db /dump/test_database --drop
```

---

## 🔌 API Endpoints

### Tour Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tour-stops` | GET | Get all tour stops |
| `/api/tour-stops/{id}` | GET | Get single stop |
| `/api/audio/stream/{stop_id}/{language}` | GET | Stream audio |

### Content Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content/shop` | GET/PUT | Shop page content |
| `/api/content/travel-info` | GET/PUT | Travel info content |
| `/api/content/discover` | GET/PUT | Discover page content |

### Images
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images/background` | GET/POST | Background image |

### Admin Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tour-stops/{id}/description` | PUT | Update stop description |
| `/api/tour-stops/{id}/image` | POST | Upload stop image |
| `/api/tour-stops/{id}/audio/{lang}` | POST | Upload audio file |

---

## 🎨 App Features

### Color Scheme
- **Primary:** #4A90D9 (Royal Blue)
- **Secondary:** #7B68EE (Slate Blue)
- **Accent:** #E8B923 (Gold)
- **Background:** #1a1a2e (Dark Blue)

### Key Features
- ✅ **9 Language Support** with emoji flags
- ✅ **8 Audio Tour Stops** (7 + 1 legend)
- ✅ **Offline Mode** - Download all audio for offline use
- ✅ **Auto-Advance** - Automatic navigation to next stop after audio completes
- ✅ **Next Stop Button** - Manual navigation to next stop
- ✅ **Admin Panel** - Edit content, upload audio/images
- ✅ **Blue Professional Theme** - Consistent across all screens

### Admin Panel Access
- **Password:** castle2025
- **Access:** Tap gear icon on home page

---

## 💰 Revenue Projections

### Assumptions
- 50,000 castle visitors/year
- 5% app adoption = 2,500 users
- Mix of free (ads) and premium features

### Potential Revenue Streams
| Source | Annual Estimate |
|--------|-----------------|
| AdMob Ads | €500-1,000 |
| Local Partner Listings | €1,000-2,000 |
| Premium Features | €2,000-5,000 |
| **Total Potential** | **€3,500-8,000** |

---

## 🔧 Configuration

### Backend Environment (.env)
```
MONGO_URL=mongodb://mongodb:27017
DB_NAME=spis_castle_db
```

### Frontend Environment (.env)
```
EXPO_PUBLIC_BACKEND_URL=https://your-domain.com
```

---

## 🆘 Troubleshooting

### MongoDB Issues
```bash
docker-compose logs mongodb
df -h  # Check disk space
```

### Backend Errors
```bash
docker-compose logs backend
docker-compose restart backend
```

### Audio Not Playing
1. Check browser console for CORS errors
2. Verify audio endpoint: `curl http://localhost:8001/api/audio/stream/{stop_id}/sk`
3. Check MongoDB: `tour_audio` collection has data

---

## 📄 License

Proprietary software. All rights reserved.
Audio content © Spišský hrad / Slovak National Heritage Board.

---

**App Name:** Spišský hrad  
**Package ID:** com.spisskygrad.freetour  
**Version:** 1.0.0  
**Export Date:** March 2026
