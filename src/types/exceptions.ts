export type ExceptionType =
  | 'LOW_CONFIDENCE'
  | 'ARITHMETIC_MISMATCH'
  | 'POSSIBLE_DUPLICATE'
  | 'MISSING_FIELD'
  | 'TRANSACTION_TYPE_REQUIRED'
  | 'ROW_STRUCTURE_REVIEW'
  | 'AMBIGUOUS_AMOUNT'
  | 'CONFLICT';

export type ExceptionSeverity = 'HIGH' | 'MEDIUM';

export type ExceptionResolutionState = 'OPEN' | 'RESOLVED';

export interface LedgerException {
  id: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  title: string;
  message: string;
  recordId?: string;
  docId?: string;
  sourceImageId?: string;
  sourcePage?: number;
  sourceRow?: number;
  candidateId?: string;
  createdAt: number;
  resolutionState: ExceptionResolutionState;
  
  // Context metadata for display & routing
  recordName?: string;
  amount?: number;
  details?: {
    field?: string;
    detectedPageTotal?: number;
    calculatedLineItemSum?: number;
    difference?: number;
    reasons?: string[];
    [key: string]: any;
  };
}

export interface ExceptionSummary {
  total: number;
  arithmeticCount: number;
  lowConfidenceCount: number;
  duplicateCount: number;
  missingFieldCount: number;
  typeRequiredCount: number;
  rowStructureCount: number;
  ambiguousAmountCount: number;
  conflictCount: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
}
