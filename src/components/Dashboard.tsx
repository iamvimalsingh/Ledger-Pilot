import React from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Share2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  FileText,
  Eye,
  ShieldCheck,
  BookOpen,
  Scale,
  AlertOctagon,
  GitMerge,
  Tag,
  FileQuestion,
} from 'lucide-react';
import {
  ExtractedRecord,
  SourceDocument,
  DuplicateCandidate,
  LedgerSettings,
} from '../types/ledger';
import {
  calculateReconciliationMetrics,
  calculateAllPagesMathValidation,
  calculatePagesMathSummary,
  validatePageTotalMath,
  formatINR,
} from '../utils/reconciliation';
import { getLedgerExceptions, calculateExceptionSummary } from '../utils/exceptions';

interface DashboardProps {
  records: ExtractedRecord[];
  documents: SourceDocument[];
  duplicates: DuplicateCandidate[];
  onSelectTab: (tab: string) => void;
  onViewSource: (docId: string, recordId?: string) => void;
  settings: LedgerSettings;
  language: 'hi' | 'en';
  onOpenCreateProject?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  documents,
  duplicates,
  onSelectTab,
  onViewSource,
  settings,
  language,
  onOpenCreateProject,
}) => {
  const isHi = language === 'hi';
  const metrics = calculateReconciliationMetrics(records, duplicates);
  const pageValidations = calculateAllPagesMathValidation(documents, records);
  const pagesSummary = calculatePagesMathSummary(pageValidations);
  const pendingDuplicates = duplicates.filter((d) => d.status === 'pending');
  const pendingReviewCount = records.filter((r) => !r.verified).length;
  const exceptions = getLedgerExceptions(records, documents, duplicates);
  const exceptionSummary = calculateExceptionSummary(exceptions);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-700 via-amber-800 to-stone-900 text-white p-5 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-200 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{settings.projectName || 'New Ledger'}</span>
            </div>
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="text-[11px] font-bold text-amber-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full transition border border-white/10"
              >
                {isHi ? '+ नया प्रोजेक्ट' : '+ New Project'}
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {isHi ? 'हस्तलिखित पन्नों से स्मार्ट डिजिटल लेजर' : 'Turn Handwritten Ledgers into Verified Digital Books'}
          </h1>
          <p className="text-stone-200 text-xs sm:text-sm mt-2 leading-relaxed">
            {isHi
              ? 'लेजर रजिस्टर, खाता डायरी या संग्रह पर्चियों की फोटो खींचें। Gemini AI लिखावट पढ़ेगा, आप एक क्लिक में समीक्षा कर सत्यापित करें।'
              : 'Snap photos of collection sheets, registers, and donation registers. AI extracts structured lines for human verification.'}
          </p>

          {/* Quick Flow Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              onClick={() => onSelectTab('upload')}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-stone-900 hover:bg-amber-50 transition shadow-sm flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>{isHi ? '📷 फोटो लें / अपलोड करें' : '📷 Capture / Upload'}</span>
            </button>

            {pendingReviewCount > 0 && (
              <button
                onClick={() => onSelectTab('review')}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm flex items-center gap-2 animate-pulse"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isHi ? `🤖 हिसाब पढ़ें (${pendingReviewCount} समीक्षा हेतु)` : `Review AI (${pendingReviewCount})`}
                </span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('reports')}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-stone-800/80 hover:bg-stone-800 text-stone-100 border border-stone-700/80 transition flex items-center gap-2 backdrop-blur-xs"
            >
              <Share2 className="w-4 h-4 text-teal-400" />
              <span>{isHi ? '📱 WhatsApp शेयर' : 'WhatsApp Share'}</span>
            </button>
          </div>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* NEEDS ATTENTION Compact Summary (Phase 3 Unified Exception Inbox) */}
      {exceptionSummary.total > 0 && (
        <div
          onClick={() => onSelectTab('inbox')}
          className="bg-gradient-to-r from-amber-50 to-rose-50 border-2 border-amber-300 hover:border-amber-400 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition shadow-2xs group"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
              <AlertOctagon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                  {isHi ? 'मानव ध्यान अपेक्षित' : 'NEEDS ATTENTION'}
                </span>
                <span className="bg-amber-600 text-white text-xs font-black px-2 py-0.5 rounded-full font-mono shadow-xs">
                  {exceptionSummary.total}
                </span>
                {exceptionSummary.highSeverityCount > 0 && (
                  <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {exceptionSummary.highSeverityCount} {isHi ? 'उच्च प्राथमिकता' : 'High Priority'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-700 mt-1 font-medium">
                {exceptionSummary.arithmeticCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-800 font-semibold">
                    <Scale className="w-3.5 h-3.5" />
                    <span>
                      {exceptionSummary.arithmeticCount} {isHi ? 'गणितीय अंतर' : 'Arithmetic'}
                    </span>
                  </span>
                )}
                {exceptionSummary.lowConfidenceCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {exceptionSummary.lowConfidenceCount} {isHi ? 'अस्पष्ट लिखावट' : 'Low Confidence'}
                    </span>
                  </span>
                )}
                {exceptionSummary.duplicateCount > 0 && (
                  <span className="flex items-center gap-1 text-purple-800 font-semibold">
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>
                      {exceptionSummary.duplicateCount} {isHi ? 'डुप्लिकेट' : 'Duplicate'}
                    </span>
                  </span>
                )}
                {exceptionSummary.missingFieldCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-700">
                    <FileQuestion className="w-3.5 h-3.5" />
                    <span>
                      {exceptionSummary.missingFieldCount} {isHi ? 'गायब जानकारी' : 'Missing Field'}
                    </span>
                  </span>
                )}
                {exceptionSummary.typeRequiredCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-900 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {exceptionSummary.typeRequiredCount} {isHi ? 'दिशा अपेक्षित' : 'Type Required'}
                    </span>
                  </span>
                )}
                {exceptionSummary.conflictCount > 0 && (
                  <span className="flex items-center gap-1 text-stone-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {exceptionSummary.conflictCount} {isHi ? 'संदिग्ध' : 'Conflict'}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-amber-950 group-hover:translate-x-0.5 transition shrink-0">
            <span>{isHi ? 'एक्सेप्शन इनबॉक्स खोलें' : 'Open Exception Inbox'}</span>
            <ArrowRight className="w-4 h-4 text-amber-800" />
          </div>
        </div>
      )}

      {/* Primary Financial Overview Cards (Income, Expense, Net Balance, Verified Status) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Verified Income */}
        <div
          onClick={() => onSelectTab('ledger')}
          className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs hover:border-emerald-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-emerald-700">
              {isHi ? 'सत्यापित आय' : 'Verified Income'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
            {formatINR(metrics.verifiedIncome)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
            <span>
              {records.filter((r) => r.verified && r.transactionType === 'INCOME').length}{' '}
              {isHi ? 'रसीदें' : 'receipts'}
            </span>
            {metrics.pendingIncome > 0 && (
              <span className="text-amber-700 font-medium">
                +{formatINR(metrics.pendingIncome)} {isHi ? 'लंबित' : 'pending'}
              </span>
            )}
          </div>
        </div>

        {/* Verified Expense */}
        <div
          onClick={() => onSelectTab('ledger')}
          className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs hover:border-rose-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-rose-700">
              {isHi ? 'सत्यापित व्यय' : 'Verified Expense'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-950 font-mono">
            {formatINR(metrics.verifiedExpense)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
            <span>
              {records.filter((r) => r.verified && r.transactionType === 'EXPENSE').length}{' '}
              {isHi ? 'खर्च' : 'payouts'}
            </span>
            {metrics.pendingExpense > 0 && (
              <span className="text-amber-700 font-medium">
                +{formatINR(metrics.pendingExpense)} {isHi ? 'लंबित' : 'pending'}
              </span>
            )}
          </div>
        </div>

        {/* Net Balance */}
        <div
          onClick={() => onSelectTab('summary')}
          className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs hover:border-indigo-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-indigo-700">
              {isHi ? 'शुद्ध शेष (बचत)' : 'Net Balance'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition">
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
            {isHi ? 'आय - व्यय (Income - Expense)' : 'Income - Expense'}
          </span>
        </div>

        {/* Verified Rate */}
        <div
          onClick={() => onSelectTab('ledger')}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-400 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase text-stone-500">
              {isHi ? 'सत्यापन स्थिति' : 'Verified Status'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center group-hover:scale-105 transition">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
            {metrics.verifiedRecordsCount} / {metrics.totalRecords}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {metrics.unverifiedRecordsCount === 0
              ? isHi
                ? '✓ सभी प्रविष्टियां सत्यापित हैं'
                : 'All Verified'
              : `${metrics.unverifiedRecordsCount} ${isHi ? 'समीक्षा हेतु लंबित' : 'pending review'}`}
          </span>
        </div>
      </div>

      {/* Payment Modes Sub-Bar */}
      <div className="bg-stone-50/80 rounded-xl p-3 border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-stone-600 font-medium">{isHi ? 'ऑनलाइन:' : 'Online:'}</span>
            <span className="font-bold text-teal-900 font-mono">{formatINR(metrics.onlineIncome)}</span>
            {metrics.onlineExpense > 0 && (
              <span className="text-[10px] text-rose-700 font-mono">(-{formatINR(metrics.onlineExpense)})</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-stone-600 font-medium">{isHi ? 'कैश (नकद):' : 'Cash:'}</span>
            <span className="font-bold text-emerald-900 font-mono">{formatINR(metrics.cashIncome)}</span>
            {metrics.cashExpense > 0 && (
              <span className="text-[10px] text-rose-700 font-mono">(-{formatINR(metrics.cashExpense)})</span>
            )}
          </div>
          {metrics.otherIncome > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-stone-600 font-medium">{isHi ? 'अन्य:' : 'Other:'}</span>
              <span className="font-bold text-stone-900 font-mono">{formatINR(metrics.otherIncome)}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => onSelectTab('summary')}
          className="text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1 text-[11px]"
        >
          <span>{isHi ? 'विस्तृत वित्तीय ब्रेकडाउन' : 'Detailed Breakdown'}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Action Banners (Duplicates or Low-confidence warnings) */}
      {pendingDuplicates.length > 0 && (
        <div
          onClick={() => onSelectTab('duplicates')}
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-900">
                {isHi
                  ? `${pendingDuplicates.length} संभावित डुप्लिकेट प्रविष्टियां मिली हैं`
                  : `${pendingDuplicates.length} Potential Duplicates Detected`}
              </h4>
              <p className="text-xs text-rose-700">
                {isHi
                  ? 'समान नाम या राशि की प्रविष्टियां हैं। कृपया मर्ज या अलग रखने का फैसला करें।'
                  : 'Review matches before approving to avoid accidental double counting.'}
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-rose-700 transition">
            {isHi ? 'समीक्षा करें' : 'Review'}
          </button>
        </div>
      )}

      {/* Arithmetic Discrepancy Alert Banner */}
      {pagesSummary.mismatchedPages > 0 && (
        <div
          onClick={() => onSelectTab('review')}
          className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Scale className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <span>
                  {isHi
                    ? `⚠️ ${pagesSummary.mismatchedPages} पन्ने में गणितीय असंगति (Page Total Mismatch)`
                    : `⚠️ ${pagesSummary.mismatchedPages} Page(s) with Arithmetic Discrepancies`}
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  Diff: {pagesSummary.netDiscrepancy > 0 ? '+' : ''}{formatINR(pagesSummary.netDiscrepancy)}
                </span>
              </h4>
              <p className="text-xs text-amber-800">
                {isHi
                  ? 'पन्ने पर लिखे कुल योग और निकाली गई प्रविष्टियों के जोड़ में अंतर है। समीक्षा स्क्रीन में जांचें।'
                  : 'Handwritten page total does not match line-item sum. Inspect in Step 5 Review.'}
              </p>
            </div>
          </div>
          <button className="px-3.5 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-2xs hover:bg-amber-700 transition">
            {isHi ? 'जांचें' : 'Audit'}
          </button>
        </div>
      )}

      {/* Source Evidence & Recent Pages Gallery */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-amber-600" />
              <span>{isHi ? 'अपलोड किए गए मूल पन्ने (Source Pages)' : 'Original Handwritten Pages'}</span>
            </h3>
            <p className="text-xs text-stone-500">
              {isHi
                ? 'किसी भी पन्ने पर क्लिक करके मूल लिखावट देखें (ज़ूम व पैन समर्थित)'
                : 'Click any page to view original high-resolution handwriting with zoom & pan'}
            </p>
          </div>

          <button
            onClick={() => onSelectTab('upload')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>{isHi ? '+ नया पन्ना जोड़ें' : '+ Add Page'}</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <Camera className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <span className="text-xs font-bold text-stone-700 block">
              {isHi ? 'अभी कोई पन्ना अपलोड नहीं हुआ है' : 'No pages uploaded yet'}
            </span>
            <button
              onClick={() => onSelectTab('upload')}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-amber-700"
            >
              {isHi ? 'फोटो खींचें या अपलोड करें' : 'Upload First Page'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {documents.map((doc) => {
              const docRecords = records.filter(
                (r) => r.sourceImageId === doc.id || r.sourcePage === doc.pageNumber
              );
              return (
                <div
                  key={doc.id}
                  onClick={() => onViewSource(doc.id)}
                  className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden hover:border-amber-400 cursor-pointer transition group shadow-2xs"
                >
                  <div className="h-36 bg-stone-200 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={doc.dataUrl}
                      alt={doc.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 text-stone-900 text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isHi ? 'स्रोत देखें' : 'View'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {isHi ? `पेज ${doc.pageNumber}` : `Page ${doc.pageNumber}`}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {docRecords.length} recs
                      </span>
                    </div>
                    {doc.detectedPageTotal !== undefined && (
                      <span className="text-[11px] text-amber-700 font-bold font-mono block mt-0.5">
                        {isHi ? 'पन्ने का कुल: ' : 'Total: '}
                        {formatINR(doc.detectedPageTotal)}
                      </span>
                    )}

                    {/* Deterministic Math Reconciliation Pill */}
                    {(() => {
                      const math = validatePageTotalMath(doc.detectedPageTotal, docRecords);
                      return (
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-100 text-[10px]">
                          <span className="text-stone-400 font-mono truncate">
                            {formatINR(math.calculatedLineItemSum)}
                          </span>
                          {math.status === 'MATCH' && (
                            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                              ✓ Match
                            </span>
                          )}
                          {math.status === 'MISMATCH' && (
                            <span className="text-rose-700 font-black bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                              ⚠️ Mismatch
                            </span>
                          )}
                          {math.status === 'NO_PAGE_TOTAL' && (
                            <span className="text-stone-500 bg-stone-100 px-1 py-0.2 rounded shrink-0">
                              No Total
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity / Extracted Records preview */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-stone-900">
              {isHi ? 'हालिया दर्ज प्रविष्टियां (Recent Records)' : 'Recent Ledger Entries'}
            </h3>
            <p className="text-xs text-stone-500">
              {isHi ? 'नवीनतम सत्यापित और समीक्षाधीन रिकॉर्ड्स' : 'Latest verified and pending entries'}
            </p>
          </div>

          <button
            onClick={() => onSelectTab('ledger')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>{isHi ? 'पूरा लेजर देखें' : 'View Full Ledger'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {records.slice(0, 5).map((rec) => (
            <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    rec.verified ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                  }`}
                />
                <div>
                  <span className="font-bold text-stone-900 block">{rec.name}</span>
                  <span className="text-[11px] text-stone-500">
                    {rec.category} • {rec.paymentMode} {rec.householdName ? `• ${rec.householdName}` : ''}
                  </span>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <span className="font-black font-mono text-sm text-stone-900">
                    {formatINR(rec.amount)}
                  </span>
                  <span className="block text-[10px] text-stone-400">
                    {rec.verified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>

                <button
                  onClick={() => onViewSource(rec.sourceImageId, rec.id)}
                  className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded"
                  title="View Source Page"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
