# Spiš Castle Free Tour (Express+)

## Overview
This is a **FREE** simplified version of the Spiš Castle Audio Tour app.
Single tour with 10 stops: the Express tour enhanced with stops 4 and 6.

## Tour Stops Included (10 total)
| Stop # | Name |
|--------|------|
| 1 | Welcome |
| 2 | In Front of the Castle Photography |
| 3 | At the Castle Model |
| 4 | In the Kitchen |
| 6 | On the Romanesque Forecourt |
| 7 | On the Upper Terrace |
| 8 | Lower Courtyard |
| 11 | Tower |
| 12 | Romanesque Palace |
| L3 | The Ghost of Spiš Castle (Legend) |

## Languages (9 total)
- English (en)
- Slovak (sk)
- German (de)
- Polish (pl)
- Hungarian (hu)
- Russian (ru)
- Spanish (es)
- Chinese (zh)
- French (fr)

## Key Differences from Main App
1. **Single tour only** - No tour type selection (Express/Family/Complete)
2. **Free** - Intended for free distribution
3. **10 stops** instead of 13
4. **Same admin panel** - All content editable

## App Store Info
- **App Name**: Spiš Castle Free Tour
- **iOS Bundle ID**: `com.spiscastle.freetour`
- **Android Package**: `com.spiscastle.freetour`

## Project Structure
```
spis-express-tour/
├── frontend/           # Expo React Native app
│   ├── app/           # Screens
│   │   ├── index.tsx          # Home (modified title)
│   │   ├── language-select.tsx # Language selection
│   │   ├── tour.tsx           # Tour list (filtered to 10 stops)
│   │   ├── stop-detail.tsx    # Audio player
│   │   ├── admin.tsx          # Admin panel
│   │   └── admin-content.tsx  # Content editor
│   ├── store/
│   │   └── tourTypeStore.ts   # Simplified (single tour)
│   ├── app.json       # New bundle IDs
│   └── eas.json       # Build config
├── backend/           # FastAPI backend (same as main)
│   └── server.py
└── README.md
```

## Build Commands
```bash
cd frontend

# Android APK (direct install)
npx eas build --platform android --profile preview

# Android AAB (Google Play)
npx eas build --platform android --profile production

# iOS (App Store)
npx eas build --platform ios --profile production
```

## Backend Deployment
The backend is identical to the main app. You can:
1. Share the same backend server (same database)
2. Deploy separate backend with copied data for stops 1,2,3,4,6,7,8,11,12 + L3

## Files Changed from Main App
1. `frontend/app.json` - New app name, bundle ID, package name
2. `frontend/store/tourTypeStore.ts` - Simplified to single tour
3. `frontend/app/index.tsx` - Changed subtitle, tour stop count
4. `frontend/app/tour.tsx` - Simplified filtering logic
5. `frontend/app/language-select.tsx` - Goes directly to tour (no tour-select)
6. Deleted `frontend/app/tour-select.tsx` - Not needed
