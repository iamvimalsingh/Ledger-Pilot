import React, { useState } from 'react';
import {
  Share2,
  Printer,
  Copy,
  Check,
  Download,
  CreditCard,
  Banknote,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  PieChart,
} from 'lucide-react';
import { LedgerEntry, SourceDocument, LedgerSettings } from '../types/ledger';
import { generateWhatsAppSummary, openWhatsAppShare, shareOrCopySummary } from '../utils/whatsapp';
import { formatINR, calculateReconciliationMetrics } from '../utils/reconciliation';

interface ReportsViewProps {
  records: LedgerEntry[];
  documents: SourceDocument[];
  onViewSource?: (docId: string, recordId?: string) => void;
  onOpenPrint: () => void;
  settings: LedgerSettings;
  language?: 'hi' | 'en';
}

export function ReportsView({
  records,
  documents,
  onOpenPrint,
  settings,
  language = 'hi',
}: ReportsViewProps) {
  const isHi = language === 'hi';
  const [activeTab, setActiveTab] = useState<'summary' | 'categories' | 'modes'>('summary');
  const [copied, setCopied] = useState<boolean>(false);

  const metrics = calculateReconciliationMetrics(records);

  const whatsappText = generateWhatsAppSummary({
    title: settings.projectName || 'My Ledger',
    records,
    includeTopDonors: true,
  });

  const handleShareWhatsApp = () => {
    openWhatsAppShare(whatsappText);
  };

  const handleCopySummary = async () => {
    await shareOrCopySummary(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'क्रमांक (Sr)',
      'प्रकार (Type)',
      'नाम (Name)',
      'राशि (Amount)',
      'माध्यम (Mode)',
      'श्रेणी (Category)',
      'उद्देश्य (Purpose)',
      'दिनांक (Date)',
      'सत्यापित (Verified)',
    ];

    const rows = records.map((r) => [
      r.serialNumber,
      r.transactionType,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      r.amount,
      r.paymentMode,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.date || '',
      r.verified ? 'Yes' : 'No',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `LedgerPilot_Report_${(settings.projectName || 'Ledger').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {isHi ? 'रिपोर्ट्स एवं शेयर (Reports & Share)' : 'Reports & Share'}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {isHi
              ? 'WhatsApp सारांश, प्रिंटेबल A4 बैलेंस शीट, एवं श्रेणीवार विश्लेषण'
              : 'WhatsApp summary, formal A4 printable balance sheet, and analytics'}
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="h-10 px-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isHi ? 'CSV डाउनलोड' : 'CSV Export'}</span>
          </button>

          <button
            onClick={onOpenPrint}
            className="h-10 px-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isHi ? 'प्रिंट / PDF' : 'Print / PDF'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{isHi ? 'WhatsApp शेयर' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'summary' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {isHi ? 'WhatsApp सारांश' : 'WhatsApp'}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'categories' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {isHi ? 'श्रेणीवार विवरण' : 'Categories'}
        </button>
        <button
          onClick={() => setActiveTab('modes')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'modes' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {isHi ? 'नकद / ऑनलाइन' : 'Payment Modes'}
        </button>
      </div>

      {/* Tab 1: WhatsApp Summary */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-stone-900">
              {isHi ? 'WhatsApp संदेश पूर्वावलोकन' : 'WhatsApp Message Preview'}
            </h3>
            <button
              onClick={handleCopySummary}
              className="h-8 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                  <span className="text-emerald-800">{isHi ? 'कॉपी हुआ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isHi ? 'कॉपी करें' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 font-mono text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed select-all">
            {whatsappText}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleShareWhatsApp}
              className="h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isHi ? 'सीधे WhatsApp पर भेजें' : 'Send via WhatsApp'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Category Breakdown */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-stone-900">
            {isHi ? 'मदवार / श्रेणीवार विश्लेषण' : 'Category Analysis'}
          </h3>

          {Object.keys(metrics.categoryTotals).length === 0 ? (
            <p className="text-xs text-stone-500 py-4">
              {isHi ? 'कोई श्रेणी डेटा उपलब्ध नहीं है।' : 'No category data recorded yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.categoryTotals)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([category, data]) => {
                  const maxTotal = Math.max(
                    ...Object.values(metrics.categoryTotals).map((c) => c.total),
                    1
                  );
                  const percentage = Math.round((data.total / maxTotal) * 100);

                  return (
                    <div key={category} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-stone-900">{category}</span>
                        <span className="font-bold text-sm font-mono text-stone-900">
                          {formatINR(data.total)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-700 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1.5">
                        {data.count} {isHi ? 'प्रविष्टियां दर्ज हैं' : 'entries'}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Payment Modes Breakdown */}
      {activeTab === 'modes' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-stone-900">
            {isHi ? 'भुगतान माध्यम विश्लेषण' : 'Payment Mode Analysis'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cash Box */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2 mb-2 text-stone-700">
                <Banknote className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-sm">{isHi ? 'नकद (Cash)' : 'Cash'}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{isHi ? 'नकद आय:' : 'Cash Income:'}</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    +{formatINR(metrics.cashIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{isHi ? 'नकद खर्च:' : 'Cash Expense:'}</span>
                  <span className="font-bold text-rose-700 font-mono">
                    -{formatINR(metrics.cashExpense)}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-bold">
                  <span>{isHi ? 'शुद्ध नकद शेष:' : 'Net Cash:'}</span>
                  <span className="font-mono">{formatINR(metrics.cashIncome - metrics.cashExpense)}</span>
                </div>
              </div>
            </div>

            {/* Online Box */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2 mb-2 text-stone-700">
                <CreditCard className="w-5 h-5 text-indigo-700" />
                <span className="font-bold text-sm">{isHi ? 'ऑनलाइन / बैंक (UPI)' : 'Online / UPI'}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{isHi ? 'ऑनलाइन आय:' : 'Online Income:'}</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    +{formatINR(metrics.onlineIncome)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">{isHi ? 'ऑनलाइन खर्च:' : 'Online Expense:'}</span>
                  <span className="font-bold text-rose-700 font-mono">
                    -{formatINR(metrics.onlineExpense)}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-bold">
                  <span>{isHi ? 'शुद्ध ऑनलाइन शेष:' : 'Net Online:'}</span>
                  <span className="font-mono">{formatINR(metrics.onlineIncome - metrics.onlineExpense)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
