# LEDGERPILOT V2 — STEP 1: COMPLETE REDESIGN AUDIT & UX ARCHITECTURE

**Document Type:** UX Architecture, System Audit & V2 Specification  
**Status:** STEP 1 COMPLETE — READY FOR REVIEW  
**Scope Guard:** Pure Audit & Architecture Plan (Zero Code Redesign Applied in Step 1)

---

## 1. Existing Architecture Audit

LedgerPilot V1 evolved incrementally as an OCR/AI-first extraction utility for handwritten paper ledgers. The current application is a React 19 SPA running on Vite with an optional Node.js/Express server proxy for `/api/extract-ledger` (Gemini 2.5/Gemini 3 Flash).

### Key Architectural Characteristics of V1:
- **Client Runtime:** React 19 SPA with Tailwind CSS v4 and Lucide icons.
- **State Management:** Monolithic state in `src/App.tsx` (~1,050 lines) managing:
  - `records: ExtractedRecord[]`
  - `documents: SourceDocument[]`
  - `households: Household[]`
  - `activeProject: ProjectMetadata`
  - `settings: LedgerSettings`
  - `duplicates: DuplicateCandidate[]`
  - `aiBudgetStats: AIBudgetStats`
- **Data Persistence:**
  - `localStorage`: Used for records (`ledgerpilot_records_v1`), households, settings, and project metadata.
  - `IndexedDB`: Used for high-res scanned document images (`LedgerPilotDB` -> `source_documents` store).
- **Core Friction Points:**
  - The application assumes the user's primary journey is **Capture / Upload Photo → Wait for OCR/AI → Review AI candidates → Verify**.
  - Manual transaction entry is completely absent as a first-class feature (entries can only be edited or created through AI/OCR review modals or hardcoded sample fixtures).
  - New users are instantly greeted with 8 demo records, a sample colony ledger SVG image, pre-filled households, and an active project fixture.

---

## 2. Existing Routes, Components & Features

### Components Tree (`src/components/`):
| Component | Primary Function | V1 Status & User Role |
| :--- | :--- | :--- |
| `Navbar.tsx` | Desktop navigation, project label, language switcher, settings trigger | Contains 10+ tabs including experimental lab tabs. |
| `BottomNav.tsx` | Mobile bottom navigation | 5 tabs: Home, Capture, Review, Ledger, Inbox. |
| `Dashboard.tsx` | Main landing dashboard | Focuses almost entirely on OCR/AI banners, stats, and camera buttons. |
| `UploadCapture.tsx` | Camera / file upload interface | Dual Local OCR / Cloud Gemini extraction queue with image dropzone. |
| `ExtractionReview.tsx` | Candidate review table (~1,220 lines) | Table for reviewing pending OCR rows, math validation, and audit history. |
| `VerifiedLedger.tsx` | Master ledger of verified transactions | Search, filter by Income/Expense/Category/Mode, CSV download. |
| `ExceptionInbox.tsx` | Phase 3 exception resolution queue | Flags arithmetic mismatches, low confidence, duplicates, unclassified entries. |
| `ReconciliationSummary.tsx` | Phase 1 page arithmetic & category totals | Mathematical verification between page totals and extracted line items. |
| `HouseholdManager.tsx` | Family/household directory | Groups records by flat/household names for community societies. |
| `ReportsView.tsx` | Summary analytics and breakdown charts | Category breakdown, cash vs online metrics, print view launch. |
| `PrintView.tsx` | Print-optimized A4 view | Printable formal balance sheet and ledger table with `window.print()`. |
| `SourceImageViewer.tsx` | Full-screen image zoom & pan viewer | Inspects handwritten page with bounding box highlight over image. |
| `DuplicateReviewModal.tsx` | Side-by-side duplicate candidate comparison | Merges or ignores possible duplicate donations/entries. |
| `SettingsModal.tsx` | Project settings, category manager, JSON backup | Manages project name, category pills, AI mode, JSON export/import. |
| `CreateProjectModal.tsx` | Modal to create a new project with presets | Only accessible from deep links in Dashboard banner or Navbar icon. |
| `AuditHistoryModal.tsx` | Correction history modal | Tracks original AI value vs human corrected value. |
| `LocalOCRTestLab.tsx` | Diagnostic Tesseract.js testbed | Standalone lab for in-browser WASM OCR benchmarking. |
| `PaddleOCRTestLab.tsx` | Diagnostic PaddleOCR testbed | Standalone lab for in-browser PP-OCRv5 ONNX benchmarking. |

