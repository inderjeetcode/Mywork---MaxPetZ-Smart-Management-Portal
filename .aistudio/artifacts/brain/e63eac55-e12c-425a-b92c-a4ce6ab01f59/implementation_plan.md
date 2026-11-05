# MAXPETZ SMART MANAGEMENT PORTAL — CRITICAL UPDATE & NGO MANAGEMENT

This update resolves the Supabase connection error, introduces the comprehensive **NGO Management & Dues Analytics** system, integrates **Client ID** across the application, and upgrades the import engine to support the latest 17-column hospital billing report alongside legacy files.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following operational preferences were confirmed for this upgrade:
> - **NGO Unlinking Behavior**: When an NGO's Client ID association is unlinked, existing historical invoices retain their historical NGO tags for accounting audit consistency, while subsequent imports will classify the Client ID as Non-NGO.
> - **Initial NGO Master State**: The portal initializes with an empty NGO Master list, providing complete administrative controls to register, edit, search, activate, deactivate, and archive partner NGOs.
> - **Missing Client IDs**: Invoices lacking a Client ID are explicitly categorized as **UNCLASSIFIED** with dedicated KPI tracking and filter tabs, ensuring:
>   $$\text{Total Outstanding} = \text{NGO Outstanding} + \text{Non-NGO Outstanding} + \text{Unclassified Outstanding}$$

---

## 1. Overview & Core Concept

1. **Supabase Connection Repair**: Sanitize and validate the Supabase URL and Publishable Key (stripping quotes, trailing slashes, accidental `/rest/v1/` suffixes). Real database probes test Auth, Table Read, and Table Write, displaying the exact technical error rather than a false "Connected" state.
2. **Client ID Integration**: Add `client_id` (stored as `TEXT` to preserve leading zeros and formatting) across the database schema, import engine, search filters, invoice grids, and exports.
3. **17-Column Excel/CSV Ingestion**: Support both the new 17-column structure (`InvNo`, `Inv Year`, `Inv Month`, `Date`, `Clientid`, `Client`, `User`, `Invoice type`, `Email`, `Mobile`, `Home`, `Invoice Amount`, `Return`, `Sold`, `Balance (As of now)`, `Mode of payment`, `Clinic`) and the legacy 10-column format.
4. **NGO Master Management (`ngo_master`)**: Dedicated module to manage hospital-associated NGOs with unique Client ID binding, status toggles (Active / Inactive / Archived), and invoice history drill-downs.
5. **Automatic NGO Classification**: During spreadsheet import, invoices are classified automatically into `NGO`, `NON_NGO`, or `UNCLASSIFIED` based on normalized Client ID matches against `ngo_master`.
6. **Dual Dues Intelligence (NGO & Non-NGO)**: Dedicated analytical views for NGO client debts, Non-NGO retail clients, and a unified executive overview with three-way breakdown.

---

## 2. User Experience & Visual Design

### Updated Global Navigation (13 Sidebar Destinations)
- **Financial Intelligence**:
  - `Overview` — Combined executive dashboard with 3-way outstanding breakdown (NGO, Non-NGO, Unclassified).
  - `Dues Dashboard` — Comprehensive dues analytics across all branches.
  - `NGO Management` — Master registry of partner animal welfare organizations.
  - `NGO Dues` — Dedicated NGO analytics, rankings, and debt ledgers.
  - `Non-NGO Dues` — Retail client dues analytics and customer debt tables.
  - `Clinic Analytics` — Branch-wise exposure and risk classifications.
  - `Staff Performance` — Doctor and user portfolio exposure.
  - `Client Management` — Client directory with Client ID search and dues summaries.
  - `Invoice Records` — Updated 15-column data grid with Client ID, Client Type, NGO Name, Return, and Sold.
  - `Smart Insights` — Data-backed debt concentration insights.
- **Task Workspace**:
  - `My Tasks` — Daily task queues (Today, Upcoming, Overdue, Completed).
  - `Task Analytics` — Weekly completion velocity and productivity charts.
- **Infrastructure**:
  - `Data Management` — 17-column file importer, column mapper, and duplicate resolver.
  - `Settings & SQL` — Live Supabase health diagnostics and complete migration script.

### Updated Invoice Management Table Columns
$$\text{Date} \mid \text{Invoice No.} \mid \text{Client ID} \mid \text{Client Name} \mid \text{Client Type (NGO / Non-NGO / Unclassified)} \mid \text{NGO Name} \mid \text{Clinic} \mid \text{Staff} \mid \text{Invoice Type} \mid \text{Invoice Amount} \mid \text{Return} \mid \text{Sold} \mid \text{Outstanding Balance} \mid \text{Payment Mode} \mid \text{Status}$$

---

## 3. Key Technical Decisions & Trade-Offs

- **Decision 1: URL Sanitization & Fail-Safe Diagnostic Probe**
  - *Chosen Approach*: Cleanse `VITE_SUPABASE_URL` with regex removing double quotes, trailing slashes, and accidental `/rest/v1` paths. Perform explicit `.select('count')` and write probes. If any query fails, the banner displays the exact error code (e.g. `PGRST204: Table ngo_master not found`) with a direct link to the SQL assistant.
  - *Why*: Eliminates the "Invalid path specified in request URL" error while maintaining strict truthfulness regarding database connectivity.
- **Decision 2: Client ID as TEXT with Zero-Padding Preservation**
  - *Chosen Approach*: Define `client_id` as `TEXT` in both TypeScript models and PostgreSQL schema.
  - *Why*: Numeric parsing converts `00452` to `452`, corrupting hospital ERP identifiers and causing NGO matching failures.
