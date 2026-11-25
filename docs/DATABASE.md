# OtakuPlay MongoDB Database Schema (21 Collections)

All models live in `backend/src/models/` with Mongoose validation, timestamps, compound/unique indexes, and TTL expiry where appropriate:

1. `User` — Identity, Google OAuth ID, bcrypt password hash, RBAC role (`user|moderator|admin|super_admin`), verification status (`isVerified`, `verifiedAt`, `verifiedBy`), XP/level, privacy settings, block/mute lists.
2. `Session` — Active device sessions with TTL index on `expiresAt`.
3. `RefreshToken` — SHA-256 token hash, rotation `familyId`, revocation state, TTL expiry.
4. `Post` — Community posts, captions, hashtags, media metadata, counters, moderation status.
5. `Comment` — Post comments & nested replies (`parentId`).
6. `Follow` — Unique `(followerId, followingId)` pairs.
7. `Like` — Unique `(userId, targetType, targetId)` pairs.
8. `Bookmark` — Unique `(userId, postId)` pairs.
9. `Conversation` — Private (`directKey` unique) and group conversations.
10. `Message` — Messages, reply reference, image attachments, `readBy` receipts, soft delete.
11. `Notification` — Per-user unread/read notifications across social, chat, level-up, verification, and announcements.
12. `AnimeBookmark` — User anime watchlist & favorites.
13. `WatchHistory` — Episode playback resume positions & completion state.
14. `AnimeRating` — User ratings (1-10) & reviews with XP idempotency flag.
15. `VerificationRequest` — Manual blue badge applications & admin review audit.
16. `Achievement` — Master badge definitions seeded by `migration.ts`.
17. `UserAchievement` — Unlocked badges per user.
18. `Leaderboard` — Weekly, monthly, and all-time XP buckets.
19. `Report` — Abuse reports for posts, comments, users, and chat messages.
20. `Announcement` — Admin announcements, banners, featured anime, and news highlights.
21. `AdminAuditLog` — Immutable administrative action log.
