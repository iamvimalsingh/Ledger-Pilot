export type PaymentMode = 'Cash' | 'Online' | 'Other';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'UNCLASSIFIED';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type PageValidationStatus = 'MATCH' | 'MISMATCH' | 'NO_PAGE_TOTAL';

export type AIAssistanceMode = 'OFF' | 'SMART' | 'ON-DEMAND';

export type EntrySource = 'MANUAL' | 'LOCAL_OCR' | 'AI_ASSISTED' | 'IMPORT';

export type ProjectType = 'general' | 'society' | 'business' | 'personal';

export interface AIBudgetStats {
  pagesProcessed: number;
  totalRows: number;
  localOnlyRows: number;
  aiAssistedRows: number;
  geminiRequests: number;
}

export interface PageMathValidation {
  docId: string;
  pageNumber: number;
  fileName: string;
  pageHeader?: string;
  detectedPageTotal?: number;
  calculatedLineItemSum: number;
  difference: number; // calculatedLineItemSum - (detectedPageTotal ?? 0)
  status: PageValidationStatus;
  isMatch: boolean;
  itemCount: number;
  incomeSum?: number;
  expenseSum?: number;
  netSum?: number;
  breakdownNote?: string;
}

export interface AuditRecord {
  originalAIValue?: {
    name?: string;
    amount?: number;
    transactionType?: TransactionType;
    paymentMode?: PaymentMode;
    category?: string;
    confidence?: ConfidenceLevel;
  };
  userCorrectedValue?: {
    name?: string;
    amount?: number;
    transactionType?: TransactionType;
    paymentMode?: PaymentMode;
    category?: string;
  };
  correctedAt?: number;
  correctedReason?: string;
}

export interface LedgerProject {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  currency: string;
  categories: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LedgerEntry {
  id: string;
  projectId?: string;
  serialNumber?: number;
  transactionType: TransactionType;
  name: string;
  amount: number;
  currency: string;
  paymentMode: PaymentMode;
  category: string;
  purpose?: string;
  date?: string;
  time?: string;
  notes?: string;
  source?: EntrySource;
  extractionSource?: 'LOCAL_OCR' | 'AI_ASSISTED' | 'MANUAL';
  verified: boolean;
  createdAt: number;
  updatedAt?: number;

  // OCR and Document traceability
  sourceImageId?: string;
  sourcePage?: number;
  sourceRow?: number;
  boundingBox?: { x0: number; y0: number; x1: number; y1: number };
  boundingPolygon?: Array<{ x: number; y: number } | [number, number]>;
  confidence?: ConfidenceLevel;
  ambiguityNotes?: string;
  rawText?: string;
  householdName?: string;
  householdId?: string;
  auditTrail?: AuditRecord;
}

// ExtractedRecord alias for backward compatibility with existing OCR utilities
export type ExtractedRecord = LedgerEntry;

export interface SourceDocument {
  id: string;
  fileName: string;
  dataUrl: string;
  pageNumber: number;
  uploadedAt: number;
  recordCount: number;
  detectedPageTotal?: number;
  pageHeader?: string;
  qualityNotes?: string;
  extractionEngine?: 'LOCAL_PADDLEOCR' | 'LOCAL_TESSERACT' | 'GEMINI_FALLBACK';
}

export interface DuplicateCandidate {
  id: string;
  newRecordId: string;
  existingRecordId: string;
  newRecord: ExtractedRecord;
  matchedRecord: ExtractedRecord;
  reasons: string[];
  similarityScore: number;
  status: 'pending' | 'merged' | 'kept_separate' | 'ignored';
}

export interface Household {
  id: string;
  name: string; // e.g. "Singh Family"
  members: string[]; // e.g. ["Vimal Singh", "Neha Singh", "Raghav Singh"]
  flatOrAddress?: string;
  notes?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface LedgerSettings {
  projectName: string;
  eventOrColony: string;
  currency: string;
  categories: string[];
  language: 'hi' | 'en';
  aiAssistanceMode?: AIAssistanceMode;
}

export interface ExtractionAPIResponse {
  success: boolean;
  pageHeader?: string;
  detectedPageTotal?: number;
  qualityNotes?: string;
  records: Array<{
    name: string;
    amount: number;
    transactionType?: TransactionType;
    currency?: string;
    paymentMode: PaymentMode;
    category: string;
    purpose?: string;
    date?: string;
    householdName?: string;
    confidence: ConfidenceLevel;
    ambiguityNotes?: string;
    rawText?: string;
  }>;
  error?: string;
}

export * from './exceptions';
