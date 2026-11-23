# Hotel Management Software – Database Business Rules & Integrity Specifications

## 1. Single Admin Architecture & Singleton Enforcements

### Business Rule:
The software operates under a single administrative authority. Multiple administrator accounts, role hierarchies (RBAC), and receptionist/accountant accounts are explicitly forbidden.

### Database Enforcement:
To guarantee that at most **one** admin account can ever exist in PostgreSQL:
1. A boolean column `is_singleton` defaults to `true` with a `UNIQUE` constraint in `admins`.
2. A database-level CHECK constraint is enforced in PostgreSQL:
   ```sql
   ALTER TABLE "admins" ADD CONSTRAINT "check_admins_single_row" CHECK ("is_singleton" = true);
   ```
Because `is_singleton` can only be `true` and is constrained by uniqueness, attempting to insert a second admin row triggers a PostgreSQL unique key violation (`23505`).

The exact same mathematical pattern is applied to:
- `hotel_settings`: Enforces a single global configuration profile.
- `system_health`: Enforces a single system health heartbeat record.

---

## 2. Timezone & Accounting Date Rules
- **Standard Operating Timezone**: `Asia/Kolkata` (IST, UTC+5:30).
- **Date vs Timestamp Handling**:
  - `check_in_date`, `expected_check_out_date`, `invoice_date`, `payment_date`, `advance_date`, `attendance_date`, `joining_date`, `order_date`: Stored strictly as PostgreSQL `DATE` types (`@db.Date`). This eliminates UTC time-shift issues where a midnight UTC conversion would change the calendar date in Indian Standard Time.
  - `actual_check_in_at`, `actual_check_out_at`, `finalized_at`, `created_at`, `updated_at`: Stored as `TIMESTAMPTZ` (`TIMESTAMP WITH TIME ZONE` via `@db.Timestamptz(3)`) to capture exact audit moments.

---

## 3. Room Allocation Conflict Protection (Double Booking Prevention)

### Business Rule:
A physical room can **never** have overlapping active stays.

### Active Booking Criteria:
A booking is considered actively occupying or blocking a room if its status is:
- `RESERVED`
- `CHECKED_IN`

Completed stays (`CHECKED_OUT`) and `CANCELLED` bookings do not block rooms.

### Overlap Detection Algorithm:
Two date intervals `[A_start, A_end]` and `[B_start, B_end]` overlap if and only if:
$$\text{A\_start} < \text{B\_end} \quad \text{AND} \quad \text{A\_end} > \text{B\_start}$$

### Database-Level Exclusion Constraint (Zero Race Condition):
An ordinary compound index or application-layer check is susceptible to concurrent race conditions. To guarantee 100% database-enforced non-overlapping room allocation, a **PostgreSQL GiST Exclusion Constraint** is configured in `migration.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" ADD CONSTRAINT "no_overlapping_active_bookings"
EXCLUDE USING gist (
  "room_id" WITH =,
  daterange("check_in_date", "expected_check_out_date", '[)') WITH &&
)
WHERE ("booking_status" IN ('RESERVED', 'CHECKED_IN'));
```

### Maintenance Room Allocation Protection (Row-Locked & Bi-directional):
1. **Prevent Booking Maintenance Rooms with Shared Row Locks**:
```sql
CREATE OR REPLACE FUNCTION check_room_not_in_maintenance()
RETURNS TRIGGER AS $$
DECLARE
  v_status "RoomStatus";
BEGIN
  -- Acquire shared row lock on room to prevent concurrent maintenance status updates
  SELECT "room_status" INTO v_status
  FROM "rooms" 
  WHERE "id" = NEW."room_id"
  FOR SHARE;

  IF v_status = 'MAINTENANCE' THEN
    RAISE EXCEPTION 'Cannot allocate room %: Room is currently marked under MAINTENANCE.', NEW."room_id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_room_maintenance
BEFORE INSERT OR UPDATE OF "room_id", "booking_status" ON "bookings"
FOR EACH ROW
WHEN (NEW."booking_status" IN ('RESERVED', 'CHECKED_IN'))
EXECUTE FUNCTION check_room_not_in_maintenance();
```

