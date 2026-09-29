import { ExtractedRecord, ConfidenceLevel, TransactionType, PaymentMode } from '../types/ledger';
import { LedgerException } from '../types/exceptions';
import { executePaddleOCR, PaddleOCRResult, PaddleOCRRegion } from './paddleOcr';
import { executeLocalOCR, LocalOCRResult, OCRLine } from './localOcr';

export interface LocalCandidateExtractionResult {
  records: ExtractedRecord[];
  pageHeader?: string;
  detectedPageTotal?: number;
  qualityNotes?: string;
  exceptions: LedgerException[];
  engineUsed: 'LOCAL_PADDLEOCR' | 'LOCAL_TESSERACT';
  rawOCRText: string;
  totalRegions: number;
}

interface RowCandidate {
  rowIndex: number;
  rawText: string;
  regions: PaddleOCRRegion[];
  bbox: { x0: number; y0: number; x1: number; y1: number };
  poly?: Array<{ x: number; y: number } | [number, number]>;
  avgScore: number;
}

/**
 * Deterministically parses amounts from raw text (e.g. ₹100, 1,500/-, 500, ₹ 2,000.00).
 */
export function extractNumericAmounts(text: string): number[] {
  const clean = text.replace(/,/g, '');
  // Matches currency notation or standalone 2-7 digit numbers
  const regex = /(?:₹|rs\.?|inr)?\s*(\b\d{2,7}(?:\.\d{1,2})?\b)(?:\s*\/-)?/gi;
  const amounts: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(clean)) !== null) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0 && val < 10000000) {
      amounts.push(val);
    }
  }

  return amounts;
}

/**
 * Strips leading row serial index (e.g. "1.", "12)", "१.", "(3)") and trailing amount from text.
 */
