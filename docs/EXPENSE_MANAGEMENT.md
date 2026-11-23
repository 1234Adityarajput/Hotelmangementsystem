# HOTEL EXPENSE MANAGEMENT MODULE

## 1. Overview
The Expense Management module enables hotel management to record, categorize, and audit all operational, maintenance, administrative, kitchen, and housekeeping expenditures.

## 2. Architecture & Database Constraints
1. **Positive Expense Amount Constraint**:
   PostgreSQL enforces `check_expense_amount_positive` (`amount > 0`). Zero or negative amounts are rejected by database triggers.
2. **Category Classification**:
   Each expense is categorized under an active `ExpenseCategory` (e.g., Food & Beverage, Utilities, Linen & Laundry, Facility Maintenance, Marketing, Administrative).
3. **Payment Modes**:
   Supports `CASH`, `UPI`, `BANK_TRANSFER`, and `OTHER`. Bank transfers and UPI transactions capture unique transaction reference IDs.

## 3. Database Schema
```prisma
model ExpenseCategory {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  expenses Expense[]
  @@map("expense_categories")
}

model Expense {
  id                   String        @id @default(uuid())
  expenseReference     String        @unique @map("expense_reference")
  expenseCategoryId    String        @map("expense_category_id")
  description          String
  amount               Decimal       @db.Decimal(12, 2)
  paymentMethod        PaymentMethod @map("payment_method")
  paymentDate          DateTime      @map("payment_date") @db.Date
  transactionReference String?       @map("transaction_reference")
  notes                String?
  createdAt            DateTime      @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt            DateTime      @updatedAt @map("updated_at") @db.Timestamptz(3)

  category ExpenseCategory @relation(fields: [expenseCategoryId], references: [id], onDelete: Restrict)
  @@map("expenses")
}
```

## 4. API Endpoints
- `GET /api/v1/expenses` — Query expenses with category filtering, date ranges, total summary.
- `GET /api/v1/expenses/categories` — List active expense categories.
- `POST /api/v1/expenses/categories` — Create custom category.
- `POST /api/v1/expenses` — Record operational expenditure.
- `PATCH /api/v1/expenses/:id` — Update expense entry.
- `DELETE /api/v1/expenses/:id` — Delete expense entry (records audit log).