2. **Prevent Flagging Occupied Rooms as Maintenance or Available**:
```sql
CREATE OR REPLACE FUNCTION protect_room_status_transitions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."room_status" = 'AVAILABLE' AND OLD."room_status" != 'AVAILABLE' THEN
    IF EXISTS (
      SELECT 1 FROM "bookings"
      WHERE "room_id" = NEW."id" AND "booking_status" = 'CHECKED_IN'
    ) THEN
      RAISE EXCEPTION 'Cannot mark room % as AVAILABLE: Room currently has an active CHECKED_IN guest stay. Guest must be checked out first.', NEW."id";
    END IF;
  END IF;

  IF NEW."room_status" = 'MAINTENANCE' AND OLD."room_status" != 'MAINTENANCE' THEN
    IF EXISTS (
      SELECT 1 FROM "bookings"
      WHERE "room_id" = NEW."id" AND "booking_status" = 'CHECKED_IN'
    ) THEN
      RAISE EXCEPTION 'Cannot mark room % as MAINTENANCE: Room currently has an active CHECKED_IN guest stay. Guests must be checked out or relocated first.', NEW."id";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_room_status_transitions
BEFORE UPDATE OF "room_status" ON "rooms"
FOR EACH ROW
EXECUTE FUNCTION protect_room_status_transitions();
```

---

## 4. Room Status Consistency with Active Bookings

