# Spiš Castle Express Tour - New Simplified App

## Overview
This is a simplified FREE version of the Spiš Castle Audio Tour app.

## Tour Stops Included
Based on Express Tour + stops 4 and 6:
- Stop 1: Welcome
- Stop 2: In Front of the Castle Photography  
- Stop 3: Romanesque Palace / Model / Kitchen
- Stop 4: (Additional stop)
- Stop 6: (Additional stop)
- Stop 7: Chapel
- Stop 8: Upper Courtyard / Cistern / Bergfried Tower
- Stop 11: Lion's Courtyard (Levie nádvorie)
- Stop 12: Gallery of Ancestors
- Legend L3: (Included legend)

## Languages (Same as main app)
- English (en)
- Slovak (sk)
- German (de)
- Polish (pl)
- Hungarian (hu)
- Russian (ru)
- Spanish (es)
- Chinese (zh)
- French (fr)

## Features
- All content editable from Admin panel
- Background photo editable
- Tour stop descriptions editable
- Audio files manageable
- Offline support

## How to Create This App

### Option 1: Fork Current Project
1. Copy the entire `/app/frontend` folder
2. Modify the tour stops data to include only: 1,2,3,4,6,7,8,11,12 + L3
3. Update app.json with new package name
4. Build with EAS

### Option 2: Export Data and Create Fresh
1. Export tour stops 1,2,3,4,6,7,8,11,12 + L3 from MongoDB
2. Create new Expo project
3. Import only the needed stops
4. Build and deploy

## Data to Export from Current App

### MongoDB Collections to Copy:
- `tour_stops` - Filter for stop_numbers: [1,2,3,4,6,7,8,11,12] and stop_name: "L3"
- `tour_audio` - Filter for same stops
- `app_settings` - Copy background image

### API Endpoints Needed:
- GET /api/tour-stops (filtered)
- GET /api/audio/stream/{stop_id}/{language}
- GET/POST /api/images/background
- GET/PUT /api/content/* (for editable content)

## Package Names (Must be different from main app)
- iOS: `com.spiscastle.expresstour`
- Android: `com.spiscastle.expresstour`

## App Name
"Spiš Castle Express Tour" or "Spiš Castle Free Tour"
