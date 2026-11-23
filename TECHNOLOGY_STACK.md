# Hotel Management Software - Technology Stack & Architecture

## Architecture Pattern: Modular Monolithic Architecture

The system is designed as a unified, cohesive modular monolith. All modules communicate in-process with clear domain boundaries, avoiding unnecessary microservice overhead while enabling rapid development and high maintainability for a solo developer.

---

## 1. Frontend Technology Stack

| Layer / Concern | Technology | Specification / Role |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.1+ | React framework with App Router, SSR/CSR, route handlers |
| **Language** | TypeScript 5.7+ | Strict mode enabled, strict null checks |
| **UI Library** | React 19.0+ | Modern React declarative UI |
| **Styling** | Tailwind CSS 3.4+ | Utility-first CSS with CSS custom variables |
| **Component Primitives** | shadcn/ui & Radix UI | Accessible headless primitives (Dialog, Select, Dropdown, Slot) |
| **Iconography** | Lucide React | Lightweight, consistent SVG icon system |
| **State & Data Fetching** | TanStack React Query v5 | Server state caching, background refetching, query keys |
| **HTTP Client** | Axios 1.7+ | Centralized API client with JWT interceptors |
| **Form Handling** | React Hook Form 7.54+ | Uncontrolled performant form state |
| **Validation** | Zod 3.24+ | TypeScript-first schema declaration and validation |
| **Date Handling** | date-fns 4.1+ | Immutable, modular date manipulation |
| **Notifications** | Sonner 1.7+ | Toast notification manager |
| **Reporting Infrastructure**| ExcelJS 4.4+, jsPDF 2.5+, jsPDF-AutoTable | Client/Server-side spreadsheet and PDF generation |

---

## 2. Backend Technology Stack

| Layer / Concern | Technology | Specification / Role |
| :--- | :--- | :--- |
| **Runtime & Platform** | Node.js LTS (v24.21.0) | High-performance asynchronous JavaScript runtime |
| **Framework** | NestJS 10.4+ | Enterprise TypeScript backend framework with dependency injection |
| **Architecture** | Modular Monolith | Cohesive in-process domain modules |
| **API Pattern** | REST API | Standardized HTTP methods, global prefix `/api/v1` |
| **ORM & Database Client**| Prisma ORM 5.22+ | Type-safe query builder, migrations, and schema generator |
| **Database Driver** | PostgreSQL client | Connection pooling and SSL support for Neon PostgreSQL |
| **Authentication** | JWT & Passport (`@nestjs/jwt`, `@nestjs/passport`) | Stateless token-based authentication |
| **Password Hashing** | bcrypt (12 salt rounds) | Cryptographic password hashing |
| **Validation & Transformation** | `class-validator`, `class-transformer` | DTO parameter validation and sanitization |
| **Security Middlewares** | Helmet, CORS | Secure HTTP response headers, origin whitelisting |
| **API Documentation** | Swagger / OpenAPI (`@nestjs/swagger`) | Auto-generated interactive documentation at `/api/docs` |
| **Error Handling** | Global Filters | RFC-compliant JSON error responses |
| **Logging** | Interceptors & Nest Logger | Request/response audit logging with execution latency |

---

## 3. Database Layer

| Component | Technology | Specification |
| :--- | :--- | :--- |
| **Database Engine** | PostgreSQL 16+ | Relational ACID database |
| **Cloud Host** | Neon PostgreSQL | Serverless PostgreSQL with pooling and instant branching |
| **ORM Tool** | Prisma ORM | Automated schema migrations, client generation, and seeding |

---

## 4. Authentication Architecture (Single Admin Role)

- **Access Level**: Exactly ONE Admin account.
- **Role Isolation**: No RBAC, no multi-role authorization, no receptionist or staff logins.
- **Protection**: JWT Auth Guard applied globally, selectively bypassed via custom `@Public()` decorator.
- **Storage**: Passwords hashed with bcrypt salt rounds = 12.
