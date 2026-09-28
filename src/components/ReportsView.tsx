import React, { useState } from 'react';
import {
  Share2,
  Printer,
  FileText,
  Copy,
  Check,
  Download,
  CreditCard,
  Banknote,
  PieChart,
  Users,
  Eye,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { ExtractedRecord, SourceDocument, LedgerSettings } from '../types/ledger';
import { generateWhatsAppSummary, openWhatsAppShare, shareOrCopySummary } from '../utils/whatsapp';
import { formatINR, calculateReconciliationMetrics } from '../utils/reconciliation';

interface ReportsViewProps {
  records: ExtractedRecord[];
  documents: SourceDocument[];
  onViewSource: (docId: string, recordId?: string) => void;
  onOpenPrint: () => void;
  settings: LedgerSettings;
  language: 'hi' | 'en';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  documents,
  onViewSource,
  onOpenPrint,
  settings,
  language,
}) => {
  const isHi = language === 'hi';
  const [activeReportTab, setActiveReportTab] = useState<
    'summary' | 'donors' | 'cash' | 'online' | 'categories' | 'evidence'
  >('summary');
  const [copied, setCopied] = useState<boolean>(false);

  const metrics = calculateReconciliationMetrics(records);
  const verifiedRecords = records.filter((r) => r.verified);

  const whatsappText = generateWhatsAppSummary({
    title: settings.projectName || 'New Ledger',
    records: records,
    includeTopDonors: true,
  });

  const handleShareWhatsApp = () => {
    openWhatsAppShare(whatsappText);
  };

  const handleCopySummary = async () => {
    const res = await shareOrCopySummary(whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>{isHi ? 'रिपोर्ट एवं साझाकरण केंद्र' : 'Reports & Export Center'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            {isHi ? 'वित्तीय रिपोर्ट एवं WhatsApp शेयर' : 'Financial Reports & WhatsApp Share'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            {isHi
              ? 'समरी, विस्तृत दाता सूची, कैश/ऑनलाइन अलग विवरण, और प्रिंटेबल दस्तावेज तैयार करें।'
              : 'Generate comprehensive summaries, detailed registers, cash/online lists, and print-ready PDFs.'}
          </p>
        </div>

        {/* Primary Share & Print Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPrint}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 shadow-2xs transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>{isHi ? '🖨 प्रिंट / PDF' : '🖨 Print / PDF'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isHi ? 'WhatsApp पर साझा करें' : 'Share on WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Clean Summary Card Box */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-950">
                {isHi ? 'WhatsApp सारांश संदेश (Live Preview)' : 'WhatsApp Formatted Message'}
              </h3>
              <span className="text-[11px] text-emerald-800/80">
                {isHi ? 'ग्रुप में भेजने हेतु तैयार पाठ' : 'Ready to forward to colony or event group'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50 transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isHi ? 'कॉपी हो गया!' : 'Copied!') : isHi ? 'कॉपी करें' : 'Copy'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isHi ? 'भेजें (Send)' : 'Send'}</span>
            </button>
          </div>
        </div>

        {/* Message Bubble Preview */}
        <pre className="p-3.5 bg-white rounded-xl border border-emerald-100 font-sans text-xs text-stone-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
          {whatsappText}
        </pre>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-5">
        {[
          { id: 'summary', label: isHi ? 'A. सारांश रिपोर्ट' : 'A. Summary Report', icon: FileText },
          { id: 'donors', label: isHi ? 'B. विस्तृत दाता सूची' : 'B. Detailed Donor List', icon: Users },
          { id: 'cash', label: isHi ? 'C. कैश सूची' : 'C. Cash Register', icon: Banknote },
          { id: 'online', label: isHi ? 'D. ऑनलाइन सूची' : 'D. Online Register', icon: CreditCard },
          { id: 'categories', label: isHi ? 'E. श्रेणी रिपोर्ट' : 'E. Category Report', icon: PieChart },
          { id: 'evidence', label: isHi ? 'F. स्रोत साक्ष्य सूची' : 'F. Source Evidence', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-2xs">
        {/* A. Summary Report */}
        {activeReportTab === 'summary' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-stone-900 pb-2 border-b border-stone-100">
              {isHi ? 'संग्रह सारांश रिपोर्ट' : 'Collection Executive Summary'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl">
                <span className="text-[11px] text-stone-500 block">कुल संग्रह</span>
                <span className="text-lg font-black text-stone-900 font-mono">
                  {formatINR(metrics.totalCollection)}
                </span>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl">
                <span className="text-[11px] text-teal-700 block">ऑनलाइन (UPI)</span>
                <span className="text-lg font-black text-teal-900 font-mono">
                  {formatINR(metrics.onlineTotal)}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <span className="text-[11px] text-emerald-700 block">कैश (नकद)</span>
                <span className="text-lg font-black text-emerald-900 font-mono">
                  {formatINR(metrics.cashTotal)}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <span className="text-[11px] text-amber-800 block">सत्यापित दर</span>
                <span className="text-lg font-black text-amber-950 font-mono">
                  {metrics.verifiedRecordsCount}/{metrics.totalRecords}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-bold text-xs uppercase text-stone-500 mb-2">
                {isHi ? 'श्रेणीवार विभाजन' : 'Category Breakdown'}
              </h4>
              <div className="divide-y divide-stone-100">
                {Object.entries(metrics.categoryTotals).map(([cat, data]) => (
                  <div key={cat} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{cat}</span>
                    <div className="text-right">
                      <span className="font-bold font-mono text-stone-900">{formatINR(data.total)}</span>
                      <span className="text-[11px] text-stone-400 ml-2">({data.count} रसीदें)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* B. Detailed Donor List */}
        {activeReportTab === 'donors' && (
          <div>
            <h3 className="font-bold text-base text-stone-900 pb-2 border-b border-stone-100 mb-3">
              {isHi ? 'विस्तृत दाता सूची (All Records)' : 'Detailed Contributor Register'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">क्र.</th>
                    <th className="py-2.5 px-3">नाम</th>
                    <th className="py-2.5 px-3">राशि</th>
                    <th className="py-2.5 px-3">माध्यम</th>
                    <th className="py-2.5 px-3">श्रेणी</th>
                    <th className="py-2.5 px-3">स्रोत</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {records.map((r, i) => (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <td className="py-2.5 px-3 font-mono text-stone-400">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">{r.name}</td>
                      <td className="py-2.5 px-3 font-black font-mono">{formatINR(r.amount)}</td>
                      <td className="py-2.5 px-3">{r.paymentMode}</td>
                      <td className="py-2.5 px-3">{r.category}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => onViewSource(r.sourceImageId, r.id)}
                          className="text-amber-700 hover:underline font-semibold"
                        >
                          पेज {r.sourcePage}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* C. Cash List */}
        {activeReportTab === 'cash' && (
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-3">
              <h3 className="font-bold text-base text-stone-900">
                {isHi ? 'कैश (नकद) संग्रह रजिस्टर' : 'Cash Collection Register'}
              </h3>
              <span className="font-black font-mono text-emerald-800 text-base">
                {formatINR(metrics.cashTotal)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">क्र.</th>
                    <th className="py-2.5 px-3">नाम</th>
                    <th className="py-2.5 px-3">राशि</th>
                    <th className="py-2.5 px-3">श्रेणी</th>
                    <th className="py-2.5 px-3">पेज</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {records
                    .filter((r) => r.paymentMode === 'Cash')
                    .map((r, i) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono text-stone-400">{i + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-stone-900">{r.name}</td>
                        <td className="py-2.5 px-3 font-black font-mono">{formatINR(r.amount)}</td>
                        <td className="py-2.5 px-3">{r.category}</td>
                        <td className="py-2.5 px-3 text-stone-500">पेज {r.sourcePage}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* D. Online List */}
        {activeReportTab === 'online' && (
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-3">
              <h3 className="font-bold text-base text-stone-900">
                {isHi ? 'ऑनलाइन (UPI / GPay / QR) रजिस्टर' : 'Online / UPI Register'}
              </h3>
              <span className="font-black font-mono text-teal-800 text-base">
                {formatINR(metrics.onlineTotal)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-teal-50/50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-3">क्र.</th>
                    <th className="py-2.5 px-3">नाम</th>
                    <th className="py-2.5 px-3">राशि</th>
                    <th className="py-2.5 px-3">श्रेणी</th>
                    <th className="py-2.5 px-3">विवरण / Trx ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {records
                    .filter((r) => r.paymentMode === 'Online')
                    .map((r, i) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono text-stone-400">{i + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-stone-900">{r.name}</td>
                        <td className="py-2.5 px-3 font-black font-mono text-teal-900">
                          {formatINR(r.amount)}
                        </td>
                        <td className="py-2.5 px-3">{r.category}</td>
                        <td className="py-2.5 px-3 text-stone-500">{r.purpose || 'UPI Online'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* E. Category Report */}
        {activeReportTab === 'categories' && (
          <div>
            <h3 className="font-bold text-base text-stone-900 pb-2 border-b border-stone-100 mb-3">
              {isHi ? 'मदवार (Category-wise) रिपोर्ट' : 'Category Analysis'}
            </h3>
            <div className="space-y-4">
              {Object.entries(metrics.categoryTotals).map(([cat, data]) => (
                <div key={cat} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-stone-900">{cat}</span>
                    <span className="font-black font-mono text-stone-900">{formatINR(data.total)}</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    कुल {data.count} रसीदें दर्ज हैं।
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* F. Source Evidence List */}
        {activeReportTab === 'evidence' && (
          <div>
            <h3 className="font-bold text-base text-stone-900 pb-2 border-b border-stone-100 mb-3">
              {isHi ? 'मूल हस्तलिखित दस्तावेज साक्ष्य (Source Evidence)' : 'Original Source Documents'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-stone-200 p-3 bg-stone-50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.dataUrl}
                      alt={doc.fileName}
                      className="w-14 h-18 object-cover rounded border border-stone-300 shadow-2xs"
                    />
                    <div>
                      <div className="font-bold text-xs text-stone-900">{doc.pageHeader || doc.fileName}</div>
                      <div className="text-[11px] text-stone-500">पेज सं: {doc.pageNumber}</div>
                      {doc.detectedPageTotal && (
                        <div className="text-[11px] text-amber-700 font-bold">
                          लिखित योग: {formatINR(doc.detectedPageTotal)}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onViewSource(doc.id)}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-stone-800 border border-stone-300 rounded-lg hover:bg-stone-100 shadow-2xs flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isHi ? 'देखें' : 'View'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
