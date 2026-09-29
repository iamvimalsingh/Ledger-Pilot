import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Cpu,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  BookOpen,
  Eye,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  Zap,
  Award,
  ArrowRight,
  TrendingDown,
  Settings2,
} from 'lucide-react';
import { LedgerSettings, AIBudgetStats } from '../types/ledger';
import { generateHandwrittenLedgerSVG } from '../utils/sampleData';

interface UploadQueueItem {
  id: string;
  file?: File;
  previewUrl: string;
  fileName: string;
  pageNumber: number;
}

interface UploadCaptureProps {
  onStartLocalExtraction: (
    items: Array<{ previewUrl: string; fileName: string; pageNumber: number; file?: File }>
  ) => Promise<{ success: boolean; error?: string; count?: number } | void>;
  onStartGeminiExtraction?: (
    items: Array<{ previewUrl: string; fileName: string; pageNumber: number }>
  ) => Promise<{ success: boolean; error?: string; count?: number } | void>;
  isExtracting: boolean;
  settings: LedgerSettings;
  language: 'hi' | 'en';
  aiBudgetStats?: AIBudgetStats;
  onUpdateSettings?: (newSettings: LedgerSettings) => void;
}

export const UploadCapture: React.FC<UploadCaptureProps> = ({
  onStartLocalExtraction,
  onStartGeminiExtraction,
  isExtracting,
  settings,
  language,
  aiBudgetStats = {
    pagesProcessed: 0,
    totalRows: 0,
    localOnlyRows: 0,
    aiAssistedRows: 0,
    geminiRequests: 0,
  },
  onUpdateSettings,
}) => {
  const isHi = language === 'hi';
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [extractMode, setExtractMode] = useState<'LOCAL_FIRST' | 'GEMINI'>('LOCAL_FIRST');
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setExtractionNotice(null);

    const startIndex = queue.length + 1;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setQueue((prev) => [
          ...prev,
          {
            id: `upload-${Date.now()}-${Math.random()}`,
            file,
            previewUrl,
            fileName: file.name,
            pageNumber: startIndex + idx,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLoadSamplePage = (sampleType: 'colony' | 'school') => {
    setErrorMessage(null);
    setExtractionNotice(null);

    const dataUrl = generateHandwrittenLedgerSVG(sampleType);
    const newPageNum = queue.length + 1;
    const sampleItem: UploadQueueItem = {
      id: `sample-${Date.now()}-${Math.random()}`,
      previewUrl: dataUrl,
      fileName:
        sampleType === 'colony'
          ? `Demo_Ledger_Page${newPageNum}.svg`
          : `School_Donation_Register_Page${newPageNum}.svg`,
      pageNumber: newPageNum,
    };
    setQueue((prev) => [...prev, sampleItem]);
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    if (queue.length <= 1) {
      setErrorMessage(null);
      setExtractionNotice(null);
    }
  };

  const handlePageNumberChange = (id: string, newPage: number) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pageNumber: Math.max(1, newPage) } : item))
    );
  };

  // Primary: Local-First Pipeline (0 Gemini calls)
  const handleExecuteLocalFirst = async () => {
    if (queue.length === 0) return;
    setErrorMessage(null);
    setExtractionNotice(null);

    try {
      const outcome = await onStartLocalExtraction(
        queue.map((q) => ({
          previewUrl: q.previewUrl,
          fileName: q.fileName,
          pageNumber: q.pageNumber,
          file: q.file,
        }))
      );

      if (outcome && outcome.success === false) {
        setErrorMessage(outcome.error || 'Local extraction encountered an issue.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Local extraction failed.');
    }
  };

  // Optional: Gemini Cloud AI Assist
  const handleExecuteGemini = async () => {
    if (!onStartGeminiExtraction || queue.length === 0) return;
    setErrorMessage(null);
    setExtractionNotice(null);

    try {
      const outcome = await onStartGeminiExtraction(
        queue.map((q) => ({
          previewUrl: q.previewUrl,
          fileName: q.fileName,
          pageNumber: q.pageNumber,
        }))
      );

      if (outcome && outcome.success === false) {
        // Safe non-blocking Gemini failure handling
        setExtractionNotice(
          isHi
            ? 'AI सहायता उपलब्ध नहीं है — स्थानीय प्रोसेसिंग जारी है।'
            : 'AI Assist unavailable — continuing with local-first processing.'
        );
      }
    } catch (err: any) {
      setExtractionNotice(
        isHi
          ? 'AI सहायता उपलब्ध नहीं है — स्थानीय प्रोसेसिंग जारी है।'
          : 'AI Assist unavailable — continuing with local-first processing.'
      );
    }
  };

  const aiUtilizationPct =
    aiBudgetStats.totalRows > 0
      ? Math.round((aiBudgetStats.aiAssistedRows / aiBudgetStats.totalRows) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-12 space-y-6">
      {/* 3-Step Workflow Banner */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-md border border-stone-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Local-First Architecture Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Zero Mandatory Cloud AI
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-emerald-400" />
              {isHi ? 'लोकल-फर्स्ट लेजर निष्कर्षण' : 'Local-First Ledger Pipeline'}
            </h1>
            <p className="text-xs text-stone-400 mt-1 max-w-2xl">
              {isHi
                ? 'दस्तावेज़ सीधे आपके ब्राउज़र में PaddleOCR द्वारा प्रोसेस होते हैं। क्लाउड AI (Gemini) केवल कठिन अस्पष्ट पंक्तियों के लिए वैकल्पिक है।'
                : 'Documents are processed locally in your browser with PaddleOCR. Cloud AI (Gemini) is strictly optional for ambiguous rows.'}
            </p>
          </div>

          {/* AI Usage & Cost Counters */}
          <div className="flex flex-wrap items-center gap-2 bg-stone-950/90 p-3 rounded-xl border border-stone-800 text-center">
            <div className="px-2.5 border-r border-stone-800">
              <p className="text-[10px] text-stone-400 font-bold uppercase">Total Rows</p>
              <p className="text-sm font-black text-white">{aiBudgetStats.totalRows}</p>
            </div>
            <div className="px-2.5 border-r border-stone-800">
              <p className="text-[10px] text-emerald-400 font-bold uppercase">Local-Only</p>
              <p className="text-sm font-black text-emerald-400">{aiBudgetStats.localOnlyRows}</p>
            </div>
            <div className="px-2.5 border-r border-stone-800">
              <p className="text-[10px] text-amber-400 font-bold uppercase">AI Calls</p>
              <p className="text-sm font-black text-amber-400">{aiBudgetStats.geminiRequests}</p>
            </div>
            <div className="px-2.5">
              <p className="text-[10px] text-blue-400 font-bold uppercase">AI Ratio</p>
              <p className="text-sm font-black text-blue-400">{aiUtilizationPct}%</p>
            </div>
          </div>
        </div>

        {/* 3 Steps Pipeline Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
          <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <p className="font-bold text-white">{isHi ? 'चरण 1: लोकल OCR' : 'Step 1: Local OCR'}</p>
              <p className="text-[11px] text-stone-400">
                {isHi ? 'ब्राउज़र में रेखांकन एवं संख्या पहचान' : 'In-browser polygon & number extraction'}
              </p>
            </div>
          </div>

          <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <p className="font-bold text-white">{isHi ? 'चरण 2: मानव समीक्षा' : 'Step 2: Human Review'}</p>
              <p className="text-[11px] text-stone-400">
                {isHi ? 'सत्यापन और अपवाद निवारण' : 'Deterministic math & exception check'}
              </p>
            </div>
          </div>

          <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <p className="font-bold text-white">{isHi ? 'वैकल्पिक: AI Assist' : 'Optional: AI Assist'}</p>
              <p className="text-[11px] text-stone-400">
                {isHi ? 'केवल अनसुलझी पंक्तियों हेतु' : 'Batch assistance for doubt rows'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload / Camera Dropzone Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Camera Capture Card */}
        <div
          onClick={() => cameraInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col items-center justify-center min-h-[140px] shadow-xs group"
        >
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-2.5 group-hover:bg-emerald-700 transition shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <span className="font-bold text-base text-stone-900 block">
            {isHi ? '📷 फोटो खीचें (Camera)' : '📷 Take Photo with Camera'}
          </span>
          <span className="text-xs text-stone-500 mt-0.5">
            {isHi ? 'मोबाइल कैमरे से सीधे पन्ना स्कैन करें' : 'Scan page directly using phone camera'}
          </span>
        </div>

        {/* Gallery / File Upload Card */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col items-center justify-center min-h-[140px] shadow-xs group ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-stone-300 bg-stone-50/60 hover:bg-stone-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="w-12 h-12 rounded-2xl bg-stone-800 text-white flex items-center justify-center mb-2.5 group-hover:bg-stone-900 transition shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <span className="font-bold text-base text-stone-900 block">
            {isHi ? '📤 गैलरी से चुनें (Upload Files)' : '📤 Upload from Gallery / Files'}
          </span>
          <span className="text-xs text-stone-500 mt-0.5">
            {isHi ? 'JPG, PNG, WEBP पन्नों की फोटो चुनें' : 'Select JPG, PNG, WEBP ledger photos'}
          </span>
        </div>
      </div>

      {/* Demo / Sample Test Ledger Option */}
      <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">
              {isHi ? 'नमूना लेजर (डेमो परीक्षण)' : 'Test with Sample Ledger (Demo)'}
            </h4>
            <p className="text-[11px] text-stone-600">
              {isHi
                ? 'यदि वास्तविक पन्ना उपलब्ध न हो, तो डेमो रजिस्टर से तुरंत पाइपलाइन जांचें।'
                : 'Instantly test workflow with pre-built handwritten sample registers.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleLoadSamplePage('colony')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 shadow-2xs transition"
          >
            {isHi ? 'नमूना लेजर (डेमो)' : 'Sample Ledger'}
          </button>
          <button
            onClick={() => handleLoadSamplePage('school')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 shadow-2xs transition"
          >
            {isHi ? 'स्कूल लेजर (डेमो)' : 'School Ledger'}
          </button>
        </div>
      </div>

      {/* Selected Queue & Action Buttons */}
      {queue.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <span>{isHi ? 'प्रोसेसिंग हेतु तैयार पन्ने' : 'Pages Ready for Local Processing'}</span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {queue.length} {isHi ? 'पन्ने' : 'pages'}
              </span>
            </h3>
            <button
              onClick={() => {
                setQueue([]);
                setErrorMessage(null);
                setExtractionNotice(null);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              {isHi ? 'सभी हटाएं' : 'Clear All'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="relative rounded-xl border border-stone-200 bg-stone-50 overflow-hidden group"
              >
                <div className="h-32 bg-stone-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.previewUrl}
                    alt={`Page preview ${item.pageNumber}`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-2 bg-white flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-stone-500">
                      {isHi ? 'पेज:' : 'Pg:'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={item.pageNumber}
                      onChange={(e) => handlePageNumberChange(item.id, Number(e.target.value))}
                      className="w-10 px-1 py-0.5 text-xs font-bold text-center border border-stone-300 rounded"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Non-blocking Notice or Error */}
          {extractionNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{isHi ? 'सूचना:' : 'Notice:'}</span>
                <p className="mt-0.5">{extractionNotice}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{isHi ? 'त्रुटि:' : 'Error:'}</span>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* PRIMARY LOCAL-FIRST ACTION */}
          <div className="pt-2 space-y-2">
            <button
              disabled={isExtracting}
              onClick={handleExecuteLocalFirst}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isHi ? 'लोकल OCR द्वारा विश्लेषण जारी है...' : 'Running Local OCR Extraction...'}
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-emerald-200" />
                  <div className="text-center">
                    <span className="text-sm font-bold block">
                      {isHi ? '⚡ स्थानीय OCR से निकालें (Local First)' : '⚡ Extract with Local OCR (Local First)'}
                    </span>
                    <span className="text-[10px] text-emerald-100 font-normal">
                      {isHi
                        ? '100% ब्राउज़र में ऑफलाइन • 0 Gemini API कॉल्स'
                        : '100% In-browser PaddleOCR • 0 Gemini API calls'}
                    </span>
                  </div>
                </>
              )}
            </button>

            {/* Optional Gemini Cloud AI Button */}
            {onStartGeminiExtraction && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={handleExecuteGemini}
                  className="text-xs text-stone-500 hover:text-stone-800 underline font-medium transition inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {isHi
                      ? 'वैकल्पिक: पूर्ण पृष्ठ क्लाउड AI (Gemini) से निकालें'
                      : 'Optional: Extract full page with Cloud AI (Gemini)'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Safety Notice & Accounting Gate */}
      <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-700 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-stone-900 block mb-0.5">
            {isHi ? 'सत्यापित लेजर सुरक्षा सिद्धांत:' : 'Verified Ledger Safety Principle:'}
          </span>
          <p className="leading-relaxed">
            {isHi
              ? 'लोकल OCR अथवा AI द्वारा निकाले गए उम्मीदवार रिकॉर्ड कभी भी सीधे सत्यापित (verified: true) नहीं बनते। प्रत्येक प्रविष्टि को आपके द्वारा समीक्षा (Review) और पुष्टि करने के बाद ही मुख्य बहीखाते में जोड़ा जाता है।'
              : 'Neither Local OCR nor Gemini can silently create verified records. Extracted candidate rows remain unverified until human review and confirmation.'}
          </p>
        </div>
      </div>
    </div>
  );
};
