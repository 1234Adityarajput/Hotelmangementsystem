# Hotel Management Software – Database Relationships & Cardinality Guide

## 1. Architectural Philosophy on Relationships
In an enterprise Hotel Management System, **data integrity and financial auditability are paramount**. 

Cascading deletes (`ON DELETE CASCADE`) are strictly prohibited on business and financial entities to ensure that audit trails, past tax returns, guest stay histories, and staff wage records can never be accidentally obliterated by deleting a parent row.

The only exception where `CASCADE` is permitted is `guest_documents`, where a document cannot exist without an owner guest (and guests with booking history cannot be deleted anyway due to `RESTRICT`).

---

## 2. Entity Relationship Specifications

### A. Guest Ecosystem
1. **`guests` (1) ───< (N) `guest_documents`**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `guest_documents.guest_id` -> `guests.id`
   - **Rule**: `ON DELETE CASCADE`, `ON UPDATE CASCADE`
   - **Rationale**: If a guest record is removed (permitted only if they have zero bookings), their identity document metadata is removed alongside.

2. **`guests` (1) ───< (N) `bookings` (As Primary Booker)**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `bookings.primary_guest_id` -> `guests.id`
   - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
   - **Rationale**: A guest cannot be deleted if they have any booking records in the hotel history.

3. **`guests` (1) ───< (N) `booking_guests` (As Co-Guest/Occupant)**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `booking_guests.guest_id` -> `guests.id`
   - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
   - **Rationale**: Preserves multi-guest occupancy history.

---

### B. Room & Stay Architecture
4. **`room_types` (1) ───< (N) `rooms`**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `rooms.room_type_id` -> `room_types.id`
   - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
   - **Rationale**: A room type cannot be deleted if active or historical rooms reference it. If a room type is retired, toggle `room_types.is_active = false`.

5. **`rooms` (1) ───< (N) `bookings`**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `bookings.room_id` -> `rooms.id`
   - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
   - **Rationale**: Rooms can never be deleted if past bookings took place in them. Rooms should be set to `room_status = MAINTENANCE` or `is_active = false`.

6. **`bookings` (1) ───< (N) `booking_guests`**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `booking_guests.booking_id` -> `bookings.id`
   - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
   - **Rationale**: Deleting booking records is forbidden; bookings transition through statuses (`CHECKED_OUT`, `CANCELLED`).

---

### C. Hotel Items & In-Stay Consumption
7. **`item_categories` (1) ───< (N) `items`**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `items.category_id` -> `item_categories.id`
   - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
   - **Rationale**: Prevents accidental deletion of categories that organize existing merchandise or kitchen items.

8. **`bookings` (1) ───< (N) `booking_items`**
   - **Cardinality**: One-to-Many
   - **Foreign Key**: `booking_items.booking_id` -> `bookings.id`
   - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
   - **Rationale**: Line items ordered during a guest stay belong immutably to the stay history.

9. **`items` (1) ───< (N) `booking_items`**
   - **Cardinality**: One-to-Many (Optional)
   - **Foreign Key**: `booking_items.item_id` -> `items.id`
   - **Rule**: `ON DELETE SET NULL`, `ON UPDATE CASCADE`
   - **Crucial Architectural Pattern**: If an item in the master catalog is archived or deleted, `booking_items.item_id` becomes `NULL`, but the transaction record is **100% intact** because `booking_items` stores:
     - `item_name_snapshot` (Name of item at time of order)
     - `unit_price` (Price of item at time of order)
     - `total_amount` (`quantity * unit_price`)

---

### D. Billing & Financial Transactions
10. **`bookings` (1) ───< (N) `invoices`**
    - **Cardinality**: One-to-Many (Typically 1-to-1 in standard stays; 1-to-Many if split billing or interim checkout applies)
    - **Foreign Key**: `invoices.booking_id` -> `bookings.id`
    - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
    - **Rationale**: Invoices are legal tax documents; they can never be cascade-deleted.

11. **`bookings` (1) ───< (N) `payments`**
    - **Cardinality**: One-to-Many
    - **Foreign Key**: `payments.booking_id` -> `bookings.id`
    - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
    - **Rationale**: All payments (advance deposits, interim room service payments, final checkout settlements) are permanently anchored to the booking.

12. **`invoices` (1) ───< (N) `payments`**
    - **Cardinality**: One-to-Many (Optional for advance payments)
    - **Foreign Key**: `payments.invoice_id` -> `invoices.id`
    - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
    - **Note on Nullability**: When a guest pays an advance at reservation/check-in, `invoice_id` is initially `NULL`. Upon checkout invoice generation, the advance payment and final payments are linked to the finalized invoice.

---

### E. Workforce & Payroll Architecture
13. **`staff` (1) ───< (N) `attendance`**
    - **Cardinality**: One-to-Many
    - **Foreign Key**: `attendance.staff_id` -> `staff.id`
    - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
    - **Constraint**: `@@unique([staff_id, attendance_date])` ensures zero duplicate attendance logs per employee per calendar day.

14. **`staff` (1) ───< (N) `salary_records`**
    - **Cardinality**: One-to-Many
    - **Foreign Key**: `salary_records.staff_id` -> `staff.id`
    - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
    - **Constraint**: `@@unique([staff_id, payroll_month, payroll_year])` ensures exact single-payroll generation per employee per pay cycle.

15. **`salary_records` (1) ───< (N) `salary_payments`**
    - **Cardinality**: One-to-Many
    - **Foreign Key**: `salary_payments.salary_record_id` -> `salary_records.id`
    - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
    - **Rationale**: Allows full or split/partial salary disbursements across dates or payment modes while tracking against the parent payroll record.

---

### F. Hotel Operational Expenses
16. **`expense_categories` (1) ───< (N) `expenses`**
    - **Cardinality**: One-to-Many
    - **Foreign Key**: `expenses.expense_category_id` -> `expense_categories.id`
    - **Rule**: `ON DELETE RESTRICT`, `ON UPDATE CASCADE`
    - **Rationale**: Outflows are permanently categorized (Electricity, Kitchen Supplies, Maintenance, etc.) for P&L reporting.
