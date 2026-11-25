# OtakuPlay REST & Socket.IO API Reference

Base prefix: `/api/v1`

## Health
- `GET /health` — Service & MongoDB connection health.

## Auth (`/api/v1/auth`)
- `POST /auth/google` — Verify Google ID token (`google-auth-library`), auto-create account, issue JWT + rotating refresh token.
- `POST /auth/register` — Email/username registration with bcryptjs (cost 12).
- `POST /auth/login` — Email/username + password login.
- `POST /auth/refresh` — Refresh token rotation with reuse detection.
- `POST /auth/logout` — Revoke current session & refresh token.
- `POST /auth/logout-all` — Revoke all sessions across all devices.
- `GET /auth/sessions` — List active sessions.
- `POST /auth/forgot-password` / `POST /auth/reset-password`
- `POST /auth/change-password`
- `POST /auth/change-email/request` / `POST /auth/change-email/verify`

## Users & Verification (`/api/v1/users`, `/api/v1/verification`)
- `GET /users/me` / `PATCH /users/me` / `DELETE /users/me`
- `GET /users/search` / `GET /users/:username`
- `POST /users/:id/follow` / `DELETE /users/:id/follow`
- `POST /users/:id/block` / `DELETE /users/:id/block` / `POST /users/:id/mute`
- `POST /verification/request` / `GET /verification/status`

## Anime (`/api/v1/anime`)
- `GET /anime/search?q=...`
- `GET /anime/details?url=...`
- `GET /anime/ongoing?page=1`
- `GET /anime/completed?page=1`
- `GET /anime/popular?page=1`
- `GET /anime/schedule`
- `GET /anime/stream?url=...`
- `GET /anime/bookmarks` / `POST /anime/bookmarks`
- `GET /anime/history` / `POST /anime/history`
- `GET /anime/ratings` / `POST /anime/ratings`

## Community (`/api/v1/posts`, `/api/v1/reports`, `/api/v1/uploads`)
- `GET /posts?feed=explore|following|trending&hashtag=&page=`
- `POST /posts` / `GET /posts/:id` / `DELETE /posts/:id`
- `POST /posts/:id/like` / `POST /posts/:id/bookmark` / `POST /posts/:id/share`
- `GET /posts/:id/comments` / `POST /posts/:id/comments`
- `POST /reports`
- `POST /uploads/media`

## Chat (`/api/v1/conversations`) & Socket.IO
- `GET /conversations` / `POST /conversations`
- `GET /conversations/:id/messages` / `POST /conversations/:id/messages`
- `POST /conversations/:id/read`
- `PATCH /conversations/:id` / `POST /conversations/:id/members` / `DELETE /conversations/:id/members/:userId` / `POST /conversations/:id/leave`
- `DELETE /conversations/messages/:messageId`
- Socket.IO events: `chat:join`, `chat:send`, `chat:new_message`, `chat:typing:start`, `chat:typing:stop`, `chat:typing`, `chat:read`, `chat:read_receipt`, `user:presence`, `notification:new`.

## Gamification & Notifications
- `GET /leaderboard?period=weekly|monthly|all_time`
- `GET /users/me/achievements`
- `GET /notifications` / `PATCH /notifications/:id/read` / `POST /notifications/read-all`

## External Proxies & Tools
- `GET /ai/chat?q=...` & `POST /ai/chat`
- `GET /news`
- `POST /tools/tiktok/resolve`
- `GET /content/highlights`

## Admin (`/api/v1/admin`) — RBAC: `moderator`, `admin`, `super_admin`
- `GET /admin/dashboard`
- `GET /admin/users` / `PATCH /admin/users/:id/status`
- `GET /admin/verifications` / `PATCH /admin/verification/:id`
- `GET /admin/reports` / `PATCH /admin/reports/:id`
- `GET /admin/posts` / `DELETE /admin/posts/:id` / `POST /admin/posts/:id/approve-contribution`
- `GET /admin/comments` / `DELETE /admin/comments/:id`
- `GET /admin/content` / `POST /admin/content` / `DELETE /admin/content/:id`
- `GET /admin/audit-logs`
