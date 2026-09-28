import React from 'react';
import { X, History, Sparkles, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { ExtractedRecord } from '../types/ledger';
import { formatINR } from '../utils/reconciliation';

interface AuditHistoryModalProps {
  record: ExtractedRecord | null;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({ record, onClose, language }) => {
  const isHi = language === 'hi';
  if (!record) return null;

  const audit = record.auditTrail;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <History className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                {isHi ? 'ऑडिट ट्रेल (संशोधन इतिहास)' : 'Correction Audit History'}
              </h3>
              <span className="text-[11px] text-stone-500 font-medium">Record ID: {record.id}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State */}
        <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
          <div className="font-bold text-stone-900 text-sm mb-1">{record.name}</div>
          <div className="flex items-center justify-between text-stone-600">
            <span>
              {record.category} • {record.paymentMode}
            </span>
            <span className="font-bold font-mono text-sm text-stone-900">{formatINR(record.amount)}</span>
          </div>
        </div>

        {/* Audit Comparison */}
        {audit ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Original AI Value */}
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="text-[10px] uppercase font-bold text-purple-800 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>{isHi ? 'मूल AI मान' : 'Original AI Value'}</span>
                </span>
                <div className="font-semibold text-stone-800">
                  {audit.originalAIValue?.name || record.name}
                </div>
                <div className="font-bold font-mono text-purple-900 text-base mt-1">
                  {formatINR(audit.originalAIValue?.amount || record.amount)}
                </div>
                {audit.originalAIValue?.transactionType && (
                  <div className="text-[11px] font-bold text-purple-700 mt-1">
                    {isHi ? 'प्रकार:' : 'Type:'} {audit.originalAIValue.transactionType}
                  </div>
                )}
              </div>

              {/* User Corrected Value */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center gap-1 mb-1">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  <span>{isHi ? 'मानव द्वारा सुधारा गया' : 'User Corrected'}</span>
                </span>
                <div className="font-semibold text-stone-800">
                  {audit.userCorrectedValue?.name || record.name}
                </div>
                <div className="font-bold font-mono text-emerald-900 text-base mt-1">
                  {formatINR(audit.userCorrectedValue?.amount ?? record.amount)}
                </div>
                {audit.userCorrectedValue?.transactionType && (
                  <div className="text-[11px] font-bold text-emerald-700 mt-1">
                    {isHi ? 'प्रकार:' : 'Type:'} {audit.userCorrectedValue.transactionType}
                  </div>
                )}
              </div>
            </div>

            {audit.correctedReason && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-0.5">
                  {isHi ? 'सुधार का कारण:' : 'Reason for Correction:'}
                </span>
                <p className="text-amber-800">{audit.correctedReason}</p>
                {audit.correctedAt && (
                  <span className="text-[10px] text-amber-700 block mt-1">
                    {new Date(audit.correctedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-stone-500 text-xs">
            {isHi ? 'यह रिकॉर्ड बिना किसी सुधार के सत्यापित हुआ है।' : 'No manual corrections made to this record.'}
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800"
          >
            {isHi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
