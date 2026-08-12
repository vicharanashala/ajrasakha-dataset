# Ajrasakha Dataset

A farmer-centric dataset application built with NestJS backend and React frontend.

## Project Structure

```
ajrasakha-dataset/
├── backend/          # NestJS backend API
│   ├── src/
│   │   ├── application/    # Use cases and DTOs
│   │   ├── domain/         # Entities and repository interfaces
│   │   ├── infrastructure/ # Database schemas and services
│   │   └── presentation/   # Controllers and modules
│   └── ...
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── ...
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB URI (for database connection)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/vicharanashala/ajrasakha-dataset.git
cd ajrasakha-dataset
```

2. Create a `.env` file in the root directory:
```bash
cp .env.docker.example .env
```

   For local development without Google OAuth credentials, see
   "Development Without Google OAuth" below instead.

3. Update the `.env` file with your MongoDB connection string and email credentials.

4. Build and run with Docker:
```bash
docker-compose up --build
```

5. Access the application at http://localhost

## Running Locally (Without Docker)

### Backend

```bash
cd backend
npm install
npm run start:dev
```

The backend runs on http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173

Update `frontend/.env` to set:
```
VITE_API_URL=http://localhost:3000/api
```

## Development Without Google OAuth

Google Sign-In is the only login method, and configuring real Google OAuth
credentials isn't required to run and test most of the application locally.
To develop without them:

```bash
cp backend/.env.development.example backend/.env
cp frontend/.env.development.example frontend/.env
```

These templates set `GOOGLE_AUTH_ENABLED=false` (backend) and
`VITE_GOOGLE_AUTH_ENABLED=false` (frontend). With these set:
- The backend starts normally without `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- `GET /api/auth/google` responds with a clear "disabled" message instead of
  requiring credentials.
- The "Continue with Google" buttons in the UI are shown disabled.
- The frontend automatically signs in as a seeded local dev user
  (`dev@localhost`) via `POST /api/auth/dev-login` — so Questions, Question
  Detail, Documentation, Profile, My Feedbacks, and submitting feedback all
  work with no manual sign-in step and no Google OAuth setup.

`/api/auth/dev-login` only works when `GOOGLE_AUTH_ENABLED=false` **and**
`NODE_ENV` is not `production` — it responds `404` otherwise, so it cannot be
reached in staging or production even if one of the two variables is
misconfigured. Staging and production are otherwise unaffected:
`GOOGLE_AUTH_ENABLED` defaults to enabled whenever it isn't explicitly set to
`false`.

## Routes

### Public Routes
- `/signin` - User login
- `/signup` - User registration
- `/verify-otp` - OTP verification after signup

### Protected Routes (Require Authentication)
- `/questions` - Browse questions
- `/questions/:id` - Question detail
- `/profile` - User profile
- `/my-feedbacks` - User's feedback history

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - User login
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/dev-login` - Dev-only sign-in as a seeded local user (only when `GOOGLE_AUTH_ENABLED=false` and not in production; 404 otherwise)

### Questions
- `GET /api/questions` - Get all questions (with pagination and filters)
- `GET /api/questions/:id` - Get question by ID

### Answers
- `GET /api/answers/question/:questionId` - Get answer for a question

### Feedback
- `POST /api/feedbacks` - Create feedback
- `GET /api/feedbacks/user/:userId` - Get user's feedbacks

## Environment Variables

### Backend (.env)
| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 3000) |
| MONGODB_URI | MongoDB connection string |
| MONGODB_DB_NAME | Database name |
| CORS_ORIGINS | Allowed CORS origins |
| SMTP_HOST | SMTP server host |
| SMTP_PORT | SMTP server port |
| SMTP_USER | SMTP username |
| SMTP_PASS | SMTP password |
| SMTP_FROM | From email address |
| GOOGLE_AUTH_ENABLED | Set to `false` to disable Google Sign-In for local development (default: enabled) |

### Frontend
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL |
| VITE_GOOGLE_AUTH_ENABLED | Set to `false` to hide/disable the Google Sign-In buttons (default: enabled) |

## Technology Stack

### Backend
- NestJS
- MongoDB with Mongoose
- TypeScript
- Docker

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Lucide Icons

## License

MIT