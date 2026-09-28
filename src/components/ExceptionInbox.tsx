import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Scale,
  Sparkles,
  GitMerge,
  FileQuestion,
  Tag,
  ArrowRight,
  Eye,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Filter,
} from 'lucide-react';
import {
  ExtractedRecord,
  SourceDocument,
  DuplicateCandidate,
  LedgerException,
  ExceptionType,
  LedgerSettings,
} from '../types/ledger';
import { getLedgerExceptions, calculateExceptionSummary } from '../utils/exceptions';
import { formatINR } from '../utils/reconciliation';

interface ExceptionInboxProps {
  records: ExtractedRecord[];
  documents: SourceDocument[];
  duplicates: DuplicateCandidate[];
  onViewSource: (docId: string, recordId?: string) => void;
  onReviewRecord: (recordId: string) => void;
  onReviewDuplicate: (candidateId?: string) => void;
  onReviewPageTotal: (docId: string) => void;
  onUpdateRecord: (id: string, updated: Partial<ExtractedRecord>, reason?: string) => void;
  onNavigateToTab: (tab: string) => void;
  settings: LedgerSettings;
  language: 'hi' | 'en';
}

type FilterCategory = 'ALL' | ExceptionType;

export const ExceptionInbox: React.FC<ExceptionInboxProps> = ({
  records,
  documents,
  duplicates,
  onViewSource,
  onReviewRecord,
  onReviewDuplicate,
  onReviewPageTotal,
  onUpdateRecord,
  onNavigateToTab,
  settings,
  language,
}) => {
  const isHi = language === 'hi';
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('ALL');

  // Derive exceptions deterministically from current state
  const exceptions = getLedgerExceptions(records, documents, duplicates);
  const summary = calculateExceptionSummary(exceptions);

  // Filter exceptions
  const filteredExceptions = exceptions.filter((exc) => {
    if (selectedFilter === 'ALL') return true;
    return exc.type === selectedFilter;
  });

  const getExceptionIcon = (type: ExceptionType) => {
    switch (type) {
      case 'ARITHMETIC_MISMATCH':
        return <Scale className="w-4 h-4 text-rose-600" />;
      case 'LOW_CONFIDENCE':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'POSSIBLE_DUPLICATE':
        return <GitMerge className="w-4 h-4 text-purple-600" />;
      case 'MISSING_FIELD':
        return <FileQuestion className="w-4 h-4 text-rose-600" />;
      case 'TRANSACTION_TYPE_REQUIRED':
        return <Tag className="w-4 h-4 text-amber-600" />;
      case 'CONFLICT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  const getExceptionTypeLabel = (type: ExceptionType) => {
    switch (type) {
      case 'ARITHMETIC_MISMATCH':
        return isHi ? 'गणितीय अंतर' : 'Arithmetic Mismatch';
      case 'LOW_CONFIDENCE':
        return isHi ? 'अस्पष्ट लिखावट' : 'Low Confidence';
      case 'POSSIBLE_DUPLICATE':
        return isHi ? 'संभावित डुप्लिकेट' : 'Possible Duplicate';
      case 'MISSING_FIELD':
        return isHi ? 'आवश्यक जानकारी गायब' : 'Missing Field';
      case 'TRANSACTION_TYPE_REQUIRED':
        return isHi ? 'दिशा अपेक्षित' : 'Type Required';
      case 'CONFLICT':
        return isHi ? 'संदिग्ध प्रविष्टि' : 'Conflict / Ambiguity';
    }
  };

  // Route to the appropriate existing workflow
  const handleReviewException = (exc: LedgerException) => {
    switch (exc.type) {
      case 'POSSIBLE_DUPLICATE':
        onReviewDuplicate(exc.candidateId);
        break;

      case 'ARITHMETIC_MISMATCH':
        if (exc.docId) {
          onReviewPageTotal(exc.docId);
        } else {
          onNavigateToTab('review');
        }
        break;

      case 'TRANSACTION_TYPE_REQUIRED':
      case 'LOW_CONFIDENCE':
      case 'MISSING_FIELD':
      case 'CONFLICT':
        if (exc.recordId) {
          onReviewRecord(exc.recordId);
        } else if (exc.docId) {
          onReviewPageTotal(exc.docId);
        } else {
          onNavigateToTab('review');
        }
        break;
    }
  };

  // Primary "Review Next" action
  const handleReviewNext = () => {
    if (filteredExceptions.length > 0) {
      handleReviewException(filteredExceptions[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-900 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>{isHi ? 'एक्सेप्शन इनबॉक्स' : 'Unified Exception Inbox'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            {isHi ? 'मानव ध्यान अपेक्षित (Exception Inbox)' : 'Items Needing Attention'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            {isHi
              ? 'सिस्टम द्वारा खोजी गई सभी विसंगतियां — केवल समस्याओं की समीक्षा करें, बाकी अपने आप सत्यापित होता है।'
              : 'Centralized orchestrator for arithmetic mismatches, low confidence, duplicates, missing data, and unclassified entries.'}
          </p>
        </div>

        {/* Primary Action Button */}
        {exceptions.length > 0 && (
          <button
            onClick={handleReviewNext}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>{isHi ? 'अगली समस्या सुलझाएं (Review Next)' : 'Review Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Total Attention Card */}
        <div
          onClick={() => setSelectedFilter('ALL')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
            selectedFilter === 'ALL'
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            {isHi ? 'कुल समस्याएं' : 'Items Needing Attention'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono mt-1">
            {summary.total}
          </div>
          <span className="text-[10px] text-stone-500 block mt-0.5">
            {summary.highSeverityCount} {isHi ? 'उच्च प्राथमिकता' : 'High Priority'}
          </span>
        </div>

        {/* Arithmetic Card */}
        <div
          onClick={() => setSelectedFilter('ARITHMETIC_MISMATCH')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
            selectedFilter === 'ARITHMETIC_MISMATCH'
              ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              {isHi ? 'गणितीय अंतर' : 'Arithmetic'}
            </span>
            <Scale className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-950 font-mono">
            {summary.arithmeticCount}
          </div>
          <span className="text-[10px] text-stone-500 block">
            {isHi ? 'पन्ने के योग में अंतर' : 'Page total mismatches'}
          </span>
        </div>

        {/* Duplicates Card */}
        <div
          onClick={() => setSelectedFilter('POSSIBLE_DUPLICATE')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
            selectedFilter === 'POSSIBLE_DUPLICATE'
              ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-200'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
              {isHi ? 'संभावित डुप्लिकेट' : 'Duplicates'}
            </span>
            <GitMerge className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 font-mono">
            {summary.duplicateCount}
          </div>
          <span className="text-[10px] text-stone-500 block">
            {isHi ? 'निर्णय अपेक्षित' : 'Pending resolution'}
          </span>
        </div>

        {/* Direction & Missing Card */}
        <div
          onClick={() => setSelectedFilter('TRANSACTION_TYPE_REQUIRED')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer ${
            selectedFilter === 'TRANSACTION_TYPE_REQUIRED'
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              {isHi ? 'दिशा / जानकारी' : 'Type / Missing'}
            </span>
            <Tag className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
            {summary.typeRequiredCount + summary.missingFieldCount}
          </div>
          <span className="text-[10px] text-stone-500 block">
            {summary.typeRequiredCount} {isHi ? 'दिशा' : 'type'}, {summary.missingFieldCount}{' '}
            {isHi ? 'गायब' : 'missing'}
          </span>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
        {[
          { id: 'ALL', label: isHi ? 'सभी' : 'All', count: summary.total },
          { id: 'ARITHMETIC_MISMATCH', label: isHi ? 'गणितीय अंतर' : 'Arithmetic', count: summary.arithmeticCount },
          { id: 'LOW_CONFIDENCE', label: isHi ? 'अस्पष्ट लिखावट' : 'Low Confidence', count: summary.lowConfidenceCount },
          { id: 'POSSIBLE_DUPLICATE', label: isHi ? 'डुप्लिकेट' : 'Duplicate', count: summary.duplicateCount },
          { id: 'MISSING_FIELD', label: isHi ? 'गायब जानकारी' : 'Missing Field', count: summary.missingFieldCount },
          { id: 'TRANSACTION_TYPE_REQUIRED', label: isHi ? 'दिशा अपेक्षित' : 'Type Required', count: summary.typeRequiredCount },
          { id: 'CONFLICT', label: isHi ? 'संदिग्ध' : 'Conflict', count: summary.conflictCount },
        ].map((f) => {
          const isActive = selectedFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id as FilterCategory)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <span>{f.label}</span>
              {f.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Exceptions List */}
      {filteredExceptions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-lg text-stone-900 mb-1">
            {isHi ? 'कोई आपत्ति या समस्या नहीं है' : 'No items need attention'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            {isHi
              ? 'बधाई! सभी रिकॉर्ड्स, पृष्ठ-योग, डुप्लिकेट्स और लेन-देन दिशाएं सुचारू रूप से सत्यापित हैं।'
              : 'All line items, page arithmetic, duplicates, and transaction classifications are reconciled and verified.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => onNavigateToTab('ledger')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              {isHi ? 'सत्यापित लेजर देखें' : 'View Verified Ledger'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExceptions.map((exc) => {
            const isHigh = exc.severity === 'HIGH';

            return (
              <div
                key={exc.id}
                className={`p-4 rounded-2xl border transition-all bg-white shadow-2xs hover:shadow-xs ${
                  isHigh ? 'border-rose-300 ring-1 ring-rose-100' : 'border-stone-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Column: Badges & Description */}
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      {/* Severity Badge */}
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {exc.severity} PRIORITY
                      </span>

                      {/* Type Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200 flex items-center gap-1">
                        {getExceptionIcon(exc.type)}
                        <span>{getExceptionTypeLabel(exc.type)}</span>
                      </span>

                      {/* Page Badge */}
                      {exc.sourcePage && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                          {isHi ? `पन्ना ${exc.sourcePage}` : `Page ${exc.sourcePage}`}
                        </span>
                      )}

                      {/* Amount if available */}
                      {exc.amount !== undefined && (
                        <span className="text-xs font-extrabold font-mono text-stone-900">
                          {formatINR(exc.amount)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="font-bold text-sm text-stone-900 mb-1 flex items-center gap-1.5">
                      <span>{exc.title}</span>
                    </h4>

                    {/* Human readable message / what is wrong */}
                    <p className="text-xs text-stone-600 leading-relaxed">{exc.message}</p>

                    {/* Quick Inline Action for TRANSACTION_TYPE_REQUIRED */}
                    {exc.type === 'TRANSACTION_TYPE_REQUIRED' && exc.recordId && (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center gap-2">
                        <span className="text-[11px] font-bold text-stone-500">
                          {isHi ? 'त्वरित दिशा चयन:' : 'Quick Classify:'}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateRecord(
                              exc.recordId!,
                              { transactionType: 'INCOME' },
                              'Reviewer classified as Income in Exception Inbox'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span>{isHi ? '+ आय (Income)' : '+ Income'}</span>
                        </button>
                        <button
                          onClick={() =>
                            onUpdateRecord(
                              exc.recordId!,
                              { transactionType: 'EXPENSE' },
                              'Reviewer classified as Expense in Exception Inbox'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          <TrendingDown className="w-3 h-3 text-rose-600" />
                          <span>{isHi ? '- व्यय (Expense)' : '- Expense'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    {/* Primary Review Action */}
                    <button
                      onClick={() => handleReviewException(exc)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isHi ? 'समीक्षा करें' : 'Review'}</span>
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </button>

                    {/* View Source Button */}
                    {(exc.sourceImageId || exc.docId) && (
                      <button
                        onClick={() =>
                          onViewSource(exc.sourceImageId || exc.docId!, exc.recordId)
                        }
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                        title={isHi ? 'मूल हस्तलिखित पन्ना देखें' : 'View original handwritten page'}
                      >
                        <Eye className="w-3 h-3 text-stone-500" />
                        <span>{isHi ? 'मूल पन्ना' : 'Source'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
