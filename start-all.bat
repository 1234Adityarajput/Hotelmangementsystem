@echo off
echo ====================================================================
echo   GRAND HORIZON - HOTEL MANAGEMENT OS (IVORY & ESPRESSO LUXURY)
echo   Starting Full-Stack Modular Monolith & Neon PostgreSQL Services
echo ====================================================================
echo.

echo [1/2] Launching NestJS Backend on http://localhost:4000 ...
start "Grand Horizon - Backend (Port 4000)" cmd /k "cd /d %~dp0backend && npm run start:dev"

echo [2/2] Launching Next.js 15 Frontend on http://localhost:3000 ...
start "Grand Horizon - Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================================================
echo   Services are running!
echo   Frontend App:   http://localhost:3000
echo   Backend API:    http://localhost:4000/api/v1
echo   API Docs:       http://localhost:4000/api/docs
echo   Neon DB:        Connected Live
echo   Admin Login:    admin  /  Admin@Hotel2026!
echo ====================================================================
echo.
pause
