# OtakuPlay Setup Guide

## Prerequisites
- **Node.js** 20+ & **npm** 10+
- **MongoDB Atlas** cluster (or local MongoDB 7+)
- **Redis** (optional — in-memory cache fallback is built in)
- **Flutter SDK** 3.24+ (stable) & **Android SDK** (API 35, JDK 17)

## 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, GOOGLE_CLIENT_ID
npm install
npm run migrate
npm run dev
```

## 2. Admin Dashboard Setup
```bash
cd admin
cp .env.example .env.local
npm install
npm run dev
```

## 3. Flutter Mobile App Setup
```bash
cd mobile
cp .env.example .env
flutter pub get
flutter test
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.otakuplay.app/api/v1 \
  --dart-define=SOCKET_URL=https://api.otakuplay.app \
  --dart-define=GOOGLE_SERVER_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```
