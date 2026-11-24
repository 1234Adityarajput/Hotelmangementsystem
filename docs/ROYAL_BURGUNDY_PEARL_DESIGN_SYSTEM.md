# ROYAL BURGUNDY & PEARL — DESIGN SYSTEM & ARCHITECTURE
**The Grand Horizon Luxury Hotel & Resort OS**  
*Five-Star Luxury Hospitality Management Platform*

---

## 1. Design Identity & Philosophy

The **Royal Burgundy & Pearl** design system embodies five-star luxury hospitality and royal boutique hotel refinement. It blends the warmth of natural pearl surfaces with the authority and grandeur of deep royal burgundy, accented sparingly by warm champagne gold.

### Core Tenets:
- **Five-Star Luxury Hospitality**: Dignified, calm, and editorial.
- **Royal Boutique Aesthetic**: Deep royal burgundy tones coupled with pearl backgrounds and subtle gold leaf accents.
- **Modern Enterprise Architecture**: High-density operational data tables, real-time KPI ribbons, and compliant audit trails.
- **Typography-First**: Manrope for interface readability paired with Playfair Display for editorial hotel headings.

---

## 2. Exact Colour Palette & Design Tokens

### Primary Theme Palette
| Token Name | Hex Code | HSL / CSS Variable | Purpose & Usage |
| :--- | :--- | :--- | :--- |
| **Primary Royal Burgundy** | `#59283A` | `338 38% 25%` | Primary brand color, sidebar background, headings, primary buttons |
| **Deep Wine** | `#472130` | `337 36% 20%` | Sidebar active background, button hover states, card depth |
| **Muted Burgundy** | `#7A4652` | `346 27% 38%` | Section badges, secondary accents, metric labels |
| **Champagne Gold** | `#C4A06A` | `36 44% 59%` | Active indicators, focus rings, premium icons, monetary highlights |
| **Pearl Background** | `#F5F0EA` | `33 27% 94%` | Main application background, table header fill, soft container surfaces |
| **Warm White** | `#FFFFFF` | `0 0% 100%` | Primary content cards, form fields, modal bodies |
| **Muted Rose** | `#8E7079` | `342 12% 50%` | Sidebar category headings, inactive icons, placeholder text |
| **Soft Border** | `#E8DDD8` | `20 22% 88%` | Card borders, table dividers, input borders, structural rules |
| **Main Text** | `#352630` | `320 16% 18%` | Primary body copy, table cell content, high-contrast values |
| **Secondary Text** | `#82747A` | `333 6% 49%` | Card descriptions, subtitles, table captions, helper copy |

### Semantic Hospitality Colors
| Status | Primary Hex | Background Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `#32765B` | `#E7F1E9` | Paid status, Confirmed bookings, Active staff, Available rooms, Positive margin |
| **Warning** | `#A97832` | `#F6EDDC` | Pending payments, Maintenance rooms, Partial settlements, Overdue folios |
| **Danger** | `#B54C44` | `#F8E8E5` | Cancelled bookings, Absent staff, Terminated status, Unpaid balances |
| **Information** | `#627D91` | `#E9EFF3` | In-house stays, Guest counts, System logs, Database probes |

---

## 3. Typography Scale & Font Pairing

1. **Interface & Body**: `Manrope` (via `next/font/google`, variable `--font-manrope`)
   - Crisp geometric sans-serif engineered for tabular numbers and micro-UI readability.
2. **Editorial Branding & Headings**: `Playfair Display` (via `next/font/google`, variable `--font-playfair`)
   - High-contrast transitional serif imparting timeless royal boutique luxury.

```css
/* Typography Scale */
h1, .page-title     -> font-serif (Playfair Display), font-bold, text-2xl/3xl, text-[#59283A]
h2, .section-title  -> font-serif (Playfair Display), font-bold, text-xl, text-[#59283A]
h3, .card-title     -> font-serif (Playfair Display), font-bold, text-base/lg, text-[#59283A]
.metric-kpi         -> font-sans (Manrope), font-mono, font-bold, text-2xl/3xl, text-[#352630]
body, table cells   -> font-sans (Manrope), font-normal/medium, text-xs/sm, text-[#352630]
micro-labels, badges-> font-sans (Manrope), font-semibold, uppercase, tracking-wider, text-[10px]/text-[11px]
```

---

## 4. Application Sidebar Specifications

- **Background**: `#59283A` (Royal Burgundy)
- **Top Brand Header**: "The Grand Horizon" with dual-tone Crown/Hotel emblem (`#C4A06A` on `#472130`).
- **Category Labels**: `#8E7079` (Muted Rose) in uppercase bold tracking-wider.
- **Inactive Nav Items**: White text (opacity 90%), `#8E7079` icon, hover state `#472130`.
- **Active Nav Items**: Deep Wine background (`#472130`), crisp white font, Champagne Gold icon (`#C4A06A`), and a vertical Champagne Gold left indicator bar (`w-1 bg-[#C4A06A] rounded-r-full`).
- **Desktop Collapse**: Supports 1-click toggle from `w-64` to `w-20` (icon-only mode with centered active indicators).
- **Mobile Responsive Drawer**: Off-canvas drawer sliding from left with high-contrast backdrop blur (`bg-black/60`).

### Navigation Hierarchy:
1. **OVERVIEW**: Dashboard (`/`)
2. **FRONT OFFICE**: Guests (`/guests`), Rooms (`/rooms`), Bookings (`/bookings`), Stays (`/stays`)
3. **OPERATIONS**: Automatic Billing (`/billing`), Items & Services (`/items`), Invoices (`/invoices`), Payments (`/payments`)
4. **WORKFORCE**: Staff (`/staff`), Attendance (`/attendance`), Advances (`/advances`), Payroll (`/payroll`)
5. **FINANCE**: Expenses (`/expenses`), Reports (`/reports`)
6. **RECORDS**: Registers (`/registers`), Audit Logs (`/audit-logs`)
7. **ADMINISTRATION**: Settings (`/settings`), DB Health & Setup (`/setup`)

