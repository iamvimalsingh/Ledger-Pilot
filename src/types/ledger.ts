export type PaymentMode = 'Cash' | 'Online' | 'Other';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'UNCLASSIFIED';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type PageValidationStatus = 'MATCH' | 'MISMATCH' | 'NO_PAGE_TOTAL';

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

export interface ExtractedRecord {
  id: string;
  sourceImageId: string;
  sourcePage: number;
  name: string;
  amount: number;
  transactionType: TransactionType;
  currency: string;
  paymentMode: PaymentMode;
  category: string;
  purpose?: string;
  date?: string;
  householdName?: string;
  householdId?: string;
  confidence: ConfidenceLevel;
  ambiguityNotes?: string;
  rawText?: string;
  verified: boolean;
  createdAt: number;
  auditTrail?: AuditRecord;
}

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
