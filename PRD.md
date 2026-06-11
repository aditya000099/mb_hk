# 📋 Product Requirements Document — Reddit Clone

> **Stack**: React (Vite + TypeScript) · FastAPI (Python) · PostgreSQL · Redis · S3-compatible storage
> **Monorepo layout**: `frontend/` · `backend/`

---

## 1. Vision & Goals

Build a pixel-faithful Reddit clone — fully functional community platform where users can join subreddits, post content, comment, vote, and moderate — with a clean REST API backend and a snappy single-page frontend.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, React Router v6, Zustand, TanStack Query, Axios |
| Styling | Vanilla CSS / CSS Modules (Reddit-inspired design system) |
| Backend | FastAPI (Python 3.12), SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| Auth | JWT (access + refresh tokens), OAuth2 (Google, optionally GitHub) |
| File Storage | AWS S3 / Cloudflare R2 (presigned URLs) |
| Search | PostgreSQL Full-Text Search → Elasticsearch (Phase 6) |
| Real-time | WebSockets (FastAPI) for notifications & live vote counts |
| Deployment | Docker Compose (dev) → VPS / Railway / Fly.io (prod) |

---

## 3. Feature Inventory

### 3.1 Core Entities
- **Users** — account, profile, karma
- **Subreddits (r/)** — communities with rules, flair, sidebar
- **Posts** — link, text, image, video, poll
- **Comments** — nested tree (unlimited depth), markdown
- **Votes** — upvote / downvote on posts & comments
- **Flairs** — post flairs & user flairs per subreddit
- **Awards** — Reddit coins & awards system
- **Notifications** — inbox: replies, mentions, mod-mail
- **Messages** — private direct messages
- **Search** — full-text across posts, comments, subreddits, users
- **Moderation** — mod queue, ban, mute, flair management
- **Admin** — site-wide moderation, user management

---

## 4. Implementation Phases

---

### 🟢 Phase 1 — Project Scaffolding & Auth
> *Goal: Runnable skeleton with user registration / login*

#### Backend (`backend/`)
- [ ] Initialize FastAPI project (`pyproject.toml`, `uv` or `poetry`)
- [ ] Configure PostgreSQL connection with SQLAlchemy async engine
- [ ] Set up Alembic migrations
- [ ] Configure Redis client (for token blacklisting / sessions)
- [ ] Define `User` model: `id`, `username`, `email`, `password_hash`, `created_at`, `karma`, `avatar_url`, `bio`, `is_banned`, `is_admin`
- [ ] Auth routes:
  - `POST /api/auth/register` — email + username + password
  - `POST /api/auth/login` — returns `access_token` + `refresh_token`
  - `POST /api/auth/logout` — blacklist token in Redis
  - `POST /api/auth/refresh` — issue new access token
  - `GET  /api/auth/me` — current user profile
- [ ] JWT middleware (Bearer token) with dependency injection
- [ ] Password hashing with `bcrypt`
- [ ] Email verification flow (optional in Phase 1, required in Phase 5)
- [ ] CORS configuration for frontend origin
- [ ] Health check endpoint `GET /api/health`

#### Frontend (`frontend/`)
- [ ] Scaffold with `create vite@latest` (React + TypeScript)
- [ ] Install: React Router v6, Zustand, TanStack Query, Axios
- [ ] Set up project folder structure:
  ```
  src/
    api/          # Axios instance + API functions
    components/   # Shared UI components
    pages/        # Route-level pages
    store/        # Zustand stores
    hooks/        # Custom hooks
    types/        # TypeScript interfaces
    utils/        # Helpers
  ```
- [ ] Implement global `authStore` (Zustand): `user`, `accessToken`, `isAuthenticated`
- [ ] Axios interceptor: attach `Authorization` header + auto-refresh on 401
- [ ] Pages: `LoginPage`, `RegisterPage`
- [ ] Protected route wrapper component
- [ ] Reddit-style header navbar (logo, search bar placeholder, auth buttons)
- [ ] Responsive layout shell

**Exit Criteria**: User can register, log in, see their username in the navbar, and log out.