---

## 5. Main Layout & Component Conventions

### 1. Main Application Shell
- **Background**: Pearl `#F5F0EA` spanning 100vw and 100vh.
- **Header**: Warm White `#FFFFFF`, border-b `#E8DDD8`, page category badge in `#F5F0EA`, title in `#59283A`, live Neon DB indicator in `#E7F1E9` (`#32765B`), and Admin profile pill.
- **Main Scroll Area**: Spacious internal padding (`p-4 sm:p-6 lg:p-8`) with luxury scrollbars (`#E8DDD8` thumb, `#C4A06A` hover).

### 2. Standardized Component Library
- **Primary Button**: `bg-[#59283A] text-white hover:bg-[#472130] focus-visible:ring-[#C4A06A]`
- **Secondary Button**: `bg-[#F5F0EA] text-[#59283A] hover:bg-[#EFE8E0] border-[#E8DDD8]`
- **Accent Button**: `bg-[#C4A06A] text-[#352630] hover:bg-[#B8935D] font-bold`
- **Destructive Button**: `bg-[#B54C44] text-white hover:bg-[#9E3E37]`
- **Card**: `bg-white border-[#E8DDD8] rounded-2xl shadow-[0_2px_12px_rgba(71,33,48,0.04)]`
- **Input / Select**: `bg-white border-[#E8DDD8] text-[#352630] placeholder-[#82747A] focus:ring-[#C4A06A]`
- **Table**:
  - Header: `bg-[#F5F0EA] border-b border-[#E8DDD8] text-[#59283A] font-bold uppercase tracking-wider`
  - Rows: `border-b border-[#E8DDD8] hover:bg-[#F5F0EA]/60 transition-colors`
- **Dialog / Modal**: `bg-white border-[#E8DDD8] rounded-2xl shadow-2xl` with Playfair Display heading.

---

## 6. General Software Features Implementation (Module 16)

| Feature | Architectural Implementation | Verification Status |
| :--- | :--- | :--- |
| **1. Simple & User-Friendly Interface** | Royal Burgundy & Pearl aesthetic with consistent typography, micro-interactions, and breadcrumbs. | Verified (All 23 routes) |
| **2. Centralized Database** | Neon Serverless PostgreSQL with Prisma ORM; normalized schema connecting rooms, stays, folios, staff, and ledgers. | Verified (Neon AWS pooler) |
| **3. Secure Admin Login** | JWT authentication (`/auth/login`) with bcrypt password hashing, persistent session tokens, and route guards. | Verified (`admin` / `Admin@Hotel2026!`) |
| **4. Automatic Billing Calculations** | Dynamic billing engine: `(room tariff × nights) + items/services + GST - advance deposits = net balance`. | Verified (`/billing` & `/invoices`) |
| **5. Digital Record Management** | 14 statutory digital registers (`/registers`) mapping physical paper registers to immutable digital databases. | Verified (`/registers`) |
| **6. Search and Filter Functionality** | Real-time column filtering across guests, rooms, bookings, payments, staff, and registers. | Verified (Instant regex/substring search) |
| **7. Date-wise Historical Records** | Date pickers with quick presets: Today, Last 7 Days, This Month, Year-to-Date, and custom ranges. | Verified across ledgers |
| **8. Data Update and Management** | Full CRUD operations for Guests, Rooms, Bookings, Stays, Staff, Payroll, Expenses, and Settings. | Verified with mutation handlers |
| **9. PDF and Excel Reports** | 1-click RFC-4180 `.csv` download and bespoke `@media print` luxury letterhead for paper/PDF export. | Verified (19 reports) |
| **10. Database Backup** | Full on-demand JSON database snapshot generator (`GET /api/v1/settings/backup`) with 1-click browser download. | Verified (`/settings` & `/setup`) |
| **11. Responsive Interface** | Mobile drawer navigation, collapsible desktop sidebar, and adaptive multi-column grid layouts. | Verified on mobile & desktop |

---

## 7. Module-Wise Styling & Screenshots

### Key Pages Tested & Formatted:
1. **Executive Dashboard (`/`)**: 13 KPI cards, 6 dedicated analytics breakdowns, front-desk quick actions, recent bookings, and audit activity.
2. **Guests Directory (`/guests`)**: VIP status badges, identity documents management, and guest dossiers.
3. **Room Inventory (`/rooms`)**: Room category occupancy cards, floor-wise grid, pricing matrix, and maintenance toggles.
4. **Reservations & Bookings (`/bookings`)**: Booking lifecycle tags (CONFIRMED, CHECKED_IN, CANCELLED), advance payment tracker.
5. **Billing & Invoices (`/invoices`)**: Printable tax folios, GST breakdown, itemized room charges, and balance settlements.
6. **Staff Directory (`/staff`)**: Employee cards, designations, monthly salary structures, and department filters.
7. **Staff Payroll (`/payroll`)**: Automatic attendance earnings calculation, overtime, advance deductions, and salary slips.
8. **Reports & Analytics (`/reports`)**: All 19 Hotel & Staff audit ledgers, executive analytics strip, date filters, search, CSV, and print/PDF layout.
9. **Hotel Settings & Database Backup (`/settings`)**: Singleton operational parameters, Neon WAL status, and on-demand JSON database backup button.
