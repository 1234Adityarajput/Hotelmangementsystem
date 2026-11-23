# Hotel Management System - Architecture Specification

## 1. High-Level Architectural Pattern: Modular Monolith
The Hotel Management System is architected as a **Modular Monolith**. Rather than introducing distributed microservices with network boundaries, independent databases, and serialization overhead, all core business capabilities reside within a single coherent backend and unified frontend.

### Benefits for Solo Development:
- **Zero Distributed Complexity**: No service discovery, distributed tracing, network latency, or partial failure cascades.
- **Single Source of Truth**: Shared domain models and atomic database transactions.
- **Fast Development Velocity**: Seamless refactoring with full TypeScript compiler support.
- **Straightforward Deployment**: One backend deployment unit and one frontend deployment unit.

---

## 2. System Layers

```
+-------------------------------------------------------------+
|                     NEXT.JS FRONTEND                        |
|  - App Router (Desktop-first UI)                            |
|  - shadcn/ui + Tailwind CSS (Hotel Design System)           |
|  - TanStack React Query (Server State Cache)                |
|  - Axios Centralized API Client (JWT Bearer Token)          |
+-------------------------------------------------------------+
                              |
                     REST API (/api/v1)
                              |
+-------------------------------------------------------------+
|                      NESTJS BACKEND                         |
|  - Global Guards (JWT Single Admin Authentication)          |
|  - Global Interceptors (Logging, Timing, Transform)         |
|  - Global Filters (RFC Error Responses)                     |
|  - Core Modules (AuthModule, DatabaseModule, HealthModule)  |
|  - Future Business Modules (Rooms, Guests, Billing, etc.)   |
+-------------------------------------------------------------+
                              |
                          Prisma ORM
                              |
+-------------------------------------------------------------+
|                   NEON POSTGRESQL DATABASE                  |
|  - Connection Pooling                                       |
|  - Automated Schema Migrations                              |
|  - Single Admin User Storage                                |
+-------------------------------------------------------------+
```

---

## 3. Security Principles
- Single Admin Role: Complete access granted exclusively to the authenticated administrator.
- Passwords hashed using `bcrypt` with 12 salt rounds.
- Tokens issued using signed JSON Web Tokens (JWT) with configurable expiration.
- HTTP security headers enforced by `helmet`.
- Cross-Origin Resource Sharing (CORS) restricted to verified frontend domains.
