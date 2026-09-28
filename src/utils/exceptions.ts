import {
  ExtractedRecord,
  SourceDocument,
  DuplicateCandidate,
  LedgerException,
  ExceptionSummary,
} from '../types/ledger';
import { validatePageTotalMath } from './reconciliation';

/**
 * Deterministically derives all open exceptions requiring human attention
 * across records, documents, page totals, and duplicate candidates.
 *
 * Rules:
 * - Never auto-fixes accounting data.
 * - Source of truth remains existing records, documents, and duplicate candidates.
 * - Distinguishes arithmetic mismatches from transaction-direction requirements.
 * - High priority: arithmetic mismatches, duplicate candidates, invalid/missing amounts/names.
 * - Medium priority: transaction type required, low confidence, conflict/ambiguity notes.
 */
export function getLedgerExceptions(
  records: ExtractedRecord[],
  documents: SourceDocument[] = [],
  duplicates: DuplicateCandidate[] = []
): LedgerException[] {
  const exceptions: LedgerException[] = [];

  // ==========================================
  // 1. PAGE-LEVEL EXCEPTIONS (Arithmetic & Direction)
  // ==========================================
  for (const doc of documents) {
    if (doc.detectedPageTotal !== undefined && !isNaN(doc.detectedPageTotal)) {
      const pageRecords = records.filter(
        (r) => r.sourceImageId === doc.id || r.sourcePage === doc.pageNumber
      );

      const math = validatePageTotalMath(doc.detectedPageTotal, pageRecords);

      if (!math.isMatch) {
        const hasUnclassified = pageRecords.some((r) => r.transactionType === 'UNCLASSIFIED');

        if (hasUnclassified) {
          // Section 5 Requirement: Distinguish "Transaction type required" from "Arithmetic mismatch"
          exceptions.push({
            id: `exc-page-type-${doc.id}`,
            type: 'TRANSACTION_TYPE_REQUIRED',
            severity: 'MEDIUM',
            title: `Page ${doc.pageNumber}: Transaction Type Required for Page Total`,
            message: `Page handwritten total ₹${doc.detectedPageTotal.toLocaleString('en-IN')} cannot be reconciled because page contains unclassified line items. Classify all entries on this page as Income or Expense.`,
            docId: doc.id,
            sourceImageId: doc.id,
            sourcePage: doc.pageNumber,
            amount: doc.detectedPageTotal,
            createdAt: doc.uploadedAt || Date.now(),
            resolutionState: 'OPEN',
            details: {
              detectedPageTotal: doc.detectedPageTotal,
              calculatedLineItemSum: math.calculatedLineItemSum,
              difference: math.difference,
            },
          });
        } else {
          // True arithmetic mismatch: all records are classified, but total does not equal sum
          exceptions.push({
            id: `exc-page-math-${doc.id}`,
            type: 'ARITHMETIC_MISMATCH',
            severity: 'HIGH',
            title: `Page ${doc.pageNumber}: Arithmetic Total Mismatch`,
            message: `Handwritten total ₹${doc.detectedPageTotal.toLocaleString('en-IN')} differs from line-item sum ₹${math.calculatedLineItemSum.toLocaleString('en-IN')} (difference: ${math.difference > 0 ? '+' : ''}₹${math.difference.toLocaleString('en-IN')}).`,
            docId: doc.id,
            sourceImageId: doc.id,
            sourcePage: doc.pageNumber,
            amount: doc.detectedPageTotal,
            createdAt: doc.uploadedAt || Date.now(),
            resolutionState: 'OPEN',
            details: {
              detectedPageTotal: doc.detectedPageTotal,
              calculatedLineItemSum: math.calculatedLineItemSum,
              difference: math.difference,
            },
          });
        }
      }
    }
  }

  // ==========================================
  // 2. DUPLICATE EXCEPTIONS
  // ==========================================
  for (const dup of duplicates) {
    if (dup.status === 'pending') {
      exceptions.push({
        id: `exc-dup-${dup.id}`,
        type: 'POSSIBLE_DUPLICATE',
        severity: 'HIGH',
        title: `Possible Duplicate: "${dup.newRecord.name}"`,
        message: `New entry on Page ${dup.newRecord.sourcePage} (₹${dup.newRecord.amount.toLocaleString('en-IN')}) matches existing entry (₹${dup.matchedRecord.amount.toLocaleString('en-IN')}, Page ${dup.matchedRecord.sourcePage}). ${dup.reasons.join(', ')}`,
        candidateId: dup.id,
        recordId: dup.newRecordId,
        sourceImageId: dup.newRecord.sourceImageId,
        sourcePage: dup.newRecord.sourcePage,
        recordName: dup.newRecord.name,
        amount: dup.newRecord.amount,
        createdAt: dup.newRecord.createdAt || Date.now(),
        resolutionState: 'OPEN',
        details: {
          reasons: dup.reasons,
          similarityScore: dup.similarityScore,
          matchedRecordName: dup.matchedRecord.name,
          matchedRecordAmount: dup.matchedRecord.amount,
          matchedRecordPage: dup.matchedRecord.sourcePage,
        },
      });
    }
  }

  // ==========================================
  // 3. RECORD-LEVEL EXCEPTIONS
  // ==========================================
  for (const r of records) {
    // Only unverified records produce actionable open review exceptions
    if (r.verified) continue;

    // A. MISSING FIELD
    const isMissingName = !r.name || r.name.trim() === '' || r.name.trim() === 'अज्ञात (Unknown)';
    const isInvalidAmount = isNaN(Number(r.amount)) || Number(r.amount) <= 0;
    const isInvalidPaymentMode = !['Cash', 'Online', 'Other'].includes(r.paymentMode);

    if (isMissingName || isInvalidAmount || isInvalidPaymentMode) {
      const missingParts: string[] = [];
      if (isMissingName) missingParts.push('Name');
      if (isInvalidAmount) missingParts.push('Valid Amount (> 0)');
      if (isInvalidPaymentMode) missingParts.push('Payment Mode');

      exceptions.push({
        id: `exc-rec-missing-${r.id}`,
        type: 'MISSING_FIELD',
        severity: 'HIGH',
        title: `Missing Required Information: ${r.name || 'Unnamed Record'}`,
        message: `Required record field(s) missing or invalid: ${missingParts.join(', ')}. Manual correction required.`,
        recordId: r.id,
        sourceImageId: r.sourceImageId,
        sourcePage: r.sourcePage,
        recordName: r.name,
        amount: r.amount,
        createdAt: r.createdAt || Date.now(),
        resolutionState: 'OPEN',
        details: {
          missingFields: missingParts,
          isMissingName,
          isInvalidAmount,
          isInvalidPaymentMode,
        },
      });
    }

    // B. TRANSACTION TYPE REQUIRED
    if (r.transactionType === 'UNCLASSIFIED') {
      exceptions.push({
        id: `exc-rec-type-${r.id}`,
        type: 'TRANSACTION_TYPE_REQUIRED',
        severity: 'MEDIUM',
        title: `Transaction Type Required: ${r.name}`,
        message: `Direction (Income vs Expense) is unclassified. Reviewer must classify before this record can be verified.`,
        recordId: r.id,
        sourceImageId: r.sourceImageId,
        sourcePage: r.sourcePage,
        recordName: r.name,
        amount: r.amount,
        createdAt: r.createdAt || Date.now(),
        resolutionState: 'OPEN',
      });
    }

    // C. LOW CONFIDENCE
    if (r.confidence === 'low') {
      exceptions.push({
        id: `exc-rec-lowconf-${r.id}`,
        type: 'LOW_CONFIDENCE',
        severity: 'MEDIUM',
        title: `Low Confidence Extraction: ${r.name}`,
        message: `Handwriting or character recognition confidence is low. Verify extracted values against source image.`,
        recordId: r.id,
        sourceImageId: r.sourceImageId,
        sourcePage: r.sourcePage,
        recordName: r.name,
        amount: r.amount,
        createdAt: r.createdAt || Date.now(),
        resolutionState: 'OPEN',
        details: {
          confidence: r.confidence,
          rawText: r.rawText,
        },
      });
    }

    // D. CONFLICT / AMBIGUITY
    const notes = (r.ambiguityNotes || '').trim();
    const isJustTypeNote =
      notes.toLowerCase().includes('transaction type required') ||
      notes.toLowerCase().includes('direction (income vs expense) missing');

    if (notes && !isJustTypeNote) {
      exceptions.push({
        id: `exc-rec-conflict-${r.id}`,
        type: 'CONFLICT',
        severity: 'MEDIUM',
        title: `Data Ambiguity / Conflict: ${r.name}`,
        message: notes,
        recordId: r.id,
        sourceImageId: r.sourceImageId,
        sourcePage: r.sourcePage,
        recordName: r.name,
        amount: r.amount,
        createdAt: r.createdAt || Date.now(),
        resolutionState: 'OPEN',
      });
    }
  }

  // ==========================================
  // DETERMINISTIC SORTING:
  // HIGH severity first, then MEDIUM.
  // Within severity: sourcePage ascending, then id.
  // ==========================================
  return exceptions.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'HIGH' ? -1 : 1;
    }
    const pageA = a.sourcePage ?? 9999;
    const pageB = b.sourcePage ?? 9999;
    if (pageA !== pageB) {
      return pageA - pageB;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Computes deterministic exception count breakdown.
 */
export function calculateExceptionSummary(exceptions: LedgerException[]): ExceptionSummary {
  let arithmeticCount = 0;
  let lowConfidenceCount = 0;
  let duplicateCount = 0;
  let missingFieldCount = 0;
  let typeRequiredCount = 0;
  let conflictCount = 0;
  let highSeverityCount = 0;
  let mediumSeverityCount = 0;

  for (const exc of exceptions) {
    if (exc.severity === 'HIGH') highSeverityCount++;
    else mediumSeverityCount++;

    switch (exc.type) {
      case 'ARITHMETIC_MISMATCH':
        arithmeticCount++;
        break;
      case 'LOW_CONFIDENCE':
        lowConfidenceCount++;
        break;
      case 'POSSIBLE_DUPLICATE':
        duplicateCount++;
        break;
      case 'MISSING_FIELD':
        missingFieldCount++;
        break;
      case 'TRANSACTION_TYPE_REQUIRED':
        typeRequiredCount++;
        break;
      case 'CONFLICT':
        conflictCount++;
        break;
    }
  }

  return {
    total: exceptions.length,
    arithmeticCount,
    lowConfidenceCount,
    duplicateCount,
    missingFieldCount,
    typeRequiredCount,
    conflictCount,
    highSeverityCount,
    mediumSeverityCount,
  };
}
