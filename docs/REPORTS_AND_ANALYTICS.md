# EXECUTIVE REPORTS & BUSINESS ANALYTICS MODULE

## 1. Overview
The Reports and Analytics module provides high-level executive decision-making metrics, operational ratios, revenue performance indicators, and financial health summaries aggregated directly from live database tables.

## 2. Core Operational & Financial Metrics
1. **Executive Operational KPIs**:
   - `totalRooms`: Total physical room inventory across all floors.
   - `availableRooms`: Clean, unoccupied rooms ready for reservation.
   - `occupiedRooms`: Currently checked-in rooms.
   - `maintenanceRooms`: Out-of-service rooms undergoing repairs.
   - `overallOccupancyRate`: `(occupiedRooms / totalRooms) * 100`.
2. **Financial Aggregations**:
   - `todayRevenue`: Sum of payments collected between 00:00:00 and 23:59:59 today.
   - `monthlyRevenue`: Cumulative revenue from 1st of current calendar month.
   - `totalPendingBalance`: Outstanding uncollected balance across all open invoices.
   - `totalExpenses`: Cumulative operating expenses for selected period.
   - `netOperatingCashflow`: Total collections minus operating expenditures.
3. **Distribution Breakdown**:
   - Collections categorized by payment mode (`CASH`, `UPI`, `BANK_TRANSFER`, `OTHER`).
   - Occupancy breakdown grouped by `RoomType` (Deluxe, Suite, Standard).
   - Monthly expenses categorized by department/category.

## 3. Real-Time Query Architecture
Calculations are executed on-demand with PostgreSQL database aggregation (`_sum`, `_avg`, `count`) without stale cached counters, ensuring complete auditability and alignment with the financial ledger.
