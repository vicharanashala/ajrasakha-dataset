# Ajrasakha Dataset

A farmer-centric agricultural Q&A dataset platform. The platform allows agricultural domain experts to browse questions from farmers, provide answers, and collect structured user feedback. Questions go through a curated review workflow before being published, and feedback is tracked through an external review system.

The name "Ajrasakha" (ಅಜ್ರಸಾಕ) means companion or partner in Kannanda — a nod to its focus on supporting farmers.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Domain Model](#domain-model)
4. [Technology Stack](#technology-stack)
5. [Prerequisites](#prerequisites)
6. [Quick Start with Docker](#quick-start-with-docker)
7. [Running Locally (Without Docker)](#running-locally-without-docker)
8. [Development Without Google OAuth](#development-without-google-oauth)
9. [Environment Variables](#environment-variables)
10. [API Reference](#api-reference)
11. [Frontend Pages](#frontend-pages)
12. [Key Workflows](#key-workflows)
13. [Project Structure](#project-structure)

---

## Overview

Ajrasakha Dataset is a quality-controlled agricultural Q&A dataset built around the following core entities:

- **Questions** — Farmer questions in regional languages with metadata (state, district, crop, season, domain, priority, source)
- **Answers** — Expert-curated answers with source citations (web links, documents, images, videos)
- **Feedback** — Structured user feedback (thumbs up/down with predefined reasons and free-text comments), reviewed by auditors
- **Users** — Farmers, domain experts, and auditors with role-based access

Questions flow through a lifecycle: `open` → `in-review` / `auditor_review` → `pass` / `closed` / `duplicate`. Only questions with status `closed` are visible in the public-facing question browser.

The external **Reviewer Backend** manages the full curation workflow and acts as a source of truth for state/district metadata. The Ajrasakha dataset platform consumes questions from it and surfaces them to the public, alongside an interactive feedback loop.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│            http://localhost:5173 (dev)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST
┌──────────────────────▼──────────────────────────────────┐
│                   Backend (NestJS)                      │
│              http://localhost:3000/api                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │             Presentation Layer                    │   │
│  │   Controllers: Auth, Question, Answer,            │   │
│  │   Feedback, Public, ApiKey, User                  │   │
│  └──────────────┬───────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────┐   │
│  │              Application Layer                    │   │
│  │   Use Cases: Auth, Question, Answer,              │   │
│  │   Feedback, PublicDataset, ApiKey, User           │   │
│  └──────────────┬───────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────┐   │
│  │               Domain Layer                        │   │
│  │   Entities: User, Question, Answer, Feedback      │   │
│  │   Repository Interfaces                           │   │
│  └──────────────┬───────────────────────────────────┘   │
│  ┌──────────────▼───────────────────────────────────┐   │
│  │            Infrastructure Layer                   │   │
│  │   MongoDB Schemas, Auth Guards, JWT,              │   │
│  │   Email Service, Review System Client             │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │         MongoDB             │
         │  chatbot.icehz1c.mongodb.net│
         │         DB: agriai          │
         └─────────────────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │     Reviewer Backend        │
         │  (External, read-only)      │
         │  - State/District lookups   │
         │  - Feedback review workflow │
         └─────────────────────────────┘
```

### Auth Strategy (3 Layers)

| Layer | Mechanism | Use Case |
|---|---|---|
| **JWT** | `accessToken` + `refreshToken` (Bearer header) | Standard email/password sign-in |
| **Google OAuth** | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Optional SSO via Google |
| **Dev bypass** | `POST /auth/dev-login` | Local development only (auto-signs in as `dev@localhost`) |

### Public API Auth

The `/public/*` endpoints use a **dual-auth strategy**:

- **Whitelisted users** — pass their API key (prefix `ajr_`) in the `Authorization: Bearer <key>` header. No JWT involved.
- **Non-whitelisted users** — pass their JWT in the header. The backend internally resolves their own active API key for usage tracking, even though they never see or manage it directly.

---

## Domain Model

### Question

Represents a farmer's question. Only `closed` questions are published.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | Primary key |
| `question` | string | The actual question text |
| `status` | enum (19 values) | `open`, `closed`, `pass`, `duplicate`, `auditor_review`, ... |
| `priority` | enum | `low`, `medium`, `high`, `critical` |
| `source` | enum | `AJRASAKHA`, `AGRI_EXPERT`, `WHATSAPP`, `OUTREACH` |
| `details` | object | `state`, `district`, `crop`, `season`, `domain[]` |
| `isClosed` | boolean | Shortcut for `status === 'closed'` |
| `embedding` | number[] | Vector embedding for similarity search |
| `aiInitialAnswer` | string | LLM-generated initial response |
| `aiApprovedAnswer` | string | LLM response after auditor approval |
| `totalAnswersCount` | number | Count of answers submitted |

### Answer

Expert answer attached to a question. A question can have many answer iterations; only one is marked `isFinalAnswer`.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | Primary key |
| `questionId` | ObjectId | FK to Question |
| `answer` | string | Answer text |
| `isFinalAnswer` | boolean | One per question |
| `sources` | SourceItem[] | `{ source, sourceType, sourceName, page }` |
| `modifications` | PreviousAnswersItem[] | Audit trail of edits |
| `approvalCount` | number | Number of approvals received |
| `authorId` | ObjectId | FK to User (optional) |

### Feedback

Structured user feedback on an answer. Submitted once per user per question. Pushed to the external Reviewer Backend for auditor review.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | Primary key |
| `questionId` | ObjectId | FK to Question |
| `userId` | ObjectId | FK to User |
| `answerId` | ObjectId | FK to Answer (optional) |
| `type` | enum | `thumbs_up`, `thumbs_down` |
| `predefinedOption` | string | Reason selected from a fixed list |
| `comment` | string | Free-text comment |
| `status` | enum | `open`, `accepted`, `rejected` |
| `reviewNote` | string | Auditor's note after review |
| `isPushedToReviewSystem` | boolean | Whether push to Reviewer Backend succeeded |
| `pushToReviewSystemError` | string | Error message if push failed |

### User

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | Primary key |
| `email` | string | Unique, lowercase |
| `authProvider` | enum | `email`, `google`, `dev` |
| `isVerified` | boolean | Email verified via OTP |
| `isWhitelisted` | boolean | Gates API key access |
| `otp` / `otpExpiresAt` | string / Date | One-time password for verification |
| `googleId` | string | Google OAuth subject ID |
| `avatar` | string | Profile picture URL |
| `refreshTokenHash` | string | SHA-256 hash of active refresh token |

---

## Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| **NestJS** | Framework with dependency injection, modules, decorators |
| **MongoDB + Mongoose** | Document database for all entities |
| **TypeScript** | Full type safety across all layers |
| **JWT** | Access + refresh token authentication |
| **Nodemailer** | OTP and feedback acknowledgment emails via SMTP |
| **Docker** | Containerized deployment |

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool and dev server |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client for API calls |

---

## Prerequisites

- **Node.js** 18 or higher
- **Docker** and **Docker Compose** (for containerized deployment)
- **MongoDB** URI (connection string to a MongoDB instance)
- **Google OAuth credentials** (optional, see [Development Without Google OAuth](#development-without-google-oauth))

---

## Quick Start with Docker

This is the fastest way to get a working environment.

```bash
# 1. Clone the repository
git clone https://github.com/vicharanashala/ajrasakha-dataset.git
cd ajrasakha-dataset

# 2. Create the .env file from the example
cp .env.docker.example .env

# 3. Edit .env and fill in at minimum:
#    - MONGODB_URI       (your MongoDB connection string)
#    - MONGODB_DB_NAME   (e.g. agriai)
#    - SMTP_* variables  (for email delivery, optional for dev)
#    - GOOGLE_CLIENT_ID  (optional, see Dev Without Google OAuth below)

# 4. Build and start the container
docker-compose up --build

# 5. The application is available at http://localhost
```

The Docker setup runs both the backend (port 3000) and frontend (port 5173) in a single container, with Nginx routing `/api/*` to the backend and everything else to the frontend.

---

## Running Locally (Without Docker)

### Backend

```bash
cd backend
npm install

# Create .env
cp .env.example .env
# Fill in the required values in .env

npm run start:dev
```

The API is available at `http://localhost:3000/api`.

### Frontend

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:3000/api

npm run dev
```

The UI is available at `http://localhost:5173`.

---

## Development Without Google OAuth

Google Sign-In is the only login method in production. However, configuring real Google OAuth credentials is **not required** to run and test most of the application locally.

```bash
# Copy the dev-ready env files
cp backend/.env.development.example backend/.env
cp frontend/.env.development.example frontend/.env
```

These dev templates set:

- `GOOGLE_AUTH_ENABLED=false` (backend) — disables Google OAuth
- `VITE_GOOGLE_AUTH_ENABLED=false` (frontend) — hides Google Sign-In buttons

With these set:

- `GET /api/auth/google` returns a "disabled" message instead of redirecting
- Google Sign-In buttons in the UI are shown in a disabled state
- The frontend **auto-signs in** as a seeded dev user (`dev@localhost`) via `POST /api/auth/dev-login` — no manual sign-in, no Google setup needed
- Questions, question details, feedback submission, profile, and API playground all work out of the box

`/api/auth/dev-login` is **guarded**: it only works when `GOOGLE_AUTH_ENABLED=false` **and** `NODE_ENV !== 'production'`. It returns `404` otherwise, so it cannot be reached in staging or production even if one of those flags is misconfigured.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `MONGODB_DB_NAME` | No | `agriai` | Database name |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins (comma-separated) |
| `JWT_ACCESS_SECRET` | No | — | Secret for access token signing |
| `JWT_REFRESH_SECRET` | No | — | Secret for refresh token signing |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `SMTP_HOST` | No | — | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | — | SMTP username |
| `SMTP_PASS` | No | — | SMTP password |
| `SMTP_FROM` | No | — | From email address |
| `GOOGLE_AUTH_ENABLED` | No | `true` | Set `false` to disable Google Sign-In |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | `http://localhost:3000/api/auth/google/callback` | Google OAuth callback URL |
| `REVIEWER_BACKEND_URL` | No | — | Reviewer Backend base URL (for feedback push + location lookups) |
| `REVIEW_SYSTEM_AUTH_KEY` | No | — | Internal API key for Reviewer Backend calls |
| `NODE_ENV` | No | `development` | Environment: `development`, `production` |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `/api` | Backend API base URL |
| `VITE_GOOGLE_AUTH_ENABLED` | No | `true` | Set `false` to disable Google Sign-In UI |

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated endpoints require a `Authorization: Bearer <token>` header.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | None | Register with email + password |
| `POST` | `/auth/signin` | None | Sign in with email + password |
| `POST` | `/auth/verify-otp` | None | Verify email with 6-digit OTP |
| `POST` | `/auth/resend-otp` | None | Resend OTP to email |
| `POST` | `/auth/google` | None | Initiate Google OAuth flow (or "disabled" message) |
| `GET` | `/auth/google/callback` | None | Google OAuth callback |
| `POST` | `/auth/dev-login` | None | Dev-only auto sign-in (only when `GOOGLE_AUTH_ENABLED=false` && `NODE_ENV!=='production'`) |
| `POST` | `/auth/refresh` | None | Refresh access token |
| `POST` | `/auth/logout` | JWT | Invalidate refresh token |

### Questions — `/api/questions`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/questions` | None | Paginated question list with filters |
| `GET` | `/questions/search` | None | Vector similarity search |
| `GET` | `/questions/:id` | None | Get single question by ID |

**Query filters for `GET /questions`:**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `status` | string | Question status filter |
| `priority` | string | `low`, `medium`, `high`, `critical` |
| `source` | string | `AJRASAKHA`, `AGRI_EXPERT`, `WHATSAPP`, `OUTREACH` |
| `state` | string | Filter by state name |
| `crop` | string | Filter by crop name |
| `domain` | string | Filter by domain |
| `search` | string | Full-text search |
| `embedding` | string | Comma-separated vector for similarity search |
| `userId` | string | User ID (if authenticated, limit is capped at 5 for unauthenticated) |

### Answers — `/api/answers`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/answers/question/:questionId` | None | Get the final answer for a question |
| `POST` | `/answers` | JWT | Create a new answer |
| `PATCH` | `/answers/:id/final` | JWT | Mark answer as final |

### Feedback — `/api/feedbacks`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/feedbacks` | JWT | Create or update feedback |
| `GET` | `/feedbacks` | JWT | Paginated feedback list |
| `GET` | `/feedbacks/question/:questionId` | API Key | List feedbacks for a question |
| `GET` | `/feedbacks/question/:questionId/user/:userId` | JWT | Get user's feedback for a question |
| `PATCH` | `/feedbacks/:id/status` | API Key | Accept or reject feedback (triggers email) |
| `GET` | `/feedbacks/user/:userId` | JWT | List all feedbacks by a user |

### Public API — `/api/public`

Requires either an API key (`ajr_...`) or JWT. See [Public API Auth](#public-api-auth) above.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/public/questions` | API Key or JWT | Paginated closed questions with final answers |
| `GET` | `/public/filters` | API Key or JWT | Available filter options (states) |
| `GET` | `/public/filter-options` | API Key or JWT | Available filter values for a given type |

**Query params for `GET /public/filter-options`:**

| Param | Required | Description |
|---|---|---|
| `type` | **Yes** | One of: `district`, `crop`, `domain` |
| `state` | No | State name (required for `type=district`) |
| `district` | No | District name |
| `crop` | No | Crop name |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | JWT | Get current user profile |
| `PATCH` | `/users/me` | JWT | Update profile (firstName, lastName, state) |

### API Keys — `/api/api-keys`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api-keys` | JWT | Generate a new API key |
| `GET` | `/api-keys` | JWT | List user's own API keys |
| `DELETE` | `/api-keys/:id` | JWT | Revoke an API key |

---

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Redirects to `/questions` |
| `/signin` | Email/password sign-in form |
| `/signup` | Email/password registration form |
| `/verify-otp` | OTP verification after signup |
| `/questions` | Paginated question browser with state/crop/search filters |
| `/questions/:id` | Question detail with final answer, sources, and feedback form |
| `/profile` | User profile and API key management |
| `/my-feedbacks` | User's submitted feedback history |
| `/documentation` | API documentation |

### Unauthenticated Experience

- Questions page shows 5 questions (blurred preview with skeleton rows) and prompts sign-in
- Question detail page shows an auth prompt modal immediately
- Searching or filtering questions prompts sign-in
- Signing in via Google redirects back to the questions page with a session JWT stored in localStorage

### API Playground

Accessible from the profile page. A two-panel interface (left: request config, right: response) that lets whitelisted users test API calls directly with their API key, and non-whitelisted users with their session JWT.

---

## Key Workflows

### Question Browsing

1. User lands on `/questions`. Default filter shows only `closed` questions.
2. Optional filters: state (loaded from Reviewer Backend), crop (full list hardcoded), domain.
3. Unauthenticated users see 5 blurred preview rows with a sign-in prompt overlay.
4. Authenticated users see up to 20 rows per page with pagination.
5. Clicking a row navigates to `/questions/:id` (auth prompt if not signed in).

### Answer & Feedback Flow

1. Question detail page fetches question and its final answer in parallel.
2. Answer shows full text and renders any attached sources as links with icons.
3. Authenticated users see the `FeedbackForm` component.
4. On feedback submission:
   - If existing feedback exists, it is **updated** (not duplicated)
   - Backend pushes feedback to the Reviewer Backend via `PATCH /questions/feedbacks/question/:questionId`
   - Push failure is non-fatal — `isPushedToReviewSystem` is set to `false` and `pushToReviewSystemError` captures the reason
5. Feedback review (accept/reject) happens in the Reviewer Backend.
6. On accept/reject, an acknowledgment email is sent to the user via SMTP.

### OTP Verification

1. User signs up with email + password → OTP is generated and emailed.
2. User submits 6-digit OTP → `isVerified=true`, JWT tokens issued.
3. If OTP expires before verification, resend gives a fresh OTP.
4. Unverified accounts on sign-in trigger automatic OTP resend.

### Public API Consumption

1. Whitelisted user passes `Authorization: Bearer ajr_...` to `/public/questions`.
2. Backend validates the API key directly, skips JWT.
3. Returns closed questions (with `status: 'closed'`) matching filters, with their final answers embedded.
4. Non-whitelisted user passes JWT → backend resolves their active API key internally for tracking purposes but processes the request identically.

---

## Project Structure

```
ajrasakha-dataset/
├── backend/
│   ├── src/
│   │   ├── application/
│   │   │   ├── dtos/                  # Data Transfer Objects
│   │   │   └── use-cases/             # Business logic
│   │   ├── domain/
│   │   │   ├── entities/              # Domain entities (plain TS interfaces)
│   │   │   └── repositories/          # Repository interfaces
│   │   ├── infrastructure/
│   │   │   ├── auth/                  # JWT, Google OAuth, API key guards, dev auth
│   │   │   ├── database/
│   │   │   │   ├── repositories/      # Concrete MongoDB repository implementations
│   │   │   │   └── schemas/           # Mongoose schemas
│   │   │   └── services/              # Email, OTP, Review System client
│   │   └── presentation/
│   │       ├── answer/
│   │       ├── auth/
│   │       ├── feedback/
│   │       ├── question/
│   │       ├── public/                # Public API controller
│   │       └── user/
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # Base UI primitives (button, card, alert, input…)
│   │   │   ├── atoms/                 # Small reusable components (badge, pagination, select)
│   │   │   └── *.tsx                  # Feature components (FeedbackForm, ApiPlayground, AuthPromptModal)
│   │   ├── pages/                     # Route-level page components
│   │   ├── services/                  # API client (questionService, answerService, feedbackService, authService)
│   │   ├── types/                     # Shared TypeScript interfaces (Question, Answer, Feedback, User…)
│   │   └── App.tsx                    # Router setup
│   └── ...
├── docker-compose.yml
└── README.md
```

---
