# Hotel Management Software – Complete Database Schema Specification

**Database Engine**: PostgreSQL 16+ (Hosted on Neon Serverless)  
**ORM**: Prisma ORM v5.22.0  
**Database Owner**: Developer 1  
**Default Timezone**: `Asia/Kolkata` (IST, UTC+5:30)  
**Financial Accuracy Standard**: `DECIMAL(12, 2)` (Strictly zero floating-point arithmetic)

---

## 1. Summary of Database Tables & Enums

### Enums (12):
- `RoomStatus`: `AVAILABLE`, `OCCUPIED`, `MAINTENANCE`
- `BookingStatus`: `RESERVED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`
- `InvoiceStatus`: `DRAFT`, `FINALIZED`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`
- `DiscountType`: `PERCENTAGE`, `FIXED`
- `PaymentMethod`: `CASH`, `UPI`, `BANK_TRANSFER`, `OTHER`
- `PaymentType`: `ADVANCE`, `PARTIAL`, `FINAL`, `REFUND`
- `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`
- `EmploymentStatus`: `ACTIVE`, `INACTIVE`, `TERMINATED`, `RESIGNED`
- `AttendanceStatus`: `PRESENT`, `ABSENT`, `HALF_DAY`, `LEAVE`, `WEEKLY_OFF`
- `PayrollStatus`: `DRAFT`, `FINALIZED`, `PAID`, `PARTIALLY_PAID`
- `AdvanceStatus`: `PENDING`, `PARTIALLY_REPAID`, `REPAID`, `WAIVED`
- `AuditAction`: `CREATE`, `UPDATE`, `DELETE`, `FINALIZE`, `CANCEL`, `CORRECTION`

### Tables (22 Models):
1. `admins` (Single Admin with singleton enforcement)
2. `guests`
3. `guest_documents`
4. `room_types`
5. `rooms`
6. `bookings` (Default status `RESERVED`, exclusion constraint protected)
7. `booking_guests`
8. `item_categories`
9. `items`
10. `booking_items`
11. `invoices` (Includes snapshot `tax_percentage`)
12. `payments`
13. `staff`
14. `attendance`
15. `staff_advances` (Staff advance & loan recovery ledger)
16. `salary_records`
17. `salary_payments`
18. `expense_categories`
19. `expenses`
20. `hotel_settings` (Singleton table)
21. `audit_logs`
22. `system_health` (Singleton table)

---

## 2. Table-by-Table Data Dictionary

### 2.1. `admins` (Single Admin Authentication)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `username` | `VARCHAR(100)` | No | - | Unique login identifier |
| `email` | `VARCHAR(255)` | Yes | `NULL` | Optional unique email address |
| `password_hash` | `TEXT` | No | - | Bcrypt hashed password (12 salt rounds) |
| `is_active` | `BOOLEAN` | No | `true` | Admin account active status |
| `is_singleton` | `BOOLEAN` | No | `true` | Unique + `CHECK (is_singleton = true)` enforces maximum 1 row |
| `last_login_at` | `TIMESTAMPTZ` | Yes | `NULL` | Timestamp of latest login |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Account modification timestamp |

---

### 2.2. `guests` (Guest Master Directory)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `guest_code` | `VARCHAR(50)` | No | - | Unique system code (e.g. `GST-00001`) |
| `full_name` | `VARCHAR(200)` | No | - | Full legal name of guest |
| `mobile_number` | `VARCHAR(20)` | No | - | Primary phone (indexed for lookup) |
| `alternate_mobile_number` | `VARCHAR(20)` | Yes | `NULL` | Secondary contact |
| `email` | `VARCHAR(255)` | Yes | `NULL` | Guest email address (indexed) |
| `address` | `TEXT` | Yes | `NULL` | Residential address |
| `city` | `VARCHAR(100)` | Yes | `NULL` | City |
| `state` | `VARCHAR(100)` | Yes | `NULL` | State / Province |
| `postal_code` | `VARCHAR(20)` | Yes | `NULL` | Postal / PIN code |
| `country` | `VARCHAR(100)` | No | `'India'` | Country of citizenship/origin |
| `date_of_birth` | `DATE` | Yes | `NULL` | Date of birth |
| `gender` | `VARCHAR(20)` | Yes | `NULL` | Gender (MALE, FEMALE, OTHER) |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Profile created at |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Profile updated at |

Indexes: `guests_mobile_number_idx`, `guests_full_name_idx`, `guests_email_idx`.

---

### 2.3. `guest_documents` (Guest Identity Documents)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `guest_id` | `TEXT` | No | - | Foreign Key -> `guests(id)` ON DELETE CASCADE |
| `document_type` | `VARCHAR(50)` | No | - | e.g. AADHAAR, PASSPORT, DRIVING_LICENSE |
| `document_number` | `VARCHAR(100)`| No | - | Document / ID card number |
| `document_file_reference` | `TEXT` | No | - | S3/Blob URL or secure storage key |
| `uploaded_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Upload timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Modification timestamp |

