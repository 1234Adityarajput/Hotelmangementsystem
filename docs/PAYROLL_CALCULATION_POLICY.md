# Hotel Management Software — Payroll Calculation Policy & Specifications

**Project**: Hotel Management Software  
**Module**: Module 13 — Payroll and Salary Management  
**Architecture**: Modular Monolithic Architecture  
**Database**: Neon PostgreSQL (`neondb`)  
**Status**: APPROVED & IMPLEMENTED  

---

## 1. Executive Summary

This policy document specifies the mathematical formulas, attendance integration rules, overtime rates, deductions, advance recovery mechanisms, and database consistency guarantees for monthly staff salary processing in the Hotel Management Software.

All monetary calculations use strict **two-decimal precision** (`DECIMAL(12, 2)`) to satisfy the PostgreSQL database check constraint:
$$\text{balance\_amount} = \text{net\_salary} - \text{total\_paid}$$

---

## 2. Salary Calculation Formulas

### 2.1 Daily Rate Calculation
$$\text{daily\_rate} = \frac{\text{monthly\_basic\_salary}}{\text{configured\_salary\_days}}$$
- Default `configured_salary_days` = 30 (configurable per payroll run between 20 and 31).

### 2.2 Attendance Integration & Payable Days
Payable days are derived automatically from the staff attendance ledger for the given month:
$$\text{payable\_days} = \text{present\_days} + (\text{half\_days} \times 0.5) + \text{paid\_leaves}$$
- Where:
  - `present_days`: count of attendance records with status `PRESENT`
  - `half_days`: count of attendance records with status `HALF_DAY` (0.5 day credit)
  - `paid_leaves`: count of approved paid leaves with status `LEAVE`
  - `absent_days`: count of unexcused absences with status `ABSENT` (0.0 day credit)
  - `weekly_off`: standard weekly rest days included in monthly salary allocation
- Admins may supply a manual `payableDays` override when generating payroll.

### 2.3 Earned Basic Salary
$$\text{earned\_basic} = \text{ROUND}(\text{daily\_rate} \times \text{payable\_days}, 2)$$

### 2.4 Overtime Hours and Amount
Standard working shift: 8.0 hours. Hours worked beyond 8.0 hours on any day are accumulated as `overtime_hours`.
$$\text{hourly\_rate} = \frac{\text{daily\_rate}}{8}$$
$$\text{overtime\_amount} = \text{ROUND}(\text{overtime\_hours} \times \text{hourly\_rate} \times 1.5, 2)$$
- Overtime multiplier is set at 1.5x of the hourly wage base.

### 2.5 Gross Salary
$$\text{gross\_salary} = \text{earned\_basic} + \text{overtime\_amount}$$

### 2.6 Deductions and Staff Advance Recovery
$$\text{total\_deductions} = \text{deductions} + \text{advance\_deductions}$$
- `advance_deductions`: Automatically linked to staff member's pending records in `staff_advances`.
- Recovery validation:
  $$\text{advance\_deductions} \le \text{staff\_advance.balance\_amount}$$
  $$\text{total\_deductions} \le \text{gross\_salary}$$
- Deductions from payroll automatically update `recovered_amount`, reduce `balance_amount`, and update `repayment_status` (`PARTIALLY_REPAID` or `REPAID`) on the linked advance record.

### 2.7 Net Salary
$$\text{net\_salary} = \text{gross\_salary} - \text{deductions} - \text{advance\_deductions}$$

### 2.8 Salary Disbursement & Balance Relationship
$$\text{balance\_amount} = \text{net\_salary} - \text{total\_paid}$$
- Multiple partial disbursements are supported via `salary_payments`.
- Each disbursement requires:
  $$\text{payment\_amount} \le \text{salary\_record.balance\_amount}$$
- When $\text{balance\_amount} = 0$, payroll status transitions automatically from `FINALIZED` to `PAID`.

---

## 3. Database Constraints Catalog

| Constraint Name | Target Table | Rule | Description |
| :--- | :--- | :--- | :--- |
| `check_salary_amounts_positive` | `salary_records` | `monthly_basic_salary >= 0 AND gross_salary >= 0 AND net_salary >= 0 AND total_paid >= 0 AND balance_amount >= 0 AND total_paid <= net_salary` | Non-negative financials & payment capping |
| `check_salary_balance_relationship` | `salary_records` | `balance_amount = (net_salary - total_paid)` | Exact mathematical equality constraint |
| `check_salary_days_and_deductions` | `salary_records` | `payable_days >= 0 AND present_days >= 0 AND absent_days >= 0 AND deductions >= 0` | Non-negative attendance days and deductions |
| `check_payroll_period_valid` | `salary_records` | `payroll_month >= 1 AND payroll_month <= 12 AND payroll_year >= 2000 AND payroll_year <= 2100` | Valid calendar period boundaries |
| `check_salary_payment_positive` | `salary_payments` | `payment_amount > 0` | Strict positive payment disbursement |
| `unique_staff_payroll_period` | `salary_records` | `UNIQUE(staff_id, payroll_month, payroll_year)` | Prevents duplicate slips for same employee & month |

---

## 4. Policy Sign-Off
Approved by Principal Software Architect & Database Owner.
All formulas are implemented with transactional safety in `backend/src/payroll/payroll.service.ts`.
