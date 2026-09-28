import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Calculator,
  PieChart,
  Scale,
  Eye,
  ChevronRight,
} from 'lucide-react';
import {
  ExtractedRecord,
  DuplicateCandidate,
  LedgerSettings,
  SourceDocument,
  PageMathValidation,
} from '../types/ledger';
import {
  calculateReconciliationMetrics,
  calculateProposedReconciliation,
  calculateAllPagesMathValidation,
  calculatePagesMathSummary,
  formatINR,
} from '../utils/reconciliation';

interface ReconciliationSummaryProps {
  records: ExtractedRecord[];
  documents?: SourceDocument[];
  duplicates: DuplicateCandidate[];
  onDrilldown: (filterType: string, filterValue: string) => void;
  onApproveProposedReconciliation: () => void;
  onViewSource?: (docId: string) => void;
  settings: LedgerSettings;
  language: 'hi' | 'en';
}

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({
  records,
  documents = [],
  duplicates,
  onDrilldown,
  onApproveProposedReconciliation,
  onViewSource,
  settings,
  language,
}) => {
  const isHi = language === 'hi';
  const [showCalculationDetails, setShowCalculationDetails] = useState<boolean>(true);

  const metrics = calculateReconciliationMetrics(records, duplicates);
  const pageValidations: PageMathValidation[] = calculateAllPagesMathValidation(
    documents,
    records
  );
  const pagesSummary = calculatePagesMathSummary(pageValidations);

  const verifiedList = records.filter((r) => r.verified);
  const unverifiedList = records.filter((r) => !r.verified);
  const pendingDuplicates = duplicates.filter((d) => d.status === 'pending');

  const proposed = calculateProposedReconciliation(verifiedList, unverifiedList, pendingDuplicates);
  const hasPendingReconciliation = unverifiedList.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            <span>{isHi ? 'स्मार्ट सामंजस्य व वित्तीय नियंत्रण' : 'Smart Reconciliation & Audit'}</span>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {isHi ? 'प्रोजेक्ट:' : 'Project:'}{' '}
            <strong className="text-stone-800">{settings.projectName || 'New Ledger'}</strong>
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
          {isHi ? 'संग्रह का संपूर्ण वित्तीय हिसाब' : 'Financial Collection Reconciliation'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          {isHi
            ? 'प्रत्येक आंकड़े का सटीक हिसाब और गणना सूत्र देखें। किसी भी कार्ड पर क्लिक करके उसके प्रविष्टियां खोलें।'
            : 'Inspect mathematical breakdowns of all collections. Click any card to drill down into its records.'}
        </p>
      </div>

      {/* Accounting Safety: Proposed Reconciliation Banner */}
      {hasPendingReconciliation && (
        <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border-2 border-amber-300 p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                  {isHi ? '🔒 लेखा सुरक्षा: प्रस्तावित नया कुल योग' : '🔒 Accounting Safety: Proposed Reconciliation'}
                </h3>
                <span className="text-[11px] font-bold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full">
                  {isHi ? 'समीक्षा आवश्यक' : 'Approval Required'}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {isHi
                  ? 'नए पन्नों के आने पर पुराना सत्यापित योग कभी अपने आप नहीं बदलता। कृपया प्रस्तावित समीकरण की पुष्टि करें:'
                  : 'Previously verified ledger amounts never change silently. Confirm the reconciliation formula:'}
              </p>

              {/* Equation Display */}
              <div className="mt-3 p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs overflow-x-auto">
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold min-w-max">
                  {/* Existing */}
                  <div className="text-center">
                    <span className="text-[10px] text-stone-500 block uppercase font-medium">
                      {isHi ? 'वर्तमान सत्यापित' : 'Existing Verified'}
                    </span>
                    <span className="text-emerald-700 font-mono text-base">
                      {formatINR(proposed.existingTotal)}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-normal">
                      ({proposed.existingCount} records)
                    </span>
                  </div>

                  <span className="text-stone-400 text-lg">+</span>

                  {/* Newly Extracted */}
                  <div className="text-center">
                    <span className="text-[10px] text-stone-500 block uppercase font-medium">
                      {isHi ? 'नए निकाले गए' : 'Newly Extracted'}
                    </span>
                    <span className="text-indigo-700 font-mono text-base">
                      {formatINR(proposed.newlyExtractedTotal)}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-normal">
                      ({proposed.newlyExtractedCount} records)
                    </span>
                  </div>

                  <span className="text-stone-400 text-lg">-</span>

                  {/* Potential duplicates */}
                  <div className="text-center">
                    <span className="text-[10px] text-stone-500 block uppercase font-medium">
                      {isHi ? 'संभावित डुप्लिकेट कटौती' : 'Potential Duplicates'}
                    </span>
                    <span className="text-rose-700 font-mono text-base">
                      {formatINR(proposed.potentialDuplicatesDeduction)}
                    </span>
                    <span className="text-[10px] text-stone-400 block font-normal">
                      ({proposed.potentialDuplicatesCount} dups)
                    </span>
                  </div>

                  <span className="text-stone-400 text-lg">=</span>

                  {/* Proposed New Total */}
                  <div className="text-center bg-amber-100/70 px-3 py-1 rounded-lg border border-amber-300">
                    <span className="text-[10px] text-amber-900 block uppercase font-bold">
                      {isHi ? 'प्रस्तावित नया कुल' : 'Proposed New Total'}
                    </span>
                    <span className="text-amber-950 font-mono text-lg font-black">
                      {formatINR(proposed.proposedNewTotal)}
                    </span>
                    <span className="text-[10px] text-amber-800 block font-semibold">
                      ({proposed.proposedNewCount} total records)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={onApproveProposedReconciliation}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isHi ? 'सामंजस्य स्वीकृत करें (Approve Reconciliation)' : 'Approve Reconciliation'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Needs Transaction Type Review Alert Banner */}
      {metrics.needsTypeReviewCount > 0 && (
        <div
          onClick={() => onDrilldown('all', '')}
          className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/80 transition shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-900">
                {isHi
                  ? `⚠️ ${metrics.needsTypeReviewCount} प्रविष्टियों में लेन-देन दिशा (आय/व्यय) चयन आवश्यक है`
                  : `⚠️ ${metrics.needsTypeReviewCount} record(s) need transaction type review (Income vs Expense)`}
              </h4>
              <p className="text-xs text-stone-600">
                {isHi
                  ? 'सुरक्षा नियम: अनिश्चित दिशा वाले रिकॉर्ड्स जब तक वर्गीकृत नहीं होते, वे आय/व्यय या बैलेंस को प्रभावित नहीं करते।'
                  : 'Safety rule: Unclassified records are isolated from Net Balance until reviewed by a human.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 group-hover:translate-x-0.5 transition flex items-center gap-1 shrink-0 ml-2">
            <span>{isHi ? 'समीक्षा करें' : 'Review Now'}</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      )}

      {/* Main Reconciliation Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Verified Income */}
        <div
          onClick={() => onDrilldown('all', '')}
          className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-emerald-700">
              {isHi ? 'सत्यापित आय (Income)' : 'Verified Income'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
            {formatINR(metrics.verifiedIncome)}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {records.filter((r) => r.verified && r.transactionType === 'INCOME').length}{' '}
            {isHi ? 'सत्यापित प्रविष्टियां' : 'verified entries'}
          </span>
        </div>

        {/* Verified Expense */}
        <div
          onClick={() => onDrilldown('all', '')}
          className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs hover:border-rose-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-rose-700">
              {isHi ? 'सत्यापित व्यय (Expense)' : 'Verified Expense'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-950 font-mono">
            {formatINR(metrics.verifiedExpense)}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {records.filter((r) => r.verified && r.transactionType === 'EXPENSE').length}{' '}
            {isHi ? 'सत्यापित खर्च' : 'verified payouts'}
          </span>
        </div>

        {/* Net Balance */}
        <div
          onClick={() => onDrilldown('all', '')}
          className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs hover:border-indigo-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-indigo-700">
              {isHi ? 'शुद्ध शेष (Net Balance)' : 'Net Balance'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono ${
              metrics.netBalance >= 0 ? 'text-indigo-950' : 'text-rose-900'
            }`}
          >
            {formatINR(metrics.netBalance)}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {isHi ? 'आय - व्यय (Income - Expense)' : 'Verified Income - Expense'}
          </span>
        </div>

        {/* Verification Ratio */}
        <div
          onClick={() => onDrilldown('uncertain', 'low')}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-stone-500">
              {isHi ? 'सत्यापन स्थिति' : 'Verified Ratio'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {metrics.verifiedRecordsCount} / {metrics.totalRecords}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">
            {metrics.uncertainRecordsCount > 0 ? (
              <span className="text-rose-600 font-semibold">
                {metrics.uncertainRecordsCount} {isHi ? 'अस्पष्ट लिखावट' : 'uncertain'}
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">✓ {isHi ? 'कोई संदेह नहीं' : 'No low-confidence'}</span>
            )}
          </span>
        </div>
      </div>

      {/* How Every Total Is Calculated Expandable Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs mb-6">
        <button
          onClick={() => setShowCalculationDetails(!showCalculationDetails)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-sm text-stone-900">
              {isHi ? 'गणितीय प्रमाण (How Every Total is Calculated)' : 'Audit Formula Breakdown'}
            </span>
          </div>
          {showCalculationDetails ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {showCalculationDetails && (
          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-2.5">
            <div className="p-3 bg-stone-50 rounded-xl font-mono text-[11px] leading-relaxed space-y-1.5">
              <div>
                • <strong>शुद्ध शेष समीकरण (Net Balance Equation):</strong>{' '}
                <span className="text-emerald-700 font-bold">Verified Income ({formatINR(metrics.verifiedIncome)})</span> -{' '}
                <span className="text-rose-700 font-bold">Verified Expense ({formatINR(metrics.verifiedExpense)})</span> ={' '}
                <span className="font-extrabold text-stone-900">{formatINR(metrics.netBalance)}</span>
              </div>
              <div>
                • <strong>माध्यम सूत्र (Mode Split):</strong> Online Income ({formatINR(metrics.onlineIncome)}) +
                Cash Income ({formatINR(metrics.cashIncome)}){' '}
                {metrics.otherIncome > 0 && `+ Other Income (${formatINR(metrics.otherIncome)})`}
              </div>
              <div>
                • <strong>सत्यापन अनुपात (Verification Ratio):</strong>{' '}
                {metrics.verifiedRecordsCount} / {metrics.totalRecords} (
                {metrics.totalRecords > 0
                  ? Math.round((metrics.verifiedRecordsCount / metrics.totalRecords) * 100)
                  : 0}
                % अनुमोदित)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Total Arithmetic Reconciliation Section */}
      {pageValidations.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-1.5">
                  <span>{isHi ? 'पृष्ठ-वार गणितीय समाधान' : 'Page Total Arithmetic Reconciliation'}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Deterministic Math
                  </span>
                </h3>
                <p className="text-xs text-stone-500">
                  {isHi
                    ? 'प्रत्येक पन्ने पर लिखे हस्तलिखित योग का स्वतंत्र प्रविष्टियों के योग से मिलान'
                    : 'Auditing handwritten page totals against independent line-item sums'}
                </p>
              </div>
            </div>

            {/* Quick status pill */}
            <div>
              {pagesSummary.mismatchedPages === 0 && pagesSummary.totalPages > 0 ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isHi ? '✓ सभी पन्ने सत्यापित' : '✓ All Pages Reconciled'}</span>
                </span>
              ) : (
                <span className="text-xs font-black text-rose-900 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    {isHi
                      ? `⚠️ ${pagesSummary.mismatchedPages} पन्ने में असंगति`
                      : `⚠️ ${pagesSummary.mismatchedPages} Page(s) Mismatch`}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Table of Page Validations */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">{isHi ? 'पन्ना' : 'Page'}</th>
                  <th className="pb-2.5 text-right">{isHi ? 'हस्तलिखित योग' : 'Handwritten Total'}</th>
                  <th className="pb-2.5 text-right">{isHi ? 'निकाला गया जोड़' : 'Line-Item Sum'}</th>
                  <th className="pb-2.5 text-right">{isHi ? 'अंतर' : 'Discrepancy'}</th>
                  <th className="pb-2.5 text-center">{isHi ? 'स्थिति' : 'Status'}</th>
                  {onViewSource && <th className="pb-2.5 text-right">{isHi ? 'कार्रवाई' : 'Action'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {pageValidations.map((v) => {
                  const isMatch = v.status === 'MATCH';
                  const isMismatch = v.status === 'MISMATCH';

                  return (
                    <tr key={v.docId} className="hover:bg-stone-50/70 transition">
                      <td className="py-3">
                        <div className="font-bold text-stone-900">
                          {isHi ? `पन्ना ${v.pageNumber}` : `Page ${v.pageNumber}`}
                        </div>
                        <div className="text-[11px] text-stone-400 font-normal truncate max-w-[140px] sm:max-w-xs">
                          {v.fileName}
                        </div>
                      </td>

                      <td className="py-3 text-right font-mono font-bold text-stone-800">
                        {v.detectedPageTotal !== undefined ? formatINR(v.detectedPageTotal) : '—'}
                      </td>

                      <td className="py-3 text-right font-mono font-bold text-stone-900">
                        {formatINR(v.calculatedLineItemSum)}
                        <span className="text-[10px] text-stone-400 font-normal block">
                          ({v.itemCount} items)
                        </span>
                      </td>

                      <td
                        className={`py-3 text-right font-mono font-black ${
                          isMatch ? 'text-emerald-700' : isMismatch ? 'text-rose-700' : 'text-stone-500'
                        }`}
                      >
                        {v.difference > 0 ? '+' : ''}
                        {formatINR(v.difference)}
                      </td>

                      <td className="py-3 text-center">
                        {isMatch && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>MATCH</span>
                          </span>
                        )}
                        {isMismatch && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>MISMATCH</span>
                          </span>
                        )}
                        {v.status === 'NO_PAGE_TOTAL' && (
                          <span className="text-[11px] text-stone-500 px-2 py-0.5 rounded bg-stone-100">
                            NO TOTAL
                          </span>
                        )}
                      </td>

                      {onViewSource && (
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onViewSource(v.docId)}
                            className="text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition inline-flex items-center gap-1 text-[11px] font-semibold"
                            title="Inspect Page Image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isHi ? 'पन्ना देखें' : 'Inspect'}</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Totals Breakdown */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
        <h3 className="font-bold text-sm text-stone-900 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" />
            <span>{isHi ? 'श्रेणीवार संग्रह (Category Breakdown)' : 'Category Totals'}</span>
          </div>
          <span className="text-xs font-normal text-stone-500">
            {isHi ? 'क्लिक करके सूची देखें' : 'Click to drill down'}
          </span>
        </h3>

        <div className="space-y-3.5">
          {Object.entries(metrics.categoryTotals).length === 0 ? (
            <div className="text-center py-4 text-stone-400 text-xs">No records available</div>
          ) : (
            Object.entries(metrics.categoryTotals)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([catName, data]) => {
                const isExpenseCategory = data.type === 'EXPENSE' || catName.toLowerCase() === 'expense' || catName.toLowerCase() === 'खर्च';
                const baseSum = isExpenseCategory ? (metrics.verifiedExpense || 1) : (metrics.verifiedIncome || 1);
                const percentage = Math.min(100, Math.round((data.total / baseSum) * 100));

                return (
                  <div
                    key={catName}
                    onClick={() => onDrilldown('category', catName)}
                    className="p-2.5 rounded-xl hover:bg-stone-50 cursor-pointer transition border border-transparent hover:border-stone-200"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800">{catName}</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isExpenseCategory
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isExpenseCategory ? 'EXPENSE' : 'INCOME'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold font-mono text-sm ${
                            isExpenseCategory ? 'text-rose-800' : 'text-stone-900'
                          }`}
                        >
                          {isExpenseCategory ? `-${formatINR(data.total)}` : formatINR(data.total)}
                        </span>
                        <span className="text-[11px] text-stone-400 ml-2">
                          ({data.count} {isHi ? 'प्रविष्टियां' : 'entries'})
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isExpenseCategory ? 'bg-rose-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};
