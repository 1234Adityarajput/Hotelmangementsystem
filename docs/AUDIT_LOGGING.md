# AUDIT LOGGING & TRACEABILITY ENGINE

## 1. Overview
The Audit Logging engine tracks every state mutation, financial transaction, check-in/out transition, salary disbursal, and configuration change performed across the system.

## 2. Architecture & Immutability
- **Write-Only / Append-Only**: Audit logs cannot be updated or deleted via application APIs.
- **Payload Capture**: Each mutating service call in NestJS captures `previousValues` (prior state) and `newValues` (persisted state) as structured JSON objects in PostgreSQL.
- **Single-Admin Identity**: Records are attributed to the active authenticated administrator user or marked as SYSTEM.

## 3. Database Schema
```prisma
model AuditLog {
  id             String      @id @default(uuid())
  entityType     String      @map("entity_type")
  entityId       String      @map("entity_id")
  action         AuditAction
  previousValues Json?       @map("previous_values")
  newValues      Json?       @map("new_values")
  changedAt      DateTime    @default(now()) @map("changed_at") @db.Timestamptz(3)
  description    String?

  @@index([entityType, entityId])
  @@index([changedAt])
  @@index([action])
  @@map("audit_logs")
}
```

## 4. API & UI Features
- Filter by entity type (`GUEST`, `ROOM`, `BOOKING`, `STAFF`, `ATTENDANCE`, `PAYROLL`, `EXPENSE`, `SETTING`).
- Filter by action (`CREATE`, `UPDATE`, `DELETE`, `FINALIZE`, `CANCEL`).
- Interactive modal showing formatted JSON state diffs (Previous State vs. New State).
- Full pagination and keyword search support.
