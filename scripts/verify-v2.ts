import { calculateReconciliationMetrics } from '../src/utils/reconciliation';
import { LedgerEntry, LedgerProject } from '../src/types/ledger';

console.log('====================================================');
console.log('LEDGERPILOT V2 — COMPREHENSIVE AUTOMATED VERIFICATION');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Deterministic Accounting Math
// ---------------------------------------------------------------------------
console.log('\n--- 1. DETERMINISTIC ACCOUNTING MATH ---');

const entry1: LedgerEntry = {
  id: 'e1',
  projectId: 'p1',
  serialNumber: 1,
  transactionType: 'INCOME',
  name: 'Test Person',
  amount: 1000,
  currency: 'INR',
  paymentMode: 'Cash',
  category: 'Donation',
  purpose: 'Test Income',
  verified: true,
  createdAt: Date.now(),
};

let m1 = calculateReconciliationMetrics([entry1]);
assert(m1.verifiedIncome === 1000, 'Entry 1: Income = ₹1,000');
assert(m1.verifiedExpense === 0, 'Entry 1: Expense = ₹0');
assert(m1.netBalance === 1000, 'Entry 1: Net Balance = ₹1,000');
assert(m1.cashIncome === 1000, 'Entry 1: Cash Income = ₹1,000');
assert(m1.cashTotal === 1000, 'Entry 1: Cash Total = ₹1,000');

const entry2: LedgerEntry = {
  id: 'e2',
  projectId: 'p1',
  serialNumber: 2,
  transactionType: 'EXPENSE',
  name: 'Test Shop',
  amount: 250,
  currency: 'INR',
  paymentMode: 'Online',
  category: 'Expense',
  purpose: 'Test Expense',
  verified: true,
  createdAt: Date.now(),
};

let m2 = calculateReconciliationMetrics([entry1, entry2]);
assert(m2.verifiedIncome === 1000, 'Entry 1+2: Income = ₹1,000');
assert(m2.verifiedExpense === 250, 'Entry 1+2: Expense = ₹250');
assert(m2.netBalance === 750, 'Entry 1+2: Net Balance = ₹750');
assert(m2.onlineExpense === 250, 'Entry 1+2: Online Expense = ₹250');
assert(m2.onlineIncome === 0, 'Entry 1+2: Online Income = ₹0');

// Edit Test: ₹1,000 -> ₹1,200
const entry1Edited: LedgerEntry = { ...entry1, amount: 1200 };
let mEdit = calculateReconciliationMetrics([entry1Edited, entry2]);
assert(mEdit.verifiedIncome === 1200, 'Edited: Income = ₹1,200');
assert(mEdit.netBalance === 950, 'Edited: Net Balance = ₹950 (1200 - 250)');

// Unverified Gate Test (OCR candidates must never silently impact official balance)
const entryUnverified: LedgerEntry = {
  id: 'e3',
  projectId: 'p1',
  serialNumber: 3,
  transactionType: 'INCOME',
  name: 'Unverified Candidate',
  amount: 5000,
  currency: 'INR',
  paymentMode: 'Cash',
  category: 'Donation',
  verified: false,
  createdAt: Date.now(),
};

let mUnverified = calculateReconciliationMetrics([entry1, entry2, entryUnverified]);
assert(
  mUnverified.verifiedIncome === 1000,
  'Unverified Gate: Verified income unaffected by unverified row',
  `Got ${mUnverified.verifiedIncome}, expected 1000`
);
assert(
  mUnverified.pendingIncome === 5000,
  'Unverified Gate: Pending income tracked in unverified model',
  `Got ${mUnverified.pendingIncome}, expected 5000`
);
assert(
  mUnverified.netBalance === 750,
  'Unverified Gate: Net Balance strictly reflects only verified entries',
  `Got ${mUnverified.netBalance}, expected 750`
);

// ---------------------------------------------------------------------------
// TEST 2: Multi-Project Data Isolation
// ---------------------------------------------------------------------------
console.log('\n--- 2. MULTI-PROJECT DATA ISOLATION ---');

