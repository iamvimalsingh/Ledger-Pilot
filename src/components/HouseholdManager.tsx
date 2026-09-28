import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Home, Check, X, Search, Sparkles } from 'lucide-react';
import { Household, ExtractedRecord, LedgerSettings } from '../types/ledger';
import { formatINR } from '../utils/reconciliation';

interface HouseholdManagerProps {
  households: Household[];
  records: ExtractedRecord[];
  onAddHousehold: (household: Household) => void;
  onUpdateHousehold: (id: string, updated: Partial<Household>) => void;
  onDeleteHousehold: (id: string) => void;
  onViewHouseholdRecords: (householdName: string) => void;
  settings: LedgerSettings;
  language: 'hi' | 'en';
}

export const HouseholdManager: React.FC<HouseholdManagerProps> = ({
  households,
  records,
  onAddHousehold,
  onUpdateHousehold,
  onDeleteHousehold,
  onViewHouseholdRecords,
  settings,
  language,
}) => {
  const isHi = language === 'hi';
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    membersStr: string;
    flatOrAddress: string;
    notes: string;
  }>({
    name: '',
    membersStr: '',
    flatOrAddress: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      membersStr: '',
      flatOrAddress: '',
      notes: '',
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleOpenEdit = (h: Household) => {
    setFormData({
      name: h.name,
      membersStr: h.members.join(', '),
      flatOrAddress: h.flatOrAddress || '',
      notes: h.notes || '',
    });
    setEditingId(h.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    const members = formData.membersStr
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (editingId) {
      onUpdateHousehold(editingId, {
        name: formData.name.trim(),
        members,
        flatOrAddress: formData.flatOrAddress.trim(),
        notes: formData.notes.trim(),
      });
      setEditingId(null);
    } else {
      const newHousehold: Household = {
        id: `hh-${Date.now()}-${Math.random()}`,
        name: formData.name.trim(),
        members,
        flatOrAddress: formData.flatOrAddress.trim(),
        notes: formData.notes.trim(),
      };
      onAddHousehold(newHousehold);
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>{isHi ? 'वैकल्पिक परिवार व घराना समूह' : 'Household & Family Mode (Optional)'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            {isHi ? 'परिवार / घराना सूची (Households)' : 'Family & Household Directory'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            {isHi
              ? 'एक ही परिवार के सदस्यों के चंदे को परिवार स्तर पर समेकित करने हेतु। यह अनिवार्य नहीं है।'
              : 'Optionally associate donor members with households (e.g. Singh Family) to view unified contributions.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isHi ? 'नया परिवार जोड़ें' : 'Add Household'}</span>
        </button>
      </div>

      {/* Add / Edit Form Modal */}
      {(isAdding || editingId) && (
        <div className="mb-6 p-4 sm:p-5 bg-white border border-purple-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
            <h3 className="font-bold text-sm text-purple-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-purple-600" />
              <span>
                {editingId
                  ? isHi
                    ? 'परिवार संपादित करें'
                    : 'Edit Household'
                  : isHi
                  ? 'नया परिवार दर्ज करें'
                  : 'New Household'}
              </span>
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                {isHi ? 'परिवार का नाम (उदा. Singh Family)' : 'Household / Family Name'}
              </label>
              <input
                type="text"
                placeholder="e.g. Singh Family (सिंह परिवार)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                {isHi ? 'मकान नं. / पता' : 'Flat No. / Address'}
              </label>
              <input
                type="text"
                placeholder="e.g. Flat B-12"
                value={formData.flatOrAddress}
                onChange={(e) => setFormData({ ...formData, flatOrAddress: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">
                {isHi ? 'सदस्यों के नाम (अल्पविराम से अलग करें)' : 'Members (comma-separated)'}
              </label>
              <input
                type="text"
                placeholder="e.g. Vimal Singh, Neha Singh, Raghav Singh"
                value={formData.membersStr}
                onChange={(e) => setFormData({ ...formData, membersStr: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-stone-100">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              Save Household
            </button>
          </div>
        </div>
      )}

      {/* Household Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {households.map((h) => {
          // Aggregate collection from records matching this household
          const householdRecords = records.filter(
            (r) =>
              (r.householdName && r.householdName.toLowerCase().includes(h.name.toLowerCase())) ||
              h.members.some((m) => r.name.toLowerCase().includes(m.toLowerCase()))
          );

          const totalCollected = householdRecords.reduce((acc, r) => acc + (r.amount || 0), 0);

          return (
            <div
              key={h.id}
              className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:border-purple-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 leading-tight">{h.name}</h4>
                      {h.flatOrAddress && (
                        <span className="text-[11px] text-stone-500">{h.flatOrAddress}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(h)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteHousehold(h.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Members pill list */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                    {isHi ? 'सदस्य (Members):' : 'Members:'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {h.members.map((m, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aggregated Total & Drilldown */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block">
                    {isHi ? 'परिवार कुल संग्रह:' : 'Household Total:'}
                  </span>
                  <span className="font-black text-stone-900 font-mono text-sm">
                    {formatINR(totalCollected)}
                  </span>
                </div>

                <button
                  onClick={() => onViewHouseholdRecords(h.name)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition"
                >
                  {isHi ? 'प्रविष्टियां देखें' : 'View Records'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
