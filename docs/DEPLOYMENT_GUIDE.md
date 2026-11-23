# Hotel Management System - Deployment Guide

## 1. Deployment Architecture Summary
- **Frontend**: Vercel
- **Backend**: Render or Railway
- **Database**: Neon Serverless PostgreSQL

---

## 2. Frontend Deployment (Vercel)
1. Push the repository to GitHub.
2. In the Vercel Dashboard, import the repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: Next.js.
5. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-service.onrender.com/api/v1`
6. Deploy.

---

## 3. Backend Deployment (Render / Railway)

### Render:
1. Create a new **Web Service**.
2. Root Directory: `backend`.
3. Environment: `Node`.
4. Build Command:
   ```bash
   npm install && npm run prisma:generate && npm run build
   ```
5. Start Command:
   ```bash
   npm run start:prod
   ```
6. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `4000` (or Render assigned `$PORT`)
   - `DATABASE_URL`: Your pooled Neon connection string (`postgres://...pooler.neon.tech/...`)
   - `JWT_SECRET`: 64-character high-entropy secret
   - `JWT_EXPIRES_IN`: `1d`
   - `FRONTEND_URL`: `https://your-hotel-frontend.vercel.app`

### Database Migrations on Deployment:
Run `npm run prisma:migrate:deploy` as a pre-deploy or release step.

---

## 4. Neon PostgreSQL Setup
1. Create a Neon account and create a project: `hotel-management`.
2. Copy the Connection String with pooled connection enabled.
3. Paste into `backend/.env` as `DATABASE_URL`.
4. Run `npm --prefix backend run prisma:migrate` to push schema to Neon.
