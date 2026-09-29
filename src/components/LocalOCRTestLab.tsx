import React, { useState, useRef, useEffect } from 'react';
import {
  Cpu,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  RefreshCw,
  Eye,
  Zap,
  Table,
  ListOrdered,
  Maximize2,
} from 'lucide-react';
import {
  OCRLine,
  OCRWord,
  OCRBlock,
  LocalOCRResult,
  PreprocessingOptions,
  preprocessImageLocally,
  executeLocalOCR,
} from '../utils/localOcr';

export const LocalOCRTestLab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const [ocrEngineStatus, setOcrEngineStatus] = useState<
    'idle' | 'initializing' | 'recognizing' | 'completed' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // Performance & Results
  const [ocrResult, setOcrResult] = useState<LocalOCRResult | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'raw' | 'structured' | 'tokens'>('raw');
  const [selectedItem, setSelectedItem] = useState<OCRLine | OCRWord | null>(null);

  // Preprocessing
  const [options, setOptions] = useState<PreprocessingOptions>({
    grayscale: false,
    contrast: 0,
    binarize: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDisplayRef = useRef<HTMLImageElement>(null);

  // Handle file selection from browser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setProcessedImageUrl(url);
      // Reset previous OCR results
      setOcrResult(null);
      setSelectedItem(null);
      setOcrEngineStatus('idle');
      setStatusMessage('');
      setProgress(0);
    }
  };

  // Client-side image canvas preprocessing
  useEffect(() => {
    if (!previewUrl) return;
    preprocessImageLocally(previewUrl, options).then((url) => {
      setProcessedImageUrl(url);
    });
  }, [previewUrl, options]);

  // Execute in-browser local OCR with zero network/Gemini calls
  const runLocalOCR = async () => {
    const targetSource = processedImageUrl || previewUrl || selectedFile;
    if (!targetSource) return;

    setOcrEngineStatus('initializing');
    setStatusMessage('Initializing in-browser WASM OCR worker (Local inference)...');
    setProgress(5);

    try {
      const res = await executeLocalOCR(targetSource, (msg, pct) => {
        setStatusMessage(msg);
        setProgress(pct);
        if (pct > 15) setOcrEngineStatus('recognizing');
      });

      setOcrResult(res);
      setOcrEngineStatus('completed');
      setStatusMessage('Local OCR inference completed successfully.');
      setProgress(100);
    } catch (err: any) {
      console.error('Local OCR execution failed:', err);
      setOcrEngineStatus('error');
      setStatusMessage(`Local OCR error: ${err?.message || 'Inference failed'}`);
    }
  };

  const blocks = ocrResult?.blocks || [];
  const lines = ocrResult?.lines || [];
  const words = ocrResult?.words || [];
  const amountCandidates = ocrResult?.amountCandidates || [];
  const devanagariWords = ocrResult?.devanagariWords || [];
  const latinWords = ocrResult?.latinWords || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Diagnostic Lab • Step 1
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% In-Browser Local Inference
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-400" /> Local OCR Diagnostic & Parsing Lab
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Inspect in-depth character tokens, bounding boxes, row alignment, and numeric candidates from Tesseract
            WASM with zero Gemini API calls.
          </p>
        </div>

        {/* Zero Cost Proof Badges */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-950/80 p-3 rounded-xl border border-stone-800">
          <div className="text-center px-3 border-r border-stone-800">
            <p className="text-[10px] uppercase font-bold text-stone-400">Gemini Calls</p>
            <p className="text-lg font-black text-emerald-400">0</p>
          </div>
          <div className="text-center px-3 border-r border-stone-800">
            <p className="text-[10px] uppercase font-bold text-stone-400">External APIs</p>
            <p className="text-lg font-black text-emerald-400">0</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] uppercase font-bold text-stone-400">Engine</p>
            <p className="text-xs font-bold text-amber-300">WASM hin+eng</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Image Viewer vs OCR Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Image (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" /> 1. Upload Real Handwritten Document
              </h2>
              {selectedFile && (
                <span className="text-xs font-medium text-stone-500 truncate max-w-[200px]">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {/* Upload Zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/40 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800">
                    Select Real Handwritten Ledger Image from Browser
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Supports JPG, JPEG, PNG, WEBP • Stays strictly in client browser
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 shadow-sm"
                >
                  Browse Image File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preprocessing Controls */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={options.grayscale || false}
                        onChange={(e) => setOptions({ ...options, grayscale: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      Grayscale
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={options.binarize || false}
                        onChange={(e) => setOptions({ ...options, binarize: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      Threshold Binarize
                    </label>

                    <label className="flex items-center gap-1.5 font-medium text-stone-700">
                      <span>Contrast:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={options.contrast || 0}
                        onChange={(e) => setOptions({ ...options, contrast: Number(e.target.value) })}
                        className="w-20 accent-amber-600"
                      />
                      <span className="text-[10px] text-stone-500">{options.contrast || 0}%</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 transition ${
                        showBoundingBoxes
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-white text-stone-700 border border-stone-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Bounding Boxes
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 rounded-lg font-medium text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Change File
                    </button>
                  </div>
                </div>

                {/* Image Preview with Bounding Box Overlay */}
                <div className="relative border border-stone-200 rounded-xl overflow-hidden bg-stone-100 max-h-[550px] flex items-center justify-center">
                  <img
                    ref={imageDisplayRef}
                    src={processedImageUrl || previewUrl}
                    alt="Ledger Page"
                    className="max-h-[550px] w-auto object-contain select-none"
                  />

                  {/* Bounding box overlays */}
                  {showBoundingBoxes && lines.length > 0 && imageDisplayRef.current && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${imageDisplayRef.current.naturalWidth || 800} ${
                        imageDisplayRef.current.naturalHeight || 1000
                      }`}
                    >
                      {lines.map((l, idx) => {
                        if (!l.bbox) return null;
                        const isSelected = selectedItem === l;
                        return (
                          <g key={idx}>
                            <rect
                              x={l.bbox.x0}
                              y={l.bbox.y0}
                              width={Math.max(1, l.bbox.x1 - l.bbox.x0)}
                              height={Math.max(1, l.bbox.y1 - l.bbox.y0)}
                              fill={isSelected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.15)'}
                              stroke={isSelected ? 'rgba(220, 38, 38, 0.9)' : 'rgba(217, 119, 6, 0.8)'}
                              strokeWidth={isSelected ? '2.5' : '1.5'}
                            />
                            <text
                              x={l.bbox.x0}
                              y={Math.max(12, l.bbox.y0 - 4)}
                              fontSize="10"
                              fill={isSelected ? '#991b1b' : '#b45309'}
                              fontWeight="bold"
                            >
                              #{idx + 1} ({Math.round(l.confidence)}%)
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>

                {/* Trigger OCR Action */}
                <button
                  onClick={runLocalOCR}
                  disabled={ocrEngineStatus === 'initializing' || ocrEngineStatus === 'recognizing'}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {ocrEngineStatus === 'initializing' || ocrEngineStatus === 'recognizing' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {statusMessage}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-200" />
                      Run 100% Local In-Browser OCR (hin+eng)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: OCR Results & Table Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Performance & Execution Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> 2. Local Performance Metrics
            </h2>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                <p className="text-[10px] text-stone-500 font-bold uppercase">Model Init</p>
                <p className="text-sm font-black text-stone-900">
                  {ocrResult?.modelInitTimeMs !== undefined ? `${ocrResult.modelInitTimeMs}ms` : '—'}
                </p>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                <p className="text-[10px] text-stone-500 font-bold uppercase">Inference</p>
                <p className="text-sm font-black text-stone-900">
                  {ocrResult?.firstInferenceTimeMs !== undefined ? `${ocrResult.firstInferenceTimeMs}ms` : '—'}
                </p>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                <p className="text-[10px] text-stone-500 font-bold uppercase">Total Time</p>
                <p className="text-sm font-black text-blue-600">
                  {ocrResult?.totalInferenceTimeMs !== undefined ? `${ocrResult.totalInferenceTimeMs}ms` : '—'}
                </p>
              </div>
            </div>

            {ocrEngineStatus !== 'idle' && (
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                <span className="text-stone-600 font-medium truncate max-w-[240px]">{statusMessage}</span>
                {ocrEngineStatus === 'completed' && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Table Heuristics / Semantic Candidates */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" /> 3. Structural Metrics (Parsed from Tesseract)
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Detected Blocks</p>
                <p className="text-base font-bold text-purple-900">
                  {ocrResult ? blocks.length : 'Unavailable from current OCR output'}
                </p>
              </div>

              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Detected Lines</p>
                <p className="text-base font-bold text-purple-900">
                  {ocrResult ? lines.length : 'Unavailable from current OCR output'}
                </p>
              </div>

              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Detected Words</p>
                <p className="text-base font-bold text-purple-900">
                  {ocrResult ? words.length : 'Unavailable from current OCR output'}
                </p>
              </div>

              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Estimated Row Groups</p>
                <p className="text-base font-bold text-purple-900">
                  {ocrResult?.estimatedRowCount !== null && ocrResult?.estimatedRowCount !== undefined
                    ? `${ocrResult.estimatedRowCount} groups`
                    : 'Unavailable (bounding coordinates missing)'}
                </p>
              </div>

              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Amount Candidates</p>
                <p className="text-base font-bold text-purple-900">
                  {ocrResult ? amountCandidates.length : 'Unavailable from current OCR output'}
                </p>
              </div>

              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Hindi/Devanagari Words</p>
                <p className="text-base font-bold text-purple-900">
                  {ocrResult ? devanagariWords.length : 'Unavailable from current OCR output'}
                </p>
              </div>
            </div>

            {/* Amount Candidates Preview */}
            {amountCandidates.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <p className="text-[11px] font-bold text-stone-700 uppercase mb-1.5">
                  Actual Numeric Candidates Found ({amountCandidates.length}):
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {amountCandidates.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-mono font-bold"
                    >
                      {c.text} ({Math.round(c.confidence)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* OCR Result View (Toggle Raw vs Structured Regions) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-700" /> 4. OCR Output Inspection
              </h2>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setViewMode('raw')}
                  className={`px-2 py-1 rounded-md font-medium transition ${
                    viewMode === 'raw' ? 'bg-white font-bold shadow-2xs text-stone-900' : 'text-stone-600'
                  }`}
                >
                  Raw Text
                </button>
                <button
                  onClick={() => setViewMode('structured')}
                  className={`px-2 py-1 rounded-md font-medium transition ${
                    viewMode === 'structured'
                      ? 'bg-white font-bold shadow-2xs text-stone-900'
                      : 'text-stone-600'
                  }`}
                >
                  Lines ({lines.length})
                </button>
                <button
                  onClick={() => setViewMode('tokens')}
                  className={`px-2 py-1 rounded-md font-medium transition ${
                    viewMode === 'tokens'
                      ? 'bg-white font-bold shadow-2xs text-stone-900'
                      : 'text-stone-600'
                  }`}
                >
                  Tokens ({words.length})
                </button>
              </div>
            </div>

            {/* View Mode: RAW TEXT */}
            {viewMode === 'raw' && (
              <div className="bg-stone-900 text-stone-100 font-mono text-xs p-3.5 rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
                {ocrResult?.rawText || (
                  <span className="text-stone-500 italic">
                    Upload an image and click "Run Local OCR" to view raw extracted text...
                  </span>
                )}
              </div>
            )}

            {/* View Mode: STRUCTURED LINES & BOUNDING BOX DATA */}
            {viewMode === 'structured' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {lines.length === 0 ? (
                  <p className="text-xs text-stone-500 italic p-3 text-center">
                    No structured lines available yet.
                  </p>
                ) : (
                  lines.map((l, idx) => {
                    const isSelected = selectedItem === l;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedItem(l)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isSelected
                            ? 'bg-amber-50 border-amber-400'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold text-stone-900 mb-1">
                          <span className="text-amber-800">Line #{idx + 1}</span>
                          <span className="text-stone-500 text-[10px]">
                            Conf: {Math.round(l.confidence)}%
                          </span>
                        </div>
                        <p className="font-sans text-stone-800 font-medium">{l.text}</p>
                        {l.bbox && (
                          <p className="text-[10px] text-stone-500 font-mono mt-1">
                            bbox: x={l.bbox.x0}, y={l.bbox.y0}, w={l.bbox.x1 - l.bbox.x0}, h=
                            {l.bbox.y1 - l.bbox.y0}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* View Mode: TOKEN CHUNKS */}
            {viewMode === 'tokens' && (
              <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto p-1">
                {words.length === 0 ? (
                  <p className="text-xs text-stone-500 italic p-3 text-center">
                    No tokens available yet.
                  </p>
                ) : (
                  words.map((w, idx) => {
                    const isDevanagari = /[\u0900-\u097F]/.test(w.text);
                    const isNumeric = /^\d+$/.test(w.text.replace(/[₹,./\-]/g, ''));
                    return (
                      <span
                        key={idx}
                        title={`Conf: ${Math.round(w.confidence)}% ${
                          w.bbox
                            ? `(x:${w.bbox.x0}, y:${w.bbox.y0}, w:${w.bbox.x1 - w.bbox.x0}, h:${
                                w.bbox.y1 - w.bbox.y0
                              })`
                            : ''
                        }`}
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          isNumeric
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-mono font-bold'
                            : isDevanagari
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-stone-50 text-stone-800 border-stone-200 font-mono'
                        }`}
                      >
                        {w.text} <span className="text-[9px] text-stone-400">({Math.round(w.confidence)}%)</span>
                      </span>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