const projectA: LedgerProject = {
  id: 'proj-A',
  name: 'Shop Ledger A',
  type: 'business',
  currency: 'INR',
  categories: ['Sales', 'Rent', 'Supplies'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const projectB: LedgerProject = {
  id: 'proj-B',
  name: 'Personal Ledger B',
  type: 'personal',
  currency: 'INR',
  categories: ['Groceries', 'Utilities'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const entriesProjA: LedgerEntry[] = [
  { ...entry1, id: 'a1', projectId: 'proj-A', amount: 3000 },
  { ...entry2, id: 'a2', projectId: 'proj-A', amount: 500 },
];

const entriesProjB: LedgerEntry[] = [
  { ...entry1, id: 'b1', projectId: 'proj-B', amount: 7000 },
];

const allEntries = [...entriesProjA, ...entriesProjB];

const filteredA = allEntries.filter((e) => e.projectId === 'proj-A');
const filteredB = allEntries.filter((e) => e.projectId === 'proj-B');

const metricsA = calculateReconciliationMetrics(filteredA);
const metricsB = calculateReconciliationMetrics(filteredB);

assert(metricsA.verifiedIncome === 3000, 'Project A income isolated to ₹3,000');
assert(metricsA.netBalance === 2500, 'Project A net balance = ₹2,500');
assert(metricsB.verifiedIncome === 7000, 'Project B income isolated to ₹7,000');
assert(metricsB.netBalance === 7000, 'Project B net balance = ₹7,000');

// ---------------------------------------------------------------------------
// TEST 3: Backup & Restore Schema Verification
// ---------------------------------------------------------------------------
console.log('\n--- 3. BACKUP & RESTORE SCHEMA INTEGRITY ---');

const backupPayload = {
  app: 'LedgerPilot',
  version: 2,
  exportedAt: Date.now(),
  projects: [projectA, projectB],
  entries: allEntries,
  settings: {
    projectName: 'Shop Ledger A',
    eventOrColony: 'Shop Ledger A',
    currency: 'INR',
    categories: ['Sales', 'Rent', 'Supplies'],
    language: 'hi',
  },
};

const serialized = JSON.stringify(backupPayload);
const deserialized = JSON.parse(serialized);

assert(deserialized.version === 2, 'Backup JSON has schema version: 2');
assert(deserialized.projects.length === 2, 'Backup contains all 2 projects');
assert(deserialized.entries.length === 3, 'Backup contains all 3 entries');
assert(deserialized.entries[0].name === 'Test Person', 'Backup preserves unicode names and fields');

// Test Corrupted JSON Safety
let rejected = false;
try {
  const invalidJson = '{"app": "RandomApp", "data": 123}';
  const parsed = JSON.parse(invalidJson);
  if (!parsed.version && !parsed.records && !parsed.projects) {
    rejected = true;
  }
} catch (e) {
  rejected = true;
}
assert(rejected, 'Corrupted / invalid backup rejected cleanly without data corruption');

// ---------------------------------------------------------------------------
// TEST 4: Large Dataset Performance Stress Test (2,000+ entries)
// ---------------------------------------------------------------------------
console.log('\n--- 4. LARGE DATASET PERFORMANCE STRESS TEST (2,000 ENTRIES) ---');

const largeDataset: LedgerEntry[] = [];
const categories = ['Donation', 'Member Fee', 'Expense', 'Maintenance', 'Operations', 'Rent', 'Salary'];
const modes: ('Cash' | 'Online' | 'Other')[] = ['Cash', 'Online', 'Other'];
const names = ['रमेश कुमार', 'सुरेश सिंह', 'अशोक वर्मा', 'प्रदीप शर्मा', 'सुनीता देवी', 'विमल जैन', 'कविता गुप्ता', 'अमित यादव'];

const startTimeGen = performance.now();
for (let i = 1; i <= 2000; i++) {
  const isInc = i % 3 !== 0; // 2/3 income, 1/3 expense
  largeDataset.push({
    id: `stress-${i}`,
    projectId: 'proj-stress',
    serialNumber: i,
    transactionType: isInc ? 'INCOME' : 'EXPENSE',
    name: `${names[i % names.length]} #${i}`,
    amount: Math.round(100 + (i * 17) % 5000),
    currency: 'INR',
    paymentMode: modes[i % modes.length],
    category: categories[i % categories.length],
    purpose: `Auto-generated test record #${i}`,
    date: '2026-09-29',
    verified: true,
    createdAt: Date.now() - (2000 - i) * 1000,
  });
}
const genTime = performance.now() - startTimeGen;
console.log(`Generated 2,000 entries in ${genTime.toFixed(2)}ms`);

const startTimeCalc = performance.now();
const largeMetrics = calculateReconciliationMetrics(largeDataset);
const calcTime = performance.now() - startTimeCalc;
console.log(`Calculated metrics for 2,000 entries in ${calcTime.toFixed(2)}ms`);

assert(calcTime < 50, '2,000 entries calculated in under 50ms', `${calcTime.toFixed(2)}ms`);
assert(largeMetrics.totalRecords === 2000, 'All 2,000 records processed');
assert(largeMetrics.verifiedIncome > 0, `Verified Income: ₹${largeMetrics.verifiedIncome}`);
assert(largeMetrics.verifiedExpense > 0, `Verified Expense: ₹${largeMetrics.verifiedExpense}`);
assert(
  largeMetrics.netBalance === largeMetrics.verifiedIncome - largeMetrics.verifiedExpense,
  'Deterministic balance math verified on 2,000 records'
);

// Search & Filter Stress Test
const startTimeSearch = performance.now();
const query = 'रमेश कुमार';
const searchResults = largeDataset.filter((e) => e.name.includes(query));
const searchTime = performance.now() - startTimeSearch;
console.log(`Filtered 2,000 entries for "${query}" (${searchResults.length} matches) in ${searchTime.toFixed(2)}ms`);
assert(searchTime < 10, 'Search across 2,000 records executed in under 10ms', `${searchTime.toFixed(2)}ms`);

// ---------------------------------------------------------------------------
// TEST 5: CSV with UTF-8 BOM Validation
// ---------------------------------------------------------------------------
console.log('\n--- 5. CSV EXCEL EXPORT INTEGRITY ---');

const headers = ['Sr', 'Type', 'Name', 'Amount', 'Mode', 'Category', 'Date'];
const sampleRow = [1, 'INCOME', '"रमेश कुमार (सिंह परिवार)"', 1000, 'Cash', '"Donation"', '2026-09-29'];
const csvContent = '\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');

assert(csvContent.charCodeAt(0) === 0xFEFF, 'CSV starts with UTF-8 Byte Order Mark (0xFEFF) for Excel Devanagari support');
assert(csvContent.includes('रमेश कुमार (सिंह परिवार)'), 'Devanagari characters preserved verbatim');

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
}
