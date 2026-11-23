# Hotel Management Software

A modern, desktop-first, Modular Monolithic Web Application designed for Hotel Operations.

## Architecture
- **Approach**: Modular Monolithic Architecture
- **Access Control**: Single Admin Account (No RBAC / Multi-role required)
- **Database Layer**: Centralized PostgreSQL on Neon with Prisma ORM
- **Database Owner**: Developer 1
- **Assigned Modules for Developer 2**: Staff Management, Attendance, Payroll, Expenses, Digital Registers, Cash Book & Reports
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn/ui
- **Backend**: NestJS 10, TypeScript (strict), REST API (`/api/v1`), Swagger OpenAPI, Helmet
- **Reporting**: ExcelJS, jsPDF, jsPDF-AutoTable

---

## Quick Start

### 1. Configure Environment Variables
```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```
Update `backend/.env` with your Neon PostgreSQL connection string (`DATABASE_URL`).

### 2. Run Database Migrations & Seeding
```bash
# Apply initial migrations to Neon PostgreSQL
npm --prefix backend run prisma:migrate:deploy

# Run idempotent database seed
npm --prefix backend run prisma:seed
```

### 3. Run Development Servers
```bash
# Backend (Port 4000)
npm --prefix backend run start:dev

# Frontend (Port 3000)
npm --prefix frontend run dev
```

### 4. Verify Setup
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **API Health**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- **Swagger OpenAPI Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## Complete Database Documentation

1. [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) – Complete table breakdown, types, nullability, defaults, keys, indexes.
2. [docs/DATABASE_ER_DIAGRAM.md](docs/DATABASE_ER_DIAGRAM.md) – Full Mermaid Entity-Relationship diagram.
3. [docs/DATABASE_RELATIONSHIPS.md](docs/DATABASE_RELATIONSHIPS.md) – Cardinality, cascading rules (`RESTRICT` vs `CASCADE`), and integrity design.
4. [docs/DATABASE_BUSINESS_RULES.md](docs/DATABASE_BUSINESS_RULES.md) – Double-booking prevention algorithm, decimal calculation formulas, attendance and payroll rules.
5. [docs/DATABASE_MIGRATIONS.md](docs/DATABASE_MIGRATIONS.md) – Migration commands and deployment procedures.
6. [docs/API_DATA_CONTRACTS.md](docs/API_DATA_CONTRACTS.md) – DTOs and data shapes for frontend and backend developers.
7. [docs/MODULE_OWNERSHIP.md](docs/MODULE_OWNERSHIP.md) – Developer ownership split and Prisma query integration guide for Developer 2.
8. [SETUP_VERIFICATION.md](SETUP_VERIFICATION.md) – 58/58 Automated Database Architecture Audit results.
