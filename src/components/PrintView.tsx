import React from 'react';
import { ArrowLeft, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { ExtractedRecord, SourceDocument, LedgerSettings } from '../types/ledger';
import { calculateReconciliationMetrics, formatINR } from '../utils/reconciliation';

interface PrintViewProps {
  records: ExtractedRecord[];
  documents: SourceDocument[];
  settings: LedgerSettings;
  onBack: () => void;
  language: 'hi' | 'en';
}

export const PrintView: React.FC<PrintViewProps> = ({
  records,
  documents,
  settings,
  onBack,
  language,
}) => {
  const isHi = language === 'hi';
  const metrics = calculateReconciliationMetrics(records);
  const now = new Date().toLocaleDateString('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-stone-100 py-6 px-3 sm:px-6">
      {/* Top Action Bar (Hidden on actual print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white px-3 py-2 rounded-xl border border-stone-300 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHi ? 'वापस जाएँ' : 'Back to App'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>{isHi ? '🖨 प्रिंट निकालें / Save as PDF' : '🖨 Print / Save as PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 / Letter format) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-stone-200 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-stone-900">
        {/* Formal Report Header */}
        <div className="border-b-2 border-stone-900 pb-5 mb-6 text-center">
          <div className="text-xs uppercase font-extrabold tracking-widest text-amber-800 mb-1">
            LedgerPilot • {isHi ? 'आधिकारिक वित्तीय संग्रह प्रतिवेदन' : 'Official Financial Ledger Report'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-950">
            {settings.projectName || (isHi ? 'वित्तीय लेखा रजिस्टर' : 'Financial Ledger Register')}
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs text-stone-600 mt-2">
            <span>
              <strong>दिनांक (Date):</strong> {now}
            </span>
            <span>•</span>
            <span>
              <strong>कुल पन्ने (Source Pages):</strong> {documents.length}
            </span>
            <span>•</span>
            <span>
              <strong>कुल प्रविष्टियां:</strong> {records.length}
            </span>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="mb-6 p-4 rounded-xl border border-stone-300 bg-stone-50/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-[11px] text-emerald-800 block uppercase font-bold">
              कुल आय (Verified Income)
            </span>
            <span className="text-xl font-black font-mono text-emerald-950">
              {formatINR(metrics.verifiedIncome)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-rose-800 block uppercase font-bold">
              कुल व्यय (Verified Expense)
            </span>
            <span className="text-xl font-black font-mono text-rose-950">
              {formatINR(metrics.verifiedExpense)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-indigo-800 block uppercase font-bold">
              शुद्ध शेष (Net Balance)
            </span>
            <span
              className={`text-xl font-black font-mono ${
                metrics.netBalance >= 0 ? 'text-indigo-950' : 'text-rose-900'
              }`}
            >
              {formatINR(metrics.netBalance)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-stone-600 block uppercase font-bold">
              सत्यापित रिकॉर्ड्स
            </span>
            <span className="text-xl font-black font-mono text-stone-900">
              {metrics.verifiedRecordsCount}/{metrics.totalRecords}
            </span>
          </div>
        </div>

        {/* Category breakdown line */}
        <div className="mb-6 text-xs text-stone-600 border-b border-stone-200 pb-3">
          <span className="font-bold text-stone-800 mr-2">मदवार विवरण:</span>
          {Object.entries(metrics.categoryTotals).map(([cat, data], idx) => {
            const isExp = data.type === 'EXPENSE' || cat.toLowerCase() === 'expense' || cat.toLowerCase() === 'खर्च';
            return (
              <span key={cat} className="mr-3 inline-block">
                {cat} ({isExp ? 'व्यय' : 'आय'}):{' '}
                <strong className={isExp ? 'text-rose-700' : 'text-stone-900'}>
                  {isExp ? `-${formatINR(data.total)}` : formatINR(data.total)}
                </strong>{' '}
                ({data.count})
                {idx < Object.entries(metrics.categoryTotals).length - 1 ? ' • ' : ''}
              </span>
            );
          })}
        </div>

        {/* Detailed Items Table */}
        <table className="w-full text-left text-xs mb-8">
          <thead>
            <tr className="border-b-2 border-stone-800 text-stone-700 uppercase tracking-wider text-[11px]">
              <th className="py-2 px-2 w-10">क्र.</th>
              <th className="py-2 px-2">प्रकार</th>
              <th className="py-2 px-2">दाता / सदस्य / विवरण</th>
              <th className="py-2 px-2 text-right">राशि (₹)</th>
              <th className="py-2 px-2 text-center">माध्यम</th>
              <th className="py-2 px-2">श्रेणी</th>
              <th className="py-2 px-2">परिवार / विवरण</th>
              <th className="py-2 px-2 text-center">स्थिति</th>
              <th className="py-2 px-2 text-center">स्रोत</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {records.map((r, i) => {
              const isExpense = r.transactionType === 'EXPENSE';
              const isUnclassified = r.transactionType === 'UNCLASSIFIED';
              return (
                <tr key={r.id} className="print:break-inside-avoid">
                  <td className="py-2 px-2 font-mono text-stone-500">{i + 1}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        isUnclassified
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isExpense
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isUnclassified ? 'अवर्गीकृत' : isExpense ? 'व्यय' : 'आय'}
                    </span>
                  </td>
                  <td className="py-2 px-2 font-bold text-stone-900">{r.name}</td>
                  <td className="py-2 px-2 text-right font-black font-mono text-sm">
                    <span
                      className={
                        isUnclassified
                          ? 'text-amber-800'
                          : isExpense
                          ? 'text-rose-700'
                          : 'text-stone-900'
                      }
                    >
                      {isUnclassified
                        ? formatINR(r.amount)
                        : isExpense
                        ? `-${formatINR(r.amount)}`
                        : `+${formatINR(r.amount)}`}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-stone-300">
                      {r.paymentMode}
                    </span>
                  </td>
                  <td className="py-2 px-2">{r.category}</td>
                  <td className="py-2 px-2 text-stone-600 text-[11px]">
                    {r.householdName ? `${r.householdName} ` : ''}
                    {r.purpose ? `(${r.purpose})` : ''}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {r.verified ? (
                      <span className="text-[10px] text-emerald-800 font-bold">✓ Verified</span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center text-stone-500 font-mono text-[11px]">
                    पेज {r.sourcePage}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-stone-900 font-bold text-xs bg-stone-50">
              <td colSpan={3} className="py-2.5 px-2 text-right">
                कुल आय (Income): <span className="font-mono text-emerald-800 text-sm">{formatINR(metrics.verifiedIncome)}</span>
                {'  '}|{'  '}
                कुल व्यय (Expense): <span className="font-mono text-rose-800 text-sm">-{formatINR(metrics.verifiedExpense)}</span>
                {'  '}|{'  '}
                शुद्ध शेष (Net):
              </td>
              <td className="py-2.5 px-2 text-right font-black font-mono text-base">
                <span className={metrics.netBalance >= 0 ? 'text-indigo-950' : 'text-rose-900'}>
                  {formatINR(metrics.netBalance)}
                </span>
              </td>
              <td colSpan={5}></td>
            </tr>
          </tfoot>
        </table>

        {/* Verification & Sign-off Section */}
        <div className="mt-12 pt-6 border-t border-stone-300 grid grid-cols-2 gap-8 text-xs text-stone-600">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>लेखा परीक्षक प्रमाण (Audit Assurance):</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-500">
              यह प्रतिवेदन LedgerPilot AI द्वारा मूल हस्तलिखित पन्नों से निकाला गया है एवं मानवीय लेखाकार द्वारा
              प्रमाणित किया गया है। प्रत्येक प्रविष्टि मूल साक्ष्य से सत्यापन योग्य है।
            </p>
          </div>

          <div className="text-right flex flex-col justify-end">
            <div className="h-10 border-b border-stone-400 w-48 ml-auto mb-1"></div>
            <span className="font-bold text-stone-900">अधिकृत कोषाध्यक्ष / संयोजक हस्ताक्षर</span>
            <span className="text-[10px] text-stone-400">Date & Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
};
