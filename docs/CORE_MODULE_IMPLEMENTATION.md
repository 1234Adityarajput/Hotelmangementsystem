# Hotel Management Software – Core Module Implementation (Phase 3)

## 1. Executive Summary

- **Project**: Hotel Management Software
- **Architecture**: Modular Monolith (Single Admin Role)
- **Database**: Neon Serverless PostgreSQL (`neondb` on AWS `us-east-2`, PostgreSQL 18.7)
- **Backend**: NestJS 10, Prisma ORM 5.22, JWT Authentication, TypeScript
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons
- **Status**: **ALL 8 CORE MODULES IMPLEMENTED, INTEGRATED & TESTED (100% Passing)**

---

## 2. Implemented Modules Overview (Developer 1 Scope)

### Module 1: Admin Dashboard
- **Backend**: `DashboardModule` (`dashboard.controller.ts`, `dashboard.service.ts`).
  - Aggregates room inventory (total, available, occupied, maintenance, occupancy rate).
  - Date-based operational metrics: today's check-ins, today's check-outs, active stays.
  - Financial calculations: today's collections, monthly revenue, pending invoice receivables.
  - Live queries for recent bookings and system audit logs. Zero mock data.
- **Frontend**: `frontend/src/app/page.tsx`.
  - Responsive metric cards, room type occupancy progress breakdown, quick operational shortcuts, recent reservations table, and live audit feed.

### Module 2: Guest Management
- **Backend**: `GuestsModule` (`guests.controller.ts`, `guests.service.ts`, DTOs with validation).
  - Search by name, mobile, email, guest code.
  - CRUD operations on `guests` table with auto-generated formatted `guestCode` (`GST-XXXXX`).
  - Identity document references stored in `guest_documents` table (Aadhaar, Passport, Driving License).
  - Total stays and historical stay query through `stayHistory` relation.
- **Frontend**: `frontend/src/app/guests/page.tsx`.
  - Data table with search, pagination, Add Guest modal with input validation, Edit Guest modal, View Details dialog with stay history and document upload/removal.

### Module 3: Room Type Management
- **Backend**: Registered in `RoomsModule` (`room-types.controller.ts`, `room-types.service.ts`).
  - CRUD operations for room categories (`Standard Single`, `Deluxe Double`, `Executive Suite`, `Presidential Suite`).
  - Enforces unique category name and validates price per night and guest capacity.
- **Frontend**: `frontend/src/app/rooms/page.tsx` (Room Types tab).
  - Category listing with room counts, Add Room Type dialog, Edit dialog.

### Module 4: Room Inventory Management
- **Backend**: Registered in `RoomsModule` (`rooms.controller.ts`, `rooms.service.ts`).
  - CRUD for hotel rooms (room number, floor, category, price per night, status).
  - Real-time date-range availability queries (`/api/v1/rooms/available`).
  - Status management: `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`. Respects PostgreSQL trigger preventing active rooms from being put in maintenance and preventing manual overrides when occupied.
- **Frontend**: `frontend/src/app/rooms/page.tsx` (Rooms tab).
  - Visual grid and filterable table by status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`), floor, and category. Add Room dialog, Quick maintenance toggle.

### Module 5: Booking Management
- **Backend**: `BookingsModule` (`bookings.controller.ts`, `bookings.service.ts`).
  - Reservation creation in database transactions.
  - Rate snapshot preservation (`roomRatePerNight`), stay duration calculation (`numberOfNights`).
  - Automatically synchronizes primary guest via PostgreSQL trigger `trg_sync_primary_booking_guest`.
  - Prevents overlapping active bookings via PostgreSQL GiST exclusion constraint (`no_overlapping_active_bookings`).
  - Advance payment recording directly to `payments` table.
- **Frontend**: `frontend/src/app/bookings/page.tsx`.
  - Booking directory with status filters, Create Reservation modal (date-range room availability check, dynamic night & total calculation, advance payment method), Cancel modal, and view details sheet.

### Module 6: Check-In, Check-Out & Room Relocation
- **Backend**: Registered in `BookingsModule` (`check-in-out.controller.ts`, `check-in-out.service.ts`).
  - Today's arrivals and departures queries.
  - Check-in action: verifies `RESERVED` status, records `actualCheckInAt`, switches status to `CHECKED_IN`. Trigger sets room to `OCCUPIED`.
  - Checkout action: verifies `CHECKED_IN` status, records `actualCheckOutAt`, switches status to `CHECKED_OUT`. Trigger sets room to `AVAILABLE`.
  - Room relocation: verifies new room availability and lack of date conflict, updates `booking.roomId` and rate snapshot. Trigger atomically handles room status transitions.
- **Frontend**: `frontend/src/app/stays/page.tsx`.
  - Operational front-desk board with three tabs: *In-House Guests*, *Today's Expected Arrivals*, and *Today's Expected Departures*. 1-click Check-In, 1-click Check-Out, and Relocation dialog.

### Module 7: Hotel Items & Services
- **Backend**: `ItemsModule` (`items.controller.ts`, `item-categories.controller.ts`, `booking-items.controller.ts`, `items.service.ts`).
  - Category and catalog item CRUD with price snapshots.
  - Room service and extra order charges (`booking_items` table) linked to active guest bookings.
- **Frontend**: `frontend/src/app/items/page.tsx`.
  - Category filter pills, item menu cards, Add Item dialog, Add Category dialog, and "Order to Room" modal.

### Module 8: Billing and Invoices
- **Backend**: `BillingModule` (`invoices.controller.ts`, `billing.service.ts`).
  - Compiles billable room charges + additional items + percentage or fixed discounts + GST tax.
  - Enforces exact mathematical relationship `balance_amount = total_amount - total_paid` to satisfy database check constraint `check_invoice_balance_relationship`.
  - Links existing advance payments and automatically assigns `PAID` or `PARTIALLY_PAID` status.
- **Frontend**: `frontend/src/app/invoices/page.tsx`.
  - Invoice directory with status filters, Generate Invoice dialog with discount & tax options, printable bill view modal, and quick settlement trigger.

### Module 9: Payments Management
- **Backend**: `PaymentsModule` (`payments.controller.ts`, `payments.service.ts`).
  - Supports payment types (`ADVANCE`, `PARTIAL`, `FINAL`, `REFUND`) and payment methods (`CASH`, `UPI`, `BANK_TRANSFER`, `OTHER`).
  - Recalculates invoice `totalPaid` and `balanceAmount` in database transactions. Automatically updates invoice status to `PAID` when balance reaches zero.
- **Frontend**: `frontend/src/app/payments/page.tsx`.
  - Accounting ledger, KPI revenue cards, method filters, and Record Payment modal.