---

### 🟢 Phase 2 — Subreddits (Communities)
> *Goal: Create, join, and browse subreddits*

#### Backend
- [ ] `Subreddit` model: `id`, `name`, `display_name`, `description`, `sidebar`, `icon_url`, `banner_url`, `created_at`, `creator_id`, `member_count`, `is_nsfw`, `is_private`, `is_restricted`
- [ ] `SubredditMember` join table: `user_id`, `subreddit_id`, `role` (member/moderator/banned)
- [ ] Routes:
  - `POST /api/r/` — create subreddit
  - `GET  /api/r/{name}` — subreddit info
  - `POST /api/r/{name}/join` — join/leave toggle
  - `GET  /api/r/{name}/members` — member list (mod-only details)
  - `GET  /api/subreddits/popular` — trending communities
  - `GET  /api/subreddits/search?q=` — search communities
  - `PUT  /api/r/{name}` — update subreddit (mods only)
- [ ] Role-based permission checks (creator → moderator → member)

#### Frontend
- [ ] `SubredditPage` (`/r/:name`) — sidebar, rules, member count, join button
- [ ] `CreateSubredditPage` — form with name validation (unique check)
- [ ] `CommunityCard` component — icon, name, member count, join button
- [ ] `PopularCommunitiesSidebar` — list of top communities
- [ ] Subreddit icon / banner upload (placeholder in Phase 2, wired in Phase 5)

**Exit Criteria**: User can create a subreddit, browse it, and join/leave.

---

### 🟢 Phase 3 — Posts & Feed
> *Goal: Create posts, view feeds, sort by hot/new/top/rising*

#### Backend
- [ ] `Post` model: `id`, `title`, `body` (text), `url` (link), `image_url`, `type` (text/link/image/video), `author_id`, `subreddit_id`, `created_at`, `score`, `upvotes`, `downvotes`, `comment_count`, `is_nsfw`, `is_spoiler`, `is_locked`, `flair_id`, `deleted_at`
- [ ] `Vote` model: `user_id`, `post_id`|`comment_id`, `value` (+1/-1)
- [ ] Sorting algorithms:
  - **Hot**: Wilson score or Reddit's own algorithm
  - **New**: `created_at DESC`
  - **Top**: `score DESC` (with time filters: hour/day/week/month/year/all)
  - **Rising**: recent posts gaining velocity
- [ ] Routes:
  - `POST /api/r/{name}/posts` — create post
  - `GET  /api/r/{name}/posts?sort=hot&t=day` — paginated post list
  - `GET  /api/posts/{post_id}` — single post
  - `PUT  /api/posts/{post_id}` — edit post (author only)
  - `DELETE /api/posts/{post_id}` — soft delete
  - `POST /api/posts/{post_id}/vote` — upvote / downvote / unvote
  - `GET  /api/feed?sort=best` — home feed (subscribed subreddits)
  - `GET  /api/feed/popular` — r/popular equivalent
  - `GET  /api/feed/all` — r/all equivalent

#### Frontend
- [ ] `PostCard` component — thumbnail, title, metadata, vote buttons, comment/share/save actions
- [ ] `PostFeedPage` — infinite scroll with `IntersectionObserver`
- [ ] `CreatePostPage` — tabbed form: Text / Link / Image / Video
- [ ] `SortBar` component — Hot / New / Top / Rising + time filter dropdown
- [ ] `VoteButton` component — animated upvote/downvote with optimistic updates
- [ ] `HomePage` — best/hot feed from joined subreddits
- [ ] `PopularPage` — `r/popular` equivalent

**Exit Criteria**: User can create a post, see the feed sorted by hot/new/top, and upvote/downvote.

---

### 🟢 Phase 4 — Comments
> *Goal: Nested threaded comments with voting*

