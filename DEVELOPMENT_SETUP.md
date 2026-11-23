# Hotel Management Software - Development Setup Guide

## 1. Prerequisites
- **Node.js**: v20+ LTS (Tested on v24.21.0)
- **npm**: v10+ (Tested on v11.19.0)
- **Git**: v2.40+ (Tested on v2.55.0.windows.2)
- **Database**: PostgreSQL (Hosted on Neon)

---

## 2. Project Architecture Overview
The project follows a **Modular Monolithic Architecture** separated into two clear sub-applications:
- `frontend/`: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, and shadcn/ui.
- `backend/`: NestJS 10, TypeScript (strict), REST API with `/api/v1` prefix, Prisma ORM, Helmet, Swagger OpenAPI.

---

## 3. Environment Configuration

### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Backend (`backend/.env`):
```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/hotel_db?schema=public"
JWT_SECRET="development_jwt_secret_key_must_be_at_least_32_characters_long_for_security!"
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
```
> **Security Note**: Never commit actual `.env` files or hardcoded credentials to version control. The repository contains `.gitignore` to prevent any secret exposure.

---

## 4. Installation Commands

To install dependencies for each layer:

```bash
# Install frontend dependencies
npm --prefix frontend install

# Install backend dependencies
npm --prefix backend install
```

---

## 5. Development Server Execution

Run the backend and frontend in separate terminal windows:

### Backend Development Server (Port 4000):
```bash
npm --prefix backend run start:dev
```
- API Base: `http://localhost:4000/api/v1`
- Swagger Documentation: `http://localhost:4000/api/docs`
- Health Check: `http://localhost:4000/api/v1/health`

### Frontend Development Server (Port 3000):
```bash
npm --prefix frontend run dev
```
- Frontend Application: `http://localhost:3000`

---

## 6. Database Operations (Prisma)

```bash
# Generate Prisma Client
npm --prefix backend run prisma:generate

# Run Database Migrations (requires valid DATABASE_URL in backend/.env)
npm --prefix backend run prisma:migrate

# Deploy Migrations (production / CI)
npm --prefix backend run prisma:migrate:deploy

# Seed Database
npm --prefix backend run prisma:seed
```

---

## 7. Quality & Verification Commands

```bash
# Type Checking
npm --prefix frontend run typecheck
npm --prefix backend run typecheck

# Linting
npm --prefix frontend run lint
npm --prefix backend run lint

# Production Builds
npm --prefix backend run build
npm --prefix frontend run build
```

---

## 8. Deployment Architecture Foundation
- **Frontend**: Vercel (Configured for Next.js App Router)
- **Backend**: Render / Railway (Configured for Node.js NestJS build)
- **Database**: Neon Serverless PostgreSQL with connection pooling
