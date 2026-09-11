# ConnectHub — Product & Engineering Reference

> This file is the single source of truth for any human or coding agent working in this
> repository. Read it fully before making changes. Keep it updated whenever architecture,
> schema, or conventions change.

---

## 1. Product Overview

**Workmate** is a small, production-grade, LinkedIn-style social networking app.

Core value: people create profiles, post text/image updates, follow each other, and chat in
real time — but **only with people they follow** (mutual-follow not required; chat is gated on
the _sender_ following the recipient, see §7).

### 1.1 Feature List (MVP scope — do not silently add features beyond this)

| #   | Feature  | Notes                                                                                                                                                                             |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Auth     | Google OAuth 2.0 login only. No email/password. (Implemented: Google OAuth 2.0 + JWT cookies, Prisma User model, local MySQL Docker Compose, Tailwind CSS configured in apps/web) |
| 2   | Profile  | View own/other profiles, edit name/bio/avatar, follower/following counts                                                                                                          |
| 3   | Posts    | Full CRUD, text + optional single image, owner-only edit/delete                                                                                                                   |
| 4   | Likes    | Like/unlike a post, like count                                                                                                                                                    |
| 5   | Follow   | Search users, follow/unfollow, list followers/following                                                                                                                           |
| 6   | Chat     | Real-time 1:1 chat via Socket.IO, persisted, restricted to followed users                                                                                                         |
| 7   | Frontend | Responsive Next.js UI for all of the above                                                                                                                                        |

### 1.2 Explicitly Out of Scope (v1)

- Comments on posts, notifications, group chat, media other than a single image per post,
  admin panel, email/password auth, password reset, multi-tenant orgs.
- Do not build these unless a task explicitly asks for them.

---

## 2. Tech Stack

| Layer        | Technology                                                     |
| ------------ | -------------------------------------------------------------- |
| Monorepo     | Turborepo (npm workspaces)                                     |
| Frontend     | Next.js (App Router), TypeScript, React                        |
| Backend      | NestJS (Node.js, TypeScript)                                   |
| Database     | MySQL                                                          |
| ORM          | Prisma (recommended) — see §5                                  |
| Real-time    | Socket.IO (via `@nestjs/platform-socket.io`)                   |
| Auth         | Google OAuth 2.0 + JWT (access + refresh cookies)              |
| File storage | Local `/uploads` in dev, Cloudflare R2 for prod                |
| Validation   | `class-validator` / `class-transformer` DTOs on every endpoint |
| Styling      | Tailwind CSS                                                   |

---

## 3. Monorepo Structure

```
/ (root)
├── PROJECT.md                     ← this file
├── turbo.json
├── package.json                   ← workspaces root
├── .env.example                   ← shared/reference env vars
│
├── apps/
│   ├── backend/                   ← NestJS API + Socket.IO gateway
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/            ← env schema/validation (Joi/Zod)
│   │   │   ├── common/
│   │   │   │   ├── decorators/    ← @CurrentUser(), @Public()
│   │   │   │   ├── filters/       ← global HttpExceptionFilter
│   │   │   │   ├── guards/        ← JwtAuthGuard, WsJwtGuard
│   │   │   │   ├── interceptors/  ← response shaping, logging
│   │   │   │   └── pipes/         ← ValidationPipe config
│   │   │   ├── prisma/            ← PrismaService, PrismaModule
│   │   │   ├── auth/              ← Google OAuth, JWT issuance, refresh
│   │   │   ├── users/             ← profile CRUD, search
│   │   │   ├── posts/             ← post CRUD, image upload
│   │   │   ├── likes/             ← like/unlike
│   │   │   ├── follows/           ← follow/unfollow, followers/following lists
│   │   │   ├── chat/
│   │   │   │   ├── chat.module.ts
│   │   │   │   ├── chat.gateway.ts    ← Socket.IO gateway (WS)
│   │   │   │   ├── chat.service.ts
│   │   │   │   └── dto/
│   │   │   └── uploads/           ← static file serving / storage adapter
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── test/                  ← e2e tests
│   │   └── package.json
│   │
│   └── web/                       ← Next.js frontend
│       ├── app/
│       │   ├── (auth)/login/
│       │   ├── (main)/feed/
│       │   ├── (main)/profile/[userId]/
│       │   ├── (main)/profile/edit/
│       │   ├── (main)/search/
│       │   ├── (main)/chat/[userId]/
│       │   └── layout.tsx
│       ├── components/
│       │   ├── posts/             ← PostCard, PostForm, PostList
│       │   ├── profile/           ← ProfileHeader, EditProfileForm
│       │   ├── chat/              ← ChatWindow, ChatList, MessageBubble
│       │   └── ui/                ← shared design-system primitives
│       ├── lib/
│       │   ├── api/               ← typed fetch client per resource
│       │   ├── socket.ts          ← Socket.IO client singleton
│       │   └── auth.ts            ← session helpers
│       ├── hooks/
│       ├── types/                 ← shared TS types (mirrors backend DTOs)
│       └── package.json
│
└── packages/                      ← optional shared workspaces
    ├── eslint-config/
    ├── tsconfig/
    └── shared-types/              ← types shared between backend & web (User, Post, etc.)
```

