# Spiš Castle Audio Tour - Deployment Guide

## Quick Start Commands

### For Android APK (Direct Install)
```bash
cd frontend
npx eas build --platform android --profile preview
```

### For Android App Bundle (Google Play Store)
```bash
cd frontend
npx eas build --platform android --profile production
```

### For iOS (App Store)
```bash
cd frontend
npx eas build --platform ios --profile production
```

---

## Pre-Deployment Checklist

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure Project ID
Edit `app.json` and replace `"projectId": "your-expo-project-id"` with your actual Expo project ID.

Get your project ID:
```bash
eas init
```

---

## Android Deployment

### Option A: APK for Direct Distribution
Best for: Testing, beta users, direct download from website

```bash
eas build --platform android --profile preview
```

Output: `.apk` file you can share directly

### Option B: App Bundle for Google Play
Best for: Google Play Store submission

```bash
eas build --platform android --profile production
```

Output: `.aab` file for Play Store

### Google Play Store Submission
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Upload the `.aab` file
4. Fill in store listing (title, description, screenshots)
5. Set up pricing (free or paid)
6. Submit for review

---

## iOS Deployment

### Prerequisites
- Apple Developer Account ($99/year)
- App Store Connect access

### Build Command
```bash
eas build --platform ios --profile production
```

### App Store Submission
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app
3. The build will appear automatically after EAS uploads it
4. Fill in app information
5. Submit for review

---

## Configuration Files

### app.json - Key Settings
```json
{
  "expo": {
    "name": "Spiš Castle Audio Tour",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.spiscastle.audiotour"
    },
    "android": {
      "package": "com.spiscastle.audiotour"
    }
  }
}
```

### eas.json - Build Profiles
- `development` - For testing with Expo Go
- `preview` - APK for direct sharing
- `production` - For app stores

---

## Backend Deployment

The backend (FastAPI + MongoDB) needs to be deployed separately.

### Recommended Hosting Options:
1. **Railway** - Easy Python hosting
2. **Render** - Free tier available
3. **DigitalOcean** - App Platform
4. **AWS** - EC2 or Elastic Beanstalk

### Environment Variables for Production
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
DB_NAME=spis_castle_production
```

### Update Frontend API URL
Before building, update `/app/frontend/.env`:
```
EXPO_PUBLIC_BACKEND_URL=https://your-production-backend.com
```

---

## App Store Listing Suggestions

### Title
Spiš Castle Audio Tour

### Short Description
Explore Europe's largest castle ruins with professional audio guides in 9 languages.

### Full Description
Discover Spiš Castle, a UNESCO World Heritage Site, with this comprehensive audio tour app.

Features:
- Professional narration for all 13 tour stops
- Available in 9 languages: English, Slovak, German, Polish, Hungarian, Russian, Spanish, Chinese, French
- Works offline - download all audio before your visit
- Three tour types: Express (30 min), Family (45 min), Complete (90 min)
- Historical legends and stories
- Easy navigation between stops

Perfect for visitors who want to explore at their own pace without a human guide.

### Keywords
castle, audio tour, Slovakia, UNESCO, Spiš, history, travel, guide

---

## Version History

### v1.0.0
- Initial release
- 13 tour stops + legends
- 9 languages
- Offline audio support
- Three tour types
