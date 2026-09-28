import {
  ExtractedRecord,
  DuplicateCandidate,
  SourceDocument,
  PageValidationStatus,
  PageMathValidation,
  TransactionType,
} from '../types/ledger';

export interface ReconciliationMetrics {
  totalRecords: number;
  verifiedRecordsCount: number;
  unverifiedRecordsCount: number;

  // Verified Financial Model
  verifiedIncome: number;
  verifiedExpense: number;
  netBalance: number;

  // Pending / Unverified Model
  pendingIncome: number;
  pendingExpense: number;
  pendingNet: number;

  // Payment Mode Breakdown
  cashIncome: number;
  cashExpense: number;
  onlineIncome: number;
  onlineExpense: number;
  otherIncome: number;
  otherExpense: number;

  uncertainRecordsCount: number;
  unclassifiedRecordsCount: number;
  needsTypeReviewCount: number;
  categoryTotals: Record<string, { total: number; count: number; type: TransactionType }>;
  potentialDuplicatesCount: number;

  // Backward compatibility aliases
  totalCollection: number;
  cashTotal: number;
  onlineTotal: number;
  otherTotal: number;
}

export interface ProposedReconciliation {
  existingTotal: number;
  existingCount: number;
  newlyExtractedTotal: number;
  newlyExtractedCount: number;
  potentialDuplicatesDeduction: number;
  potentialDuplicatesCount: number;
  proposedNewTotal: number;
  proposedNewCount: number;
}

/**
 * Safe backward-compatibility migration strategy:
 * Guarantees existing records without transactionType are handled safely.
 * Never silently turns an uncertain classification into verified.
 */
export function migrateRecordTransactionType(record: any): ExtractedRecord {
  if (record.transactionType === 'INCOME' || record.transactionType === 'EXPENSE') {
    return {
      ...record,
      amount: Math.abs(Number(record.amount)) || 0,
      verified: Boolean(record.verified),
    };
  }

  // For legacy records where transactionType is genuinely unknown or UNCLASSIFIED:
  // DO NOT assign INCOME, DO NOT assign EXPENSE.
  // Instead represent the record as explicitly UNCLASSIFIED / pending review.
  // Preserves all original data (name, amount, paymentMode, category, purpose, date,
  // sourceImageId, sourcePage, rawText, confidence, auditTrail, etc.) without any data loss.
  return {
    ...record,
    amount: Math.abs(Number(record.amount)) || 0,
    transactionType: 'UNCLASSIFIED',
    verified: false, // Must NEVER be silently verified
    ambiguityNotes:
      record.ambiguityNotes ||
      'Transaction Type Required: Direction (INCOME vs EXPENSE) missing in legacy record',
  };
}

