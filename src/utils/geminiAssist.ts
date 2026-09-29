import { ExtractedRecord, TransactionType } from '../types/ledger';

export interface UnresolvedRowAssistRequest {
  recordId: string;
  sourceRow: number;
  rawText?: string;
  nameCandidate: string;
  amountCandidate: number;
}

export interface UnresolvedRowAssistResult {
  recordId: string;
  name: string;
  amount: number;
  transactionType: TransactionType;
  confidence: 'high' | 'medium' | 'low';
  resolutionStatus: 'CONFIRMED' | 'CORRECTED' | 'UNRESOLVED';
  notes?: string;
}

export interface BatchAssistResponse {
  success: boolean;
  resolvedRows: UnresolvedRowAssistResult[];
  error?: string;
}

/**
 * Batched Gemini AI Assist for Unresolved Rows of a Page.
 * Batches multiple unresolved rows into ONE single Gemini API call.
 * If Gemini fails (503 / 429 / offline), fails closed with error message and NEVER fabricates demo data.
 */
export async function runGeminiBatchAssist(
  imageDataUrl: string,
  unresolvedRows: UnresolvedRowAssistRequest[],
  pageNumber: number,
  projectName?: string
): Promise<BatchAssistResponse> {
  if (unresolvedRows.length === 0) {
    return { success: true, resolvedRows: [] };
  }

  try {
    const response = await fetch('/api/extract-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageDataUrl,
        mimeType: 'image/jpeg',
        pageNumber,
        projectName: projectName || '',
        unresolvedRows, // Targeted batch assist prompt
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Gemini API returned status ${response.status}`;
      try {
        const json = JSON.parse(errText);
        if (json.error) msg = json.error;
      } catch (_) {}
      return { success: false, resolvedRows: [], error: msg };
    }

    const data = await response.json();
    if (!data.success) {
      return { success: false, resolvedRows: [], error: data.error || 'AI verification failed' };
    }

    // Map verified records back to targeted rows
    const resolvedRows: UnresolvedRowAssistResult[] = [];
    const aiRecords = data.records || [];

    unresolvedRows.forEach((row, idx) => {
      const matched = aiRecords[idx];
      if (matched) {
        resolvedRows.push({
          recordId: row.recordId,
          name: matched.name || row.nameCandidate,
          amount: matched.amount !== undefined ? matched.amount : row.amountCandidate,
          transactionType: matched.transactionType || 'UNCLASSIFIED',
          confidence: matched.confidence || 'medium',
          resolutionStatus:
            matched.confidence === 'high' ? 'CONFIRMED' : matched.confidence === 'medium' ? 'CORRECTED' : 'UNRESOLVED',
          notes: matched.ambiguityNotes || '',
        });
      } else {
        resolvedRows.push({
          recordId: row.recordId,
          name: row.nameCandidate,
          amount: row.amountCandidate,
          transactionType: 'UNCLASSIFIED',
          confidence: 'low',
          resolutionStatus: 'UNRESOLVED',
          notes: 'AI could not resolve this specific row.',
        });
      }
    });

    return {
      success: true,
      resolvedRows,
    };
  } catch (err: any) {
    console.warn('Gemini batch assist network failure:', err);
    return {
      success: false,
      resolvedRows: [],
      error: err?.message || 'Network error connecting to AI assist service.',
    };
  }
}
