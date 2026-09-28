import { ExtractedRecord, DuplicateCandidate } from '../types/ledger';

// Helper to normalize strings for comparison (removes titles, extra spaces, punctuation)
export function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/(?:mr\.|mrs\.|ms\.|shri|shree|smt\.|dr\.|ji|श्री|श्रीमती|जी)/gi, '')
    .replace(/[^\w\s\u0900-\u097F]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for fuzzy name comparison
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let j = 0; j <= bn; ++j) matrix[j][0] = j;

  for (let j = 1; j <= bn; ++j) {
    for (let i = 1; i <= an; ++i) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

export function calculateNameSimilarity(str1: string, str2: string): number {
  const s1 = normalizeName(str1);
  const s2 = normalizeName(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  const similarity = 1 - distance / maxLen;

  // Also check if one contains the other as a significant substring
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    if (minLen >= 4) {
      return Math.max(similarity, 0.85);
    }
  }

  return Math.max(0, similarity);
}

/**
 * Compare newly extracted entries against existing verified records or across the batch
 */
export function detectDuplicates(
  newRecords: ExtractedRecord[],
  existingRecords: ExtractedRecord[]
): DuplicateCandidate[] {
  const duplicates: DuplicateCandidate[] = [];
  const evaluatedPairs = new Set<string>();

  for (const newRec of newRecords) {
    // Compare against existing verified records
    for (const existingRec of existingRecords) {
      if (newRec.id === existingRec.id) continue;

      const pairKey = [newRec.id, existingRec.id].sort().join(':');
      if (evaluatedPairs.has(pairKey)) continue;

      // Opposite transaction types (e.g. Rajesh ₹1,000 INCOME vs Rajesh ₹1,000 EXPENSE) cannot be duplicate
      if (
        newRec.transactionType &&
        existingRec.transactionType &&
        newRec.transactionType !== 'UNCLASSIFIED' &&
        existingRec.transactionType !== 'UNCLASSIFIED' &&
        newRec.transactionType !== existingRec.transactionType
      ) {
        continue;
      }

      const reasons: string[] = [];
      let score = 0;

      const nameSim = calculateNameSimilarity(newRec.name, existingRec.name);
      const isExactName = normalizeName(newRec.name) === normalizeName(existingRec.name) && newRec.name.length > 2;
      const isSameAmount = newRec.amount > 0 && newRec.amount === existingRec.amount;
      const isSameHousehold =
        newRec.householdName &&
        existingRec.householdName &&
        normalizeName(newRec.householdName) === normalizeName(existingRec.householdName);
      const isSameDate = newRec.date && existingRec.date && newRec.date === existingRec.date;
      const isSameCategory =
        newRec.category &&
        existingRec.category &&
        newRec.category.toLowerCase() === existingRec.category.toLowerCase();

      if (isExactName) {
        reasons.push(`समान नाम (Exact name match): "${newRec.name}"`);
        score += 0.55;
      } else if (nameSim >= 0.78) {
        reasons.push(
          `मिलता-जुलता नाम (Similar spelling ${Math.round(nameSim * 100)}%): "${newRec.name}" vs "${existingRec.name}"`
        );
        score += 0.4;
      }

      if (isSameAmount) {
        reasons.push(`समान राशि (Identical amount): ₹${newRec.amount.toLocaleString('en-IN')}`);
        score += 0.35;
      }

      if (isSameHousehold) {
        reasons.push(`समान परिवार/घर (Same household): "${newRec.householdName}"`);
        score += 0.15;
      }

      if (isSameDate) {
        reasons.push(`समान तारीख (Same date): ${newRec.date}`);
        score += 0.1;
      }

      if (isSameCategory) {
        reasons.push(`समान श्रेणी (Same category): ${newRec.category}`);
        score += 0.05;
      }

      // If duplicate signals are strong enough (e.g. same name + same amount, or very high name similarity)
      if (score >= 0.5 || (isExactName && (isSameAmount || isSameHousehold))) {
        evaluatedPairs.add(pairKey);
        duplicates.push({
          id: `dup-${newRec.id}-${existingRec.id}`,
          newRecordId: newRec.id,
          existingRecordId: existingRec.id,
          newRecord: newRec,
          matchedRecord: existingRec,
          reasons,
          similarityScore: Math.min(1.0, score),
          status: 'pending',
        });
      }
    }
  }

  return duplicates;
}