- **Decision 3: NGO Matching by Normalized Client ID**
  - *Chosen Approach*: Ingestion reads `Clientid`, trims whitespace, converts to uppercase, and queries `ngo_master.client_id`. If matched to an active NGO, the record is tagged `client_type = 'NGO'` and `ngo_name = ngo.ngo_name`. If Client ID is absent, it is marked `UNCLASSIFIED`.
  - *Why*: Client names often contain variations or pet names (e.g., "Friendicoes SECA (Pet: Tommy)"), whereas Client ID is unambiguous.

---

## 4. Technical Architecture & Data Strategy

### System Layout & Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAXPETZ SMART PORTAL v2                         │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      Sanitized Supabase Client                 │   │
│   │   URL: https://xhqzwikzzwerqjqrccal.supabase.co (No quotes/slash)│   │
│   │   Probes: Auth Check ──> Table Read Check ──> Write Check      │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │                   17-Column Excel / CSV Importer               │   │
│   │  Columns: InvNo, Inv Year, Inv Month, Date, Clientid, Client,  │   │
│   │           User, Invoice type, Email, Mobile, Home, Amount,     │   │
│   │           Return, Sold, Balance (As of now), Mode, Clinic      │   │
│   └───────────────┬────────────────────────────────┬───────────────┘   │
│                   │ Clientid Match                 │                   │
│                   ▼                                ▼                   │
│   ┌───────────────────────────────┐  ┌─────────────────────────────┐   │
│   │       ngo_master Table        │  │     invoices Table (v2)     │   │
│   │ - client_id (TEXT UNIQUE)     │  │ - client_id (TEXT)          │   │
│   │ - ngo_name                    │  │ - client_type (NGO/NON/UNC) │   │
│   │ - status (ACTIVE/INACTIVE)    │  │ - ngo_name (TEXT)           │   │
│   └───────────────┬───────────────┘  │ - return_amount (NUMERIC)   │   │
│                   │                  │ - sold_amount (NUMERIC)     │   │
│                   ▼                  └─────────────┬───────────────┘   │
│   ┌───────────────────────────────┐                │                   │
│   │     NGO Management Module     │                ▼                   │
│   │ - Add / Edit / Search NGO     │  ┌─────────────────────────────┐   │
│   │ - Activate / Deactivate       │  │    Dues Dashboards (v2)     │   │
│   │ - NGO Dues vs Non-NGO Dues    │  │  - Combined Overview        │   │
│   │ - Drill-down Invoices         │  │  - Dedicated NGO Dues       │   │
│   └───────────────────────────────┘  │  - Dedicated Non-NGO Dues   │   │
│                                      └─────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Database Schema Updates (`maxpetz_supabase_migration.sql`)
1. **`ngo_master` Table**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `client_id TEXT NOT NULL UNIQUE`
   - `ngo_name TEXT NOT NULL`
   - `contact_person TEXT`, `email TEXT`, `phone TEXT`, `notes TEXT`
   - `status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED'))`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`, `updated_at TIMESTAMPTZ DEFAULT NOW()`
2. **`invoices` Table Extensions**:
   - `client_id TEXT` (Indexed)
   - `client_type TEXT NOT NULL DEFAULT 'UNCLASSIFIED' CHECK (client_type IN ('NGO', 'NON_NGO', 'UNCLASSIFIED'))`
   - `ngo_name TEXT`
   - `inv_year INT`, `inv_month TEXT`
   - `email TEXT`, `mobile TEXT`, `home TEXT`
   - `return_amount NUMERIC(14,2) DEFAULT 0.00`
   - `sold_amount NUMERIC(14,2) DEFAULT 0.00`
3. **Indexes & RLS**:
   - Index on `invoices(client_id)`, `invoices(client_type)`, `ngo_master(client_id)`
   - RLS policies granting authenticated hospital users read/write permissions on `ngo_master` and `invoices`.

---

## 5. Execution Steps

1. **Repair `src/lib/supabase.ts` & `.env`**: Cleanse environment variables, add robust URL normalizer, and implement live read/write health diagnostics.
2. **Update Migration SQL (`src/lib/sqlMigration.ts`)**: Add `ngo_master` table DDL, RLS policies, and new invoice columns.
3. **Update Domain Types (`src/types/index.ts`)**: Add `NGO`, `ClientType`, `NGOAnalyticsSummary`, and extended `Invoice` fields.
4. **Upgrade Import Engine (`src/services/importService.ts`)**: Support the 17-column structure, preserve `Return` and `Sold`, extract `Clientid` as `TEXT`, and execute automatic NGO classification against `ngo_master`.
5. **Build NGO Master Management (`src/components/ngo/NgoManagementView.tsx`)**: Full CRUD for partner NGOs, activation toggling, and unlink workflow.
6. **Build NGO Dues & Non-NGO Dues Views**:
   - `src/components/dues/NgoDuesView.tsx` — KPI cards, NGO ranking, and clinic distribution.
   - `src/components/dues/NonNgoDuesView.tsx` — Client ledger, search by Client ID, and balance ranking.
7. **Upgrade Combined Dues Dashboard (`src/components/dues/ExecutiveKpis.tsx` & `GlobalFilterBar.tsx`)**: Add classification filter and distinct KPI cards for NGO, Non-NGO, Unclassified, and Total Outstanding.
8. **Update Invoice Grid & Navigation**: Render 15 columns with Client ID, Client Type, and NGO name; update sidebar with the 13 navigation sections.
9. **Verification**: Run `compile_applet` and `lint_applet`, verify TypeScript cleanliness, test file parsing, and confirm live status indicators.