export function calculateReconciliationMetrics(
  records: ExtractedRecord[],
  duplicates: DuplicateCandidate[] = []
): ReconciliationMetrics {
  let verifiedIncome = 0;
  let verifiedExpense = 0;
  let pendingIncome = 0;
  let pendingExpense = 0;
  let unclassifiedRecordsCount = 0;

  let cashIncome = 0;
  let cashExpense = 0;
  let onlineIncome = 0;
  let onlineExpense = 0;
  let otherIncome = 0;
  let otherExpense = 0;

  let verifiedRecordsCount = 0;
  let uncertainRecordsCount = 0;
  const categoryTotals: Record<string, { total: number; count: number; type: TransactionType }> = {};

  for (const record of records) {
    const amt = Math.abs(Number(record.amount)) || 0;
    const type: TransactionType = record.transactionType || 'UNCLASSIFIED';

    if (type === 'UNCLASSIFIED') {
      unclassifiedRecordsCount++;
      // UNCLASSIFIED records do NOT contribute to verifiedIncome, verifiedExpense,
      // netBalance, pendingIncome, or pendingExpense!
    } else if (record.verified) {
      verifiedRecordsCount++;
      if (type === 'EXPENSE') {
        verifiedExpense += amt;
        if (record.paymentMode === 'Online') onlineExpense += amt;
        else if (record.paymentMode === 'Cash') cashExpense += amt;
        else otherExpense += amt;
      } else {
        verifiedIncome += amt;
        if (record.paymentMode === 'Online') onlineIncome += amt;
        else if (record.paymentMode === 'Cash') cashIncome += amt;
        else otherIncome += amt;
      }
    } else {
      if (type === 'EXPENSE') {
        pendingExpense += amt;
      } else {
        pendingIncome += amt;
      }
    }

    if (record.confidence === 'low') {
      uncertainRecordsCount++;
    }

    const cat = record.category || (type === 'EXPENSE' ? 'Expense' : type === 'INCOME' ? 'General' : 'Unclassified');
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { total: 0, count: 0, type };
    }
    categoryTotals[cat].total += amt;
    categoryTotals[cat].count += 1;
  }

  const netBalance = verifiedIncome - verifiedExpense;
  const pendingNet = pendingIncome - pendingExpense;
  const pendingDuplicates = duplicates.filter((d) => d.status === 'pending');

  return {
    totalRecords: records.length,
    verifiedRecordsCount,
    unverifiedRecordsCount: records.length - verifiedRecordsCount,
    verifiedIncome,
    verifiedExpense,
    netBalance,
    pendingIncome,
    pendingExpense,
    pendingNet,
    cashIncome,
    cashExpense,
    onlineIncome,
    onlineExpense,
    otherIncome,
    otherExpense,
    uncertainRecordsCount,
    unclassifiedRecordsCount,
    needsTypeReviewCount: unclassifiedRecordsCount,
    categoryTotals,
    potentialDuplicatesCount: pendingDuplicates.length,
    // Backward compatibility aliases
    totalCollection: verifiedIncome,
    cashTotal: cashIncome,
    onlineTotal: onlineIncome,
    otherTotal: otherIncome,
  };
}

export function calculateProposedReconciliation(
  existingVerifiedRecords: ExtractedRecord[],
  newBatchRecords: ExtractedRecord[],
  pendingDuplicates: DuplicateCandidate[]
): ProposedReconciliation {
  const existingTotal = existingVerifiedRecords.reduce((acc, r) => acc + (Math.abs(Number(r.amount)) || 0), 0);
  const existingCount = existingVerifiedRecords.length;

  const newlyExtractedTotal = newBatchRecords.reduce((acc, r) => acc + (Math.abs(Number(r.amount)) || 0), 0);
  const newlyExtractedCount = newBatchRecords.length;

  // Compute duplicate deduction: sum of newly extracted records that are pending duplicates
  const duplicateNewRecordIds = new Set(pendingDuplicates.map((d) => d.newRecordId));
  const duplicateRecords = newBatchRecords.filter((r) => duplicateNewRecordIds.has(r.id));
  const potentialDuplicatesDeduction = duplicateRecords.reduce((acc, r) => acc + (Math.abs(Number(r.amount)) || 0), 0);
  const potentialDuplicatesCount = duplicateRecords.length;

  const proposedNewTotal = existingTotal + newlyExtractedTotal - potentialDuplicatesDeduction;
  const proposedNewCount = existingCount + newlyExtractedCount - potentialDuplicatesCount;

  return {
    existingTotal,
    existingCount,
    newlyExtractedTotal,
    newlyExtractedCount,
    potentialDuplicatesDeduction,
    potentialDuplicatesCount,
    proposedNewTotal,
    proposedNewCount,
  };
}

export function formatINR(val: number): string {
  const num = val || 0;
  const prefix = num < 0 ? '-₹' : '₹';
  return prefix + Math.abs(num).toLocaleString('en-IN');
}

