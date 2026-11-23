# STATUTORY HOTEL DIGITAL REGISTERS (14 TYPES)

## 1. Overview
Under hospitality regulations and statutory compliance standards, hotels must maintain chronological, immutable registers of guests, room movements, police verification identities, financial collections, and employee attendance.

The Digital Registers module replaces physical logbooks with 14 electronic registers backed by live PostgreSQL data and instant CSV/PDF export capability.

## 2. Supported Register Catalog
| # | Register Name | Data Source | Primary Fields |
|---|---------------|-------------|----------------|
| 1 | Guest Directory Register | `Guest` | Guest Code, Full Name, Mobile, Email, Nationality, VIP Flag |
| 2 | Room Inventory Register | `Room`, `RoomType` | Room Number, Floor, Room Type, Base Price, Live Status |
| 3 | Reservation Register | `Booking` | Booking Ref, Guest Name, Room, Check-in Date, Checkout Date, Nights, Status |
| 4 | Check-In Arrival Register | `Booking` (`CHECKED_IN`) | Actual Check-In Timestamp, Key Issued, Primary Guest, Initial Deposit |
| 5 | Check-Out Departure Register | `Booking` (`CHECKED_OUT`) | Actual Check-Out Timestamp, Total Room Nights, Balance Settled |
| 6 | Invoice Billing Register | `Invoice` | Invoice Number, Subtotal, Tax Amount, Discount, Net Payable, Status |
| 7 | Payment Financial Ledger | `Payment` | Receipt Ref, Payment Date, Amount, Payment Method, Type, Status |
| 8 | POS & Services Catalog | `Item`, `ItemCategory` | Item Code, Name, Category, Unit Price, Service Flag |
| 9 | Staff Employment Register | `Staff` | Employee Code, Full Name, Mobile, Designation, Department, Monthly Salary |
| 10 | Daily Attendance Register | `Attendance` | Date, Employee, Status, Check-In, Check-Out, Working Hours, Overtime |
| 11 | Staff Advances Ledger | `StaffAdvance` | Advance Ref, Disbursed Date, Amount, Recovered, Balance, Status |
| 12 | Monthly Payroll Register | `SalaryRecord` | Month/Year, Staff, Basic, Overtime, Deductions, Net Salary, Paid, Balance |
| 13 | Hotel Expense Ledger | `Expense` | Expense Ref, Category, Description, Amount, Payment Method, Date |
| 14 | Security & System Audit Trail | `AuditLog` | Timestamp, Action, Entity Type, Entity ID, Description |

## 3. Architecture & Immutability
All digital registers query the database directly in read-only mode with strict timestamp sorting. Modifications must be performed through their respective business modules, ensuring the integrity of the audit trail.