---

### 2.4. `room_types` (Room Categories & Tariffs)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `name` | `VARCHAR(100)` | No | - | Category name (e.g. Deluxe AC, Suite) UNIQUE |
| `description` | `TEXT` | Yes | `NULL` | Features, amenities |
| `default_price_per_night` | `DECIMAL(12,2)` | No | - | Base tariff. `CHECK (default_price_per_night >= 0)` |
| `capacity` | `INTEGER` | No | `2` | Max standard guest capacity |
| `is_active` | `BOOLEAN` | No | `true` | Active status |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Record modification timestamp |

---

### 2.5. `rooms` (Individual Physical Rooms)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `room_number` | `VARCHAR(20)` | No | - | Room identifier (e.g. "101", "202") UNIQUE |
| `room_type_id` | `TEXT` | No | - | Foreign Key -> `room_types(id)` ON DELETE RESTRICT |
| `description` | `TEXT` | Yes | `NULL` | Room specific notes |
| `floor` | `INTEGER` | No | `1` | Floor number |
| `price_per_night` | `DECIMAL(12,2)` | No | - | Active tariff. `CHECK (price_per_night >= 0)` |
| `room_status` | `RoomStatus` | No | `'AVAILABLE'` | Enum: AVAILABLE, OCCUPIED, MAINTENANCE |
| `is_active` | `BOOLEAN` | No | `true` | Operational status |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Room creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Room modification timestamp |

Indexes: `rooms_room_status_idx`, `rooms_room_type_id_idx`.

---

### 2.6. `bookings` (Stays & Reservations)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `booking_number` | `VARCHAR(50)` | No | - | Unique reference code (e.g. `BKG-202611-001`) |
| `primary_guest_id` | `TEXT` | No | - | Foreign Key -> `guests(id)` ON DELETE RESTRICT |
| `room_id` | `TEXT` | No | - | Foreign Key -> `rooms(id)` ON DELETE RESTRICT |
| `booking_status` | `BookingStatus` | No | `'RESERVED'` | Enum: RESERVED, CHECKED_IN, CHECKED_OUT, CANCELLED |
| `check_in_date` | `DATE` | No | - | Scheduled check-in date |
| `check_in_time` | `VARCHAR(10)` | Yes | `NULL` | Scheduled check-in time (e.g. "12:00 PM") |
| `expected_check_out_date` | `DATE` | No | - | Scheduled check-out date |
| `expected_check_out_time`| `VARCHAR(10)` | Yes | `NULL` | Scheduled check-out time (e.g. "11:00 AM") |
| `actual_check_in_at` | `TIMESTAMPTZ` | Yes | `NULL` | Exact check-in moment |
| `actual_check_out_at`| `TIMESTAMPTZ` | Yes | `NULL` | Exact check-out moment |
| `number_of_nights` | `INTEGER` | No | - | Calculated night count (`>= 0`) |
| `number_of_guests` | `INTEGER` | No | `1` | Guest count (`> 0`) |
| `room_rate_per_night`| `DECIMAL(12,2)` | No | - | Rate frozen at booking. `CHECK (room_rate_per_night >= 0)` |
| `advance_amount` | `DECIMAL(12,2)` | No | `0.00` | Advance deposit paid at reservation |
| `notes` | `TEXT` | Yes | `NULL` | Special requests or remarks |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Record modification timestamp |

Advanced Constraints & Triggers:
- GiST Exclusion Constraint: `no_overlapping_active_bookings` on `(room_id, daterange(check_in_date, expected_check_out_date, '[)'))` for status `IN ('RESERVED', 'CHECKED_IN')`.
- Trigger `trg_check_room_maintenance`: Prevents reserving/checking-in rooms in `MAINTENANCE`.
- Trigger `trg_sync_room_status_from_booking`: Sets room status to `OCCUPIED` on `CHECKED_IN`, and `AVAILABLE` on `CHECKED_OUT`/`CANCELLED`.
- Trigger `trg_ensure_primary_booking_guest`: Automatically creates primary entry in `booking_guests`.
- CHECK: `check_checked_in_timestamp` (`booking_status != 'CHECKED_IN' OR actual_check_in_at IS NOT NULL`).
- CHECK: `check_booking_dates` (`expected_check_out_date >= check_in_date`).

