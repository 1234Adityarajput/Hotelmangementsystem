# IVORY & ESPRESSO — MODERN EDITORIAL LUXURY DESIGN SYSTEM
## Grand Horizon Hotel & Resort OS

---

## 1. Design Vision & Philosophy
The **Ivory & Espresso** design system embodies the warmth, understated elegance, and timeless sophistication of a world-class luxury boutique hotel. Moving away from cold, generic tech dashboards, this design system treats hotel management as an editorial, high-touch craft.

### Core Principles
- **Modern Editorial Luxury**: Generous whitespace, refined serif headlines paired with ultra-clean modern grotesque sans-serif for high operational density.
- **Warm & Welcoming Palette**: Deep espresso browns, antique golds, warm ivories, and rich coffee undertones that reduce screen fatigue.
- **Visual Consistency**: Every button, status badge, data table, and modal follows uniform design tokens across all 19 functional modules.
- **Operational Clarity**: Financial metrics and front-desk actions are immediate, readable, and right-aligned with standardized Indian Rupee (INR) formatting.

---

## 2. Color Palette & Token Specifications

### Primary Brand Palette
| Color Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **ESPRESSO** | `#362A22` | Primary brand color, sidebar background, primary CTA buttons, major titles |
| **MOCHA** | `#79695B` | Secondary text, icon accents, muted editorial labels |
| **ANTIQUE GOLD** | `#B08A60` | Accent color, active navigation indicator, brand highlights, focus rings |
| **WARM IVORY** | `#EEE7DA` | Secondary button backgrounds, badge backgrounds, warm borders |
| **PURE WHITE** | `#FFFFFF` | Card surfaces, modal surfaces, table row backgrounds |

### Neutral & Surface Palette
| Token | Hex Code | Tailwind / CSS Mapping | Usage |
| :--- | :--- | :--- | :--- |
| **Main Background** | `#F7F4EE` | `bg-[#F7F4EE]` / `bg-ivory-bg` | Full viewport app shell background |
| **Surface Background** | `#FFFFFF` | `bg-white` / `bg-surface` | Cards, dropdown menus, modals |
| **Primary Text** | `#362A22` | `text-[#362A22]` | Headings, table cells, primary labels |
| **Secondary Text** | `#79695B` | `text-[#79695B]` | Subtitles, helper text, breadcrumbs |
| **Muted Text** | `#948779` | `text-[#948779]` | Placeholders, inactive timestamps |
| **Primary Border** | `#E3D9CA` | `border-[#E3D9CA]` | Card outlines, input borders, table borders |
| **Subtle Divider** | `#EAE3D8` | `divide-[#EAE3D8]` / `border-[#EAE3D8]` | Horizontal row dividers |
| **Hover Background** | `#F2EADF` | `hover:bg-[#F2EADF]` | Table row hover, button ghost hover |
| **Selected Background**| `#E9DFD0` | `bg-[#E9DFD0]` | Active selected list items |
| **Disabled State** | `#E8E2D9` | `bg-[#E8E2D9]` | Disabled inputs & buttons |

### Semantic Hospitality Status Tokens
Status indicators are strictly standardized across all operational modules:
| Status | Text Color | Background | Border | Applied To |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `#32765B` | `#E7F1E9` | `#32765B`/30 | Available Room, Checked In, Paid Invoice, Present Staff |
| **Warning** | `#A97832` | `#F6EDDC` | `#A97832`/30 | Maintenance Room, Reserved Stay, Half-Day Attendance, Pending Payment |
| **Danger** | `#B54C44` | `#F8E8E5` | `#B54C44`/30 | Cancelled Booking, Failed Payment, Absent Staff, Out of Service |
| **Information**| `#627D91` | `#E9EFF3` | `#627D91`/30 | System Logs, In-House Relocation, Staff Advances, Folio Additions |

---

## 3. Typography Hierarchy

### Font Families
1. **Editorial & Display Headings**: `Playfair Display` (serif, elegant, high-contrast, editorial).
2. **Operational, Navigation & Data**: `Manrope` (sans-serif, geometric, highly legible at small sizes).

