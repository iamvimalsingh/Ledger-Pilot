import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  FileImage,
  Trash2,
  CheckCircle2,
  FileQuestion,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  BookOpen,
} from 'lucide-react';
import { LedgerSettings } from '../types/ledger';
import { generateHandwrittenLedgerSVG } from '../utils/sampleData';

interface UploadQueueItem {
  id: string;
  file?: File;
  previewUrl: string;
  fileName: string;
  pageNumber: number;
}

interface UploadCaptureProps {
  onStartExtraction: (items: Array<{ previewUrl: string; fileName: string; pageNumber: number }>) => Promise<void>;
  isExtracting: boolean;
  settings: LedgerSettings;
  language: 'hi' | 'en';
}

export const UploadCapture: React.FC<UploadCaptureProps> = ({
  onStartExtraction,
  isExtracting,
  settings,
  language,
}) => {
  const isHi = language === 'hi';
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = [];
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
  };

  const handlePageNumberChange = (id: string, newPage: number) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pageNumber: Math.max(1, newPage) } : item))
    );
  };

  const handleSubmit = async () => {
    if (queue.length === 0) return;
    await onStartExtraction(
      queue.map((q) => ({
        previewUrl: q.previewUrl,
        fileName: q.fileName,
        pageNumber: q.pageNumber,
      }))
    );
    setQueue([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Intro Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 bg-amber-100/80 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>{isHi ? 'Gemini मल्टीमॉडल दृष्टि AI' : 'Gemini Multimodal Vision AI'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          {isHi ? 'हस्तलिखित पन्नों की फोटो लें या अपलोड करें' : 'Capture or Upload Handwritten Pages'}
        </h2>
        <p className="text-sm text-stone-600 max-w-xl mx-auto mt-1.5">
          {isHi
            ? 'डायरी, लेजर रजिस्टर, रसीद बुक या नकद संग्रह पर्चियों की साफ फोटो अपलोड करें। AI नाम, राशि, मोड और विवरण निकालेगा।'
            : 'Upload photos of diaries, donation registers, receipt books, or collection slips. AI extracts names, amounts, payment modes, and notes.'}
        </p>
      </div>

      {/* Main Upload / Camera Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        {/* Camera Capture Card */}
        <div
          onClick={() => cameraInputRef.current?.click()}
          className="border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col items-center justify-center min-h-[150px] shadow-xs group"
        >
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className="w-13 h-13 rounded-2xl bg-amber-600 text-white flex items-center justify-center mb-3 group-hover:bg-amber-700 transition shadow-sm">
            <Camera className="w-7 h-7" />
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
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col items-center justify-center min-h-[150px] shadow-xs group ${
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
          <div className="w-13 h-13 rounded-2xl bg-stone-800 text-white flex items-center justify-center mb-3 group-hover:bg-stone-900 transition shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <span className="font-bold text-base text-stone-900 block">
            {isHi ? '📤 गैलरी से चुनें (Upload Files)' : '📤 Upload from Gallery / Files'}
          </span>
          <span className="text-xs text-stone-500 mt-0.5">
            {isHi ? 'एक या एक से अधिक पन्नों की फोटो अपलोड करें' : 'Upload one or multiple photos at once'}
          </span>
        </div>
      </div>

      {/* Instant Demo Sample Ledger Button */}
      <div className="mb-6 p-4 rounded-2xl bg-stone-100 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              {isHi ? 'तुरंत परीक्षण करें (Try Instant Sample Ledger)' : 'Test with Sample Handwritten Ledger'}
            </h4>
            <p className="text-xs text-stone-600">
              {isHi
                ? 'यदि आपके पास अभी कोई हस्तलिखित कॉपी नहीं है, तो हमारे नमूना लेजर रजिस्टर से तुरंत टेस्ट करें।'
                : 'No document right now? Load authentic handwritten sample register with 1-click.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleLoadSamplePage('colony')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 shadow-2xs transition"
          >
            {isHi ? 'नमूना लेजर (डेमो)' : 'Sample Ledger (Demo)'}
          </button>
          <button
            onClick={() => handleLoadSamplePage('school')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 shadow-2xs transition"
          >
            {isHi ? 'स्कूल लेजर (डेमो)' : 'School Ledger (Demo)'}
          </button>
        </div>
      </div>

      {/* Upload Queue Section */}
      {queue.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <span>{isHi ? 'विश्लेषण हेतु चयनित पन्ने' : 'Pages Ready for Analysis'}</span>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {queue.length} {isHi ? 'पन्ने' : 'pages'}
              </span>
            </h3>
            <button
              onClick={() => setQueue([])}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              {isHi ? 'सभी हटाएं' : 'Clear All'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-5">
            {queue.map((item, index) => (
              <div
                key={item.id}
                className="relative rounded-xl border border-stone-200 bg-stone-50 overflow-hidden group"
              >
                <div className="h-36 bg-stone-200 flex items-center justify-center overflow-hidden">
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

          {/* Primary AI Extract Button */}
          <button
            disabled={isExtracting}
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl font-bold text-base bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isHi ? 'AI लिखावट का विश्लेषण कर रहा है...' : 'AI Extracting Ledger Records...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {isHi
                    ? `🤖 हिसाब पढ़ें (${queue.length} पन्ने AI द्वारा स्कैन करें)`
                    : `🤖 Extract Ledger Records (${queue.length} pages)`}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Safety Notice & Extraction Guidelines */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">
            {isHi ? 'लेखा सुरक्षा सिद्धांत (Accounting Safety Principle):' : 'Accounting Safety Principle:'}
          </span>
          <p className="text-amber-800/90 leading-relaxed">
            {isHi
              ? 'AI केवल एक सहायक है। AI द्वारा निकाला गया डेटा सीधे सत्यापित नहीं माना जाता। आपके द्वारा समीक्षा (Review) और पुष्टि करने के बाद ही यह स्थायी सत्यापित लेजर बनता है।'
              : 'AI is an assistant. Extracted records do not silently enter the verified accounting books until you inspect, edit if needed, and give explicit confirmation.'}
          </p>
        </div>
      </div>
    </div>
  );
};