#### Backend
- [ ] `Comment` model: `id`, `body`, `author_id`, `post_id`, `parent_comment_id` (self-referential FK), `created_at`, `score`, `is_deleted`, `is_mod_removed`, `depth`
- [ ] Recursive comment tree fetching (CTE in PostgreSQL or iterative reconstruction)
- [ ] Routes:
  - `POST /api/posts/{post_id}/comments` — add comment (with optional `parent_comment_id`)
  - `GET  /api/posts/{post_id}/comments?sort=best` — full comment tree
  - `PUT  /api/comments/{comment_id}` — edit comment
  - `DELETE /api/comments/{comment_id}` — soft delete
  - `POST /api/comments/{comment_id}/vote` — vote on comment
  - `GET  /api/comments/{comment_id}/replies` — lazy-load collapsed replies
- [ ] Sorting: Best (Wilson), New, Old, Top, Controversial, Q&A

#### Frontend
- [ ] `PostDetailPage` (`/r/:name/comments/:postId`) — post body + comment section
- [ ] `CommentTree` recursive component — collapse/expand branches
- [ ] `CommentBox` — Markdown editor (with preview toggle)
- [ ] `Comment` component — reply button, vote, edit, delete, report, permalink
- [ ] "Load more comments" / "Continue this thread →" for deep nesting
- [ ] Markdown renderer (react-markdown + remark-gfm)

**Exit Criteria**: User can post a comment, reply to any comment at any depth, and collapse threads.

---

### 🟡 Phase 5 — User Profiles & Media Uploads
> *Goal: Full profile pages, avatar, karma, saved posts, media support*

#### Backend
- [ ] Expand `User` model: `display_name`, `bio`, `banner_url`, `avatar_url`, `link_karma`, `comment_karma`
- [ ] S3 presigned URL upload flow:
  - `POST /api/media/presign` — returns presigned S3 PUT URL + object key
  - Client uploads directly to S3, then passes key to update endpoint
- [ ] `SavedPost` & `SavedComment` models
- [ ] Routes:
  - `GET  /api/users/{username}` — public profile
  - `PUT  /api/users/me` — update profile (bio, avatar, banner)
  - `GET  /api/users/{username}/posts` — user's posts
  - `GET  /api/users/{username}/comments` — user's comments
  - `GET  /api/users/me/saved` — saved posts & comments
  - `POST /api/posts/{post_id}/save` — toggle save
  - `POST /api/comments/{comment_id}/save` — toggle save

#### Frontend
- [ ] `UserProfilePage` (`/u/:username`) — overview / posts / comments / saved tabs
- [ ] `AvatarUpload` component — drag & drop + crop
- [ ] `BannerUpload` component
- [ ] Karma display (post karma + comment karma)
- [ ] `SavedFeedPage` — saved posts/comments
- [ ] Image / GIF post rendering in feed
- [ ] Video player component (HTML5 `<video>` with controls)

**Exit Criteria**: User can upload an avatar, view their profile, and save/unsave posts.

---

### 🟡 Phase 6 — Search, Flairs, Notifications & Messaging
> *Goal: Platform feels complete — search everything, get notified, DM users*

#### Backend
- [ ] PostgreSQL full-text search with `tsvector` / `tsquery`
- [ ] `GET /api/search?q=&type=post|comment|subreddit|user&sort=relevance`
- [ ] `Flair` model: `id`, `subreddit_id`, `text`, `color`, `background_color`, `emoji_url`, `type` (post/user)
- [ ] Flair routes: CRUD for mods, apply-flair for users
- [ ] `Notification` model: `id`, `user_id`, `type` (reply/mention/modmail/award), `read`, `payload`
- [ ] WebSocket endpoint `WS /api/ws/notifications` — push live notifications
- [ ] `Message` model: DMs between users
- [ ] Routes:
  - `POST /api/messages` — send DM
  - `GET  /api/messages/inbox` — conversation list
  - `GET  /api/messages/{thread_id}` — full thread
  - `GET  /api/notifications` — paginated notifications
  - `POST /api/notifications/mark-read`

#### Frontend
- [ ] `SearchPage` — tabbed results (Posts / Communities / People)
- [ ] `SearchBar` — typeahead suggestions with debounce
- [ ] `NotificationDropdown` — bell icon with unread badge, live via WebSocket
- [ ] `InboxPage` — notifications + messages
- [ ] `MessageThread` component
- [ ] `FlairSelector` — subreddit flair picker on post creation
- [ ] `UserFlair` badge on username

