# Hotel Management Software – Complete Database Entity-Relationship Diagram

This document illustrates the entire normalized PostgreSQL schema for the Hotel Management Software. All core transactional entities, financial pipelines, staffing modules, and administrative logs are represented with their exact cardinality.

---

## Complete Mermaid ER Diagram

```mermaid
erDiagram
    ADMINS ||--|| HOTEL_SETTINGS : "manages"

    GUESTS ||--o{ GUEST_DOCUMENTS : "submits"
    GUESTS ||--o{ BOOKINGS : "books_as_primary"
    GUESTS ||--o{ BOOKING_GUESTS : "occupies_as_member"

    ROOM_TYPES ||--o{ ROOMS : "categorizes"
    ROOMS ||--o{ BOOKINGS : "allocated_to"

    BOOKINGS ||--o{ BOOKING_GUESTS : "includes"
    BOOKINGS ||--o{ BOOKING_ITEMS : "consumes"
    BOOKINGS ||--o{ INVOICES : "billed_under"
    BOOKINGS ||--o{ PAYMENTS : "settled_by"

    ITEM_CATEGORIES ||--o{ ITEMS : "classifies"
    ITEMS ||--o{ BOOKING_ITEMS : "referenced_in"

    INVOICES ||--o{ PAYMENTS : "clears"

    STAFF ||--o{ ATTENDANCE : "logs_daily"
    STAFF ||--o{ SALARY_RECORDS : "earns_monthly"
    SALARY_RECORDS ||--o{ SALARY_PAYMENTS : "disburses"

    EXPENSE_CATEGORIES ||--o{ EXPENSES : "groups"

    AUDIT_LOGS }o--|| BOOKINGS : "tracks"
    AUDIT_LOGS }o--|| INVOICES : "tracks"
    AUDIT_LOGS }o--|| SALARY_RECORDS : "tracks"

    ADMINS {
        string id PK
        string username UK
        string email UK
        string password_hash
        boolean is_active
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }

    HOTEL_SETTINGS {
        string id PK
        string hotel_name
        string hotel_address
        string mobile_number
        string email
        string currency_code
        string timezone
        string default_check_in_time
        string default_check_out_time
        boolean tax_enabled
        decimal default_tax_percentage
        int default_salary_days
    }

    GUESTS {
        string id PK
        string guest_code UK
        string full_name
        string mobile_number
        string email
        string address
        string city
        string state
        string country
        date date_of_birth
        string gender
    }

    GUEST_DOCUMENTS {
        string id PK
        string guest_id FK
        string document_type
        string document_number
        string document_file_reference
        timestamp uploaded_at
    }

    ROOM_TYPES {
        string id PK
        string name UK
        string description
        decimal default_price_per_night
        int capacity
        boolean is_active
    }

    ROOMS {
        string id PK
        string room_number UK
        string room_type_id FK
        decimal price_per_night
        string room_status
        int floor
        boolean is_active
    }

    BOOKINGS {
        string id PK
        string booking_number UK
        string primary_guest_id FK
        string room_id FK
        string booking_status
        date check_in_date
        date expected_check_out_date
        timestamp actual_check_in_at
        timestamp actual_check_out_at
        int number_of_nights
        int number_of_guests
        decimal room_rate_per_night
        decimal advance_amount
        string notes
    }

    BOOKING_GUESTS {
        string id PK
        string booking_id FK
        string guest_id FK
        boolean is_primary_guest
    }

    ITEM_CATEGORIES {
        string id PK
        string name UK
        string description
        boolean is_active
    }

    ITEMS {
        string id PK
        string category_id FK
        string name
        decimal unit_price
        boolean is_active
    }

    BOOKING_ITEMS {
        string id PK
        string booking_id FK
        string item_id FK
        string item_name_snapshot
        int quantity
        decimal unit_price
        decimal total_amount
        date purchase_date
        string purchase_time
    }

    INVOICES {
        string id PK
        string invoice_number UK
        string booking_id FK
        string invoice_status
        decimal room_charges
        decimal additional_charges
        decimal subtotal
        string discount_type
        decimal discount_value
        decimal discount_amount
        decimal tax_amount
        decimal total_amount
        decimal total_paid
        decimal balance_amount
        date invoice_date
        timestamp finalized_at
    }

    PAYMENTS {
        string id PK
        string payment_reference UK
        string booking_id FK
        string invoice_id FK
        string payment_type
        string payment_method
        decimal amount
        string transaction_reference
        date payment_date
        string payment_status
    }

    STAFF {
        string id PK
        string employee_code UK
        string full_name
        string mobile_number
        string email
        string designation
        string department
        date joining_date
        string employment_status
        decimal monthly_salary
        string bank_account_number
        string bank_ifsc_code
    }

    ATTENDANCE {
        string id PK
        string staff_id FK
        date attendance_date
        string attendance_status
        string check_in_time
        string check_out_time
        decimal working_hours
        decimal overtime_hours
    }

    SALARY_RECORDS {
        string id PK
        string staff_id FK
        int payroll_month
        int payroll_year
        decimal monthly_basic_salary
        int configured_salary_days
        decimal payable_days
        decimal present_days
        decimal absent_days
        decimal gross_salary
        decimal deductions
        decimal advance_deductions
        decimal net_salary
        string payroll_status
        timestamp finalized_at
    }

    SALARY_PAYMENTS {
        string id PK
        string salary_record_id FK
        string payment_reference UK
        decimal payment_amount
        string payment_method
        date payment_date
        string transaction_reference
    }

    EXPENSE_CATEGORIES {
        string id PK
        string name UK
        string description
        boolean is_active
    }

    EXPENSES {
        string id PK
        string expense_reference UK
        string expense_category_id FK
        string description
        decimal amount
        string payment_method
        date payment_date
        string transaction_reference
    }

    AUDIT_LOGS {
        string id PK
        string entity_type
        string entity_id
        string action
        json previous_values
        json new_values
        timestamp changed_at
        string description
    }
```

---

## Visual Subsystem Architecture

1. **Guest & Stay Core**:
   `guests` <-> `guest_documents`  
   `guests` <-> `bookings` <-> `rooms` <-> `room_types`  
   `bookings` <-> `booking_guests` <-> `guests`

2. **Commerce & Billing Pipeline**:
   `item_categories` <-> `items` <-> `booking_items` <-> `bookings`  
   `bookings` <-> `invoices` <-> `payments`  
   `bookings` <-> `payments` (Advance payments recorded before invoice finalization)

3. **Workforce & Payroll Pipeline**:
   `staff` <-> `attendance` (Daily time tracking)  
   `staff` <-> `salary_records` <-> `salary_payments` (Monthly payroll cycles and disbursement)

4. **Cash Flow & Operational Outflows**:
   `expense_categories` <-> `expenses`  
   `daily_cash_book`: Virtual aggregation of `payments` (inflows) and `expenses` + `salary_payments` (outflows).
