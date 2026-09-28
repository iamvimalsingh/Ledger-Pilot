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
  Search,
  Eye,
  Zap,
} from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface OCRBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface OCRWord {
  text: string;
  confidence: number;
  bbox: OCRBox;
}

interface OCRLine {
  text: string;
  confidence: number;
  bbox: OCRBox;
  words: OCRWord[];
}

interface PreprocessingOptions {
  grayscale: boolean;
  contrast: number; // 0 to 100
  binarize: boolean;
}

export const LocalOCRTestLab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const [ocrEngineStatus, setOcrEngineStatus] = useState<
    'idle' | 'initializing' | 'recognizing' | 'completed' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  // Performance metrics
  const [modelInitTimeMs, setModelInitTimeMs] = useState<number | null>(null);
  const [firstInferenceTimeMs, setFirstInferenceTimeMs] = useState<number | null>(null);
  const [totalInferenceTimeMs, setTotalInferenceTimeMs] = useState<number | null>(null);

  // Results
  const [rawText, setRawText] = useState<string>('');
  const [lines, setLines] = useState<OCRLine[]>([]);
  const [words, setWords] = useState<OCRWord[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<OCRLine | OCRWord | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  // Preprocessing
  const [options, setOptions] = useState<PreprocessingOptions>({
    grayscale: false,
    contrast: 0,
    binarize: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      setRawText('');
      setLines([]);
      setWords([]);
      setOcrEngineStatus('idle');
      setStatusMessage('');
      setProgress(0);
      setModelInitTimeMs(null);
      setFirstInferenceTimeMs(null);
      setTotalInferenceTimeMs(null);
    }
  };

  // Client-side image canvas preprocessing
  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      if (options.grayscale || options.contrast > 0 || options.binarize) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const contrastFactor = (259 * (options.contrast + 255)) / (255 * (259 - options.contrast));

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Grayscale luminance
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;

          // Contrast adjustment
          if (options.contrast > 0) {
            gray = contrastFactor * (gray - 128) + 128;
            gray = Math.max(0, Math.min(255, gray));
          }

          // Simple threshold binarization
          if (options.binarize) {
            gray = gray > 140 ? 255 : 0;
          }

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      setProcessedImageUrl(canvas.toDataURL('image/png'));
    };
    img.src = previewUrl;
  }, [previewUrl, options]);

  // Execute in-browser local OCR with zero network/Gemini calls
  const runLocalOCR = async () => {
    if (!processedImageUrl && !selectedFile) return;

    setOcrEngineStatus('initializing');
    setStatusMessage('Initializing in-browser WASM OCR worker (Local inference)...');
    setProgress(5);

    const initStart = performance.now();

    try {
      // Create local WASM worker with Hindi + English support
      const worker = await createWorker('hin+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrEngineStatus('recognizing');
            setStatusMessage(`Local recognition in progress: ${Math.round((m.progress || 0) * 100)}%`);
            setProgress(Math.round((m.progress || 0) * 100));
          } else {
            setStatusMessage(`Engine: ${m.status}`);
          }
        },
      });

      const initEnd = performance.now();
      const initDuration = Math.round(initEnd - initStart);
      setModelInitTimeMs(initDuration);

      setOcrEngineStatus('recognizing');
      setStatusMessage('Executing local neural character recognition on browser thread/worker...');

      const inferenceStart = performance.now();
      const imageSource = processedImageUrl || selectedFile;
      const ret = await worker.recognize(imageSource as any);
      const inferenceEnd = performance.now();

      const inferenceDuration = Math.round(inferenceEnd - inferenceStart);
      setFirstInferenceTimeMs(inferenceDuration);
      setTotalInferenceTimeMs(initDuration + inferenceDuration);

      // Extract raw data and geometry
      setRawText(ret.data.text || '');

      const extractedLines: OCRLine[] = [];
      const extractedWords: OCRWord[] = [];

      if (ret.data && (ret.data as any).lines) {
        for (const l of (ret.data as any).lines) {
          const lineObj: OCRLine = {
            text: l.text?.trim() || '',
            confidence: l.confidence || 0,
            bbox: l.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
            words: [],
          };

          if (l.words) {
            for (const w of l.words) {
              const wordObj: OCRWord = {
                text: w.text?.trim() || '',
                confidence: w.confidence || 0,
                bbox: w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
              };
              lineObj.words.push(wordObj);
              extractedWords.push(wordObj);
            }
          }

          if (lineObj.text) {
            extractedLines.push(lineObj);
          }
        }
      }

      setLines(extractedLines);
      setWords(extractedWords);

      await worker.terminate();

      setOcrEngineStatus('completed');
      setStatusMessage('Local OCR inference completed successfully.');
      setProgress(100);
    } catch (err: any) {
      console.error('Local OCR execution failed:', err);
      setOcrEngineStatus('error');
      setStatusMessage(`Local OCR error: ${err?.message || 'Inference failed'}`);
    }
  };

  // Table & Region Heuristics (Local analysis without AI)
  const amountCandidates = words.filter((w) => {
    const clean = w.text.replace(/[₹,./\-]/g, '').trim();
    return /^\d{2,7}$/.test(clean);
  });

  const devanagariWords = words.filter((w) => /[\u0900-\u097F]/.test(w.text));

  // Estimate likely row groups based on vertical position alignment (y-coordinate clustering)
  const rowGroupBuckets: { [bucketKey: number]: OCRLine[] } = {};
  lines.forEach((l) => {
    const centerY = Math.floor((l.bbox.y0 + l.bbox.y1) / 2 / 30) * 30; // 30px bucket
    if (!rowGroupBuckets[centerY]) rowGroupBuckets[centerY] = [];
    rowGroupBuckets[centerY].push(l);
  });
  const estimatedRowCount = Object.keys(rowGroupBuckets).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Experimental Lab • Step 1
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% In-Browser Local Inference
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-400" /> Local OCR Feasibility Test (Zero Gemini Calls)
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Directly test local WASM character & table recognition on real handwritten ledger images without
            transmitting image bytes to the cloud or incurring API costs.
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
            <p className="text-[10px] uppercase font-bold text-stone-400">Engine Type</p>
            <p className="text-xs font-bold text-amber-300">WASM / Local</p>
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
                        checked={options.grayscale}
                        onChange={(e) => setOptions({ ...options, grayscale: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      Grayscale
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={options.binarize}
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
                        value={options.contrast}
                        onChange={(e) => setOptions({ ...options, contrast: Number(e.target.value) })}
                        className="w-20 accent-amber-600"
                      />
                      <span className="text-[10px] text-stone-500">{options.contrast}%</span>
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
                <div className="relative border border-stone-200 rounded-xl overflow-hidden bg-stone-100 max-h-[600px] flex items-center justify-center">
                  <img
                    ref={imageDisplayRef}
                    src={processedImageUrl || previewUrl}
                    alt="Ledger Page"
                    className="max-h-[600px] w-auto object-contain select-none"
                  />

                  {/* Bounding box overlays */}
                  {showBoundingBoxes && lines.length > 0 && imageDisplayRef.current && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${imageDisplayRef.current.naturalWidth || 800} ${
                        imageDisplayRef.current.naturalHeight || 1000
                      }`}
                    >
                      {lines.map((l, idx) => (
                        <g key={idx}>
                          <rect
                            x={l.bbox.x0}
                            y={l.bbox.y0}
                            width={l.bbox.x1 - l.bbox.x0}
                            height={l.bbox.y1 - l.bbox.y0}
                            fill="rgba(245, 158, 11, 0.15)"
                            stroke="rgba(217, 119, 6, 0.8)"
                            strokeWidth="1.5"
                          />
                          <text
                            x={l.bbox.x0}
                            y={Math.max(12, l.bbox.y0 - 4)}
                            fontSize="10"
                            fill="#b45309"
                            fontWeight="bold"
                          >
                            #{idx + 1} ({Math.round(l.confidence)}%)
                          </text>
                        </g>
                      ))}
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
                  {modelInitTimeMs !== null ? `${modelInitTimeMs}ms` : '—'}
                </p>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                <p className="text-[10px] text-stone-500 font-bold uppercase">Inference</p>
                <p className="text-sm font-black text-stone-900">
                  {firstInferenceTimeMs !== null ? `${firstInferenceTimeMs}ms` : '—'}
                </p>
              </div>
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
                <p className="text-[10px] text-stone-500 font-bold uppercase">Total Time</p>
                <p className="text-sm font-black text-blue-600">
                  {totalInferenceTimeMs !== null ? `${totalInferenceTimeMs}ms` : '—'}
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
              <Layers className="w-4 h-4 text-purple-600" /> 3. Structural Table Analysis (Local)
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Detected Text Lines</p>
                <p className="text-lg font-bold text-purple-900">{lines.length}</p>
              </div>
              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Estimated Row Groups</p>
                <p className="text-lg font-bold text-purple-900">{estimatedRowCount}</p>
              </div>
              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Amount Candidates</p>
                <p className="text-lg font-bold text-purple-900">{amountCandidates.length}</p>
              </div>
              <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                <p className="text-stone-500 font-medium">Hindi / Devanagari Regions</p>
                <p className="text-lg font-bold text-purple-900">{devanagariWords.length}</p>
              </div>
            </div>

            {/* Amount Candidates Preview */}
            {amountCandidates.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <p className="text-[11px] font-bold text-stone-700 uppercase mb-1.5">
                  Detected Numeric Candidates:
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

          {/* Raw OCR Text Output */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-stone-700" /> 4. Raw OCR Text Output
              </h2>
              <span className="text-[11px] text-stone-500 font-medium">{words.length} tokens</span>
            </div>

            <div className="bg-stone-900 text-stone-100 font-mono text-xs p-3.5 rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
              {rawText || (
                <span className="text-stone-500 italic">
                  Upload an image and click "Run Local OCR" to view raw extracted text...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