---

### 2.7. `booking_guests` (Co-Guests & Primary Link)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `booking_id` | `TEXT` | No | - | Foreign Key -> `bookings(id)` ON DELETE CASCADE |
| `guest_id` | `TEXT` | No | - | Foreign Key -> `guests(id)` ON DELETE CASCADE |
| `is_primary_guest` | `BOOLEAN` | No | `false` | True for the primary booker |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Association timestamp |

Unique Constraint: `@@unique([booking_id, guest_id])`.

---

### 2.8. `item_categories` & `items` (Catalog)
- `item_categories`: `id`, `name` (UNIQUE), `description`, `is_active`.
- `items`: `id`, `name`, `category_id`, `unit_price` (`DECIMAL(12, 2)`), `description`, `is_active`. `CHECK (price >= 0)`.

---

### 2.9. `booking_items` (In-Stay Orders)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `booking_id` | `TEXT` | No | - | Foreign Key -> `bookings(id)` ON DELETE CASCADE |
| `item_id` | `TEXT` | Yes | `NULL` | Foreign Key -> `items(id)` ON DELETE SET NULL |
| `item_name_snapshot` | `VARCHAR(150)`| No | - | Immutable item name snapshot |
| `quantity` | `INTEGER` | No | `1` | Quantity ordered (`> 0`) |
| `unit_price` | `DECIMAL(12,2)` | No | - | Price per unit at purchase (`>= 0`) |
| `total_amount` | `DECIMAL(12,2)` | No | - | `quantity * unit_price` (`>= 0`) |
| `order_date` | `DATE` | No | - | Calendar order date |
| `notes` | `TEXT` | Yes | `NULL` | Service notes |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Order timestamp |

---

### 2.10. `invoices` (Guest Checkout Billing)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `invoice_number` | `VARCHAR(50)` | No | - | Unique tax invoice number |
| `booking_id` | `TEXT` | No | - | Foreign Key -> `bookings(id)` ON DELETE RESTRICT |
| `invoice_date` | `DATE` | No | - | Billing date |
| `invoice_status` | `InvoiceStatus` | No | `'DRAFT'` | DRAFT, FINALIZED, PARTIALLY_PAID, PAID, CANCELLED |
| `room_charges` | `DECIMAL(12,2)` | No | - | Room stay subtotal (`>= 0`) |
| `additional_charges`| `DECIMAL(12,2)`| No | `0.00` | Room service and extra services |
| `subtotal` | `DECIMAL(12,2)` | No | - | `room_charges + additional_charges` (`>= 0`) |
| `discount_type` | `DiscountType` | Yes | `NULL` | PERCENTAGE or FIXED |
| `discount_value` | `DECIMAL(12,2)` | No | `0.00` | Discount figure |
| `discount_amount`| `DECIMAL(12,2)` | No | `0.00` | Computed discount |
| `tax_percentage` | `DECIMAL(5,2)` | No | `0.00` | Applied tax percentage snapshot (`>= 0`) |
| `tax_amount` | `DECIMAL(12,2)` | No | `0.00` | Computed GST/VAT |
| `total_amount` | `DECIMAL(12,2)` | No | - | Net invoice total (`>= 0`) |
| `total_paid` | `DECIMAL(12,2)` | No | `0.00` | Total collected payments (`>= 0`) |
| `balance_amount` | `DECIMAL(12,2)` | No | - | `total_amount - total_paid` |
| `finalized_at` | `TIMESTAMPTZ` | Yes | `NULL` | Checkout freeze timestamp |
| `notes` | `TEXT` | Yes | `NULL` | Bill notes |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Created timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Modified timestamp |

CHECK Constraints:
- `check_invoice_amounts_positive`: `room_charges >= 0 AND subtotal >= 0 AND total_amount >= 0 AND total_paid >= 0 AND tax_percentage >= 0`
- `check_discount_validity`: `discount_type != 'PERCENTAGE' OR (discount_value >= 0 AND discount_value <= 100)`

---