---

## 3. Current First-Launch Behavior

When a fresh user loads the application for the very first time (with empty `localStorage`):
1. `records` state defaults to `INITIAL_SAMPLE_RECORDS` (8 records containing Vimal Singh ₹2,100, Neha Singh ₹1,100, Raghav Singh ₹1,500, Ramesh Chandra Gupta ₹5,000, etc.).
2. `documents` state defaults to `INITIAL_SAMPLE_DOCS` (SVG vector mock of a handwritten notebook page).
3. `households` defaults to `SAMPLE_HOUSEHOLDS` ("Singh Family", "Gupta Residence", "Sharma Niwas").
4. `activeProject` defaults to `DEFAULT_PROJECT_METADATA` ("New Ledger").
5. The `useEffect` hook in `App.tsx` automatically writes `INITIAL_SAMPLE_DOCS` into browser IndexedDB.
6. The dashboard displays `₹12,200` total collection, `₹8,200` cash, `3` pending reviews, and `1` arithmetic mismatch.
7. **Problem:** The user has no idea this data is fake. If they want to enter their own real cash diary, they are faced with deleting 8 sample records or discovering how to reset the database.

---

## 4. Current Sample/Demo Data Sources

All sample/fixture data originates from `src/utils/sampleData.ts`:
- `INITIAL_SAMPLE_RECORDS`: 8 hardcoded `ExtractedRecord` objects with timestamps, category tags, and audit trails.
- `INITIAL_SAMPLE_DOCS`: 1 `SourceDocument` containing a 100-line SVG string generator (`generateHandwrittenLedgerSVG`).
- `SAMPLE_HOUSEHOLDS`: 3 pre-configured family objects.
- `DEMO_PROJECT_METADATA`: Legacy project fixture.

**V2 Action:** This fixture file must be disconnected from the application's default initialization. It can remain strictly as an optional demo loader ("नमूना डेटा लोड करें" in Advanced Settings or Help) but must never self-populate on fresh startup.

---

## 5. Current Project Creation Flow

In V1, project creation is obscured:
1. `CreateProjectModal.tsx` exists, but there is no prominent call to action on the primary screen.
2. It is triggered by a tiny icon button in the Navbar or a small secondary link in the Dashboard hero banner.
3. If a user never clicks it, they operate inside the default project with existing pre-loaded sample records.
4. There is no onboarding state asking: *"What is the name of your ledger?"*

---

## 6. Current Navigation Problems

1. **Navigation Bloat:** Desktop navbar displays up to 10 distinct tabs (`Dashboard`, `Capture/Upload`, `Review`, `Exceptions`, `Ledger`, `Reconciliation`, `Households`, `Reports`, `Tesseract Lab`, `PaddleOCR Test`).
2. **Mobile Nav Divergence:** Mobile bottom bar shows 5 tabs, missing direct access to Reports, Settings, Reconciliation, and Household manager.
3. **Mental Model Confusion:** Users are asked to navigate between "Review" (unverified records), "Ledger" (verified records), "Inbox" (exceptions), and "Reconciliation" (page totals). For a person writing from a physical diary, this 4-way separation creates cognitive overload.
4. **Primary Action Missing:** There is no persistent `+ Add Entry` (नया हिसाब जोड़ें) floating action button or quick entry sheet.

---

## 7. Existing IndexedDB & localStorage Architecture

- **`localStorage`:**
  - `ledgerpilot_records_v1`: JSON stringified array of records.
  - `ledgerpilot_households_v1`: JSON stringified array of households.
  - `ledgerpilot_settings_v1`: Settings object.
  - `ledgerpilot_project_metadata_v1`: Project metadata.
- **`IndexedDB` (`LedgerPilotDB` v1 in `src/utils/indexedDb.ts`):**
  - Store: `source_documents` (key: `id`, stores image Base64 dataUrl, fileName, pageNumber, detectedPageTotal).
  - Store: `ledger_state` (key: `key`, currently unused placeholder).
- **Limitation:** `localStorage` has a strict ~5MB quota. If a ledger grows to thousands of records with audit history, `localStorage` can throw quota exhaustion errors. Structured ledger data should migrate cleanly to IndexedDB.

---

## 8. Existing AI/OCR Architecture

