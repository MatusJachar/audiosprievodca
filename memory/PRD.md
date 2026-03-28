# Product Requirements Document - Spissky Hrad Audio Guide

## App Identity
- **Name:** Spissky hrad
- **Subtitle:** Audiosprievodca
- **Package ID:** com.spiscastle.freetour
- **URL Scheme:** audioguide://

## Features Implemented

### Core Tour (v2.0)
- 8 tour stops (1, 2, 4, 6, 8, 11, 12 + Legend 3)
- 9 languages (SK, EN, DE, PL, HU, RU, ES, ZH, FR)
- Audio player with auto-advance + Next Stop button
- Progress tracking per user
- Offline download capability
- UNESCO Heritage branding

### Monetization
- Local Business Partners CRUD (4 seeded partners)
- Partner categories: restaurant, hotel, shop, attraction, service
- Rating system, discount banners, contact buttons (call, email, web)
- GastroFlow Deep Linking with referral tracking

### Admin Panel
- Dashboard statistics (stops, audio files, languages, partners, referrals, users)
- Tour stop editing (name, description in all 9 languages)
- Partner management (add, edit, toggle, delete)
- Content management (travel info, shop/tickets, discover region)
- Deep linking configuration

### Deep Linking
- `audioguide://` URL scheme
- `gastroflow://` integration
- Referral tracking (direct, referral, embed types)
- Nearby restaurants API

## Color Scheme
- Primary: #4A90D9 (blue)
- Secondary: #7B68EE (purple)
- Accent: #E8B923 (gold)

## Tech Stack
- Frontend: Expo (React Native) with expo-router
- Backend: FastAPI (Python)
- Database: MongoDB
- State: Zustand