**Convention:** any type shared between frontend and backend (User, Post, Message shapes,
enums) belongs in `packages/shared-types` and is imported by both apps — never duplicated.

---

## 4. Authentication & Authorization

- **Login:** Google OAuth 2.0 (`passport-google-oauth20`) only. On first login, create a `User`
  row from the Google profile (email, name, avatar).
- **Session:** Backend issues a short-lived JWT **access token** and a long-lived **refresh
  token**, both set as `httpOnly`, `secure`, `sameSite=lax` cookies. No tokens in
  `localStorage`.
- **Guards:**
  - `JwtAuthGuard` on every REST route except `/auth/*` and health checks. Use a `@Public()`
    decorator to opt out explicitly rather than leaving routes unguarded.
  - `WsJwtGuard` validates the JWT on Socket.IO `connection` (token passed via `auth` payload
    or cookie) and attaches `userId` to the socket.
- **Ownership checks:** every mutation endpoint (edit/delete post, edit profile) must verify
  `resource.userId === request.user.id` in the service layer and throw `ForbiddenException`
  otherwise. Never trust a `userId` in the request body for these checks.
- **Global error handling:** a single `HttpExceptionFilter` returns a consistent JSON error
  shape (see §8). Do not leak stack traces or Prisma error internals to clients.

---

## 5. Data Model (MySQL via Prisma)

```prisma
model User {
  id            String    @id @default(uuid())
  googleId      String    @unique
  email         String    @unique
  name          String
  bio           String?   @db.Text
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  posts         Post[]
  likes         Like[]
  followers     Follow[]  @relation("following")   // users who follow ME
  following     Follow[]  @relation("follower")     // users I follow
  sentMessages  Message[] @relation("sender")
  receivedMessages Message[] @relation("recipient")
}

model Post {
  id        String   @id @default(uuid())
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  content   String   @db.Text
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  likes     Like[]

  @@index([authorId])
  @@index([createdAt])
}

model Like {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, postId])   // prevents double-like
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String   // the one doing the following
  followingId String   // the one being followed
  follower    User     @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("following", fields: [followingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followingId])
}

model Message {
  id          String   @id @default(uuid())
  senderId    String
  recipientId String
  sender      User     @relation("sender", fields: [senderId], references: [id], onDelete: Cascade)
  recipient   User     @relation("recipient", fields: [recipientId], references: [id], onDelete: Cascade)
  content     String   @db.Text
  createdAt   DateTime @default(now())
  readAt      DateTime?

  @@index([senderId, recipientId])
  @@index([recipientId, senderId])
}
```

---

## 6. REST API Surface (backend, prefix `/api`)

| Method | Route                            | Auth                   | Description                              |
| ------ | -------------------------------- | ---------------------- | ---------------------------------------- |
| GET    | `/auth/google`                   | public                 | redirect to Google                       |
| GET    | `/auth/google/callback`          | public                 | handles callback, sets cookies           |
| POST   | `/auth/refresh`                  | cookie                 | rotate access token                      |
| POST   | `/auth/logout`                   | required               | clear cookies                            |
| GET    | `/users/me`                      | required               | current user profile                     |
| GET    | `/users/:id`                     | required               | public profile view                      |
| PATCH  | `/users/me`                      | required               | edit name/bio/avatar                     |
| GET    | `/users/search?q=`               | required               | search by name/email                     |
| GET    | `/posts?cursor=&limit=`          | required               | paginated feed                           |
| POST   | `/posts`                         | required               | create post (multipart: content, image?) |
| GET    | `/posts/:id`                     | required               | single post                              |
| PATCH  | `/posts/:id`                     | required + owner       | edit post                                |
| DELETE | `/posts/:id`                     | required + owner       | delete post                              |
| POST   | `/posts/:id/like`                | required               | like post (idempotent)                   |
| DELETE | `/posts/:id/like`                | required               | unlike post                              |
| POST   | `/follows/:userId`               | required               | follow user                              |
| DELETE | `/follows/:userId`               | required               | unfollow user                            |
| GET    | `/follows/:userId/followers`     | required               | list followers                           |
| GET    | `/follows/:userId/following`     | required               | list following                           |
| GET    | `/chat/:userId/messages?cursor=` | required + must follow | message history                          |

