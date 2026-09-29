import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Check, ArrowDownLeft, ArrowUpRight, Calendar, Tag, CreditCard, User, FileText } from 'lucide-react';
import { LedgerEntry, TransactionType, PaymentMode } from '../types/ledger';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>, addAnother: boolean) => void;
  nextSerialNumber: number;
  categories: string[];
  existingNames?: string[];
  currency?: string;
  language?: 'hi' | 'en';
}

export function QuickEntryModal({
  isOpen,
  onClose,
  onSave,
  nextSerialNumber,
  categories,
  existingNames = [],
  currency = '₹',
  language = 'hi',
}: QuickEntryModalProps) {
  const isHindi = language === 'hi';

  const [type, setType] = useState<TransactionType>('INCOME');
  const [amount, setAmount] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>(categories[0] || 'General');
  const [purpose, setPurpose] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string; name?: string }>({});

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Focus amount input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { amount?: string; name?: string } = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = isHindi ? 'कृपया मान्य राशि दर्ज करें' : 'Enter a valid amount';
    }
    if (!name.trim()) {
      newErrors.name = isHindi ? 'कृपया नाम या विवरण लिखें' : 'Name or party is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (addAnother: boolean) => {
    if (!validate()) return;

    const parsedAmount = parseFloat(amount);

    onSave(
      {
        projectId: '', // Parent sets active project
        serialNumber: nextSerialNumber,
        transactionType: type,
        name: name.trim(),
        amount: parsedAmount,
        currency,
        category,
        purpose: purpose.trim() || undefined,
        paymentMode,
        date,
        notes: notes.trim() || undefined,
        source: 'MANUAL',
        verified: true, // Manual entries are verified by default
      },
      addAnother
    );

    if (addAnother) {
      // Reset fields for next entry, keeping date & mode
      setAmount('');
      setName('');
      setPurpose('');
      setNotes('');
      setErrors({});
      amountInputRef.current?.focus();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
              #{nextSerialNumber}
            </span>
            <h3 className="font-bold text-stone-900 text-base sm:text-lg">
              {isHindi ? 'नया हिसाब जोड़ें' : 'Add New Entry'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4.5 flex-1">
          {/* 1. Transaction Type Toggle (Large Touch Targets) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              {isHindi ? 'हिसाब का प्रकार' : 'Transaction Type'}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>{isHindi ? '+ आय / जमा (Income)' : '+ Income'}</span>
              </button>

              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>{isHindi ? '- खर्च / निकासी (Expense)' : '- Expense'}</span>
              </button>
            </div>
          </div>

          {/* 2. Amount Input (Primary Focus) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              {isHindi ? 'राशि (रुपये)' : 'Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-400">
                {currency}
              </span>
              <input
                ref={amountInputRef}
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                placeholder="0"
                className={`w-full h-14 pl-10 pr-4 text-2xl font-bold rounded-xl border bg-white focus:outline-none transition-all ${
                  errors.amount
                    ? 'border-rose-500 ring-2 ring-rose-100'
                    : 'border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-200'
                } ${type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-rose-600 font-medium mt-1">{errors.amount}</p>
            )}
          </div>

          {/* 3. Name / Party Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              {isHindi ? 'नाम / व्यक्ति / पार्टी' : 'Name / Party'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                list="party-names"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder={isHindi ? 'जैसे: रमेश कुमार, बिजली बिल, आदि' : 'e.g. Ramesh Kumar, Electricity bill'}
                className={`w-full h-11 pl-10 pr-3 rounded-xl border bg-white text-sm text-stone-900 focus:outline-none transition-all ${
                  errors.name
                    ? 'border-rose-500 ring-2 ring-rose-100'
                    : 'border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-200'
                }`}
              />
              <datalist id="party-names">
                {Array.from(new Set(existingNames)).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            {errors.name && (
              <p className="text-xs text-rose-600 font-medium mt-1">{errors.name}</p>
            )}
          </div>

          {/* 4. Category / Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                {isHindi ? 'श्रेणी (Category)' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                {isHindi ? 'उद्देश्य / मद (वैकल्पिक)' : 'Purpose / Item (Optional)'}
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={isHindi ? 'विवरण लिखें...' : 'Brief details...'}
                className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900"
              />
            </div>
          </div>

          {/* 5. Payment Mode & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                {isHindi ? 'भुगतान माध्यम' : 'Payment Mode'}
              </label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-stone-100 rounded-xl">
                {(['Cash', 'Online', 'Other'] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`h-9 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      paymentMode === mode
                        ? 'bg-white text-stone-900 shadow-xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {mode === 'Cash'
                      ? isHindi ? 'नकद' : 'Cash'
                      : mode === 'Online'
                      ? isHindi ? 'ऑनलाइन' : 'Online'
                      : isHindi ? 'अन्य' : 'Other'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                {isHindi ? 'दिनांक' : 'Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900 cursor-pointer"
              />
            </div>
          </div>

          {/* 6. Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              {isHindi ? 'टिप्पणी / संदर्भ (वैकल्पिक)' : 'Notes / Reference (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isHindi ? 'जैसे: रसीद सं. 45, चेक नंबर, आदि' : 'e.g. Receipt #45, slip note'}
              className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="h-11 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-sm font-semibold transition-colors cursor-pointer"
          >
            {isHindi ? 'सहेजें और अगला (+)' : 'Save & Add Next'}
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="h-11 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isHindi ? 'सहेजें' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
