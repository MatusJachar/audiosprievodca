# 📱 Complete Guide: From GitHub to Android APK

## Part 1: Download Project to Your PC

### Step 1.1: Install Git (if not installed)
**Windows:**
- Download from: https://git-scm.com/download/windows
- Run installer, keep default settings

**Mac:**
- Open Terminal and run: `xcode-select --install`
- Or download from: https://git-scm.com/download/mac

### Step 1.2: Clone Your Project

Open Terminal (Mac) or Command Prompt/PowerShell (Windows):

```bash
# Navigate to where you want to save the project
cd Desktop

# Clone your repository (replace with your actual GitHub URL)
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Enter the project folder
cd YOUR-REPO-NAME
```

### Step 1.3: Verify Files
You should see:
```
YOUR-REPO-NAME/
├── frontend/          ← React Native/Expo app
│   ├── app/          ← All screens
│   ├── app.json      ← App configuration
│   ├── eas.json      ← EAS build config
│   └── package.json  ← Dependencies
├── backend/           ← FastAPI server
│   ├── server.py
│   └── requirements.txt
└── README.md
```

---

## Part 2: Setup Local Environment

### Step 2.1: Install Node.js
- Download from: https://nodejs.org/ (LTS version)
- Run installer
- Verify: `node --version` (should show v18+ or v20+)

### Step 2.2: Install EAS CLI

```bash
npm install -g eas-cli
```

Verify: `eas --version`

### Step 2.3: Create Expo Account (if needed)
- Go to: https://expo.dev/signup
- Create free account
- Remember your username and password

### Step 2.4: Login to EAS

```bash
eas login
```

Enter your Expo credentials when prompted.

---

## Part 3: Build Android APK

### Step 3.1: Navigate to Frontend

```bash
cd frontend
```

### Step 3.2: Install Dependencies

```bash
npm install
```

Wait for all packages to install (~2-5 minutes).

### Step 3.3: Configure EAS Project

```bash
eas build:configure
```

This will:
- Ask if you want to create a new project (say Yes)
- Link to your Expo account
- Update app.json with your project ID

### Step 3.4: Start the Build

```bash
eas build --platform android --profile preview
```

You'll see:
```
✔ Using remote Android credentials (Expo server)

Build started: https://expo.dev/accounts/YOUR-USERNAME/projects/...

Waiting for build to complete...
```

### Step 3.5: Wait for Build (~15-20 minutes)

The build happens on Expo's cloud servers. You can:
- Watch progress in terminal
- Or visit the URL shown to see detailed progress

### Step 3.6: Download APK

When complete, you'll see:
```
✔ Build finished
🤖 Android build: https://expo.dev/artifacts/eas/...apk

Install and run the Android build on a device:
  - Download: https://expo.dev/artifacts/eas/...apk
```

Click the link to download your APK file!

### Step 3.7: Install on Android Phone

**Option A: Direct download on phone**
- Open the download link on your Android phone
- Download and install

**Option B: Transfer from PC**
1. Connect phone via USB
2. Copy APK to phone
3. Open file manager on phone
4. Tap APK to install

**Note:** You may need to enable "Install from unknown sources":
- Settings → Security → Unknown sources → Enable

---

## Part 4: Backend Deployment Options

### Option A: Keep Using Emergent URL (Easiest - Current Setup)

**Pros:**
- No changes needed
- Works immediately
- Free while using Emergent

**Cons:**
- Depends on Emergent session being active
- URL may change if session expires
- Not suitable for production/Play Store

**Current URL:**
```
https://castleaudio.preview.emergentagent.com
```

---

### Option B: Deploy to Railway (Recommended for Production)

**Cost:** Free tier available, ~$5/month for production

**Steps:**

1. **Create Railway Account**
   - Go to: https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Backend Service**
   - Select the `backend` folder
   - Railway auto-detects Python/FastAPI

4. **Add MongoDB Database**
   - In Railway, click "New" → "Database" → "MongoDB"
   - Copy the connection string

5. **Set Environment Variables**
   ```
   MONGO_URL=mongodb://... (from step 4)
   DB_NAME=spis_castle
   ```

6. **Get Your Production URL**
   Railway gives you: `https://your-app.railway.app`

7. **Update App & Rebuild**
   ```bash
   # Edit frontend/.env
   EXPO_PUBLIC_BACKEND_URL=https://your-app.railway.app
   
   # Rebuild APK
   eas build --platform android --profile preview
   ```

---

### Option C: Deploy to Render (Alternative)

**Cost:** Free tier available

**Steps:**

1. **Create Render Account**
   - Go to: https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - New → Web Service
   - Connect your GitHub repo
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

3. **Add MongoDB Atlas**
   - Go to: https://www.mongodb.com/atlas
   - Create free cluster
   - Get connection string

4. **Set Environment Variables in Render**
   ```
   MONGO_URL=mongodb+srv://...
   DB_NAME=spis_castle
   ```

5. **Get Production URL**
   Render gives you: `https://your-app.onrender.com`

---

### Option D: Deploy to Vercel + MongoDB Atlas

**Cost:** Free tier available

Similar to above but using Vercel for the backend.

---

## Part 5: Migrate Database (If Changing Backend)

When moving to production, you need to migrate your data:

### Export from Current Database
```python
# Run this script to export tour data
import json
from pymongo import MongoClient

# Connect to current database
client = MongoClient("mongodb://localhost:27017")
db = client.test_database

# Export tour stops
stops = list(db.tour_stops.find())
with open("tour_stops.json", "w") as f:
    json.dump(stops, f, default=str)

# Export audio
audio = list(db.tour_audio.find())
with open("tour_audio.json", "w") as f:
    json.dump(audio, f, default=str)
```

### Import to New Database
```python
# Run this to import data
import json
from pymongo import MongoClient

# Connect to new database
client = MongoClient("mongodb+srv://YOUR-NEW-URL")
db = client.spis_castle

# Import data
with open("tour_stops.json") as f:
    stops = json.load(f)
    db.tour_stops.insert_many(stops)

with open("tour_audio.json") as f:
    audio = json.load(f)
    db.tour_audio.insert_many(audio)
```

---

## Quick Reference Commands

```bash
# Clone project
git clone https://github.com/USER/REPO.git

# Setup
cd REPO/frontend
npm install
npm install -g eas-cli
eas login

# Build APK (for testing)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production

# Check build status
eas build:list

# Update code and rebuild
git pull
npm install
eas build --platform android --profile preview
```

---

## Troubleshooting

### "eas: command not found"
```bash
npm install -g eas-cli
```

### "Not logged in"
```bash
eas login
```

### "Project not found"
```bash
eas build:configure
```

### Build fails
- Check internet connection
- Try `npm install` again
- Check Expo dashboard for error details

### APK won't install
- Enable "Unknown sources" in phone settings
- Check phone has enough storage (100MB+)

---

## Summary: Your Path to Play Store

1. ✅ Download from GitHub
2. ✅ Install Node.js + EAS CLI
3. ✅ Build APK for testing
4. ⬜ Test on your device
5. ⬜ Deploy backend to production (Railway/Render)
6. ⬜ Rebuild with production URL
7. ⬜ Build AAB for Play Store
8. ⬜ Submit to Google Play

---

*Good luck with your build! 🚀*