/**
 * Deterministically validates the mathematical reconciliation between
 * the handwritten page total (detected by AI or manually corrected) and
 * the independent sum of extracted line item amounts for that page.
 *
 * For single-type pages:
 * - INCOME page: page total vs income line-item sum
 * - EXPENSE page: page total vs expense line-item sum
 *
 * For mixed pages:
 * - Compares with income, net, or gross sum without guessing.
 *
 * All floating-point values are rounded safely to 2 decimal places.
 * AI extractions are NEVER assumed to be mathematical truth.
 */
export function validatePageTotalMath(
  detectedTotal: number | undefined | null,
  records: Array<{ amount: number; transactionType?: TransactionType }>
): {
  detectedPageTotal?: number;
  calculatedLineItemSum: number;
  difference: number;
  status: PageValidationStatus;
  isMatch: boolean;
  incomeSum?: number;
  expenseSum?: number;
  netSum?: number;
  breakdownNote?: string;
} {
  if (detectedTotal === undefined || detectedTotal === null || isNaN(detectedTotal)) {
    const rawSum = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    return {
      detectedPageTotal: undefined,
      calculatedLineItemSum: Math.round(rawSum * 100) / 100,
      difference: 0,
      status: 'NO_PAGE_TOTAL',
      isMatch: false,
    };
  }

  const roundedDetected = Math.round(Number(detectedTotal) * 100) / 100;
  let incomeSum = 0;
  let expenseSum = 0;
  let unclassifiedSum = 0;
  let hasIncome = false;
  let hasExpense = false;
  let hasUnclassified = false;

  for (const r of records) {
    const amt = Number(r.amount) || 0;
    if (r.transactionType === 'EXPENSE') {
      expenseSum += amt;
      hasExpense = true;
    } else if (r.transactionType === 'INCOME') {
      incomeSum += amt;
      hasIncome = true;
    } else {
      unclassifiedSum += amt;
      hasUnclassified = true;
    }
  }

  incomeSum = Math.round(incomeSum * 100) / 100;
  expenseSum = Math.round(expenseSum * 100) / 100;
  unclassifiedSum = Math.round(unclassifiedSum * 100) / 100;
  const grossSum = Math.round((incomeSum + expenseSum + unclassifiedSum) * 100) / 100;
  const netSum = Math.round((incomeSum - expenseSum) * 100) / 100;

  // Phase 1 Safety: If an unclassified record is present on a page,
  // do not silently guess or assign it to Income or Expense.
  if (hasUnclassified) {
    const diff = Math.round((grossSum - roundedDetected) * 100) / 100;
    return {
      detectedPageTotal: roundedDetected,
      calculatedLineItemSum: grossSum,
      difference: diff,
      status: 'MISMATCH',
      isMatch: false,
      incomeSum,
      expenseSum,
      netSum,
      breakdownNote:
        'Contains unclassified records: Transaction type review (Income vs Expense) required before definitive reconciliation.',
    };
  }

  // Case A: Page contains only Income records (or default untyped records)
  if (!hasExpense) {
    const diff = Math.round((incomeSum - roundedDetected) * 100) / 100;
    const isMatch = Math.abs(diff) < 0.001;
    return {
      detectedPageTotal: roundedDetected,
      calculatedLineItemSum: incomeSum,
      difference: diff,
      status: isMatch ? 'MATCH' : 'MISMATCH',
      isMatch,
      incomeSum,
      expenseSum: 0,
      netSum: incomeSum,
    };
  }

  // Case B: Page contains only Expense records
  if (hasExpense && !hasIncome && incomeSum === 0) {
    const diff = Math.round((expenseSum - roundedDetected) * 100) / 100;
    const isMatch = Math.abs(diff) < 0.001;
    return {
      detectedPageTotal: roundedDetected,
      calculatedLineItemSum: expenseSum,
      difference: diff,
      status: isMatch ? 'MATCH' : 'MISMATCH',
      isMatch,
      incomeSum: 0,
      expenseSum,
      netSum: -expenseSum,
    };
  }

  // Case C: Page contains BOTH Income and Expense records
  // Compare against income, net, or gross sum without guessing:
  if (Math.abs(incomeSum - roundedDetected) < 0.001) {
    return {
      detectedPageTotal: roundedDetected,
      calculatedLineItemSum: incomeSum,
      difference: 0,
      status: 'MATCH',
      isMatch: true,
      incomeSum,
      expenseSum,
      netSum,
      breakdownNote: `Matches page income total (₹${incomeSum})`,
    };
  }

  if (Math.abs(netSum - roundedDetected) < 0.001) {
    return {
      detectedPageTotal: roundedDetected,
      calculatedLineItemSum: netSum,
      difference: 0,
      status: 'MATCH',
      isMatch: true,
      incomeSum,
      expenseSum,
      netSum,
      breakdownNote: `Matches page net balance (₹${netSum})`,
    };
  }

  if (Math.abs(grossSum - roundedDetected) < 0.001) {
    return {
      detectedPageTotal: roundedDetected,
      calculatedLineItemSum: grossSum,
      difference: 0,
      status: 'MATCH',
      isMatch: true,
      incomeSum,
      expenseSum,
      netSum,
      breakdownNote: `Matches page gross total (₹${grossSum})`,
    };
  }

  // DO NOT GUESS: Flag for manual review
  const diff = Math.round((grossSum - roundedDetected) * 100) / 100;
  return {
    detectedPageTotal: roundedDetected,
    calculatedLineItemSum: grossSum,
    difference: diff,
    status: 'MISMATCH',
    isMatch: false,
    incomeSum,
    expenseSum,
    netSum,
    breakdownNote: `Mixed Page: Income ₹${incomeSum}, Expense ₹${expenseSum}. Total ₹${roundedDetected} requires manual review.`,
  };
}