1. **Local-First PaddleOCR (`src/utils/paddleOcr.ts`):** In-browser ONNX WASM engine running PP-OCRv5 for bounding box polygon extraction and text line clustering.
2. **Local-First Tesseract.js (`src/utils/localOcr.ts`):** WASM worker running `hin+eng` LSTM model.
3. **Deterministic Local Candidate Extractor (`src/utils/localCandidateExtractor.ts`):** Slices OCR lines into candidates, extracts amounts with regex, infers transaction direction, and links bounding geometry.
4. **Server Proxy (`server.ts` -> `/api/extract-ledger`):** Node.js Express endpoint communicating with `@google/genai` (Gemini API) using structured JSON output schemas.
5. **Batch AI Assist (`src/utils/geminiAssist.ts`):** Client utility batching only unresolved doubt rows.

---

## 9. What Should Be Kept (Classification A: KEEP AS CORE)

The following core logic is mathematically sound, robust, and essential:
1. **Deterministic Double-Entry Arithmetic (`src/utils/reconciliation.ts`):**
   - Total Income, Total Expense, Net Balance calculation.
   - Cash vs Online breakdown.
   - Category totals.
2. **Verified vs Unverified Gate:**
   - Unverified records NEVER alter the official financial balance sheet until human approval.
3. **Transaction Classification Model:**
   - `INCOME`, `EXPENSE`, and `UNCLASSIFIED` direction handling.
4. **JSON Backup Export & Import (`SettingsModal.tsx` / `indexedDb.ts`):**
   - Essential for offline-first data portability and zero-cloud sync.
5. **Print & PDF Engine (`PrintView.tsx`):**
   - Standard A4 formal balance sheet layout with `window.print()`.
6. **WhatsApp Summary Generator (`src/utils/whatsapp.ts`):**
   - Clean, formatted Hindi/English plain-text summary for instant messaging.
7. **Audit Trail Tracking:**
   - Tracking edits and correction reasons for financial accountability.

---

## 10. What Should Be Redesigned (Classification B: KEEP BUT REDESIGN)

1. **First-Launch / Empty State:**
   - Redesign completely into a clean onboarding screen with zero pre-populated records.
2. **Manual Quick Entry:**
   - Must be the primary, most accessible action in the entire application.
   - Large, thumb-friendly numeric input, income/expense toggle, auto-incrementing serial number.
3. **Dashboard:**
   - Transform from an AI/OCR marketing hero into an actionable financial summary:
     - Big Net Balance card (कुल बचत / शेष)
     - Total Income (कुल आय) & Total Expense (कुल खर्च)
     - Recent Transactions list with instant search & filter
     - One-click `+ नया हिसाब जोड़ें` action button
4. **Ledger View:**
   - Unify "Verified Ledger" and "Review" into a single, intuitive Ledger view with clear status badges (e.g., "सत्यापित" vs "समीक्षा बाकी").
5. **Project Management:**
   - Make project selection and switching clean, obvious, and accessible directly from the header without entering Settings.

---

## 11. What Should Become Optional/Advanced (Classification C: MOVE TO OPTIONAL)

1. **Camera / Document Upload (`UploadCapture.tsx`):**
   - Demote from a primary tab to an optional tool: *"फोटो से ऑटो-भरें (वैकल्पिक)"* accessible inside the Add Entry flow or via an "Import from Photo" button.
2. **Page Arithmetic Reconciliation (`ReconciliationSummary.tsx`):**
   - Move inside Reports / Audit tools as "पेज योग मिलान" for users who specifically scan physical register pages with written page totals.
3. **Household Management (`HouseholdManager.tsx`):**
   - Move into a secondary utility or filter category rather than a top-level navbar tab.
4. **Duplicate Candidate Review (`DuplicateReviewModal.tsx`):**
   - Keep as an automated background check that surfaces an alert badge only when a duplicate name/amount is detected.
5. **Exception Inbox (`ExceptionInbox.tsx`):**
   - Keep exception detection active, but surface it as a filter pill inside the main Ledger view (`⚠️ 2 अपवाद जांचें`) rather than a separate isolated application section.

---

## 12. What Should Be Removed/Deprecated (Classification D & E: EXPERIMENTAL / DEPRECATE)

1. **`LocalOCRTestLab.tsx` & `PaddleOCRTestLab.tsx` (Remove from Navbar):**
   - Deprecate top-level navbar buttons. Retain utility modules in `src/utils/` for optional background scanning, but remove diagnostic test labs from the main user-facing navigation.
2. **Automatic Sample Data Ingestion on Fresh Launch (Remove):**
   - Completely remove `INITIAL_SAMPLE_RECORDS` and `INITIAL_SAMPLE_DOCS` from the default `useState` initialization in `App.tsx`.
