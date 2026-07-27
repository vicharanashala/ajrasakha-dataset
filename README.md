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

### Frontend
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL |

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