# HOTEL EXPORT ENGINE (PDF & EXCEL/CSV)

## 1. Overview
The Export Engine provides automated document and report generation across all 19 modules of the Hotel Management System.

## 2. Capabilities & Architecture
1. **Spreadsheet Export (CSV / Excel format)**:
   - Dynamic, client-side RFC 4180 compliant CSV generator.
   - Escapes quotes, delimiters, newlines, and formula injection characters.
   - Triggers native browser download with timestamped filename (`register-name-YYYY-MM-DD.csv`).
2. **Print & PDF Engine**:
   - Styled using CSS `@media print` directives across pages:
     - Automatically hides navigation sidebar, top headers, action buttons, and pagination controls during print.
     - Preserves clean black/white tabular typography, column headers, page numbering, and hotel identity header.
     - Direct browser PDF rendering via `window.print()` / PDF printer.
3. **Payroll Payslip Generation**:
   - Individual salary slip layout displaying staff name, designation, department, basic pay, payable days, overtime remuneration, advance recovery deductions, net disbursed salary, and authorization signature blocks.
