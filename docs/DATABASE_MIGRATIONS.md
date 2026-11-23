# Hotel Management Software – Database Migrations & Deployment Guide

## 1. Migration Architecture
Prisma Migrate is the schema migration engine for this PostgreSQL database hosted on Neon.

The complete schema DDL is versioned and captured in:
`backend/prisma/migrations/20261123000000_init_complete_hotel_database/migration.sql`

### Current Deployment Status
- **Target Database**: Neon Serverless PostgreSQL (`neondb` on AWS `us-east-2`)
- **Applied Migration**: `20261123000000_init_complete_hotel_database`
- **Tables Deployed**: 23 tables (22 domain models + `_prisma_migrations`)
- **Extensions**: `btree_gist` active
- **Status**: Live and synchronized. 100% verified via automated integrity and integration test suites.

---

## 2. Standard Migration Workflow

### When Neon Credentials are Provided:
1. Update `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/hotel_db?sslmode=require"
   ```

2. Apply all pending migrations to the database:
   ```bash
   npm --prefix backend run prisma:migrate:deploy
   ```
   *Note: `prisma migrate deploy` executes committed migration scripts directly against the production database without requiring an interactive shadow database.*

3. Execute idempotent database seeding:
   ```bash
   npm --prefix backend run prisma:seed
   ```

4. Verify database connectivity:
   Run the backend and check:
   ```bash
   curl http://localhost:4000/api/v1/health
   ```
   Response confirms:
   ```json
   {
     "database": {
       "configured": true,
       "provider": "postgresql",
       "connected": true,
       "message": "Successfully connected and verified PostgreSQL database.",
       "latencyMs": 18
     }
   }
   ```

---

## 3. Safe Migration Practices for Solo Developers
- **Never Run `prisma migrate reset` in Production**:
  Reset deletes the database and recreates it from scratch. It is only for clean local experiments.
- **Always Generate Client After Schema Change**:
  ```bash
  npm --prefix backend run prisma:generate
  ```
- **Run Schema Validation**:
  ```bash
  npx --prefix backend prisma validate --schema backend/prisma/schema.prisma
  ```
- **Inspect SQL Diff Before Applying**:
  ```bash
  npx --prefix backend prisma migrate diff --from-schema-datamodel backend/prisma/schema.prisma --to-url "$DATABASE_URL" --script
  ```

---

## 4. Rollback Strategy
Because the schema uses strict `ON DELETE RESTRICT` constraints on all historical and financial tables, schema changes should be additive (new columns nullable or with defaults) rather than dropping columns directly in a live system.

If a rollback of a migration is necessary:
1. Check `_prisma_migrations` table in Neon to identify the applied migration entry.
2. Formulate the inverse SQL script.
3. Apply via psql or Neon SQL Editor.
