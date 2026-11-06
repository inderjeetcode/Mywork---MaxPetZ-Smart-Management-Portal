# Cart Due NGO Management & Multi-Tier Client Classification [COMPLETED]

An enterprise-grade extension to the Cart Due Dashboard for MaxPetZ Hospitals Pvt. Ltd., adding dedicated Cart Due NGO Master management, automatic 3-tier client classification (NGO, Normal Client, Unclassified), 3-way outstanding reconciliation, category filtering across follow-ups and collections, and an optional sync from the regular Dues NGO Master.

### User Review & Critical Decisions

> [!NOTE]
> All requested features have been fully implemented, verified, and compiled with 0 errors:
>
> - **Client Category Tabs**: Segmented category tabs (**All Cart Due**, **NGO Cart Due**, **Normal Client Cart Due**, **Unclassified Cart Due**) are active on the top Cart Due filter bar with real-time counts and currency totals.
> - **NGO Master Independence & Sync**: The Cart Due NGO Master maintains its own storage and database table (`cart_due_ngo_master`), completely isolated from regular Dues, with an optional one-click action to **"Copy from Dues NGO Master"**.
> - **Automatic Reactive Reclassification**: Adding, editing, or toggling an NGO Client ID immediately reclassifies all matching Cart Due records across every view without requiring Excel re-import.
> - **Reconciliation Integrity**: Total Cart Due Outstanding strictly equals $\text{NGO Outstanding} + \text{Normal Client Outstanding} + \text{Unclassified Outstanding}$, verified with a reconciliation indicator and no double counting.
> - **Empty Initial State**: The Cart Due NGO Master starts empty (0 mock records) ready for real hospital entries.

---

### 1. Implemented Subsystems

#### 1. Type Models (`src/types/index.ts`)
- Added `CartDueNGO`: Complete interface for Cart Due registered NGOs (`id`, `client_id`, `ngo_name`, `contact_person`, `email`, `phone`, `notes`, `status`).
- Added `CartDueNgoAnalyticsSummary`: Analytical interface summarizing NGO records, open dues, collections, and associated providers.
- Extended `CartDueRecord`, `CartDuePayment`, `CartDueAdvanceCredit`, `CartDueFollowup`, and `CartDueClientSummary` with `client_type` (`'NGO' | 'NORMAL' | 'UNCLASSIFIED'`) and `ngo_name`.
- Extended `CartDueFilterState` with `clientType: 'all' | 'ngo' | 'normal' | 'unclassified'`.

#### 2. Cart Due Reactive Engine (`src/context/CartDueContext.tsx`)
- Isolated storage key `maxpetz_cart_due_ngos_v1` and Supabase table `cart_due_ngo_master`.
- Exact normalized matching on `client_id.trim().toUpperCase()`. Preserves leading zeroes as TEXT.
- Reactive reclassification: Dynamically assigns `client_type` and `ngo_name` across all Cart Due records, follow-ups, and payments.
- Real-time 3-way KPI computations:
  - `totalCartNgoOutstanding` & `ngoClientCount`
  - `totalNormalClientOutstanding` & `normalClientCount`
  - `totalUnclassifiedOutstanding` & `unclassifiedClientCount`
  - `totalCartOutstanding` (strictly reconciled)
- Complete NGO CRUD: `addCartNgo`, `updateCartNgo`, `toggleCartNgoStatus`, `deleteCartNgo`, and `copyFromDuesNgoMaster`.

#### 3. Dedicated Management Interface (`src/components/cartDue/CartDueNgoManagementView.tsx`)
- Master list with search by Client ID, NGO Name, and contact person.
- Status toggle (`ACTIVE` / `INACTIVE`) preserving all historical cart records.
- Add/Edit NGO modal with **Live Impact Detection** (detects existing cart records matching Client ID before saving).
- One-click **Copy from Dues Master** with candidate preview and collision prevention.
- Dedicated **Drill-down Ledger Modal** detailing records, providers, and collection history per NGO.

#### 4. Filter Bar & Analytics (`CartDueFilterBar.tsx`, `CartDueKpis.tsx`, `CartDueAnalyticsView.tsx`)
- Prominent 4-segment category tabs at the top of the filter bar with counts and currency totals.
- 3-Way category partition strip in KPI ribbon with visual percentage progress bar and mathematical audit check.
- Stacked bar charts and category share pie chart in analytics.
- Client-wise and provider-wise breakdown by category.

#### 5. CRM & Ledger Integration (`CartDueClientsView.tsx`, `CartDueFollowupsView.tsx`, `CartDueCollectionsView.tsx`)
- Category filter pills across Client Accounts, Follow-ups CRM, and Payment Receipts ledger.
- Prominent category badges (`NGO`, `Normal`, `Unclassified`) displayed on client rows, detail drawers, follow-up cards, and payment receipts.

#### 6. Database Schema (`src/lib/sqlMigration.ts`)
- Added Table 23: `public.cart_due_ngo_master` with TEXT `client_id UNIQUE`, indexes, triggers, and Row Level Security policies.
- Added non-destructive `ALTER TABLE public.cart_due_records ADD COLUMN IF NOT EXISTS client_type TEXT` and `ngo_name TEXT`.

---

### 2. Verification
- TypeScript compilation (`compile_applet`): **PASSED** (0 errors).
- ESLint / Syntax checking (`lint_applet`): **PASSED** (0 errors).
- Dev server: **RESTARTED & RUNNING** on port 3000.