3. **Mandatory OCR Step in Primary User Journey (Remove):**
   - Remove any requirement to upload an image before creating financial records.

---

## 13. Proposed V2 Information Architecture

```
LEDGERPILOT V2
│
├── First-Launch Onboarding (Shown ONLY if 0 projects exist)
│   ├── "नया हिसाब शुरू करें" (Create Project Modal)
│   └── "Backup खोलें" (Restore JSON/File)
│
├── Main Application Layout
│   ├── Top Bar
│   │   ├── Project Switcher / Active Project Title
│   │   ├── Language Toggle (हिं / EN)
│   │   ├── Backup / Export Trigger
│   │   └── Settings Menu
│   │
│   ├── Tab 1: Dashboard (मुख्य पृष्ठ)
│   │   ├── Balance Summary Cards (Net, Income, Expense, Cash, Online)
│   │   ├── Primary Action: [+ नया हिसाब जोड़ें] (Quick Entry)
│   │   ├── Quick Action: [📷 फोटो से भरें] (Optional OCR)
│   │   ├── Quick Action: [📤 शेयर / WhatsApp]
│   │   └── Recent Entries (Latest 5 items with quick edit/delete)
│   │
│   ├── Tab 2: Ledger (बहीखाता / रसीद सूची)
│   │   ├── Search bar & Date / Type / Category filters
│   │   ├── Transaction Cards / Table with Auto-Serial numbers
│   │   ├── Inline Quick Edit & Delete
│   │   └── Export to Excel / CSV / Print
│   │
│   ├── Tab 3: Reports & Share (रिपोर्ट्स एवं शेयर)
│   │   ├── Category-wise spending breakdown
│   │   ├── WhatsApp Formatted Summary generator
│   │   ├── Print / PDF Export Sheet
│   │   └── Full Ledger JSON Backup / Restore
│   │
│   └── Tab 4: Advanced / Scan (वैकल्पिक स्कैन) [Secondary]
│       ├── Scan Paper Page (PaddleOCR / Gemini Assist)
│       ├── Page Total Math Reconciliation
│       └── Duplicate & Exception Inspector
│
└── Persistent Floating Action Button (FAB)
    └── [+ नया हिसाब जोड़ें] (Opens Manual Quick Entry Drawer/Modal)
```

---

## 14. Proposed First-Launch Flow

1. User visits application URL.
2. App checks `localStorage`/`IndexedDB` for active projects.
3. If no project exists (or record count is 0 and no active project has been created):
   - User is presented with a distraction-free, elegant welcome screen:
   ```
   [ Book Icon ]
   LedgerPilot
   "अपना हिसाब, आसान तरीके से"
   
   खाता डायरी, चंदा, घरेलू खर्च और लेन-देन का सरल डिजिटल बहीखाता।
   100% सुरक्षित • आपके फोन/ब्राउज़र में ऑफलाइन सुरक्षित
   
   [ + नया हिसाब शुरू करें ]  (Primary button, emerald-600)
   [ 📂 पुराना बैकअप खोलें (Restore) ]  (Secondary button, stone-100)
   
   (Small subtle link at bottom: "डेमो डेटा से देखें")
   ```
4. Clicking **"नया हिसाब शुरू करें"** opens the streamlined 2-step setup:
   - Step A: Ledger Name (e.g., "दुकान खाता 2026", "घरेलू खर्च", "कॉलोनी चंदा")
   - Step B: Choose Type (General / Society / Business / Personal) -> Auto-configures initial categories.
   - Clicking "शुरू करें" immediately creates the project and opens the clean dashboard with **0 records**.

---

## 15. Proposed Project Creation Flow

- Can be triggered anytime from the Top Bar dropdown or First Launch.
- Input fields:
  1. **Ledger Name (अनिवार्य):** Simple text input with autofocus.
  2. **Preset Templates:**
     - *सामान्य (General):* Donation, Member Fee, Expense, Maintenance, Other.
     - *घरेलू / व्यक्तिगत (Personal):* राशन/किराना, दूध/सब्जी, बिल/किराया, चिकित्सा, अन्य खर्च, वेतन/आय.
     - *सोसाइटी / समिति (Society):* मेंटेनेंस, सुरक्षा, बिजली-पानी, चंदा, मरम्मत, अन्य.
  3. **Currency Symbol:** Default `₹` (configurable).
