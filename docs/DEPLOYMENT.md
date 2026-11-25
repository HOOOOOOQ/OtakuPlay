# OtakuPlay Deployment Guide

## Backend Deployment (Railway / Render / Fly.io / VPS)
1. Provision MongoDB Atlas with least-privilege database user and IP allowlist.
2. Configure environment variables from `backend/.env.example`.
3. Build & migrate:
   ```bash
   cd backend
   npm ci
   npm run build
   npm run migrate
   npm start
   ```
4. Serve behind HTTPS reverse proxy (Nginx/Caddy/Cloudflare) supporting WebSocket upgrades for Socket.IO.

## Admin Dashboard Deployment (Vercel)
1. Import repository in Vercel with Root Directory set to `admin`.
2. Set `BACKEND_INTERNAL_URL` and `NEXT_PUBLIC_API_BASE_URL=/api/v1`.
3. Deploy via `next build`.

## Android Release Build
1. Create a release keystore and configure `mobile/android/key.properties` (never commit keystore or properties).
2. Run:
   ```bash
   cd mobile
   flutter pub get
   flutter analyze
   flutter test
   flutter build apk --release \
     --dart-define=API_BASE_URL=https://api.yourdomain.com/api/v1 \
     --dart-define=SOCKET_URL=https://api.yourdomain.com \
     --dart-define=GOOGLE_SERVER_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
3. Output APK: `mobile/build/app/outputs/flutter-apk/app-release.apk`.