### 2.11. `payments` (Guest Inflow Transactions)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `payment_reference`| `VARCHAR(50)` | No | - | Unique transaction receipt ID |
| `booking_id` | `TEXT` | No | - | Foreign Key -> `bookings(id)` ON DELETE RESTRICT |
| `invoice_id` | `TEXT` | Yes | `NULL` | Foreign Key -> `invoices(id)` ON DELETE RESTRICT |
| `payment_date` | `DATE` | No | - | Accounting calendar date |
| `amount` | `DECIMAL(12,2)` | No | - | Paid amount. `CHECK (amount > 0)` |
| `payment_method` | `PaymentMethod` | No | - | CASH, UPI, BANK_TRANSFER, OTHER |
| `payment_type` | `PaymentType` | No | - | ADVANCE, PARTIAL, FINAL, REFUND |
| `payment_status` | `PaymentStatus` | No | `'COMPLETED'`| PENDING, COMPLETED, FAILED, REFUNDED |
| `transaction_id` | `VARCHAR(100)`| Yes | `NULL` | UPI / Bank UTR number |
| `notes` | `TEXT` | Yes | `NULL` | Transaction remarks |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Recorded timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Updated timestamp |

---

### 2.12. `staff` & `attendance` (Staff & Daily Clock Register)
- `staff`: `id`, `employee_code` (UNIQUE), `full_name`, `mobile_number`, `designation`, `department`, `joining_date`, `monthly_salary` (`DECIMAL(12, 2) >= 0`), `employment_status`, `is_active`.
- `attendance`: `id`, `staff_id`, `attendance_date`, `status`, `check_in_time`, `check_out_time`, `working_hours` (`>= 0`), `overtime_hours` (`>= 0`), `notes`. Unique: `@@unique([staff_id, attendance_date])`.

---

### 2.13. `staff_advances` (Staff Advance & Loan Ledger)
| Column | PostgreSQL Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `TEXT` / `UUID` | No | `gen_random_uuid()` | Primary Key |
| `staff_id` | `TEXT` | No | - | Foreign Key -> `staff(id)` ON DELETE RESTRICT |
| `amount` | `DECIMAL(12,2)` | No | - | Disbursed loan/advance amount. `CHECK (amount > 0)` |
| `recovered_amount` | `DECIMAL(12,2)` | No | `0.00` | Amount recovered so far. `CHECK (recovered_amount >= 0)` |
| `advance_date` | `DATE` | No | - | Disbursed calendar date |
| `status` | `AdvanceStatus` | No | `'PENDING'` | PENDING, PARTIALLY_REPAID, REPAID, WAIVED |
| `reason` | `TEXT` | Yes | `NULL` | Advance request description |
| `salary_record_id` | `TEXT` | Yes | `NULL` | Foreign Key -> `salary_records(id)` ON DELETE SET NULL |
| `created_at` | `TIMESTAMPTZ` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | Auto-update | Record modification timestamp |

---

### 2.14. `salary_records` & `salary_payments` (Payroll & Disbursements)
- `salary_records`: `id`, `staff_id`, `payroll_month` (1-12), `payroll_year` (2000-2100), `total_month_days`, `present_days`, `absent_days`, `half_days`, `paid_leaves`, `payable_days`, `monthly_basic_salary` (`DECIMAL(12, 2)`), `gross_salary`, `advance_deductions`, `net_salary`, `total_paid`, `balance_amount`, `payroll_status`. Unique: `@@unique([staff_id, payroll_month, payroll_year])`.
- `salary_payments`: `id`, `salary_record_id`, `payment_reference` (UNIQUE), `payment_date`, `payment_amount` (`> 0`), `payment_method`, `notes`.

---

### 2.15. `expense_categories` & `expenses` (Operating Expenses)
- `expense_categories`: `id`, `name` (UNIQUE), `description`, `is_active`.
- `expenses`: `id`, `expense_reference` (UNIQUE), `expense_category_id`, `title`, `description`, `amount` (`DECIMAL(12, 2) > 0`), `payment_date`, `payment_method`, `paid_to`, `notes`.

---

### 2.16. `hotel_settings`, `audit_logs`, `system_health`
- `hotel_settings`: Singleton configuration (`is_singleton` UNIQUE + `CHECK (is_singleton = true)`).
- `audit_logs`: Entity change history (`entity_type`, `entity_id`, `action`, `performed_by`, `old_values`, `new_values`, `changed_at`).
- `system_health`: Singleton health status (`is_singleton` UNIQUE + `CHECK (is_singleton = true)`).
