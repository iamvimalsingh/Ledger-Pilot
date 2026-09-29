import React from 'react';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  CreditCard,
  Banknote,
  FileText,
  Share2,
  Printer,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderDown,
} from 'lucide-react';
import {
  ExtractedRecord,
  SourceDocument,
  DuplicateCandidate,
  LedgerSettings,
} from '../types/ledger';
import { calculateReconciliationMetrics, formatINR } from '../utils/reconciliation';

interface DashboardProps {
  records: ExtractedRecord[];
  documents: SourceDocument[];
  duplicates: DuplicateCandidate[];
  onSelectTab: (tab: string) => void;
  onOpenQuickEntry: () => void;
  onOpenBackupModal?: () => void;
  onEditRecord?: (record: ExtractedRecord) => void;
  settings: LedgerSettings;
  language?: 'hi' | 'en';
}

export function Dashboard({
  records,
  documents,
  duplicates,
  onSelectTab,
  onOpenQuickEntry,
  onOpenBackupModal,
  onEditRecord,
  settings,
  language = 'hi',
}: DashboardProps) {
  const isHi = language === 'hi';
  const metrics = calculateReconciliationMetrics(records, duplicates);

  const verifiedRecords = records.filter((r) => r.verified);
  const unverifiedRecords = records.filter((r) => !r.verified);

  // Latest 5 entries sorted by creation time or serial
  const recentEntries = [...records]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || (b.serialNumber || 0) - (a.serialNumber || 0))
    .slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6">
      {/* 1. Net Balance Hero Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-7 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
              {isHi ? 'शेष (बचा हुआ पैसा)' : 'Remaining Balance'}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  metrics.netBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {formatINR(metrics.netBalance)}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenQuickEntry}
            className="h-12 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{isHi ? '+ नया हिसाब जोड़ें' : '+ Add Entry'}</span>
          </button>
        </div>

        {/* Income & Expense Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-5">
          {/* Income Column */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-0.5">
                {isHi ? 'कुल आय (Total Income)' : 'Total Income'}
              </p>
              <p className="text-lg sm:text-xl font-bold text-stone-900">
                {formatINR(metrics.verifiedIncome)}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {verifiedRecords.filter((r) => r.transactionType === 'INCOME').length}{' '}
                {isHi ? 'प्रविष्टियां' : 'entries'}
              </p>
            </div>
          </div>

          {/* Expense Column */}
          <div className="flex items-start gap-3 border-l border-stone-100 pl-4 sm:pl-6">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-0.5">
                {isHi ? 'कुल खर्च (Total Expense)' : 'Total Expense'}
              </p>
              <p className="text-lg sm:text-xl font-bold text-stone-900">
                {formatINR(metrics.verifiedExpense)}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {verifiedRecords.filter((r) => r.transactionType === 'EXPENSE').length}{' '}
                {isHi ? 'प्रविष्टियां' : 'entries'}
              </p>
            </div>
          </div>
        </div>

        {/* Cash vs Online Metrics Bar (Subtle metadata, no static pills) */}
        {(metrics.cashTotal > 0 || metrics.onlineTotal > 0) && (
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-stone-400" />
              <span>{isHi ? 'नकद (Cash):' : 'Cash:'}</span>
              <span className="font-bold text-stone-900">{formatINR(metrics.cashTotal)}</span>
            </div>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-stone-400" />
              <span>{isHi ? 'ऑनलाइन (Online/UPI):' : 'Online:'}</span>
              <span className="font-bold text-stone-900">{formatINR(metrics.onlineTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectTab('ledger')}
          className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-left transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-2.5 group-hover:bg-stone-200 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <p className="font-bold text-sm text-stone-900">{isHi ? 'बहीखाता' : 'Ledger'}</p>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {records.length} {isHi ? 'रिकॉर्ड्स' : 'records'}
          </p>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-left transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5 group-hover:bg-emerald-100 transition-colors">
            <Share2 className="w-4 h-4" />
          </div>
          <p className="font-bold text-sm text-stone-900">{isHi ? 'WhatsApp शेयर' : 'WhatsApp Share'}</p>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {isHi ? 'विवरण भेजें' : 'Send summary'}
          </p>
        </button>

        <button
          onClick={() => onSelectTab('reports')}
          className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-left transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-2.5 group-hover:bg-stone-200 transition-colors">
            <Printer className="w-4 h-4" />
          </div>
          <p className="font-bold text-sm text-stone-900">{isHi ? 'प्रिंट / PDF' : 'Print / PDF'}</p>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {isHi ? 'A4 रिपोर्ट' : 'Formal sheet'}
          </p>
        </button>

        {onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            className="p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-left transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center mb-2.5 group-hover:bg-stone-200 transition-colors">
              <FolderDown className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="font-bold text-sm text-stone-900">{isHi ? 'हिसाब सुरक्षित करें' : 'Backup Ledger'}</p>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              {isHi ? 'सुरक्षित बैकअप' : 'Save backup file'}
            </p>
          </button>
        )}
      </div>

      {/* 3. Pending Review Banner (if any unverified items from OCR exist) */}
      {unverifiedRecords.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                {unverifiedRecords.length} {isHi ? 'प्रविष्टियां समीक्षा हेतु बाकी हैं' : 'entries pending review'}
              </p>
              <p className="text-xs text-amber-700">
                {isHi ? 'सत्यापित करने के बाद ही शेष राशि में जुड़ेंगी' : 'Will update balance upon verification'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('ledger')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            {isHi ? 'समीक्षा करें' : 'Review'}
          </button>
        </div>
      )}

      {/* 4. Recent Entries Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-stone-900">
            {isHi ? 'हालिया लेन-देन (Recent Entries)' : 'Recent Entries'}
          </h3>
          {records.length > 0 && (
            <button
              onClick={() => onSelectTab('ledger')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isHi ? 'सभी देखें' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {records.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-800 text-base mb-1">
              {isHi ? 'अभी कोई हिसाब दर्ज नहीं है' : 'No entries yet'}
            </h4>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-5">
              {isHi
                ? 'अपनी डायरी या रसीद से पहला हिसाब जोड़ने के लिए नीचे दिए गए बटन पर टैप करें।'
                : 'Start tracking transactions by adding your first entry below.'}
            </p>
            <button
              onClick={onOpenQuickEntry}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isHi ? '+ पहला हिसाब जोड़ें' : '+ Add First Entry'}</span>
            </button>
          </div>
        ) : (
          /* List of Recent Entries */
          <div className="divide-y divide-stone-100">
            {recentEntries.map((entry) => {
              const isIncome = entry.transactionType === 'INCOME';
              return (
                <div
                  key={entry.id}
                  onClick={() => onEditRecord && onEditRecord(entry)}
                  className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-semibold text-stone-400 shrink-0">
                      #{entry.serialNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-stone-900 truncate">{entry.name}</p>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span>{entry.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.paymentMode}</span>
                        {entry.date && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{entry.date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-bold text-sm sm:text-base ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatINR(entry.amount)}
                    </p>
                    <span className="text-[11px] font-medium text-stone-400 block">
                      {isIncome ? (isHi ? 'आय' : 'Income') : isHi ? 'खर्च' : 'Expense'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