function extractNameFromRowText(text: string, amountStr?: string): string {
  let cleaned = text;

  // Remove trailing or leading amounts
  if (amountStr) {
    cleaned = cleaned.replace(new RegExp(`(?:₹|Rs\\.?|INR)?\\s*${amountStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*\\/-)?`, 'gi'), ' ');
  }

  // Remove serial index: e.g. "1.", "12-", "3 )", "(4)"
  cleaned = cleaned.replace(/^[\s(]*\d{1,3}[\s.\-):]+/g, ' ');

  // Remove common table header labels if present
  cleaned = cleaned.replace(/\b(नाम|Name|विवरण|चंदा|दान|राशि|Amount|रू|रु|Rs|INR)\b/gi, ' ');

  // Clean extra spaces and punctuation
  cleaned = cleaned.replace(/[,\-:|]/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned || 'अज्ञात (Unknown)';
}

/**
 * Infers transaction type deterministically from keywords.
 */
function inferTransactionType(text: string): TransactionType {
  const lower = text.toLowerCase();
  if (/खर्च|व्यय|भुगतान|expense|paid|payment|debit|खर्चा/i.test(lower)) {
    return 'EXPENSE';
  }
  if (/जमा|दान|चंदा|प्राप्त|receipt|income|credit|donation|संग्रह/i.test(lower)) {
    return 'INCOME';
  }
  return 'UNCLASSIFIED';
}

/**
 * Pure In-Browser Local Candidate Extractor.
 * Runs Local OCR (PaddleOCR -> Tesseract fallback) and deterministically binds source regions to candidates.
 * ZERO Gemini calls. ZERO external OCR calls.
 */
export async function extractLocalCandidatesFromImage(
  imageSource: File | Blob | string,
  options: {
    pageNumber: number;
    docId: string;
    existingCategories?: string[];
    currency?: string;
    onProgress?: (msg: string, pct: number) => void;
  }
): Promise<LocalCandidateExtractionResult> {
  const { pageNumber, docId, currency = '₹', onProgress } = options;
  let paddleResult: PaddleOCRResult | null = null;
  let tesseractResult: LocalOCRResult | null = null;
  let engineUsed: 'LOCAL_PADDLEOCR' | 'LOCAL_TESSERACT' = 'LOCAL_PADDLEOCR';

  onProgress?.('Starting in-browser Local OCR (PaddleOCR)...', 10);

  // 1. Try PaddleOCR first
  try {
    paddleResult = await executePaddleOCR(imageSource as any, (status, pct) => {
      onProgress?.(`PaddleOCR: ${status}`, Math.round(pct * 0.7));
    });
  } catch (paddleErr) {
    console.warn('PaddleOCR failed or unsupported in this browser environment, falling back to Tesseract:', paddleErr);
    engineUsed = 'LOCAL_TESSERACT';
    onProgress?.('Running Tesseract WASM local OCR fallback...', 25);
    tesseractResult = await executeLocalOCR(imageSource, (status, pct) => {
      onProgress?.(`Tesseract: ${status}`, Math.round(pct * 0.7));
    });
  }

  onProgress?.('Extracting structured candidates and table geometry...', 75);

  const exceptions: LedgerException[] = [];
  const records: ExtractedRecord[] = [];
  let pageHeader = '';
  let detectedPageTotal: number | undefined = undefined;

  // Build unified row groups from OCR items
  const rowGroups: RowCandidate[] = [];

  if (paddleResult && paddleResult.regions.length > 0) {
    // Sort regions by Y coordinate (top to bottom), then X (left to right)
    const sorted = [...paddleResult.regions].sort((a, b) => {
      const yDiff = a.bbox.y0 - b.bbox.y0;
      if (Math.abs(yDiff) > 18) return yDiff;
      return a.bbox.x0 - b.bbox.x0;
    });

    // Cluster by vertical overlap (within 24px vertical distance)
    sorted.forEach((region) => {
      const yMid = (region.bbox.y0 + region.bbox.y1) / 2;
      const matchedRow = rowGroups.find((r) => Math.abs((r.bbox.y0 + r.bbox.y1) / 2 - yMid) < 22);

      if (matchedRow) {
        matchedRow.regions.push(region);
        matchedRow.rawText += ` ${region.text}`;
        matchedRow.bbox.x0 = Math.min(matchedRow.bbox.x0, region.bbox.x0);
        matchedRow.bbox.y0 = Math.min(matchedRow.bbox.y0, region.bbox.y0);
        matchedRow.bbox.x1 = Math.max(matchedRow.bbox.x1, region.bbox.x1);
        matchedRow.bbox.y1 = Math.max(matchedRow.bbox.y1, region.bbox.y1);
      } else {
        rowGroups.push({
          rowIndex: rowGroups.length + 1,
          rawText: region.text,
          regions: [region],
          bbox: { ...region.bbox },
          poly: region.poly,
          avgScore: region.score,
        });
      }
    });
  } else if (tesseractResult && tesseractResult.lines.length > 0) {
    tesseractResult.lines.forEach((line, idx) => {
      rowGroups.push({
        rowIndex: idx + 1,
        rawText: line.text,
        regions: [],
        bbox: line.bbox ? { ...line.bbox } : { x0: 0, y0: idx * 35, x1: 600, y1: (idx + 1) * 35 },
        avgScore: (line.confidence || 50) / 100,
      });
    });
  }

  // 2. Separate Header / Page Total Rows
  const contentRows: RowCandidate[] = [];

  rowGroups.forEach((row, idx) => {
    const text = row.rawText.trim();
    if (!text) return;

    // Header detection (e.g. top rows mentioning Register / Date / Header keywords)
    if (idx === 0 && (/रजिस्टर|खाता|लेजर|चंदा|समिति|दिनांक|Page|Ledger|Register|Date/i.test(text) || !extractNumericAmounts(text).length)) {
      pageHeader = text;
      return;
    }

    // Page Total detection (e.g. "कुल योग", "Total", "Grand Total", "बाकी")
    if (/कुल|योग|total|grand total|balance|बाकी/i.test(text)) {
      const totals = extractNumericAmounts(text);
      if (totals.length > 0) {
        detectedPageTotal = totals[totals.length - 1];
        return;
      }
    }

    contentRows.push(row);
  });

  // 3. Extract Candidates from Content Rows
  contentRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 1;
    const rawRowText = row.rawText.trim();
    const amounts = extractNumericAmounts(rawRowText);
    const transType = inferTransactionType(rawRowText);

    let amount = 0;
    let confidence: ConfidenceLevel = 'high';
    let ambiguityNotes = '';

    if (amounts.length === 0) {
      // Row has text but no distinct numeric amount
      confidence = 'low';
      ambiguityNotes = 'No numeric amount detected on this row';
      amount = 0;
    } else if (amounts.length === 1) {
      amount = amounts[0];
      // If OCR score is low or text looks garbled
      if (row.avgScore < 0.55) {
        confidence = 'medium';
        ambiguityNotes = 'Moderate OCR confidence on handwriting characters';
      }
    } else {
      // Multiple amounts found on same line
      amount = amounts[amounts.length - 1]; // pick rightmost as candidate
      confidence = 'low';
      ambiguityNotes = `Multiple amount candidates found: [${amounts.join(', ')}]`;
    }

    const name = extractNameFromRowText(rawRowText, amounts.length > 0 ? String(amount) : undefined);

    if (name === 'अज्ञात (Unknown)') {
      confidence = 'low';
      ambiguityNotes = ambiguityNotes ? `${ambiguityNotes}; Missing name` : 'Missing name in row';
    }

    const recordId = `rec-local-${Date.now()}-${rowIdx}-${Math.random().toString(36).substr(2, 4)}`;

    const candidateRecord: ExtractedRecord = {
      id: recordId,
      sourceImageId: docId,
      sourcePage: pageNumber,
      sourceRow: rowNum,
      boundingBox: row.bbox,
      boundingPolygon: row.poly,
      extractionSource: 'LOCAL_OCR',
      name,
      amount,
      transactionType: transType,
      currency,
      paymentMode: /online|gpay|phonepe|upi|पेटीएम/i.test(rawRowText) ? 'Online' : 'Cash',
      category: transType === 'EXPENSE' ? 'Expense' : 'General',
      confidence,
      ambiguityNotes,
      rawText: rawRowText,
      verified: false, // MANDATORY: Local OCR NEVER marks verified: true
      createdAt: Date.now(),
    };

    records.push(candidateRecord);

    // 4. Generate Exceptions for Unresolved Issues (Phase 3 Integration)
    if (confidence === 'low') {
      exceptions.push({
        id: `exc-lowconf-${recordId}`,
        type: 'LOW_CONFIDENCE',
        severity: 'HIGH',
        title: `Row ${rowNum}: Low Confidence (${name})`,
        message: ambiguityNotes || 'Handwriting characters or amounts are uncertain.',
        recordId,
        docId,
        sourceImageId: docId,
        sourcePage: pageNumber,
        sourceRow: rowNum,
        recordName: name,
        amount,
        createdAt: Date.now(),
        resolutionState: 'OPEN',
      });
    }

    if (amounts.length > 1) {
      exceptions.push({
        id: `exc-ambig-${recordId}`,
        type: 'AMBIGUOUS_AMOUNT',
        severity: 'HIGH',
        title: `Row ${rowNum}: Ambiguous Amount Candidates`,
        message: `Multiple numbers detected: ₹${amounts.join(', ₹')}. Please select the intended amount.`,
        recordId,
        docId,
        sourceImageId: docId,
        sourcePage: pageNumber,
        sourceRow: rowNum,
        recordName: name,
        amount,
        createdAt: Date.now(),
        resolutionState: 'OPEN',
      });
    }

    if (transType === 'UNCLASSIFIED') {
      exceptions.push({
        id: `exc-transtype-${recordId}`,
        type: 'TRANSACTION_TYPE_REQUIRED',
        severity: 'MEDIUM',
        title: `Row ${rowNum}: Transaction Type Unclassified`,
        message: `Direction not specified for "${name}". Please classify as Income or Expense.`,
        recordId,
        docId,
        sourceImageId: docId,
        sourcePage: pageNumber,
        sourceRow: rowNum,
        recordName: name,
        amount,
        createdAt: Date.now(),
        resolutionState: 'OPEN',
      });
    }
  });

  // Check arithmetic reconciliation (Phase 1 Integration)
  if (detectedPageTotal !== undefined && records.length > 0) {
    const lineItemSum = records.reduce((sum, r) => sum + r.amount, 0);
    const diff = Math.abs(lineItemSum - Number(detectedPageTotal));
    if (diff > 0.01) {
      exceptions.push({
        id: `exc-arith-${docId}-${pageNumber}`,
        type: 'ARITHMETIC_MISMATCH',
        severity: 'HIGH',
        title: `Page ${pageNumber}: Arithmetic Total Mismatch`,
        message: `Sum of local line items (₹${lineItemSum.toLocaleString()}) does not match detected page total (₹${Number(detectedPageTotal).toLocaleString()}). Difference: ₹${diff.toLocaleString()}`,
        docId,
        sourceImageId: docId,
        sourcePage: pageNumber,
        details: {
          detectedPageTotal: Number(detectedPageTotal),
          calculatedLineItemSum: lineItemSum,
          difference: diff,
        },
        createdAt: Date.now(),
        resolutionState: 'OPEN',
      });
    }
  }

  const qualityNotes =
    engineUsed === 'LOCAL_PADDLEOCR'
      ? `PaddleOCR (PP-OCRv5) local inference. ${records.length} rows detected locally with 0 Gemini calls.`
      : `Tesseract WASM fallback. ${records.length} rows detected locally with 0 Gemini calls.`;

  return {
    records,
    pageHeader,
    detectedPageTotal,
    qualityNotes,
    exceptions,
    engineUsed,
    rawOCRText: paddleResult?.rawText || tesseractResult?.rawText || '',
    totalRegions: paddleResult?.regions.length || tesseractResult?.lines.length || 0,
  };
}