### Business Rule:
The physical status of a room (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`) strictly mirrors real-world guest check-in states:
1. When a booking status transitions to `CHECKED_IN`, the room automatically transitions to `OCCUPIED`.
2. When a guest switches rooms while remaining `CHECKED_IN`, the new room becomes `OCCUPIED`, and the old room is safely released to `AVAILABLE` (if not under maintenance and no other active stay occupies it).
3. When a booking is completed (`CHECKED_OUT`) or voided (`CANCELLED`), the room automatically reverts to `AVAILABLE` (unless under maintenance or occupied by another active stay).

### Database Synchronization Trigger:
```sql
CREATE OR REPLACE FUNCTION sync_room_status_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: When a booking is created directly as CHECKED_IN
  IF (TG_OP = 'INSERT') THEN
    IF NEW."booking_status" = 'CHECKED_IN' THEN
      UPDATE "rooms"
      SET "room_status" = 'OCCUPIED', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = NEW."room_id" AND "room_status" != 'OCCUPIED';
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Case A: Guest switched rooms while remaining CHECKED_IN
    IF (OLD."booking_status" = 'CHECKED_IN' AND NEW."booking_status" = 'CHECKED_IN' AND OLD."room_id" != NEW."room_id") THEN
      UPDATE "rooms"
      SET "room_status" = 'OCCUPIED', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = NEW."room_id" AND "room_status" != 'OCCUPIED';

      IF NOT EXISTS (
        SELECT 1 FROM "bookings"
        WHERE "room_id" = OLD."room_id" AND "booking_status" = 'CHECKED_IN' AND "id" != NEW."id"
      ) THEN
        UPDATE "rooms"
        SET "room_status" = 'AVAILABLE', "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = OLD."room_id" AND "room_status" != 'MAINTENANCE';
      END IF;

    -- Case B: Newly checked in
    ELSIF (OLD."booking_status" != 'CHECKED_IN' AND NEW."booking_status" = 'CHECKED_IN') THEN
      UPDATE "rooms"
      SET "room_status" = 'OCCUPIED', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = NEW."room_id" AND "room_status" != 'OCCUPIED';

    -- Case C: Transitioned from CHECKED_IN to CHECKED_OUT or CANCELLED
    ELSIF (OLD."booking_status" = 'CHECKED_IN' AND NEW."booking_status" IN ('CHECKED_OUT', 'CANCELLED')) THEN
      IF NOT EXISTS (
        SELECT 1 FROM "bookings"
        WHERE "room_id" = NEW."room_id" AND "booking_status" = 'CHECKED_IN' AND "id" != NEW."id"
      ) THEN
        UPDATE "rooms"
        SET "room_status" = 'AVAILABLE', "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."room_id" AND "room_status" != 'MAINTENANCE';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_room_status_from_booking
AFTER INSERT OR UPDATE OF "booking_status", "room_id" ON "bookings"
FOR EACH ROW
EXECUTE FUNCTION sync_room_status_from_booking();
```

---

## 5. Primary Guest Consistency Architecture

### Business Rules:
1. Every booking has its primary guest in `booking_guests`.
2. Exactly **one** primary guest can exist per booking (`unique_primary_guest_per_booking`).
3. Updating `primaryGuestId` on a booking automatically updates the junction record.
4. Deleting, demoting, or unmatching the primary guest junction record directly while the booking references them is rejected.
5. Recursive trigger loops are strictly avoided via `pg_trigger_depth()`.

### Database Constraints & Triggers:
```sql
-- 1. Partial Unique Index: Only one primary guest per booking
CREATE UNIQUE INDEX "unique_primary_guest_per_booking" 
ON "booking_guests"("booking_id") 
WHERE ("is_primary_guest" = true);

-- 2. Synchronize primary guest junction record on booking creation or update
CREATE OR REPLACE FUNCTION sync_primary_booking_guest()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 2 THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO "booking_guests" ("id", "booking_id", "guest_id", "is_primary_guest", "created_at")
    VALUES (gen_random_uuid()::text, NEW."id", NEW."primary_guest_id", true, CURRENT_TIMESTAMP)
    ON CONFLICT ("booking_id", "guest_id") 
    DO UPDATE SET "is_primary_guest" = true;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF (OLD."primary_guest_id" != NEW."primary_guest_id") THEN
      UPDATE "booking_guests"
      SET "is_primary_guest" = false
      WHERE "booking_id" = NEW."id" AND "guest_id" = OLD."primary_guest_id";

      IF EXISTS (
        SELECT 1 FROM "booking_guests" WHERE "booking_id" = NEW."id" AND "guest_id" = NEW."primary_guest_id"
      ) THEN
        UPDATE "booking_guests"
        SET "is_primary_guest" = true
        WHERE "booking_id" = NEW."id" AND "guest_id" = NEW."primary_guest_id";
      ELSE
        INSERT INTO "booking_guests" ("id", "booking_id", "guest_id", "is_primary_guest", "created_at")
        VALUES (gen_random_uuid()::text, NEW."id", NEW."primary_guest_id", true, CURRENT_TIMESTAMP);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_primary_booking_guest
AFTER INSERT OR UPDATE OF "primary_guest_id" ON "bookings"
FOR EACH ROW
EXECUTE FUNCTION sync_primary_booking_guest();

-- 3. Protect primary guest junction record from invalid promotions, demotions, and deletions
CREATE OR REPLACE FUNCTION protect_primary_booking_guest()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_primary_guest TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN
    IF (TG_OP = 'DELETE') THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Block deletion of designated primary guest
  IF (TG_OP = 'DELETE') THEN
    SELECT "primary_guest_id" INTO v_booking_primary_guest
    FROM "bookings" WHERE "id" = OLD."booking_id";

    IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest = OLD."guest_id" THEN
      RAISE EXCEPTION 'Cannot delete primary guest record (guest %) for booking %: This guest is currently designated as primaryGuestId on the booking. Update bookings.primary_guest_id first.', OLD."guest_id", OLD."booking_id";
    END IF;
    RETURN OLD;
  END IF;

  -- Block insertion of unmatched primary guest
  IF (TG_OP = 'INSERT') THEN
    IF NEW."is_primary_guest" = true THEN
      SELECT "primary_guest_id" INTO v_booking_primary_guest
      FROM "bookings" WHERE "id" = NEW."booking_id";

      IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest != NEW."guest_id" THEN
        RAISE EXCEPTION 'Cannot set guest % as primary for booking %: Does not match bookings.primary_guest_id (%). Update bookings.primary_guest_id first.', NEW."guest_id", NEW."booking_id", v_booking_primary_guest;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Block invalid demotion or promotion
  IF (TG_OP = 'UPDATE') THEN
    SELECT "primary_guest_id" INTO v_booking_primary_guest
    FROM "bookings" WHERE "id" = NEW."booking_id";

    IF OLD."is_primary_guest" = true AND NEW."is_primary_guest" = false THEN
      IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest = OLD."guest_id" THEN
        RAISE EXCEPTION 'Cannot demote primary guest % for booking %: This guest is designated as primaryGuestId on the booking. Update bookings.primary_guest_id first.', OLD."guest_id", OLD."booking_id";
      END IF;
    END IF;

    IF NEW."is_primary_guest" = true THEN
      IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest != NEW."guest_id" THEN
        RAISE EXCEPTION 'Cannot promote guest % to primary for booking %: Does not match bookings.primary_guest_id (%). Update bookings.primary_guest_id first.', NEW."guest_id", NEW."booking_id", v_booking_primary_guest;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_primary_booking_guest
BEFORE INSERT OR UPDATE OR DELETE ON "booking_guests"
FOR EACH ROW
EXECUTE FUNCTION protect_primary_booking_guest();
```

---

## 6. Staff Advance & Loan Recovery Ledger

### Business Rule:
Staff members may receive salary advances or emergency loans. Advances must be tracked in a dedicated ledger (`staff_advances`) and deducted during monthly payroll calculations.

### Advance Constraints:
1. Advance amount must be strictly positive: `amount > 0`.
2. Recovered amount cannot be negative: `recovered_amount >= 0`.
3. Recovered amount **cannot exceed original advance**: `recovered_amount <= amount`.
4. Remaining advance balance is always: `amount - recovered_amount >= 0`.

---

## 7. Financial Calculation Rules (Zero Floating-Point)

### Precision Rule:
All monetary values in the database are defined as `DECIMAL(12, 2)` (or `NUMERIC(12, 2)` in PostgreSQL). Floating-point data types (`FLOAT`, `REAL`, `DOUBLE PRECISION`) are strictly forbidden.

### Invoicing Formulas:
1. **Room Charges**:
   $$\text{room\_charges} = \text{number\_of\_nights} \times \text{room\_rate\_per\_night}$$
2. **Additional Charges**:
   $$\text{additional\_charges} = \sum (\text{booking\_items.total\_amount})$$
3. **Subtotal**:
   $$\text{subtotal} = \text{room\_charges} + \text{additional\_charges}$$
4. **Discount Amount**:
   - If `discount_type == 'PERCENTAGE'`:
     $$\text{discount\_amount} = \text{ROUND}(\text{subtotal} \times \frac{\text{discount\_value}}{100}, 2)$$
   - If `discount_type == 'FIXED'`:
     $$\text{discount\_amount} = \text{discount\_value}$$
5. **Tax Amount**:
   $$\text{taxable\_amount} = \text{subtotal} - \text{discount\_amount}$$
   $$\text{tax\_amount} = \text{ROUND}(\text{taxable\_amount} \times \frac{\text{tax\_percentage}}{100}, 2)$$
6. **Total Invoice Amount**:
   $$\text{total\_amount} = \text{taxable\_amount} + \text{tax\_amount}$$
7. **Exact Invoice Balance Mathematical Relationship**:
   $$\text{balance\_amount} = \text{total\_amount} - \text{total\_paid}$$
   Enforced database rules:
   - `balance_amount = (total_amount - total_paid)`
   - `total_paid <= total_amount`
   - `balance_amount >= 0`

---

## 8. Database CHECK Constraints Catalog

| Constraint Name | Target Table | Condition | Purpose |
| :--- | :--- | :--- | :--- |
| `check_admins_single_row` | `admins` | `is_singleton = true` | Mathematical guarantee of single admin account |
| `check_hotel_settings_single_row` | `hotel_settings` | `is_singleton = true` | Guarantees single hotel profile |
| `check_system_health_single_row` | `system_health` | `is_singleton = true` | Guarantees single health ping row |
| `check_room_price_positive` | `rooms` | `price_per_night >= 0` | Non-negative room tariff |
| `check_room_type_price_positive` | `room_types` | `default_price_per_night >= 0` | Non-negative room type tariff |
| `check_room_rate_positive` | `bookings` | `room_rate_per_night >= 0 AND number_of_nights >= 0 AND number_of_guests > 0 AND advance_amount >= 0` | Valid stay metrics |
| `check_booking_dates` | `bookings` | `expected_check_out_date >= check_in_date` | Valid date sequence |
| `check_checked_in_timestamp` | `bookings` | `booking_status != 'CHECKED_IN' OR actual_check_in_at IS NOT NULL` | Requires check-in timestamp |
| `check_item_price_positive` | `items` | `unit_price >= 0` | Non-negative item catalog price (Fixed: unit_price not price) |
| `check_item_amounts_positive` | `booking_items` | `unit_price >= 0 AND total_amount >= 0 AND quantity > 0` | Positive quantity & amounts |
| `check_invoice_amounts_positive` | `invoices` | `room_charges >= 0 AND additional_charges >= 0 AND subtotal >= 0 AND tax_percentage >= 0 AND tax_amount >= 0 AND total_amount >= 0 AND total_paid >= 0 AND balance_amount >= 0 AND total_paid <= total_amount` | Valid bill financials & non-negative balance |
| `check_invoice_balance_relationship` | `invoices` | `balance_amount = (total_amount - total_paid)` | Exact mathematical balance relationship |
| `check_discount_validity` | `invoices` | `discount_value >= 0 AND discount_amount >= 0 AND (discount_type IS NULL OR discount_type = 'FIXED' OR (discount_type = 'PERCENTAGE' AND discount_value <= 100))` | NULL-safe discount bounds (0-100%) |
| `check_payment_amount_positive` | `payments` | `amount > 0` | Inflow payments must be positive |
| `check_monthly_salary_positive` | `staff` | `monthly_salary >= 0` | Non-negative salary base |
| `check_attendance_hours_positive` | `attendance` | `working_hours >= 0 AND overtime_hours >= 0` | Non-negative hours |
| `check_salary_amounts_positive` | `salary_records` | `monthly_basic_salary >= 0 AND gross_salary >= 0 AND net_salary >= 0 AND advance_deductions >= 0 AND total_paid >= 0 AND balance_amount >= 0 AND total_paid <= net_salary` | Valid payroll figures & payment limit |
| `check_salary_balance_relationship` | `salary_records` | `balance_amount = (net_salary - total_paid)` | Exact mathematical salary balance relationship |
| `check_salary_days_and_deductions` | `salary_records` | `payable_days >= 0 AND present_days >= 0 AND absent_days >= 0 AND half_days >= 0 AND paid_leaves >= 0 AND deductions >= 0` | Valid payroll days and deduction bounds |
| `check_payroll_period_valid` | `salary_records` | `payroll_month >= 1 AND payroll_month <= 12 AND payroll_year >= 2000 AND payroll_year <= 2100` | Valid month/year bounds |
| `check_salary_payment_positive` | `salary_payments` | `payment_amount > 0` | Salary disbursement must be positive |
| `check_staff_advance_recovery_limits` | `staff_advances` | `amount > 0 AND recovered_amount >= 0 AND recovered_amount <= amount` | Valid advance & recovery limits |
| `check_expense_amount_positive` | `expenses` | `amount > 0` | Operational expense must be positive |