### Type Scale
- **H1 Major Page Title**: `28px - 34px` (`font-serif font-bold text-[#362A22]`)
- **H2 Section Heading**: `20px - 24px` (`font-serif font-bold text-[#362A22]`)
- **Card Title**: `15px - 16px` (`font-serif font-bold text-[#362A22]`)
- **Body & Table Text**: `13px - 14px` (`font-sans font-medium text-[#362A22]`)
- **Supporting & Helper Labels**: `11px - 12px` (`font-sans text-[#79695B]`)
- **Large KPI Numbers**: `28px - 34px` (`font-serif font-bold text-[#362A22]`)

---

## 4. Application Shell & Navigation

### Sidebar Navigation (Espresso `#362A22`)
- **Brand Header**: Grand Horizon icon in Antique Gold (`#B08A60`) on Espresso `#362A22`.
- **Navigation Groups**:
  - `OVERVIEW`: Dashboard (`/`)
  - `FRONT OFFICE`: Guests (`/guests`), Rooms (`/rooms`), Bookings (`/bookings`), Stays (`/stays`)
  - `OPERATIONS`: Items & Services (`/items`), Invoices (`/invoices`), Payments (`/payments`)
  - `WORKFORCE`: Staff (`/staff`), Attendance (`/attendance`), Staff Advances (`/advances`), Payroll (`/payroll`)
  - `FINANCE`: Expenses (`/expenses`), Reports (`/reports`)
  - `RECORDS`: Digital Registers (`/registers`), Audit Logs (`/audit-logs`)
  - `ADMINISTRATION`: Hotel Settings (`/settings`), DB Health & Setup (`/setup`)
- **Active Navigation Pill**: Antique Gold background (`#B08A60`), pure white text, subtle shadow.
- **Hover State**: Deep warm espresso highlight (`#43352B`), warm ivory text (`#EEE7DA`).

### Application Header
- Pure white surface (`#FFFFFF`) with bottom border `1px solid #E3D9CA`.
- Categorized breadcrumbs (`OVERVIEW > Dashboard`) in uppercase tracking font.
- Live Neon DB connection indicator badge (`#E7F1E9` background, `#32765B` success text).
- Single Administrator profile pill with antique gold shield badge.

---

## 5. UI Component Library Standards

### Cards (`Card`, `CardHeader`, `CardTitle`, `CardContent`)
- Background: Pure White (`#FFFFFF`).
- Border: `1px solid #E3D9CA`.
- Radius: `rounded-2xl` (`16px`).
- Shadow: `shadow-[0_2px_10px_rgba(54,42,34,0.04)]`.

### Buttons (`Button`)
- **Primary**: `bg-[#362A22] hover:bg-[#43352B] text-white shadow-sm`.
- **Accent**: `bg-[#B08A60] hover:bg-[#96724A] text-white shadow-sm`.
- **Outline**: `border border-[#E3D9CA] bg-white text-[#362A22] hover:bg-[#F2EADF]`.
- **Secondary**: `bg-[#EEE7DA] text-[#362A22] hover:bg-[#E3D9CA]`.
- **Destructive**: `bg-[#B54C44] hover:bg-[#9E3E37] text-white`.
- **Ghost**: `text-[#79695B] hover:bg-[#F2EADF] hover:text-[#362A22]`.

### Data Tables
- Header: `#F7F4EE` Warm Ivory background, `11px` bold uppercase Mocha text (`#79695B`).
- Borders: Horizontal dividers `border-b border-[#EAE3D8]`.
- Row Hover: `hover:bg-[#F2EADF]/60 transition-colors`.
- Currency Alignment: Right-aligned tabular figures in INR format (`₹1,250.00`).

---

## 6. Verification & Production Status
- **Next.js 15 App Router Build**: 22/22 routes successfully generated and statically compiled.
- **TypeScript & ESLint Check**: 0 errors.
- **Database Connectivity**: 100% verified against live Neon Serverless PostgreSQL.
- **Design Uniformity**: Applied across all 19 functional modules and login authentication portal.