**Exit Criteria**: User can search posts/subreddits, receive real-time notifications on reply, and send a DM.

---

### 🔴 Phase 7 — Moderation, Awards & Polish
> *Goal: Full moderation tooling, awards system, and production readiness*

#### Backend
- [ ] Moderation routes:
  - `POST /api/r/{name}/mod/approve` — approve removed post
  - `POST /api/r/{name}/mod/remove` — remove post/comment
  - `POST /api/r/{name}/mod/ban` — ban user from subreddit
  - `POST /api/r/{name}/mod/mute` — mute user (no modmail)
  - `GET  /api/r/{name}/mod/queue` — mod queue (reports)
  - `POST /api/posts/{post_id}/report` — report post
  - `POST /api/r/{name}/rules` — add subreddit rule
- [ ] `Award` model: coins system, give award to post/comment
- [ ] Admin routes: user management, site-wide ban, report queue
- [ ] Rate limiting (Redis token-bucket) on write endpoints
- [ ] Cursor-based pagination on all list endpoints

#### Frontend
- [ ] `ModQueuePage` (`/r/:name/about/modqueue`)
- [ ] `ModToolbar` — visible to mods on posts/comments
- [ ] `ReportModal` — reason selection + custom text
- [ ] `BanUserModal`
- [ ] `SubredditRulesPage` (mod edit + public view)
- [ ] `AwardModal` — give award UI
- [ ] `AdminDashboard` (`/admin`) — user table, site-wide reports
- [ ] Dark mode toggle (CSS custom properties)
- [ ] Responsive mobile layout
- [ ] PWA manifest + service worker (offline shell)
- [ ] `robots.txt`, meta tags, OpenGraph cards for link previews

**Exit Criteria**: Mods can manage their subreddit, admins can ban users site-wide, and the app is mobile-responsive with dark mode.

---

## 5. API Design Principles

| Principle | Decision |
|---|---|
| Versioning | `/api/v1/` prefix (added in Phase 1, enforced later) |
| Auth | Bearer JWT; refresh token stored in `httpOnly` cookie |
| Pagination | Cursor-based (`after` param) on all feeds; offset-based on search |
| Errors | RFC 7807 Problem Details (`type`, `title`, `status`, `detail`) |
| Rate limiting | Redis sliding window per user per endpoint |
| Validation | Pydantic v2 models with strict types |
| Docs | Auto-generated Swagger UI at `/docs` and ReDoc at `/redoc` |

---

## 6. Database Schema Overview

```
users ──< subreddit_members >── subreddits
  │                                 │
  │                              <─ posts ──< votes (post)
  │                                   │
  │                               <── comments ──< votes (comment)
  │
  ├── notifications
  ├── messages
  └── saved_posts / saved_comments
```

---

## 7. Non-Functional Requirements

| Area | Target |
|---|---|
| API Response Time | p95 < 200ms for feed endpoints |
| Uptime | 99.9% (single-region to start) |
| Security | OWASP Top 10; SQL injection via ORM only; XSS via React's JSX |
| Scalability | Stateless API behind load balancer; Redis for shared state |
| Dev Experience | Docker Compose brings up full stack with one command |

---

## 8. Folder Structure

```
mb_hk/
├── PRD.md                    ← this file
├── docker-compose.yml        ← Phase 1
├── .env.example
│
├── frontend/                 ← React + Vite + TypeScript
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── backend/                  ← FastAPI + SQLAlchemy + Alembic
    ├── app/
    │   ├── main.py
    │   ├── core/             # config, security, db
    │   ├── models/           # SQLAlchemy ORM models
    │   ├── schemas/          # Pydantic v2 schemas
    │   ├── routers/          # FastAPI routers per domain
    │   ├── services/         # Business logic layer
    │   └── utils/
    ├── alembic/
    ├── tests/
    ├── Dockerfile
    └── pyproject.toml
```

---

*Last updated: June 2026 | Phase target: Production-ready Reddit clone in 7 phases*