/**
 * Calculates page-level deterministic mathematical validation across all source documents.
 */
export function calculateAllPagesMathValidation(
  documents: SourceDocument[],
  records: ExtractedRecord[]
): PageMathValidation[] {
  return documents.map((doc) => {
    // Match records either by document ID or page number
    const pageRecords = records.filter(
      (r) => r.sourceImageId === doc.id || r.sourcePage === doc.pageNumber
    );

    const math = validatePageTotalMath(doc.detectedPageTotal, pageRecords);

    return {
      docId: doc.id,
      pageNumber: doc.pageNumber,
      fileName: doc.fileName,
      pageHeader: doc.pageHeader,
      detectedPageTotal: math.detectedPageTotal,
      calculatedLineItemSum: math.calculatedLineItemSum,
      difference: math.difference,
      status: math.status,
      isMatch: math.isMatch,
      itemCount: pageRecords.length,
      incomeSum: math.incomeSum,
      expenseSum: math.expenseSum,
      netSum: math.netSum,
      breakdownNote: math.breakdownNote,
    };
  });
}

export interface PagesMathSummary {
  totalPages: number;
  matchedPages: number;
  mismatchedPages: number;
  unspecifiedPages: number;
  totalCalculatedSum: number;
  totalDetectedSum: number;
  netDiscrepancy: number;
}

export function calculatePagesMathSummary(validations: PageMathValidation[]): PagesMathSummary {
  let matchedPages = 0;
  let mismatchedPages = 0;
  let unspecifiedPages = 0;
  let totalCalculatedSum = 0;
  let totalDetectedSum = 0;

  for (const v of validations) {
    totalCalculatedSum += v.calculatedLineItemSum;
    if (v.detectedPageTotal !== undefined) {
      totalDetectedSum += v.detectedPageTotal;
    }

    if (v.status === 'MATCH') {
      matchedPages++;
    } else if (v.status === 'MISMATCH') {
      mismatchedPages++;
    } else {
      unspecifiedPages++;
    }
  }

  const netDiscrepancy = Math.round((totalCalculatedSum - totalDetectedSum) * 100) / 100;

  return {
    totalPages: validations.length,
    matchedPages,
    mismatchedPages,
    unspecifiedPages,
    totalCalculatedSum,
    totalDetectedSum,
    netDiscrepancy,
  };
}