- On submit:
  - Generates unique `projectId`.
  - Sets as `activeProject`.
  - Initializes empty ledger.
  - User is instantly ready to click **[+ नया हिसाब जोड़ें]**.

---

## 16. Proposed Dashboard UX

```
+-------------------------------------------------------------+
|  LedgerPilot   [ दुकान खाता 2026 v ]       [हिं/EN] [⚙️]    |
+-------------------------------------------------------------+
|                                                             |
|  कुल बचत / शुद्ध शेष (Net Balance)                          |
|  ₹ 42,500                                                   |
|                                                             |
|  +---------------------------+ +--------------------------+ |
|  |  कुल आय (Total Income)    | |  कुल खर्च (Total Expense)| |
|  |  ₹ 65,000 (14 प्रविष्टियां)| |  ₹ 22,500 (8 प्रविष्टियां)| |
|  +---------------------------+ +--------------------------+ |
|                                                             |
|  [ + नया हिसाब जोड़ें (Quick Entry) ]  <-- Large primary btn|
|                                                             |
|  [ 📤 WhatsApp शेयर ]   [ 🖨 प्रिंट / PDF ]   [ 📷 स्कैन ] |
|                                                             |
|  हालिया लेन-देन (Recent Entries)                [सभी देखें >]|
|  ---------------------------------------------------------- |
|  #14  रमेश कुमार       आय     ₹2,500   नकद     आज, 2:15 PM   |
|  #13  बिजली बिल भुगतान  खर्च   ₹1,850   Online  कल             |
|  #12  सुरेश शर्मा       आय     ₹5,000   GPay    28 Sep         |
+-------------------------------------------------------------+
```

---

## 17. Proposed Manual Quick Entry UX

The core manual entry interaction must require **fewer than 4 taps** to complete:

