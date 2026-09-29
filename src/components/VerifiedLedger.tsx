import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  X,
  History,
} from 'lucide-react';
import { LedgerEntry, LedgerSettings, TransactionType, PaymentMode } from '../types/ledger';
import { formatINR } from '../utils/reconciliation';

interface VerifiedLedgerProps {
  records: LedgerEntry[];
  onOpenQuickEntry?: () => void;
  onUpdateRecord: (id: string, updated: Partial<LedgerEntry>, reason?: string) => void;
  onDeleteRecord: (id: string) => void;
  onViewSource?: (docId: string, recordId?: string) => void;
  onOpenAuditHistory?: (record: LedgerEntry) => void;
  settings: LedgerSettings;
  language?: 'hi' | 'en';
}

export function VerifiedLedger({
  records,
  onOpenQuickEntry,
  onUpdateRecord,
  onDeleteRecord,
  onViewSource,
  onOpenAuditHistory,
  settings,
  language = 'hi',
}: VerifiedLedgerProps) {
  const isHi = language === 'hi';

  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter records
  const filtered = records.filter((r) => {
    if (typeFilter !== 'ALL' && r.transactionType !== typeFilter) return false;
    if (modeFilter !== 'ALL' && r.paymentMode !== modeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchCategory = r.category.toLowerCase().includes(q);
      const matchPurpose = (r.purpose || '').toLowerCase().includes(q);
      const matchNotes = (r.notes || '').toLowerCase().includes(q);
      const matchAmount = String(r.amount).includes(q);
      const matchSerial = String(r.serialNumber).includes(q);
      return matchName || matchCategory || matchPurpose || matchNotes || matchAmount || matchSerial;
    }
    return true;
  });

  // Deterministic financial totals on filtered results
  const totalIncome = filtered
    .filter((r) => r.transactionType === 'INCOME')
    .reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalExpense = filtered
    .filter((r) => r.transactionType === 'EXPENSE')
    .reduce((acc, r) => acc + (r.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Export CSV with UTF-8 BOM
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
      'टिप्पणी (Notes)',
      'सत्यापित (Verified)',
    ];

    const rows = filtered.map((r) => [
      r.serialNumber,
      r.transactionType,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      r.amount,
      r.paymentMode,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.date || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`,
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
      `LedgerPilot_${(settings.projectName || 'Ledger').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 space-y-5">
      {/* Top Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
            {isHi ? 'बहीखाता (Ledger)' : 'Ledger Entries'}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {isHi
              ? `कुल ${records.length} प्रविष्टियां दर्ज हैं`
              : `Total ${records.length} records recorded`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="h-10 px-3.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHi ? 'CSV डाउनलोड' : 'Export CSV'}</span>
            </button>
          )}

          {onOpenQuickEntry && (
            <button
              onClick={onOpenQuickEntry}
              className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isHi ? '+ नया हिसाब' : '+ Add Entry'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Deterministic Filtered Totals Bar */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
          <div className="text-center sm:text-left sm:pl-3">
            <span className="text-[11px] font-semibold text-stone-500 block">
              {isHi ? 'चयनित आय' : 'Income'}
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-700">
              +{formatINR(totalIncome)}
            </span>
          </div>

          <div className="text-center border-x border-stone-100">
            <span className="text-[11px] font-semibold text-stone-500 block">
              {isHi ? 'चयनित खर्च' : 'Expense'}
            </span>
            <span className="text-sm sm:text-base font-bold text-rose-700">
              -{formatINR(totalExpense)}
            </span>
          </div>

          <div className="text-center sm:text-right sm:pr-3">
            <span className="text-[11px] font-semibold text-stone-500 block">
              {isHi ? 'शुद्ध शेष' : 'Net Balance'}
            </span>
            <span
              className={`text-sm sm:text-base font-bold ${
                netBalance >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {formatINR(netBalance)}
            </span>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      {records.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isHi
                  ? 'नाम, विवरण, श्रेणी, क्रमांक खोजें...'
                  : 'Search by name, category, serial...'
              }
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-900 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isHi ? 'सभी' : 'All'}
            </button>
            <button
              onClick={() => setTypeFilter('INCOME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'INCOME'
                  ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isHi ? '+ आय' : '+ Income'}
            </button>
            <button
              onClick={() => setTypeFilter('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'EXPENSE'
                  ? 'bg-rose-700 text-white shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {isHi ? '- खर्च' : '- Expense'}
            </button>
          </div>

          {/* Mode Filter Selector */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 focus:outline-none focus:border-stone-900 cursor-pointer shadow-2xs"
          >
            <option value="ALL">{isHi ? 'सभी माध्यम' : 'All Modes'}</option>
            <option value="Cash">{isHi ? 'नकद (Cash)' : 'Cash'}</option>
            <option value="Online">{isHi ? 'ऑनलाइन (Online)' : 'Online'}</option>
            <option value="Other">{isHi ? 'अन्य' : 'Other'}</option>
          </select>
        </div>
      )}

      {/* Main Ledger Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {records.length === 0 ? (
          /* Empty Ledger State */
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-800 text-base mb-1">
              {isHi ? 'अभी कोई हिसाब दर्ज नहीं है' : 'No entries yet'}
            </h4>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-5">
              {isHi
                ? 'नया हिसाब जोड़ने के लिए नीचे दिए गए बटन पर टैप करें।'
                : 'Add transactions manually to begin tracking.'}
            </p>
            {onOpenQuickEntry && (
              <button
                onClick={onOpenQuickEntry}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isHi ? '+ पहला हिसाब जोड़ें' : '+ Add First Entry'}</span>
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty Search Filter State */
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-stone-700 mb-1">
              {isHi ? 'इस खोज से कोई हिसाब नहीं मिला' : 'No entries match your search'}
            </p>
            <p className="text-xs text-stone-500 mb-4">
              {isHi
                ? 'कृपया अलग शब्द खोजें या फ़िल्टर हटाएं।'
                : 'Try searching for something else or clearing filters.'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('ALL');
                setModeFilter('ALL');
              }}
              className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              {isHi ? 'फ़िल्टर हटाएं' : 'Clear Filters'}
            </button>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 sm:px-4 w-12 text-center">#</th>
                  <th className="py-3 px-3.5 sm:px-4">{isHi ? 'नाम / पार्टी' : 'Name / Party'}</th>
                  <th className="py-3 px-3.5 sm:px-4 hidden sm:table-cell">{isHi ? 'श्रेणी / उद्देश्य' : 'Category / Purpose'}</th>
                  <th className="py-3 px-3.5 sm:px-4">{isHi ? 'माध्यम' : 'Mode'}</th>
                  <th className="py-3 px-3.5 sm:px-4 hidden md:table-cell">{isHi ? 'दिनांक' : 'Date'}</th>
                  <th className="py-3 px-3.5 sm:px-4 text-right">{isHi ? 'राशि (₹)' : 'Amount'}</th>
                  <th className="py-3 px-3 w-20 text-center">{isHi ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((entry) => {
                  const isIncome = entry.transactionType === 'INCOME';
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-stone-50/80 transition-colors group"
                    >
                      {/* Serial Number */}
                      <td className="py-3 px-3.5 sm:px-4 text-center font-mono text-xs font-semibold text-stone-400">
                        #{entry.serialNumber}
                      </td>

                      {/* Name / Party */}
                      <td className="py-3 px-3.5 sm:px-4">
                        <p className="font-bold text-stone-900">{entry.name}</p>
                        {/* Mobile category & date subtitle */}
                        <div className="sm:hidden flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          <span>{entry.category}</span>
                          {entry.date && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{entry.date}</span>
                            </>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-[11px] text-stone-500 italic mt-0.5">
                            {entry.notes}
                          </p>
                        )}
                      </td>

                      {/* Category & Purpose (Desktop) */}
                      <td className="py-3 px-3.5 sm:px-4 hidden sm:table-cell">
                        <span className="font-medium text-stone-800">{entry.category}</span>
                        {entry.purpose && (
                          <span className="text-xs text-stone-500 block">{entry.purpose}</span>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3 px-3.5 sm:px-4 text-stone-600 font-medium text-xs">
                        {entry.paymentMode === 'Cash'
                          ? isHi ? 'नकद' : 'Cash'
                          : entry.paymentMode === 'Online'
                          ? isHi ? 'ऑनलाइन' : 'Online'
                          : isHi ? 'अन्य' : 'Other'}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3.5 sm:px-4 hidden md:table-cell text-xs text-stone-500">
                        {entry.date || '—'}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 sm:px-4 text-right">
                        <span
                          className={`font-bold font-mono text-sm sm:text-base ${
                            isIncome ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatINR(entry.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            title={isHi ? 'बदलें' : 'Edit'}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(entry.id)}
                            title={isHi ? 'हटाएं' : 'Delete'}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Entry Modal */}
      {editingEntry && (
        <EditEntryDialog
          entry={editingEntry}
          categories={settings.categories}
          onClose={() => setEditingEntry(null)}
          onSave={(updated, reason) => {
            onUpdateRecord(editingEntry.id, updated, reason);
            setEditingEntry(null);
          }}
          language={language}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-stone-900 mb-1">
              {isHi ? 'हिसाब हटाएं?' : 'Delete Entry?'}
            </h4>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              {isHi
                ? 'क्या आप इस प्रविष्टि को हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकेगी।'
                : 'Are you sure you want to delete this record? This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeletingId(null)}
                className="h-10 px-4 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  onDeleteRecord(deletingId);
                  setDeletingId(null);
                }}
                className="h-10 px-5 rounded-xl bg-rose-700 hover:bg-rose-800 text-xs font-semibold text-white shadow-xs cursor-pointer"
              >
                {isHi ? 'हटाएं' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Edit Entry Dialog
function EditEntryDialog({
  entry,
  categories,
  onClose,
  onSave,
  language = 'hi',
}: {
  entry: LedgerEntry;
  categories: string[];
  onClose: () => void;
  onSave: (updated: Partial<LedgerEntry>, reason?: string) => void;
  language?: 'hi' | 'en';
}) {
  const isHi = language === 'hi';
  const [name, setName] = useState(entry.name);
  const [amount, setAmount] = useState(String(entry.amount));
  const [type, setType] = useState<TransactionType>(entry.transactionType);
  const [category, setCategory] = useState(entry.category);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(entry.paymentMode);
  const [purpose, setPurpose] = useState(entry.purpose || '');
  const [date, setDate] = useState(entry.date || '');
  const [notes, setNotes] = useState(entry.notes || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSave(
      {
        name: name.trim(),
        amount: parsedAmount,
        transactionType: type,
        category,
        paymentMode,
        purpose: purpose.trim() || undefined,
        date: date || undefined,
        notes: notes.trim() || undefined,
      },
      'User manual edit from ledger'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
              #{entry.serialNumber}
            </span>
            <h3 className="font-bold text-base text-stone-900">
              {isHi ? 'हिसाब सुधारें (Edit Entry)' : 'Edit Entry'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`h-9 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                type === 'INCOME' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-stone-600'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{isHi ? '+ आय' : '+ Income'}</span>
            </button>
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`h-9 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                type === 'EXPENSE' ? 'bg-rose-700 text-white shadow-2xs' : 'text-stone-600'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{isHi ? '- खर्च' : '- Expense'}</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">
              {isHi ? 'नाम / व्यक्ति' : 'Name / Party'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-stone-900"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">
              {isHi ? 'राशि (Amount)' : 'Amount'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:outline-none focus:border-stone-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">
                {isHi ? 'श्रेणी' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">
                {isHi ? 'माध्यम' : 'Mode'}
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full h-10 px-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              >
                <option value="Cash">{isHi ? 'नकद (Cash)' : 'Cash'}</option>
                <option value="Online">{isHi ? 'ऑनलाइन (Online)' : 'Online'}</option>
                <option value="Other">{isHi ? 'अन्य' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">
              {isHi ? 'दिनांक' : 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">
              {isHi ? 'टिप्पणी / संदर्भ' : 'Notes'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold text-white shadow-2xs"
            >
              {isHi ? 'सहेजें' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