All list endpoints use cursor-based pagination. All mutating endpoints validate the request
body with a DTO class (`class-validator`) and reject unknown/invalid fields
(`whitelist: true, forbidNonWhitelisted: true` in the global `ValidationPipe`).

---

## 7. Real-Time Chat Rules (Socket.IO)

- Namespace: `/chat`. Client connects with the JWT (cookie or `auth.token`).
- **Authorization rule:** User A may open/send a chat with User B **only if A follows B**
  (checked server-side on both `connection`-scoped room join and every `sendMessage` event —
  never trust the client). If the check fails, emit an `error` event and do not persist or
  broadcast the message.
- Events:
  - `client → server: sendMessage { recipientId, content }`
  - `server → client: newMessage { id, senderId, recipientId, content, createdAt }`
  - `server → client: error { code, message }`
- Rooms are keyed by a deterministic sorted pair, e.g. `chat:{minUserId}:{maxUserId}`.
- Every message is persisted to `Message` **before** being emitted to the recipient, so REST
  history and socket stream never diverge.
- Unfollowing does not delete history; it only blocks _new_ messages going forward (decide/confirm
  this behavior with product owner if requirements tighten — current default: block new sends
  only).

---

## 8. Backend Conventions (for coding agents)

- **Response shape (success):** `{ "data": <payload>, "meta"?: {...} }`
- **Response shape (error):** `{ "error": { "code": string, "message": string, "details"?: any } }`
  produced only by the global exception filter — services throw Nest `HttpException` subclasses,
  they do not format responses themselves.
- **Module boundaries:** one NestJS module per domain (`users`, `posts`, `likes`, `follows`,
  `chat`, `auth`). Controllers stay thin; business logic and ownership checks live in services.
- **DTOs:** every controller method has an explicit input DTO and, where non-trivial, a
  response DTO/serializer. Never pass raw Prisma models to the client (avoid leaking
  `googleId`, etc. — use `class-transformer`'s `@Exclude()` or explicit mapping).
- **File uploads:** validate mime type (`image/png`, `image/jpeg`, `image/webp`) and size limit
  (e.g. 5MB) before storing; store only the resulting URL on the `Post`/`User` record.
- **Testing:** new services/controllers get unit tests; new flows (auth, follow-gated chat,
  post ownership) get e2e tests under `apps/backend/test`.
- **Migrations:** schema changes go through `prisma migrate dev` and are committed; never hand-edit
  the database.

## 9. Frontend Conventions

- App Router with route groups: `(auth)` for unauthenticated pages, `(main)` for authenticated
  app shell (nav + sidebar).
- Data fetching: server components for initial page loads where practical; client components +
  the typed API client (`lib/api`) for interactive/mutating flows.
- Socket connection is established once (singleton in `lib/socket.ts`) after login and reused
  across chat screens; disconnect on logout.
- All forms validate client-side (mirroring backend DTO rules) but the backend remains the
  source of truth for validation.
- Shared types come from `packages/shared-types`, not redefined locally.

---

## 10. Environment Variables (see `.env.example`)

```
# backend
DATABASE_URL=mysql://user:pass@localhost:3306/connecthub
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=http://localhost:3000
UPLOADS_DIR=./uploads

# web
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

## 11. Definition of Done (per feature)

A feature is complete only when:

1. Backend: DTO validation, auth guard, ownership/authorization check, error handling, and at
   least one test exist.
2. Frontend: loading, empty, and error states are handled (not just the happy path).
3. Types are shared, not duplicated.
4. This file is updated if the change affects structure, schema, or conventions.

### 11.1 Implementation Status

- **Auth (Google OAuth + Session):** Completed end-to-end.
  - Backend: `passport-google-oauth20`, JWT access + refresh tokens in `httpOnly, secure, sameSite=lax` cookies, global `JwtAuthGuard` with `@Public()` opt-out, Prisma `User` model, `/users/me` endpoint, and local MySQL `docker-compose.yml`.
  - Frontend: Tailwind CSS configured in `apps/web`, single "Sign in with Google" button login screen at `/login`, authenticated `/feed` placeholder showing user profile + logout, and `middleware.ts` cookie presence guard.