### Flow & Layout:
1. **Auto-Serial Number:** `#15` automatically assigned (user doesn't type this).
2. **Transaction Direction Toggle (Top):**
   - `[ + आय (Income) ]` (Green)  |  `[ - खर्च (Expense) ]` (Red)
   - Large touch targets, defaults to last selected direction.
3. **Amount Input (Primary focus):**
   - Prominent large font input: `₹ 0`
   - Numeric keypad auto-focused on mobile (`inputMode="decimal"`).
4. **Name / Party (नाम / व्यक्ति):**
   - Text input with auto-suggestions of previously entered names.
5. **Purpose / Category (विवरण एवं मद):**
   - Quick pills of common categories (`किराना`, `मेंटेनेंस`, `चंदा`, `बिल`, etc.) plus custom text.
6. **Payment Mode:**
   - 3 simple pills: `[ नकद (Cash) ]` | `[ ऑनलाइन (Online/UPI) ]` | `[ अन्य ]`
7. **Date:**
   - Defaults to `Today` (आज); tap to change.
8. **Action Bar:**
   - `[ सहेजें एवं नया जोड़ें (Save & Add Another) ]`
   - `[ सहेजें (Save) ]`
9. **Instant Feedback:**
   - Entry immediately added to local ledger, totals recalculate deterministically, smooth toast notification.

---

## 18. Proposed Ledger / List UX

- **Header Controls:**
  - Fast search input (searches names, notes, categories, amounts).
  - Quick filter pills: `[ सभी ]` `[ आय (+)]` `[ खर्च (-)]`.
  - Date range filter: `[ इस महीने ]` `[ इस हफ्ते ]` `[ सभी दिनांक ]`.
- **Card / Row Items:**
  - Serial `#`, Date, Name, Category pill, Payment mode pill.
  - Large colored amount (`+ ₹2,500` green or `- ₹1,850` red).
  - Tap row to expand details, edit, or delete.
- **Batch Actions:**
  - Multi-select to export or delete.
- **Empty State:**
  - *"अभी कोई हिसाब दर्ज नहीं है। पहला हिसाब जोड़ने के लिए नीचे दिए गए बटन पर टैप करें।"*
  - Big button: `+ पहला हिसाब जोड़ें`.

---

## 19. Proposed Backup & Restore Flow

- **Zero Cloud Account Requirement:**
  - 100% of data is stored in the user's browser device.
- **Export Backup:**
  - Single click creates a human-readable and machine-restorable file: `LedgerPilot_Backup_[ProjectName]_[Date].json`.
  - Contains project metadata, categories, records, and audit history.
- **Restore Backup:**
  - User selects JSON file.
  - System inspects file integrity, shows preview (*"दुकान खाता 2026: 45 रिकॉर्ड्स पाए गए"*).
  - User confirms -> Replaces or merges into local storage cleanly.
  - Toast confirmation: *"बैकअप सफलतापूर्वक रीस्टोर हुआ।"*

---

## 20. Proposed Import / Export Flow

1. **Excel / CSV Export:**
   - Generates UTF-8 BOM CSV compatible with Microsoft Excel and Google Sheets without font garbling.
   - Columns: `क्रमांक (Sr), प्रकार (Type), नाम (Name), राशि (Amount), मोड (Mode), श्रेणी (Category), उद्देश्य (Purpose), दिनांक (Date)`.
2. **PDF / Print Export:**
   - Formal A4 report generation with print stylesheet.
3. **WhatsApp Share:**
   - Formatted WhatsApp text with emojis, bold headers, income/expense breakdown, and net balance.

---

## 21. Proposed AI / OCR Placement

AI and OCR are relocated from the front door to an **optional smart assistant role**:
- **Entry point A:** Inside the Manual Quick Entry screen: `[ 📷 फोटो से ऑटो-भरें ]`.
- **Entry point B:** Secondary navigation tab: `[ उन्नत टूल्स / स्कैन ]`.
- **Behavior:**
  - If user selects an image, in-browser PaddleOCR / Tesseract parses candidate rows.
  - Extracted candidates appear in an inbox for human review.
  - Gemini AI Assist is called **only on-demand** when the user taps *"AI से लिखावट स्पष्ट करें"* on difficult handwriting.
  - Core ledger works completely if Gemini API key is missing or server is offline.

---

## 22. Proposed Mobile Navigation

Mobile is the primary device for physical ledger keepers.
- **Bottom Navigation Bar (4 items):**
  1. **डैशबोर्ड (Home):** Balance cards, quick buttons, recent items.
  2. **बहीखाता (Ledger):** Full searchable ledger list.
  3. **शेयर / रिपोर्ट (Reports):** WhatsApp summary, print sheet, export.
  4. **मेनू (Menu / Settings):** Backup, restore, categories, OCR scan tool.
- **Floating Action Button (FAB):**
  - High-visibility emerald button in bottom right corner: `+ नया हिसाब`.

---

## 23. Proposed Desktop Navigation

- **Clean Top Header:**
  - Logo + App Name.
  - Active Ledger selector dropdown with `+ New Ledger` button.
  - Navigation links: `Dashboard`, `Ledger`, `Reports & Share`, `Scan (Optional)`.
  - Right utilities: Language toggle (`हिं / EN`), Backup button, Settings gear.

---

## 24. Proposed Data Model Changes

Enhance `ExtractedRecord` and `LedgerSettings` to support first-class manual workflows:

```typescript
export type TransactionType = 'INCOME' | 'EXPENSE' | 'UNCLASSIFIED';
export type PaymentMode = 'Cash' | 'Online' | 'Other';
export type EntrySource = 'MANUAL' | 'LOCAL_OCR' | 'AI_ASSISTED' | 'IMPORT';

export interface LedgerEntry {
  id: string;
  projectId: string;
  serialNumber: number; // 1, 2, 3...
  transactionType: TransactionType;
  name: string;
  amount: number;
  currency: string;
  category: string;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  time?: string;
  notes?: string;
  source: EntrySource;
  verified: boolean; // Manual entries are verified by default
  createdAt: number;
  updatedAt: number;
  auditTrail?: {
    originalValue?: Partial<LedgerEntry>;
    editedAt?: number;
    editReason?: string;
  };
}

export interface LedgerProject {
  id: string;
  name: string;
  description?: string;
  type: 'general' | 'society' | 'business' | 'personal';
  currency: string;
  categories: string[];
  createdAt: number;
  updatedAt: number;
}
```

---

## 25. Proposed IndexedDB Stores & Schema

Upgrade `LedgerPilotDB` from v1 to v2:
- **`projects` (Store):** Key: `id`
  - Stores all user projects metadata and category configs.
- **`entries` (Store):** Key: `id`, Indexes: `projectId`, `transactionType`, `date`, `serialNumber`
  - Stores all structured ledger entries without `localStorage` 5MB quota constraints.
- **`source_documents` (Store):** Key: `id`, Index: `projectId`
  - Stores scanned document images (optional OCR feature).
- **`app_meta` (Store):** Key: `key`
  - Stores active project ID, app language, user preferences.

---

## 26. Data Migration Considerations from Existing Version

- If a returning user has existing data in `localStorage` (`ledgerpilot_records_v1`):
  - Check if records are the default mock records (`Vimal Singh`, etc.). If they are the default mock fixtures, cleanly transition to the fresh onboarding state.
  - If user has real custom records in `localStorage`:
    - Automatically migrate them into the V2 IndexedDB schema under a default project named `My Ledger`.
    - Set `source: 'MANUAL'`, preserve all dates, amounts, and verified statuses.
    - Never delete or drop user records without explicit backup.

---

## 27. Empty States

1. **Zero Projects (First Launch):** Welcome screen with "नया हिसाब शुरू करें" and "Backup खोलें".
2. **Zero Entries in Active Ledger:**
   - Clean illustration, headline: *"इस बहीखाते में अभी कोई प्रविष्टि नहीं है।"*
   - Subtext: *"अपनी डायरी या पर्ची से पहला हिसाब दर्ज करें।"*
   - Primary button: `[ + नया हिसाब जोड़ें ]`.
3. **Zero Search Results:**
   - *"कोई परिणाम नहीं मिला। कृपया अलग नाम या तारीख खोजें।"*
   - Button: `[ फ़िल्टर हटाएं (Clear Filters) ]`.

---

## 28. Error States

1. **Negative / Zero Amount Entry:** Clear inline red validation: *"राशि ₹0 से अधिक होनी चाहिए।"*
2. **Missing Party / Name:** Inline validation: *"कृपया नाम या विवरण दर्ज करें।"*
3. **Backup File Invalid:** Toast: *"अमान्य बैकअप फ़ाइल। कृपया सही LedgerPilot JSON फ़ाइल चुनें।"*
4. **IndexedDB Unavailable:** Graceful fallback to `localStorage` with non-blocking warning.

---

## 29. Loading States

- Skeleton card loaders for dashboard totals during initial IndexedDB read (~50ms).
- Button spinner on "सहेजें (Saving...)".
- Fast, instant client-side transitions (no artificial delays).

---

## 30. Fresh-Install Behavior

- Fresh install produces a completely pristine, empty application state.
- **Zero sample records.**
- **Zero sample images.**
- **Zero pre-filled households.**
- Guides user directly into giving their ledger a name and entering their first real transaction.

---

## 31. Security & Privacy Considerations for Local-First Data

- **Data Ownership:** All financial amounts, names, and notes reside 100% inside client-side browser storage (IndexedDB).
- **Zero Network Leakage:** Manual entries never send HTTP requests to any server or AI model.
- **Offline Reliability:** App operates completely when disconnected from internet (PWA / offline capable).
- **Explicit Export:** Cross-device transfer is handled exclusively through encrypted/plain JSON backups that the user controls and shares.

---

## 32. Recommended V2 Component Structure

```
src/
├── components/
│   ├── onboarding/
│   │   ├── WelcomeOnboarding.tsx      <-- First launch welcome screen
│   │   └── CreateProjectModal.tsx     <-- Clean project creation
│   ├── dashboard/
│   │   ├── DashboardV2.tsx            <-- Streamlined summary & quick actions
│   │   └── BalanceSummaryCard.tsx     <-- Net, Income, Expense cards
│   ├── ledger/
│   │   ├── QuickEntryModal.tsx        <-- Ultra-fast manual entry drawer/modal
│   │   ├── LedgerTable.tsx            <-- Searchable transaction list
│   │   └── EntryDetailModal.tsx       <-- Edit, delete, audit modal
│   ├── reports/
│   │   ├── ReportsAndShare.tsx        <-- WhatsApp summary, print sheet, CSV
│   │   └── PrintView.tsx              <-- Formal printable layout
│   ├── scan/
│   │   └── OptionalScanAssistant.tsx  <-- Demoted optional OCR / Gemini assist
│   ├── common/
│   │   ├── NavbarV2.tsx               <-- Clean desktop topbar
│   │   ├── BottomNavV2.tsx            <-- Clean mobile 4-tab bar
│   │   └── FloatingActionButton.tsx   <-- Quick Add Entry FAB
│   └── settings/
│       ├── SettingsModal.tsx          <-- Backup, restore, categories
│       └── BackupRestoreModal.tsx     <-- Dedicated import/export
```

---

## 33. Recommended Implementation Sequence for STEP 2

When STEP 2 is approved, execute in this exact sequence:
1. **Phase 2.1 — Storage & Model Foundation:**
   - Update `src/types/ledger.ts` with `LedgerEntry` and `LedgerProject` schemas.
   - Upgrade `src/utils/indexedDb.ts` to manage projects and entries cleanly.
   - Remove automatic sample data injection on startup.
2. **Phase 2.2 — Onboarding & Project Creation:**
   - Build `WelcomeOnboarding.tsx` for zero-project state.
   - Connect project creation to immediately initialize empty ledger.
3. **Phase 2.3 — Manual Quick Entry:**
   - Build `QuickEntryModal.tsx` with auto-serial numbering, income/expense toggle, amount, party, category, payment mode.
   - Verify deterministic calculations and instant balance update.
4. **Phase 2.4 — Dashboard & Ledger List:**
   - Build `DashboardV2.tsx` and `LedgerTable.tsx`.
   - Implement real-time search, filter, inline edit, delete.
5. **Phase 2.5 — Export, Backup & Reports:**
   - Wire up WhatsApp summary, CSV export, Print sheet, and JSON backup/restore.
6. **Phase 2.6 — Relocate OCR / AI to Optional Tools:**
   - Move scan functionality to secondary tool tab.
7. **Phase 2.7 — Navigation & Mobile UI Polish:**
   - Implement `NavbarV2.tsx`, `BottomNavV2.tsx`, and FAB.

---

## 34. Risks and Dependencies

| Risk | Mitigation |
| :--- | :--- |
| **Existing User Data Loss** | Implement automated migration in `indexedDb.ts` that detects real user records in `localStorage` and migrates them safely into V2 schema. |
| **Browser Storage Eviction** | Provide prominent "बैकअप लें (Export Backup)" notifications and ensure JSON backup is frictionless. |
| **Complex Category Customization** | Supply intuitive presets (General, Society, Personal) while letting users add custom categories with 1 tap. |
| **Mobile Keyboard Overlap** | Design Quick Entry modal with proper viewport scroll and `inputMode="decimal"` for numeric keypad. |

---

## 35. Clear Acceptance Criteria for STEP 2

1. **Zero Sample Data on Fresh Launch:** Opening the app with empty browser storage displays the Welcome Onboarding screen with zero records.
2. **Frictionless Project Creation:** Creating a project takes under 10 seconds and opens an empty, active dashboard.
3. **Manual Entry in Under 5 Seconds:** User can tap `+ नया हिसाब जोड़ें`, enter `500`, tap `आय`, type `सुनील`, and tap `सहेजें`. Entry appears as `#1` with instant balance `₹500`.
4. **Deterministic Math:** Net balance = Sum of Verified Income - Sum of Verified Expense (100% accurate, zero AI dependency).
5. **Full Offline Capability:** Core workflow functions with network disabled.
6. **One-Click Backup & Restore:** Exporting JSON and restoring on a fresh browser restores all entries and totals perfectly.
7. **Clean Navigation:** No diagnostic OCR tabs in primary navigation; secondary tools tucked neatly into an Advanced/Scan menu.
8. **Build & Typecheck:** `npm run build && npx tsc --noEmit && npm run lint` passes with 0 errors.

---

**STEP 1 STATUS: READY FOR REVIEW**

### Exact Files / Components to Modify in STEP 2:
1. `src/types/ledger.ts` (Data model updates for `LedgerEntry`, `LedgerProject`, `EntrySource`)
2. `src/utils/indexedDb.ts` (IndexedDB stores for projects and entries; migration from `localStorage`)
3. `src/App.tsx` (Remove sample data fallback; integrate onboarding router, active project state, quick entry modal)
4. `src/components/Dashboard.tsx` (Replaced with action-oriented financial dashboard)
5. `src/components/Navbar.tsx` (Streamlined topbar, project switcher, removed experimental tabs)
6. `src/components/BottomNav.tsx` (Streamlined 4-tab mobile bar with FAB)
7. `src/components/VerifiedLedger.tsx` (Upgraded to unified ledger table with search and quick actions)
8. `src/components/CreateProjectModal.tsx` (Streamlined onboarding & project creation)
9. `src/components/QuickEntryModal.tsx` (New: Ultra-fast manual transaction entry)
10. `src/components/WelcomeOnboarding.tsx` (New: First-launch empty state)
11. `src/components/SettingsModal.tsx` (Dedicated backup/restore and category manager)
12. `src/components/ReportsView.tsx` (Integrated WhatsApp share, print sheet launch, and CSV export)
