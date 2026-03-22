# Spišský hrad - Audio Tour Application

## Complete Export Package for Hetzner Deployment

This package contains everything needed to deploy the Spišský hrad Audio Tour application on your own server.

---

## 📦 Package Contents

```
spissky-hrad-export/
├── docker-compose.yml      # One-command deployment
├── docker/
│   └── nginx.conf          # Reverse proxy configuration
├── backend/
│   ├── server.py           # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container
│   └── .env.example        # Environment template
├── frontend/
│   ├── app/                # React Native screens
│   ├── assets/             # Images, fonts
│   ├── store/              # State management
│   ├── app.json            # Expo configuration
│   ├── eas.json            # EAS build config
│   └── package.json        # Node dependencies
├── database/
│   ├── dump/               # MongoDB backup (154 audio files, 17 stops)
│   └── restore.sh          # Database restore script
└── README.md               # This file
```

---

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- 2GB+ RAM available
- 1GB+ disk space

### Deployment

```bash
# 1. Clone or extract the package
cd spissky-hrad-export

# 2. Start all services
docker-compose up -d

# 3. Wait for services to initialize (about 30 seconds)
docker-compose logs -f

# 4. Test the API
curl http://localhost:8001/api/tour-stops
```

The backend API will be available at:
- **Direct:** http://localhost:8001/api/
- **Via Nginx:** http://localhost/api/

---

## 📱 Mobile App Build (EAS)

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli eas-cli`
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

Before building, update `frontend/.env`:
```
EXPO_PUBLIC_BACKEND_URL=https://your-server.com
```

---

## 🗄️ Database

### Collections
| Collection | Documents | Description |
|------------|-----------|-------------|
| tour_stops | 17 | Tour stop metadata & translations |
| tour_audio | 154 | Audio files (9 languages × 17 stops) |
| app_settings | 1 | Background image, site settings |
| user_progress | 1 | User progress tracking |

### Manual Restore (if needed)

```bash
# Enter MongoDB container
docker exec -it spissky-hrad-mongodb bash

# Restore database
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

### Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tour-stops/{id}/description` | PUT | Update description |
| `/api/tour-stops/{id}/image` | POST | Upload stop image |
| `/api/tour-stops/{id}/audio/{language}` | POST | Upload audio |

---

## 🌍 Languages Supported

| Code | Language | Native Name |
|------|----------|-------------|
| sk | Slovak | Slovenčina |
| en | English | English |
| de | German | Deutsch |
| pl | Polish | Polski |
| hu | Hungarian | Magyar |
| ru | Russian | Русский |
| es | Spanish | Español |
| zh | Chinese | 中文 |
| fr | French | Français |

---

## 🏰 Tour Stops (Express+ Tour)

| Stop | Name |
|------|------|
| 1 | Welcome / Vitajte |
| 2 | In Front of Castle Photography |
| 3 | At the Castle Model |
| 4 | In the Kitchen |
| 6 | On the Romanesque Forecourt |
| 7 | On the Upper Terrace |
| 8 | Lower Courtyard |
| 11 | Tower |
| 12 | Romanesque Palace |
| L3 | The Ghost of Spiš Castle (Legend) |

---

## 💰 Monetization Ready

### Google AdMob
The app is prepared for AdMob integration:
1. Create AdMob account at https://admob.google.com
2. Add app and get App ID
3. Update `app.json` with AdMob config
4. Install: `npx expo install react-native-google-mobile-ads`

### Local Business Partners
Backend supports partner CRUD:
- `/api/admin/partners` - Partner management
- Categories: restaurant, hotel, shop, transport, attraction

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
MONGO_URL=mongodb://mongodb:27017
DB_NAME=spis_castle_db
```

**Frontend (.env)**
```
EXPO_PUBLIC_BACKEND_URL=https://your-domain.com
```

### SSL/HTTPS (Production)

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place in `docker/ssl/`
3. Uncomment HTTPS section in `nginx.conf`
4. Restart nginx: `docker-compose restart nginx`

---

## 📊 Revenue Projections

### Assumptions
- 50,000 castle visitors/year
- 5% app adoption rate = 2,500 users
- Mix of free (ads) and premium features

### Potential Revenue Streams
| Source | Annual Estimate |
|--------|-----------------|
| AdMob (€0.50 CPM) | €500-1,000 |
| Local Partner Listings | €1,000-2,000 |
| Premium Features (future) | €2,000-5,000 |
| **Total Potential** | **€3,500-8,000** |

---

## 🆘 Troubleshooting

### MongoDB won't start
```bash
docker-compose logs mongodb
# Check disk space
df -h
```

### Backend errors
```bash
docker-compose logs backend
# Restart backend
docker-compose restart backend
```

### Audio not playing
- Check browser console for CORS errors
- Verify `/api/audio/stream/{id}/{lang}` returns audio
- Check MongoDB tour_audio collection has data

---

## 📞 Support

For technical support or customization requests:
- GitHub Issues: [your-repo]/issues
- Email: support@example.com

---

## 📄 License

This project is proprietary software. All rights reserved.
Audio content © Spišský hrad / Slovak National Heritage Board.

---

**Version:** 1.0.0  
**Last Updated:** March 2026  
**Export Date:** $(date)
