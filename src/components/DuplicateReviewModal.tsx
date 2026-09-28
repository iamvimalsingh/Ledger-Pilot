import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  GitMerge,
  Split,
  EyeOff,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { DuplicateCandidate, ExtractedRecord, TransactionType } from '../types/ledger';
import { formatINR } from '../utils/reconciliation';

interface DuplicateReviewModalProps {
  candidates: DuplicateCandidate[];
  onMerge: (candidateId: string, mergedRecord: ExtractedRecord) => void;
  onKeepSeparate: (candidateId: string) => void;
  onIgnore: (candidateId: string) => void;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  candidates,
  onMerge,
  onKeepSeparate,
  onIgnore,
  onClose,
  language,
}) => {
  const isHi = language === 'hi';
  const pendingCandidates = candidates.filter((c) => c.status === 'pending');

  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(
    pendingCandidates[0]?.id || null
  );

  // Merge customization state
  const activeCandidate = pendingCandidates.find((c) => c.id === activeCandidateId);
  const [selectedNameSource, setSelectedNameSource] = useState<'new' | 'existing'>('new');
  const [selectedAmountMode, setSelectedAmountMode] = useState<'keep_one' | 'sum'>('keep_one');
  const [mergeNotes, setMergeNotes] = useState<string>('');

  if (!activeCandidate) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {isHi ? 'कोई डुप्लिकेट लंबित नहीं है!' : 'All Duplicates Resolved!'}
          </h3>
          <p className="text-sm text-stone-600 mt-1 mb-5">
            {isHi
              ? 'सभी संभावित प्रविष्टियों की समीक्षा पूरी हो चुकी है।'
              : 'Every potential duplicate candidate has been reviewed.'}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition"
          >
            {isHi ? 'वापस जाएँ' : 'Back to Ledger'}
          </button>
        </div>
      </div>
    );
  }

  const { newRecord, matchedRecord, reasons, similarityScore } = activeCandidate;

  const handleExecuteMerge = () => {
    const finalAmount =
      selectedAmountMode === 'sum' ? newRecord.amount + matchedRecord.amount : newRecord.amount;

    const resolvedType: TransactionType =
      matchedRecord.transactionType && matchedRecord.transactionType !== 'UNCLASSIFIED'
        ? matchedRecord.transactionType
        : newRecord.transactionType && newRecord.transactionType !== 'UNCLASSIFIED'
        ? newRecord.transactionType
        : 'UNCLASSIFIED';

    const merged: ExtractedRecord = {
      ...matchedRecord,
      name: selectedNameSource === 'new' ? newRecord.name : matchedRecord.name,
      amount: finalAmount,
      transactionType: resolvedType,
      purpose: [matchedRecord.purpose, newRecord.purpose, mergeNotes].filter(Boolean).join(' | '),
      rawText: `${matchedRecord.rawText || ''} [Merged with ${newRecord.name} (₹${newRecord.amount})]`,
      verified: resolvedType !== 'UNCLASSIFIED',
      auditTrail: {
        originalAIValue: {
          name: newRecord.name,
          amount: newRecord.amount,
          transactionType: newRecord.transactionType,
        },
        userCorrectedValue: {
          name: selectedNameSource === 'new' ? newRecord.name : matchedRecord.name,
          amount: finalAmount,
          transactionType: resolvedType,
        },
        correctedAt: Date.now(),
        correctedReason: `Merged duplicate: ${selectedAmountMode === 'sum' ? 'Summed amounts' : 'Single entry kept'}`,
      },
    };

    onMerge(activeCandidate.id, merged);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50/80 border-b border-amber-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <span>{isHi ? 'संभावित डुप्लिकेट समीक्षा' : 'Potential Duplicate Review'}</span>
                <span className="text-xs bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  {pendingCandidates.length} {isHi ? 'शेष' : 'remaining'}
                </span>
              </h3>
              <p className="text-xs text-stone-600">
                {isHi
                  ? 'सिस्टम स्वचालित रूप से मर्ज नहीं करता। कृपया सही विकल्प चुनें।'
                  : 'System does not merge automatically. Please verify human intent.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-amber-100/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reasons banner */}
        <div className="bg-amber-50/40 px-5 py-2.5 border-b border-amber-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-amber-900">
            {isHi ? 'पहचान के कारण:' : 'Matching signals:'}
          </span>
          {reasons.map((reason, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-white text-stone-700 border border-amber-200 px-2 py-0.5 rounded-md font-medium"
            >
              {reason}
            </span>
          ))}
          <span className="text-[11px] font-bold text-amber-700 ml-auto">
            {Math.round(similarityScore * 100)}% {isHi ? 'समानता' : 'similarity'}
          </span>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Newly Extracted Record */}
            <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {isHi ? 'नई प्रविष्टि (Newly Extracted)' : 'New Extraction'}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        newRecord.transactionType === 'UNCLASSIFIED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : newRecord.transactionType === 'EXPENSE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {newRecord.transactionType || 'UNCLASSIFIED'}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {isHi ? `पेज ${newRecord.sourcePage}` : `Page ${newRecord.sourcePage}`}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-stone-500 block">{isHi ? 'नाम' : 'Name'}</span>
                  <div className="text-base font-bold text-stone-900">{newRecord.name}</div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-500 block">{isHi ? 'राशि' : 'Amount'}</span>
                    <span className="text-lg font-black text-indigo-800 font-mono">
                      {formatINR(newRecord.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">{isHi ? 'माध्यम' : 'Mode'}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-800">
                      {newRecord.paymentMode}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[11px] text-stone-500 block">{isHi ? 'श्रेणी' : 'Category'}</span>
                  <span className="text-xs font-medium text-stone-700">{newRecord.category}</span>
                </div>

                {newRecord.householdName && (
                  <div className="mt-2">
                    <span className="text-[11px] text-stone-500 block">{isHi ? 'परिवार' : 'Household'}</span>
                    <span className="text-xs font-medium text-stone-700">{newRecord.householdName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Matched Record */}
            <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {isHi ? 'पहले से दर्ज (Existing Record)' : 'Existing in Ledger'}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        matchedRecord.transactionType === 'UNCLASSIFIED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : matchedRecord.transactionType === 'EXPENSE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {matchedRecord.transactionType || 'UNCLASSIFIED'}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {isHi ? `पेज ${matchedRecord.sourcePage}` : `Page ${matchedRecord.sourcePage}`}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[11px] text-stone-500 block">{isHi ? 'नाम' : 'Name'}</span>
                  <div className="text-base font-bold text-stone-900">{matchedRecord.name}</div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-500 block">{isHi ? 'राशि' : 'Amount'}</span>
                    <span className="text-lg font-black text-emerald-800 font-mono">
                      {formatINR(matchedRecord.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 block">{isHi ? 'माध्यम' : 'Mode'}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-800">
                      {matchedRecord.paymentMode}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-[11px] text-stone-500 block">{isHi ? 'श्रेणी' : 'Category'}</span>
                  <span className="text-xs font-medium text-stone-700">{matchedRecord.category}</span>
                </div>

                {matchedRecord.householdName && (
                  <div className="mt-2">
                    <span className="text-[11px] text-stone-500 block">{isHi ? 'परिवार' : 'Household'}</span>
                    <span className="text-xs font-medium text-stone-700">{matchedRecord.householdName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Merge Options Customizer */}
          <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-3 flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5 text-amber-600" />
              <span>{isHi ? 'यदि मर्ज करें तो क्या रखें?' : 'Merge Options (If merging)'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                  {isHi ? 'कौन सा नाम रखना है?' : 'Which Name to keep?'}
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="nameSource"
                      checked={selectedNameSource === 'new'}
                      onChange={() => setSelectedNameSource('new')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="truncate">{newRecord.name} (नया)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="nameSource"
                      checked={selectedNameSource === 'existing'}
                      onChange={() => setSelectedNameSource('existing')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="truncate">{matchedRecord.name} (मौजूदा)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                  {isHi ? 'राशि का क्या करें?' : 'Amount Handling?'}
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="amountMode"
                      checked={selectedAmountMode === 'keep_one'}
                      onChange={() => setSelectedAmountMode('keep_one')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>{isHi ? `एक ही रखें (${formatINR(newRecord.amount)})` : `Keep single (${formatINR(newRecord.amount)})`}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="amountMode"
                      checked={selectedAmountMode === 'sum'}
                      onChange={() => setSelectedAmountMode('sum')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      {isHi
                        ? `दोनों को जोड़ें (${formatINR(newRecord.amount + matchedRecord.amount)})`
                        : `Sum both amounts (${formatINR(newRecord.amount + matchedRecord.amount)})`}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions: Merge, Keep Separate, Ignore */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={() => onIgnore(activeCandidate.id)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition flex items-center gap-1.5"
          >
            <EyeOff className="w-4 h-4" />
            <span>{isHi ? 'नजरअंदाज (Ignore)' : 'Ignore'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onKeepSeparate(activeCandidate.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 transition shadow-xs flex items-center gap-1.5"
            >
              <Split className="w-4 h-4 text-indigo-600" />
              <span>{isHi ? 'अलग रखें (Keep Separate)' : 'Keep Separate'}</span>
            </button>

            <button
              onClick={handleExecuteMerge}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm flex items-center gap-1.5"
            >
              <GitMerge className="w-4 h-4" />
              <span>{isHi ? 'मर्ज करें (Merge Records)' : 'Merge Records'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
