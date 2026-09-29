import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  FileCheck,
  Filter,
  Check,
  Sparkles,
  HelpCircle,
  History,
  X,
  Search,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Scale,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  ExtractedRecord,
  PaymentMode,
  ConfidenceLevel,
  LedgerSettings,
  SourceDocument,
  PageMathValidation,
  TransactionType,
} from '../types/ledger';
import {
  formatINR,
  calculateAllPagesMathValidation,
  calculatePagesMathSummary,
} from '../utils/reconciliation';

interface ExtractionReviewProps {
  records: ExtractedRecord[];
  documents?: SourceDocument[];
  onUpdateDocumentTotal?: (docId: string, newTotal: number | undefined) => void;
  onApproveRecord: (id: string) => void;
  onApproveAll: (ids: string[]) => void;
  onUpdateRecord: (id: string, updated: Partial<ExtractedRecord>, reason?: string) => void;
  onDeleteRecord: (id: string) => void;
  onToggleUncertain: (id: string) => void;
  onViewSource: (docId: string, recordId?: string) => void;
  onOpenAuditHistory: (record: ExtractedRecord) => void;
  settings: LedgerSettings;
  language: 'hi' | 'en';
}

export const ExtractionReview: React.FC<ExtractionReviewProps> = ({
  records,
  documents = [],
  onUpdateDocumentTotal,
  onApproveRecord,
  onApproveAll,
  onUpdateRecord,
  onDeleteRecord,
  onToggleUncertain,
  onViewSource,
  onOpenAuditHistory,
  settings,
  language,
}) => {
  const isHi = language === 'hi';

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'uncertain' | 'verified'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'INCOME' | 'EXPENSE' | 'UNCLASSIFIED'>('all');
  const [selectedPageFilter, setSelectedPageFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<ExtractedRecord | null>(null);
  const [editingPageTotalDoc, setEditingPageTotalDoc] = useState<SourceDocument | null>(null);
  const [tempPageTotal, setTempPageTotal] = useState<string>('');
  const [editFormData, setEditFormData] = useState<{
    name: string;
    amount: number;
    transactionType: TransactionType;
    paymentMode: PaymentMode;
    category: string;
    householdName: string;
    date: string;
    purpose: string;
    correctionReason: string;
  }>({
    name: '',
    amount: 0,
    transactionType: 'INCOME',
    paymentMode: 'Cash',
    category: 'General',
    householdName: '',
    date: '',
    purpose: '',
    correctionReason: '',
  });

  const openEditModal = (rec: ExtractedRecord) => {
    setEditingRecord(rec);
    setEditFormData({
      name: rec.name,
      amount: rec.amount,
      transactionType: rec.transactionType || 'UNCLASSIFIED',
      paymentMode: rec.paymentMode,
      category: rec.category,
      householdName: rec.householdName || '',
      date: rec.date || '',
      purpose: rec.purpose || '',
      correctionReason: '',
    });
  };

  const saveEdit = () => {
    if (!editingRecord) return;

    onUpdateRecord(
      editingRecord.id,
      {
        name: editFormData.name.trim(),
        amount: Math.abs(Number(editFormData.amount)) || 0,
        transactionType: editFormData.transactionType,
        paymentMode: editFormData.paymentMode,
        category: editFormData.category,
        householdName: editFormData.householdName.trim(),
        date: editFormData.date,
        purpose: editFormData.purpose.trim(),
      },
      editFormData.correctionReason || 'User manual correction in review screen'
    );

    setEditingRecord(null);
  };

  const openEditPageTotal = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setEditingPageTotalDoc(doc);
      setTempPageTotal(doc.detectedPageTotal !== undefined ? String(doc.detectedPageTotal) : '');
    }
  };

  const savePageTotal = () => {
    if (!editingPageTotalDoc || !onUpdateDocumentTotal) return;
    const trimmed = tempPageTotal.trim();
    const val = trimmed === '' ? undefined : Number(trimmed);
    onUpdateDocumentTotal(editingPageTotalDoc.id, isNaN(Number(val)) ? undefined : val);
    setEditingPageTotalDoc(null);
  };

  // Deterministic Page-level Mathematical Validation
  const pageValidations: PageMathValidation[] = calculateAllPagesMathValidation(
    documents,
    records
  );
  const pagesSummary = calculatePagesMathSummary(pageValidations);

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (selectedPageFilter !== 'all' && r.sourcePage !== selectedPageFilter) return false;
    if (typeFilter !== 'all' && r.transactionType !== typeFilter) return false;
    if (activeFilter === 'pending' && r.verified) return false;
    if (activeFilter === 'verified' && !r.verified) return false;
    if (activeFilter === 'uncertain' && r.confidence !== 'low') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchCategory = r.category.toLowerCase().includes(q);
      const matchPurpose = (r.purpose || '').toLowerCase().includes(q);
      const matchHousehold = (r.householdName || '').toLowerCase().includes(q);
      const matchAmount = String(r.amount).includes(q);
      return matchName || matchCategory || matchPurpose || matchHousehold || matchAmount;
    }

    return true;
  });

  const pendingList = records.filter((r) => !r.verified);
  const uncertainList = records.filter((r) => r.confidence === 'low');
  const highConfidencePending = records.filter(
    (r) => !r.verified && r.confidence === 'high' && r.transactionType !== 'UNCLASSIFIED'
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isHi ? 'चरण 5: समीक्षा एवं सत्यापन' : 'Step 5: Review & Verification'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            {isHi ? 'AI द्वारा निकाले गए रिकॉर्ड्स की समीक्षा' : 'AI Extracted Ledger Review'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            {isHi
              ? 'पुष्टि करने से पहले नाम, राशि और माध्यम जांचें। अनिश्चित लिखावट को विशेष रूप से चिह्नित किया गया है।'
              : 'Audit and approve entries. Low-confidence handwriting is highlighted for human inspection.'}
          </p>
        </div>

        {/* Quick Batch Action */}
        {highConfidencePending.length > 0 && (
          <button
            onClick={() => onApproveAll(highConfidencePending.map((r) => r.id))}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isHi
                ? `उच्च विश्वसनीयता वाले ${highConfidencePending.length} रिकॉर्ड्स स्वीकृत करें`
                : `Approve ${highConfidencePending.length} High Confidence`}
            </span>
          </button>
        )}
      </div>

      {/* CORE MATHEMATICAL VALIDATION: Page Total Arithmetic Reconciliation */}
      {pageValidations.length > 0 && (
        <section aria-label="Page Total Arithmetic Reconciliation" className="mb-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-stone-900 flex items-center gap-1.5">
                    <span>{isHi ? 'पृष्ठ-वार गणितीय समाधान' : 'Page Total Arithmetic Reconciliation'}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      Deterministic
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    {isHi
                      ? 'AI द्वारा पन्ने पर लिखा कुल योग बनाम निकली प्रविष्टियों का स्वतंत्र गणितीय जोड़'
                      : 'Independent verification: handwritten page total vs. line-item sum'}
                  </p>
                </div>
              </div>

              {/* Overall Status Badge */}
              <div className="flex items-center gap-2">
                {pagesSummary.mismatchedPages === 0 && pagesSummary.totalPages > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isHi ? '✓ सभी पन्नों का योग सत्यापित (MATCH)' : '✓ All Pages Match'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      {isHi
                        ? `⚠️ ${pagesSummary.mismatchedPages} पन्ने में असंगति (MISMATCH)`
                        : `⚠️ ${pagesSummary.mismatchedPages} Page Mismatch`}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* List of Page Validation Cards */}
            <div className="space-y-3">
              {pageValidations.map((val) => {
                const isMatch = val.status === 'MATCH';
                const isMismatch = val.status === 'MISMATCH';
                const doc = documents.find((d) => d.id === val.docId);

                return (
                  <div
                    key={val.docId}
                    className={`rounded-xl border p-3.5 sm:p-4 transition ${
                      isMatch
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : isMismatch
                        ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
                        : 'border-stone-200 bg-stone-50/60'
                    }`}
                  >
                    {/* Page Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-stone-900">
                          {isHi ? `पन्ना ${val.pageNumber}` : `Page ${val.pageNumber}`}
                        </span>
                        {val.pageHeader && (
                          <span className="text-xs text-stone-600 font-medium truncate max-w-[200px] sm:max-w-xs">
                            • {val.pageHeader}
                          </span>
                        )}
                        <span className="text-[11px] text-stone-400">({val.fileName})</span>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {isMatch && (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isHi ? '✓ योग सुसंगत (MATCH)' : '✓ MATCH'}</span>
                          </span>
                        )}
                        {isMismatch && (
                          <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>
                              {isHi ? '⚠️ योग असंगत (MISMATCH)' : '⚠️ MISMATCH'}
                              <span className="font-mono ml-1">
                                ({val.difference > 0 ? '+' : ''}
                                {formatINR(val.difference)})
                              </span>
                            </span>
                          </span>
                        )}
                        {val.status === 'NO_PAGE_TOTAL' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                            <span>{isHi ? 'कुल योग दर्ज नहीं' : 'No Page Total'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Numerical Comparison Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 bg-white/90 rounded-xl border border-stone-200/80 mb-3 shadow-2xs">
                      {/* Box 1: Handwritten Detected Total */}
                      <div className="flex flex-col justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                          <span>{isHi ? 'पन्ने पर लिखा कुल' : 'Handwritten Page Total'}</span>
                          {onUpdateDocumentTotal && doc && (
                            <button
                              onClick={() => openEditPageTotal(val.docId)}
                              className="text-[10px] text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer"
                            >
                              {isHi ? 'सुधारें' : 'Edit'}
                            </button>
                          )}
                        </span>
                        <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-0.5">
                          {val.detectedPageTotal !== undefined
                            ? formatINR(val.detectedPageTotal)
                            : isHi
                            ? 'पहचाना नहीं गया'
                            : 'Not Detected'}
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {isHi ? 'मूल पन्ने के नीचे से AI द्वारा पढ़ा गया' : 'Read from bottom of page'}
                        </span>
                      </div>

                      {/* Box 2: Independent Line-Item Sum */}
                      <div className="flex flex-col justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                          {isHi ? 'प्रविष्टियों का कुल जोड़' : 'Calculated Line-Item Sum'}
                        </span>
                        <div className="text-base sm:text-lg font-black text-stone-900 font-mono mt-0.5">
                          {formatINR(val.calculatedLineItemSum)}
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {isHi
                            ? `${val.itemCount} प्रविष्टियों का स्वतंत्र योग`
                            : `Sum of ${val.itemCount} line items`}
                        </span>
                      </div>

                      {/* Box 3: Discrepancy / Difference */}
                      <div className="flex flex-col justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                          {isHi ? 'अंतर (Difference)' : 'Difference (Calculated - Page)'}
                        </span>
                        <div
                          className={`text-base sm:text-lg font-black font-mono mt-0.5 ${
                            isMatch
                              ? 'text-emerald-700'
                              : isMismatch
                              ? 'text-rose-700'
                              : 'text-stone-700'
                          }`}
                        >
                          {val.difference > 0 ? '+' : ''}
                          {formatINR(val.difference)}
                        </div>
                        <span className="text-[10px] font-medium text-stone-500">
                          {isMatch
                            ? isHi
                              ? '✓ शून्य अंतर (परफेक्ट मिलान)'
                              : '✓ Zero difference (Perfect match)'
                            : isMismatch
                            ? val.difference < 0
                              ? isHi
                                ? `कमी: ₹${Math.abs(val.difference)} कम हैं`
                                : `Shortfall of ${formatINR(Math.abs(val.difference))}`
                              : isHi
                              ? `अधिकता: ₹${val.difference} अधिक हैं`
                              : `Excess of ${formatINR(val.difference)}`
                            : isHi
                            ? 'तुलना हेतु योग दर्ज करें'
                            : 'Set page total to verify'}
                        </span>
                      </div>
                    </div>

                    {/* Diagnostic Explanation Callout */}
                    <div
                      className={`text-xs p-2.5 rounded-lg mb-3 flex items-start gap-2 ${
                        isMatch
                          ? 'bg-emerald-100/70 text-emerald-900'
                          : isMismatch
                          ? 'bg-rose-100/70 text-rose-950 font-medium'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {isMatch && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {isMismatch && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      {val.status === 'NO_PAGE_TOTAL' && <HelpCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        {isMatch && (
                          <span>
                            {isHi
                              ? 'सत्यापन सफल: निकली हुई सभी प्रविष्टियों का कुल जोड़ हस्तलिखित पन्ने पर लिखे कुल योग के पूर्णतः समान है।'
                              : 'Reconciliation verified: Independent sum of line items matches the handwritten page total.'}
                          </span>
                        )}
                        {isMismatch && (
                          <span>
                            {val.difference < 0 ? (
                              <>
                                {isHi
                                  ? `⚠️ पन्ने पर लिखे योग (₹${val.detectedPageTotal?.toLocaleString('en-IN')}) की तुलना में प्रविष्टियों का जोड़ ₹${Math.abs(val.difference).toLocaleString('en-IN')} कम है। संभवतः कोई पंक्ति स्कैन में छूट गई है या किसी प्रविष्टि की राशि कम पढ़ी गई है। कृपया मूल लिखावट की फोटो जांचें।`
                                  : `⚠️ Shortfall: Extracted line items (${formatINR(val.calculatedLineItemSum)}) sum to ${formatINR(Math.abs(val.difference))} less than the handwritten page total (${formatINR(val.detectedPageTotal || 0)}). A line item may have been missed during extraction, or a digit misread.`}
                              </>
                            ) : (
                              <>
                                {isHi
                                  ? `⚠️ प्रविष्टियों का जोड़ पन्ने पर लिखे योग (₹${val.detectedPageTotal?.toLocaleString('en-IN')}) से ₹${val.difference.toLocaleString('en-IN')} अधिक है। किसी प्रविष्टि की राशि अधिक पढ़ी गई हो सकती है। कृपया मूल लिखावट की फोटो जांचें।`
                                  : `⚠️ Excess: Extracted line items (${formatINR(val.calculatedLineItemSum)}) exceed the handwritten page total (${formatINR(val.detectedPageTotal || 0)}) by ${formatINR(val.difference)}. An extracted digit may be too high.`}
                              </>
                            )}
                          </span>
                        )}
                        {val.status === 'NO_PAGE_TOTAL' && (
                          <span>
                            {isHi
                              ? `इस पन्ने पर AI द्वारा कोई कुल योग नहीं पहचाना गया। इस पन्ने की प्रविष्टियों का कुल योग ${formatINR(val.calculatedLineItemSum)} है। यदि पन्ने पर योग लिखा है तो "योग सुधारें" पर क्लिक करके दर्ज करें।`
                              : `No handwritten total was detected for this page. Line items sum to ${formatINR(val.calculatedLineItemSum)}. You can manually enter the page total to enable mathematical reconciliation.`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons for this Page */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewSource(val.docId)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isHi ? 'मूल पन्ना देखें (ज़ूम/पैन)' : 'Inspect Page Image'}</span>
                        </button>

                        {onUpdateDocumentTotal && doc && (
                          <button
                            onClick={() => openEditPageTotal(val.docId)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 transition flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-stone-500" />
                            <span>{isHi ? 'पन्ने का योग बदलें' : 'Edit Page Total'}</span>
                          </button>
                        )}
                      </div>

                      {/* Filter by Page Toggle */}
                      <div>
                        {selectedPageFilter === val.pageNumber ? (
                          <button
                            onClick={() => setSelectedPageFilter('all')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white flex items-center gap-1 shadow-2xs"
                          >
                            <X className="w-3 h-3" />
                            <span>{isHi ? `पन्ना ${val.pageNumber} फ़िल्टर हटाएं` : `Showing Page ${val.pageNumber} (Clear)`}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedPageFilter(val.pageNumber)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center gap-1"
                          >
                            <Filter className="w-3 h-3 text-stone-400" />
                            <span>{isHi ? `सिर्फ पन्ना ${val.pageNumber} के रिकॉर्ड्स देखें` : `Filter to Page ${val.pageNumber} Records`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>{isHi ? 'लंबित समीक्षा' : 'Pending Review'}</span>
            <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('uncertain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'uncertain'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isHi ? 'अस्पष्ट लिखावट' : 'Uncertain (Low)'}</span>
            <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {uncertainList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === 'verified'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{isHi ? 'स्वीकृत' : 'Approved'}</span>
            <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {records.filter((r) => r.verified).length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {isHi ? `सभी (${records.length})` : `All (${records.length})`}
          </button>
        </div>

        {/* Transaction Type Filter Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200/80">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
              typeFilter === 'all'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {isHi ? 'सभी प्रकार' : 'All Types'}
          </button>
          <button
            onClick={() => setTypeFilter('INCOME')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              typeFilter === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-800 hover:bg-white/60'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>{isHi ? 'आय (Income)' : 'Income'}</span>
          </button>
          <button
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
              typeFilter === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-800 hover:bg-white/60'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            <span>{isHi ? 'व्यय (Expense)' : 'Expense'}</span>
          </button>
          {records.some((r) => r.transactionType === 'UNCLASSIFIED') && (
            <button
              onClick={() => setTypeFilter('UNCLASSIFIED')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                typeFilter === 'UNCLASSIFIED'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 hover:bg-white/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{isHi ? 'दिशा अपेक्षित' : 'Needs Type'}</span>
              <span className="bg-black/20 text-white text-[9px] px-1 rounded-full font-bold">
                {records.filter((r) => r.transactionType === 'UNCLASSIFIED').length}
              </span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isHi ? 'नाम या राशि से खोजें...' : 'Search records...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Record List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          <h4 className="font-bold text-stone-800 text-sm">
            {isHi ? 'इस फ़िल्टर में कोई रिकॉर्ड नहीं है' : 'No records match this filter'}
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            {isHi
              ? 'बधाई! सभी लंबित रिकॉर्ड्स की समीक्षा पूरी हो चुकी है या कोई नया पन्ना अपलोड करें।'
              : 'All pending records reviewed, or upload more pages to extract.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((rec) => {
            const isLowConfidence = rec.confidence === 'low';
            const isMedium = rec.confidence === 'medium';

            return (
              <div
                key={rec.id}
                className={`p-3.5 sm:p-4 rounded-xl border bg-white transition-all shadow-2xs ${
                  isLowConfidence
                    ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                    : isMedium
                    ? 'border-amber-300 bg-amber-50/15'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Column: Name & Metadata */}
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="font-bold text-base text-stone-900">{rec.name}</span>

                      {/* Source Engine Pill */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          rec.extractionSource === 'AI_ASSISTED'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {rec.extractionSource === 'AI_ASSISTED' ? (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>AI Assisted</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>Local OCR</span>
                          </>
                        )}
                      </span>

                      {/* Source Row Badge */}
                      {rec.sourceRow && (
                        <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded border border-stone-200">
                          Row #{rec.sourceRow}
                        </span>
                      )}

                      {/* Transaction Type Pill */}
                      {rec.transactionType === 'UNCLASSIFIED' ? (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                          <span>{isHi ? '⚠️ दिशा चयन आवश्यक' : '⚠️ Transaction Type Required'}</span>
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            rec.transactionType === 'EXPENSE'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {rec.transactionType === 'EXPENSE' ? (
                            <>
                              <TrendingDown className="w-3 h-3 text-rose-600" />
                              <span>{isHi ? 'व्यय / खर्च' : 'EXPENSE'}</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              <span>{isHi ? 'आय / संग्रह' : 'INCOME'}</span>
                            </>
                          )}
                        </span>
                      )}

                      {/* Confidence Pill */}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          rec.confidence === 'high'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.confidence === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.confidence === 'low' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {rec.confidence === 'high'
                          ? isHi
                            ? 'उच्च विश्वास'
                            : 'HIGH'
                          : rec.confidence === 'medium'
                          ? isHi
                            ? 'मध्यम विश्वास'
                            : 'MEDIUM'
                          : isHi
                          ? 'अस्पष्ट (LOW)'
                          : 'LOW'}
                      </span>

                      {/* Payment Mode */}
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          rec.paymentMode === 'Online'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : rec.paymentMode === 'Cash'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {rec.paymentMode}
                      </span>

                      {/* Category */}
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200/60">
                        {rec.category}
                      </span>

                      {/* Audit badge if corrected */}
                      {rec.auditTrail && (
                        <button
                          onClick={() => onOpenAuditHistory(rec)}
                          className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-indigo-100 transition"
                          title="View Correction Audit Trail"
                        >
                          <History className="w-3 h-3" />
                          <span>{isHi ? 'संशोधित (Audited)' : 'Audited'}</span>
                        </button>
                      )}
                    </div>

                    {/* Secondary details */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-stone-500 mt-1.5">
                      {rec.householdName && (
                        <span className="text-purple-700 font-medium">
                          🏠 {rec.householdName}
                        </span>
                      )}
                      {rec.purpose && <span>📝 {rec.purpose}</span>}
                      {rec.date && <span>📅 {rec.date}</span>}
                      <span className="text-stone-400">
                        {isHi ? `पेज ${rec.sourcePage}` : `Page ${rec.sourcePage}`}
                      </span>
                    </div>

                    {/* Quick Direction Selector for UNCLASSIFIED records */}
                    {rec.transactionType === 'UNCLASSIFIED' && (
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-300 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>{isHi ? 'लेन-देन दिशा चुनें:' : 'Select Transaction Type:'}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              onUpdateRecord(
                                rec.id,
                                { transactionType: 'INCOME' },
                                'Reviewer set transaction direction to Income'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            title="Classify as Income"
                          >
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>{isHi ? '+ आय (INCOME)' : '+ Income'}</span>
                          </button>
                          <button
                            onClick={() =>
                              onUpdateRecord(
                                rec.id,
                                { transactionType: 'EXPENSE' },
                                'Reviewer set transaction direction to Expense'
                              )
                            }
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-rose-800 hover:bg-rose-50 border border-rose-300 shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            title="Classify as Expense"
                          >
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            <span>{isHi ? '- व्यय (EXPENSE)' : '- Expense'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Ambiguity Notes if present */}
                    {rec.ambiguityNotes && (
                      <div className="mt-2 text-xs bg-amber-50 text-amber-900 border border-amber-200/80 p-2 rounded-lg flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{isHi ? 'संदिग्ध विवरण:' : 'Ambiguity Note:'} </span>
                          <span>{rec.ambiguityNotes}</span>
                        </div>
                      </div>
                    )}

                    {/* Raw transcription snippet */}
                    {rec.rawText && (
                      <div className="mt-1 text-[11px] text-stone-400 font-mono">
                        "{rec.rawText}"
                      </div>
                    )}
                  </div>

                  {/* Right Column: Amount & Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="text-left sm:text-right">
                      <span
                        className={`text-xl sm:text-2xl font-black font-mono ${
                          rec.transactionType === 'EXPENSE'
                            ? 'text-rose-700'
                            : rec.transactionType === 'INCOME'
                            ? 'text-stone-900'
                            : 'text-amber-800'
                        }`}
                      >
                        {rec.transactionType === 'EXPENSE'
                          ? `-${formatINR(rec.amount)}`
                          : rec.transactionType === 'INCOME'
                          ? `+${formatINR(rec.amount)}`
                          : formatINR(rec.amount)}
                      </span>
                      {rec.transactionType === 'UNCLASSIFIED' ? (
                        <span className="block text-[10px] font-bold text-amber-700 sm:text-right">
                          {isHi ? '⚠️ दिशा अपेक्षित' : '⚠️ Type Required'}
                        </span>
                      ) : rec.verified ? (
                        <span className="block text-[10px] font-bold text-emerald-700 sm:text-right">
                          ✓ {isHi ? 'सत्यापित' : 'Verified'}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* View Source Image */}
                      {rec.sourceImageId && (
                        <button
                          onClick={() => onViewSource(rec.sourceImageId!, rec.id)}
                          className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg border border-stone-200 transition text-xs flex items-center gap-1"
                          title={isHi ? 'स्रोत देखें (Original Page)' : 'View Original Handwritten Source'}
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] font-semibold">{isHi ? 'स्रोत देखें' : 'Source'}</span>
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 transition"
                        title="Edit / संपादित करें"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Toggle uncertain */}
                      <button
                        onClick={() => onToggleUncertain(rec.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          rec.confidence === 'low'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'text-stone-400 hover:text-amber-700 hover:bg-stone-50 border-stone-200'
                        }`}
                        title={isHi ? 'अनिश्चित चिह्नित करें' : 'Mark Uncertain'}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteRecord(rec.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-stone-200 transition"
                        title="Delete / हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Approve / Verify Button */}
                      {!rec.verified ? (
                        <button
                          onClick={() => {
                            if (rec.transactionType === 'UNCLASSIFIED') {
                              openEditModal(rec);
                            } else {
                              onApproveRecord(rec.id);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1 transition ${
                            rec.transactionType === 'UNCLASSIFIED'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title={
                            rec.transactionType === 'UNCLASSIFIED'
                              ? isHi
                                ? 'स्वीकृति से पहले दिशा (आय/व्यय) चुनें'
                                : 'Select transaction type before verifying'
                              : ''
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {rec.transactionType === 'UNCLASSIFIED'
                              ? isHi
                                ? 'दिशा चुनें'
                                : 'Select Type'
                              : isHi
                              ? 'स्वीकृत'
                              : 'Verify'}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateRecord(rec.id, { verified: false }, 'Un-verified for re-review')}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold text-stone-500 hover:bg-stone-100 border border-stone-200"
                        >
                          {isHi ? 'पुनः जांच' : 'Re-open'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                <span>{isHi ? 'प्रविष्टि संपादित करें (Edit Record)' : 'Edit Ledger Entry'}</span>
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Transaction Type Selector */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">
                  {isHi ? 'लेन-देन प्रकार (Transaction Type)' : 'Transaction Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, transactionType: 'INCOME' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      editFormData.transactionType === 'INCOME'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{isHi ? 'आय / संग्रह (INCOME)' : 'INCOME (Receipt)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, transactionType: 'EXPENSE' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      editFormData.transactionType === 'EXPENSE'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span>{isHi ? 'व्यय / खर्च (EXPENSE)' : 'EXPENSE (Payout)'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {isHi
                    ? '💡 राशि हमेशा धनात्मक दर्ज होती है (Net Balance = कुल आय - कुल व्यय)।'
                    : '💡 Amounts are stored as positive numbers. Net Balance = Verified Income - Verified Expense.'}
                </span>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  {isHi ? 'दाता / सदस्य का नाम' : 'Donor / Member Name'}
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {isHi ? 'राशि (₹ Amount)' : 'Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editFormData.amount}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, amount: Math.abs(Number(e.target.value)) })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {isHi ? 'माध्यम (Payment Mode)' : 'Payment Mode'}
                  </label>
                  <select
                    value={editFormData.paymentMode}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, paymentMode: e.target.value as PaymentMode })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Cash">Cash (नकद)</option>
                    <option value="Online">Online (UPI / GPay / QR)</option>
                    <option value="Other">Other (चेक / अन्य)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {isHi ? 'श्रेणी (Category)' : 'Category'}
                  </label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  >
                    {settings.categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    {isHi ? 'परिवार / घराना (Household)' : 'Household (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Singh Family"
                    value={editFormData.householdName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, householdName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  {isHi ? 'उद्देश्य / नोट (Purpose / Notes)' : 'Purpose / Notes'}
                </label>
                <input
                  type="text"
                  placeholder={
                    isHi ? 'उदा. वार्षिक योगदान, रसीद सं. 42' : 'e.g. Annual contribution, Flat 201'
                  }
                  value={editFormData.purpose}
                  onChange={(e) => setEditFormData({ ...editFormData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              {/* Audit trail reason */}
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                <label className="font-bold text-amber-900 block mb-1">
                  {isHi ? 'संशोधन का कारण (Audit Trail Note):' : 'Reason for Correction (Auditable):'}
                </label>
                <input
                  type="text"
                  placeholder={
                    isHi
                      ? 'उदा. लिखावट में शून्य स्पष्ट नहीं था, रसीद में 500 है'
                      : 'e.g. Clarified handwritten digit with donor'
                  }
                  value={editFormData.correctionReason}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, correctionReason: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded text-xs"
                />
                <span className="text-[10px] text-amber-700 mt-1 block">
                  {isHi
                    ? 'AI का मूल मान और आपका सुधारा गया मान दोनों हमेशा सुरक्षित रखे जाते हैं।'
                    : 'Original AI extraction and your manual correction are preserved for audit safety.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-stone-200">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={saveEdit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                {isHi ? 'सुधार सहेजें' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Handwritten Page Total Modal */}
      {editingPageTotalDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>
                  {isHi
                    ? `पन्ना ${editingPageTotalDoc.pageNumber} का हस्तलिखित योग बदलें`
                    : `Edit Handwritten Page ${editingPageTotalDoc.pageNumber} Total`}
                </span>
              </h3>
              <button
                onClick={() => setEditingPageTotalDoc(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-stone-600 leading-relaxed">
                {isHi
                  ? 'यदि AI ने मूल पन्ने के नीचे लिखे कुल योग को गलत पढ़ा है, तो यहाँ सही हस्तलिखित योग दर्ज करें। स्वतंत्र गणना प्रणाली तुरंत नया मिलान (Match/Mismatch) निकालेगी।'
                  : 'If AI misread the total handwritten at the bottom of this page, correct it here. The system will independently recalculate the arithmetic reconciliation.'}
              </p>

              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  {isHi ? 'हस्तलिखित कुल योग (₹ Handwritten Total)' : 'Handwritten Page Total (₹)'}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="e.g. 22950"
                  value={tempPageTotal}
                  onChange={(e) => setTempPageTotal(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-base font-black font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  {isHi ? 'खाली छोड़ने पर कुल योग "पहचाना नहीं गया" हो जाएगा।' : 'Leave empty if no total is written on the page.'}
                </span>
              </div>

              {/* Independent calculated line-item sum reference */}
              {(() => {
                const currentValidation = pageValidations.find((v) => v.docId === editingPageTotalDoc.id);
                return (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[11px] text-stone-500 block uppercase font-semibold">
                      {isHi ? 'वर्तमान प्रविष्टियों का स्वतंत्र जोड़:' : 'Current Line-Item Sum:'}
                    </span>
                    <span className="text-sm font-black text-stone-900 font-mono">
                      {currentValidation ? formatINR(currentValidation.calculatedLineItemSum) : '₹0'}
                    </span>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      {isHi ? 'यह जोड़ सभी प्रविष्टियों की राशियों का स्वतंत्र योग है।' : 'Calculated deterministically by summing line items.'}
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-stone-200">
              <button
                onClick={() => setEditingPageTotalDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={savePageTotal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                {isHi ? 'सहेजें व पुनः जांचें' : 'Save & Recalculate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
