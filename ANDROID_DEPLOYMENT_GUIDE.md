# 🚀 Spiš Castle Audio Tour - Android Deployment Guide

## Prerequisites

Before you begin, make sure you have:

1. **Expo Account** - Create free at https://expo.dev
2. **EAS CLI** installed globally
3. **Google Play Developer Account** ($25 one-time) - For publishing to Play Store

---

## Step 1: Install EAS CLI

Open your terminal and run:

```bash
npm install -g eas-cli
```

---

## Step 2: Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

---

## Step 3: Download the Project

Download the project files from this platform to your local computer.

The project structure should look like:
```
spis-castle-tour/
├── frontend/
│   ├── app/
│   ├── app.json
│   ├── eas.json
│   └── package.json
└── backend/
    └── server.py
```

---

## Step 4: Configure Your Project

Navigate to the frontend folder:

```bash
cd frontend
```

Initialize EAS for your project:

```bash
eas build:configure
```

This will:
- Create/update your `eas.json`
- Link to your Expo account
- Generate a unique project ID

---

## Step 5: Update app.json

Edit `app.json` and replace `"your-expo-project-id"` with the project ID from Step 4:

```json
"extra": {
  "eas": {
    "projectId": "YOUR-ACTUAL-PROJECT-ID"
  }
}
```

---

## Step 6: Build Android APK (For Testing)

To create an APK file for testing on your device:

```bash
eas build --platform android --profile preview
```

**Build time:** ~15-20 minutes

After completion, you'll get a download link for the APK file.

---

## Step 7: Install APK on Your Device

1. Download the APK from the provided link
2. Transfer to your Android phone
3. Enable "Install from unknown sources" in Settings
4. Open and install the APK

---

## Step 8: Build for Google Play Store (Production)

When ready for production:

```bash
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) file for Play Store submission.

---

## Step 9: Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create a new app
3. Fill in store listing details:
   - App name: Spiš Castle Audio Tour
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (at least 2)
   - Feature graphic (1024x500)
   - App icon (512x512)
4. Upload the AAB file
5. Set pricing (Free or Paid)
6. Submit for review

---

## Required Store Assets

### Screenshots Needed:
- Phone: 1080x1920 or similar (at least 2)
- Tablet: 1200x1920 (optional)

### Graphics:
- App Icon: 512x512 PNG
- Feature Graphic: 1024x500 PNG

### Text:
- Title: Spiš Castle Audio Tour (max 30 chars)
- Short Description: (max 80 chars)
- Full Description: (max 4000 chars)

---

## Quick Commands Reference

```bash
# Login to Expo
eas login

# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Check build status
eas build:list

# Submit to Play Store (requires setup)
eas submit --platform android
```

---

## Backend Deployment Note

The app currently connects to: `https://spis-free-tour.preview.emergentagent.com`

For production, you'll need to:
1. Deploy the backend to a production server
2. Update the `EXPO_PUBLIC_BACKEND_URL` in the app
3. Rebuild the app with the new URL

---

## Troubleshooting

### Build fails with "Project not found"
- Run `eas build:configure` again
- Make sure project ID is set in app.json

### APK won't install
- Enable "Install from unknown sources"
- Check if phone has enough storage

### App crashes on start
- Check backend URL is accessible
- Ensure all API endpoints are working

---

## Support

For issues with:
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Play Store**: https://support.google.com/googleplay/android-developer

---

*Last updated: January 2026*
