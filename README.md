# OtakuPlay

> **Your Anime. Your Community. Your Universe.**

OtakuPlay adalah platform hiburan anime dan komunitas penggemar anime yang menggabungkan katalog & pemutar anime, jejaring sosial komunitas bergaya modern, real-time chat, sistem XP/level/leaderboard, asisten Otaku AI, berita Kompas, utilitas TikTok, serta Admin Command Center berbasis RBAC.

## Struktur Monorepo

```text
OtakuPlay/
├── mobile/          # Aplikasi Android Flutter + Riverpod + GoRouter + Dio + Socket.IO
├── backend/         # REST API + Socket.IO + 21 Mongoose Models + Zod + Pino + JWT/Google OAuth
├── admin/           # Admin Dashboard Next.js + TypeScript + Tailwind + Recharts
├── docs/            # SETUP.md, API.md, DATABASE.md, DEPLOYMENT.md
└── .github/         # CI/CD workflows (Backend test, Admin build, Flutter APK release)
```

## Dokumentasi Lengkap
- [Setup Guide](docs/SETUP.md)
- [REST & Socket API Reference](docs/API.md)
- [MongoDB Database Design](docs/DATABASE.md)
- [Deployment & Release](docs/DEPLOYMENT.md)
