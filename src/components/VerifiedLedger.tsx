import React, { useState } from 'react';
import {
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Download,
  FileSpreadsheet,
  ArrowUpDown,
  History,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';
import { ExtractedRecord, LedgerSettings, TransactionType } from '../types/ledger';
import { formatINR } from '../utils/reconciliation';

interface VerifiedLedgerProps {
  records: ExtractedRecord[];
  onViewSource: (docId: string, recordId?: string) => void;
  onOpenAuditHistory: (record: ExtractedRecord) => void;
  onDeleteRecord: (id: string) => void;
  settings: LedgerSettings;
  language: 'hi' | 'en';
}

export const VerifiedLedger: React.FC<VerifiedLedgerProps> = ({
  records,
  onViewSource,
  onOpenAuditHistory,
  onDeleteRecord,
  settings,
  language,
}) => {
  const isHi = language === 'hi';
  const verifiedRecords = records.filter(
    (r) => r.verified && r.transactionType !== 'UNCLASSIFIED'
  );

  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'name' | 'newest'>('newest');

  // Filter & Sort
  const filteredRecords = verifiedRecords
    .filter((r) => {
      if (selectedType !== 'all' && r.transactionType !== selectedType) return false;
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      if (selectedMode !== 'all' && r.paymentMode !== selectedMode) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchCategory = r.category.toLowerCase().includes(q);
        const matchPurpose = (r.purpose || '').toLowerCase().includes(q);
        const matchHousehold = (r.householdName || '').toLowerCase().includes(q);
        const matchAmount = String(r.amount).includes(q);
        return matchName || matchCategory || matchPurpose || matchHousehold || matchAmount;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.createdAt - a.createdAt;
    });

  const filteredIncome = filteredRecords
    .filter((r) => r.transactionType === 'INCOME')
    .reduce((acc, r) => acc + (r.amount || 0), 0);
  const filteredExpense = filteredRecords
    .filter((r) => r.transactionType === 'EXPENSE')
    .reduce((acc, r) => acc + (r.amount || 0), 0);
  const filteredNet = filteredIncome - filteredExpense;

  const exportCSV = () => {
    const headers = ['Sr', 'Type', 'Name', 'Amount', 'Mode', 'Category', 'Household', 'Purpose', 'Date', 'Page'];
    const rows = filteredRecords.map((r, i) => [
      i + 1,
      r.transactionType || 'UNCLASSIFIED',
      `"${r.name.replace(/"/g, '""')}"`,
      r.amount,
      r.paymentMode,
      `"${r.category}"`,
      `"${r.householdName || ''}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.date || '',
      r.sourcePage,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedProject = (settings.projectName || 'Ledger').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `LedgerPilot_${sanitizedProject}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isHi ? 'मानव सत्यापित प्रविष्टियां' : 'Human Verified Entries'}</span>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {isHi ? 'प्रोजेक्ट:' : 'Project:'}{' '}
              <strong className="text-stone-800">{settings.projectName || 'New Ledger'}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            {isHi ? 'स्थायी सत्यापित खाता (Verified Ledger)' : 'Verified Official Ledger'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            {isHi
              ? 'केवल वे प्रविष्टियां जो आपकी पुष्टि से सत्यापित की गई हैं। प्रत्येक प्रविष्टि मूल हस्तलिखित पन्ने से जुड़ी है।'
              : 'Official accounting records approved by human reviewer. Fully traceable to original handwriting.'}
          </p>
        </div>

        {/* Financial Model Trio Block (Income, Expense, Net Balance) & Export */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl p-1.5">
            <div className="px-2.5 py-1 text-right">
              <span className="text-[10px] text-emerald-800 font-semibold uppercase block">
                {isHi ? 'सत्यापित आय' : 'Income'}
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-950 font-mono">
                {formatINR(filteredIncome)}
              </span>
            </div>

            <span className="text-stone-300 font-light text-lg">|</span>

            <div className="px-2.5 py-1 text-right">
              <span className="text-[10px] text-rose-800 font-semibold uppercase block">
                {isHi ? 'सत्यापित व्यय' : 'Expense'}
              </span>
              <span className="text-sm sm:text-base font-black text-rose-950 font-mono">
                {formatINR(filteredExpense)}
              </span>
            </div>

            <span className="text-stone-300 font-light text-lg">|</span>

            <div className="px-2.5 py-1 text-right bg-white rounded-lg border border-stone-200 shadow-2xs">
              <span className="text-[10px] text-indigo-800 font-bold uppercase block">
                {isHi ? 'शुद्ध शेष (Net)' : 'Net Balance'}
              </span>
              <span
                className={`text-sm sm:text-base font-black font-mono ${
                  filteredNet >= 0 ? 'text-indigo-950' : 'text-rose-900'
                }`}
              >
                {formatINR(filteredNet)}
              </span>
            </div>
          </div>

          <button
            onClick={exportCSV}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 shadow-2xs transition flex items-center gap-1.5 shrink-0"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">CSV Export</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs mb-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isHi ? 'नाम, परिवार, विवरण या राशि से खोजें...' : 'Search by name, household, amount...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800"
            >
              <option value="all">{isHi ? 'सभी प्रकार (All Types)' : 'All Types'}</option>
              <option value="INCOME">{isHi ? 'केवल आय (INCOME Only)' : 'INCOME (Receipts)'}</option>
              <option value="EXPENSE">{isHi ? 'केवल व्यय (EXPENSE Only)' : 'EXPENSE (Payouts)'}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
            >
              <option value="all">{isHi ? 'सभी श्रेणियां (All Categories)' : 'All Categories'}</option>
              {settings.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
            >
              <option value="all">{isHi ? 'सभी माध्यम (All Modes)' : 'All Payment Modes'}</option>
              <option value="Cash">Cash (नकद)</option>
              <option value="Online">Online (UPI / QR)</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Quick count row & Sort */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
          <span>
            {filteredRecords.length} {isHi ? 'प्रविष्टियां प्रदर्शित' : 'entries shown'}
          </span>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs font-semibold text-stone-700 cursor-pointer focus:ring-0"
            >
              <option value="newest">{isHi ? 'नवीनतम पहले' : 'Newest First'}</option>
              <option value="amount-desc">{isHi ? 'अधिकतम राशि' : 'Highest Amount'}</option>
              <option value="amount-asc">{isHi ? 'न्यूनतम राशि' : 'Lowest Amount'}</option>
              <option value="name">{isHi ? 'नाम (A-Z)' : 'Name (A-Z)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Records Table / Cards */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-6">
          <Layers className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <h4 className="font-bold text-stone-800 text-sm">
            {isHi ? 'कोई सत्यापित प्रविष्टि नहीं मिली' : 'No verified records found'}
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            {isHi
              ? 'कृपया पहले "AI समीक्षा" टैब में जाकर निकाले गए रिकॉर्ड्स की पुष्टि करें।'
              : 'Please visit the "AI Review" tab to verify extracted entries.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">क्र. (No.)</th>
                  <th className="py-3 px-4">{isHi ? 'प्रकार' : 'Type'}</th>
                  <th className="py-3 px-4">{isHi ? 'दाता / सदस्य' : 'Donor / Member'}</th>
                  <th className="py-3 px-4">{isHi ? 'राशि (Amount)' : 'Amount'}</th>
                  <th className="py-3 px-4">{isHi ? 'माध्यम' : 'Mode'}</th>
                  <th className="py-3 px-4">{isHi ? 'श्रेणी' : 'Category'}</th>
                  <th className="py-3 px-4">{isHi ? 'परिवार / पता' : 'Household'}</th>
                  <th className="py-3 px-4">{isHi ? 'मूल स्रोत' : 'Source'}</th>
                  <th className="py-3 px-4 text-right">{isHi ? 'क्रियाएं' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRecords.map((rec, index) => {
                  const isExpense = rec.transactionType === 'EXPENSE';
                  return (
                    <tr key={rec.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-400 font-bold">{index + 1}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isExpense
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isExpense ? (
                            <>
                              <TrendingDown className="w-3 h-3 text-rose-600" />
                              <span>EXPENSE</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              <span>INCOME</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        <div>{rec.name}</div>
                        {rec.purpose && (
                          <div className="text-[11px] text-stone-400 font-normal">{rec.purpose}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-black font-mono text-sm">
                        <span className={isExpense ? 'text-rose-700' : 'text-stone-900'}>
                          {isExpense ? `-${formatINR(rec.amount)}` : `+${formatINR(rec.amount)}`}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            rec.paymentMode === 'Online'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : rec.paymentMode === 'Cash'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {rec.paymentMode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200/60 font-medium">
                          {rec.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {rec.householdName ? (
                          <span className="text-purple-800 font-medium">{rec.householdName}</span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onViewSource(rec.sourceImageId, rec.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-amber-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isHi ? `पेज ${rec.sourcePage}` : `Page ${rec.sourcePage}`}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rec.auditTrail && (
                            <button
                              onClick={() => onOpenAuditHistory(rec)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Audit Trail"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteRecord(rec.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-stone-100">
            {filteredRecords.map((rec, index) => {
              const isExpense = rec.transactionType === 'EXPENSE';
              return (
                <div key={rec.id} className="p-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-stone-400">#{index + 1}</span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 ${
                            isExpense
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isExpense ? 'EXPENSE' : 'INCOME'}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-stone-900">{rec.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            rec.paymentMode === 'Online'
                              ? 'bg-teal-50 text-teal-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {rec.paymentMode}
                        </span>
                        <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                          {rec.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black font-mono text-base ${
                          isExpense ? 'text-rose-700' : 'text-stone-900'
                        }`}
                      >
                        {isExpense ? `-${formatINR(rec.amount)}` : `+${formatINR(rec.amount)}`}
                      </span>
                      <div className="text-[10px] text-emerald-600 font-semibold">✓ Verified</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-50 text-xs">
                    <span className="text-[11px] text-stone-500">
                      {rec.householdName || rec.purpose || rec.date || ''}
                    </span>

                    <button
                      onClick={() => onViewSource(rec.sourceImageId, rec.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isHi ? `स्रोत (पेज ${rec.sourcePage})` : `Source (Pg ${rec.sourcePage})`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
