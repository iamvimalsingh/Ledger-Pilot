import React, { useState, useRef } from 'react';
import {
  Cpu,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
  RefreshCw,
  Eye,
  Zap,
  SplitSquareVertical,
  Award,
} from 'lucide-react';
import { executePaddleOCR, PaddleOCRResult, PaddleOCRRegion } from '../utils/paddleOcr';
import { executeLocalOCR, LocalOCRResult } from '../utils/localOcr';

export const PaddleOCRTestLab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // PaddleOCR State
  const [paddleResult, setPaddleResult] = useState<PaddleOCRResult | null>(null);
  const [isPaddleRunning, setIsPaddleRunning] = useState<boolean>(false);
  const [paddleStatusMsg, setPaddleStatusMsg] = useState<string>('');
  const [paddleError, setPaddleError] = useState<string | null>(null);

  // Tesseract State
  const [tesseractResult, setTesseractResult] = useState<LocalOCRResult | null>(null);
  const [isTesseractRunning, setIsTesseractRunning] = useState<boolean>(false);
  const [tesseractStatusMsg, setTesseractStatusMsg] = useState<string>('');
  const [tesseractError, setTesseractError] = useState<string | null>(null);

  // UI state
  const [selectedRegion, setSelectedRegion] = useState<PaddleOCRRegion | null>(null);
  const [showPolygons, setShowPolygons] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDisplayRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Reset results
      setPaddleResult(null);
      setTesseractResult(null);
      setPaddleError(null);
      setTesseractError(null);
      setSelectedRegion(null);
    }
  };

  // Run PaddleOCR
  const runPaddle = async () => {
    if (!selectedFile && !previewUrl) return;
    setIsPaddleRunning(true);
    setPaddleError(null);
    setPaddleStatusMsg('Initializing PaddleOCR (PP-OCRv5) in browser...');

    try {
      const target = selectedFile || previewUrl!;
      const res = await executePaddleOCR(target as any, (msg) => {
        setPaddleStatusMsg(msg);
      });
      setPaddleResult(res);
      setIsPaddleRunning(false);
      setPaddleStatusMsg('PaddleOCR completed.');
    } catch (err: any) {
      console.error('PaddleOCR error:', err);
      setIsPaddleRunning(false);
      setPaddleError(err?.message || 'PaddleOCR inference failed in this browser environment.');
    }
  };

  // Run Tesseract
  const runTesseract = async () => {
    if (!selectedFile && !previewUrl) return;
    setIsTesseractRunning(true);
    setTesseractError(null);
    setTesseractStatusMsg('Initializing Tesseract WASM (hin+eng)...');

    try {
      const target = selectedFile || previewUrl!;
      const res = await executeLocalOCR(target, (msg) => {
        setTesseractStatusMsg(msg);
      });
      setTesseractResult(res);
      setIsTesseractRunning(false);
      setTesseractStatusMsg('Tesseract completed.');
    } catch (err: any) {
      console.error('Tesseract error:', err);
      setIsTesseractRunning(false);
      setTesseractError(err?.message || 'Tesseract inference failed.');
    }
  };

  // Run Both for Same-Image Comparison
  const runBothEngines = async () => {
    await runPaddle();
    await runTesseract();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Step 2 Comparison Lab
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% In-Browser Local Inference
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" /> PaddleOCR vs Tesseract Benchmark Lab
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Evaluate PaddleOCR (PP-OCRv5 ONNX) against Tesseract on the exact same handwritten ledger scan with ZERO
            Gemini calls and ZERO external OCR APIs.
          </p>
        </div>

        {/* Zero Cost Proof Badges */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-950/80 p-3 rounded-xl border border-stone-800">
          <div className="text-center px-3 border-r border-stone-800">
            <p className="text-[10px] uppercase font-bold text-stone-400">Gemini Calls</p>
            <p className="text-lg font-black text-emerald-400">0</p>
          </div>
          <div className="text-center px-3 border-r border-stone-800">
            <p className="text-[10px] uppercase font-bold text-stone-400">Remote OCR APIs</p>
            <p className="text-lg font-black text-emerald-400">0</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] uppercase font-bold text-stone-400">Model Engine</p>
            <p className="text-xs font-bold text-indigo-300">PP-OCRv5 (Local)</p>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Real Browser Image Upload & Polygon Visualizer (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" /> 1. Upload Real Handwritten Image
              </h2>
              {selectedFile && (
                <span className="text-xs font-medium text-stone-500 truncate max-w-[200px]">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            {/* Hidden input */}
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
                className="border-2 border-dashed border-stone-300 hover:border-indigo-500 bg-stone-50 hover:bg-indigo-50/30 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800">
                    Select Real Handwritten Ledger Scan from Browser
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Passes browser File/Blob directly into PaddleOCR ONNX/WASM runtime
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 shadow-sm"
                >
                  Browse Real Image
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Control Bar */}
                <div className="flex items-center justify-between text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPolygons(!showPolygons)}
                      className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                        showPolygons
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          : 'bg-white text-stone-700 border border-stone-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> Polygon Overlays
                    </button>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 rounded-lg font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Change Image
                  </button>
                </div>

                {/* Visualizer Frame */}
                <div className="relative border border-stone-200 rounded-xl overflow-hidden bg-stone-100 max-h-[500px] flex items-center justify-center">
                  <img
                    ref={imageDisplayRef}
                    src={previewUrl}
                    alt="Ledger Scan"
                    className="max-h-[500px] w-auto object-contain select-none"
                  />

                  {/* PaddleOCR Polygons */}
                  {showPolygons && paddleResult && paddleResult.regions.length > 0 && imageDisplayRef.current && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${imageDisplayRef.current.naturalWidth || 800} ${
                        imageDisplayRef.current.naturalHeight || 1000
                      }`}
                    >
                      {paddleResult.regions.map((r, idx) => {
                        const isSelected = selectedRegion === r;
                        const pointsStr = r.poly
                          .map((p) => (Array.isArray(p) ? `${p[0]},${p[1]}` : `${(p as any).x},${(p as any).y}`))
                          .join(' ');
                        const firstPt = r.poly[0];
                        const textX = Array.isArray(firstPt) ? firstPt[0] : (firstPt as any)?.x || 0;
                        const textY = Array.isArray(firstPt) ? firstPt[1] : (firstPt as any)?.y || 0;

                        return (
                          <g key={idx}>
                            <polygon
                              points={pointsStr}
                              fill={isSelected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.2)'}
                              stroke={isSelected ? 'rgba(220, 38, 38, 0.9)' : 'rgba(79, 70, 229, 0.8)'}
                              strokeWidth={isSelected ? '2.5' : '1.5'}
                            />
                            {firstPt && (
                              <text
                                x={textX}
                                y={Math.max(12, textY - 4)}
                                fontSize="10"
                                fill={isSelected ? '#991b1b' : '#3730a3'}
                                fontWeight="bold"
                              >
                                #{idx + 1} ({Math.round(r.score * 100)}%)
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>

                {/* Benchmark Trigger Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={runPaddle}
                    disabled={isPaddleRunning}
                    className="py-3 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isPaddleRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="truncate max-w-[160px]">{paddleStatusMsg}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-indigo-200" />
                        Run Local PaddleOCR (PP-OCRv5)
                      </>
                    )}
                  </button>

                  <button
                    onClick={runBothEngines}
                    disabled={isPaddleRunning || isTesseractRunning}
                    className="py-3 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <SplitSquareVertical className="w-4 h-4 text-amber-400" />
                    Run Head-to-Head Comparison
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results, Metrics & Comparison Matrix (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Same-Image Head-to-Head Comparison Table */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" /> 2. Head-to-Head Benchmark (Same Image)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500">
                    <th className="pb-2 font-bold">Metric / Aspect</th>
                    <th className="pb-2 font-bold text-indigo-700">PaddleOCR (PP-OCRv5)</th>
                    <th className="pb-2 font-bold text-stone-700">Tesseract (hin+eng)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  <tr>
                    <td className="py-2 font-medium">Model Engine</td>
                    <td className="py-2 font-mono text-indigo-900 font-bold">DBNet + SVTR / PP-OCRv5</td>
                    <td className="py-2 font-mono text-stone-600">LSTM / Tesseract v5/v7</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Text Regions / Lines</td>
                    <td className="py-2 font-bold text-indigo-700">
                      {paddleResult ? `${paddleResult.regions.length} detected` : '—'}
                    </td>
                    <td className="py-2 font-bold text-stone-700">
                      {tesseractResult ? `${tesseractResult.lines.length} lines` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Amount Candidates</td>
                    <td className="py-2 font-bold text-emerald-700">
                      {paddleResult ? `${paddleResult.amountCandidates.length} numbers` : '—'}
                    </td>
                    <td className="py-2 font-bold text-emerald-700">
                      {tesseractResult ? `${tesseractResult.amountCandidates.length} numbers` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Hindi / Devanagari</td>
                    <td className="py-2 font-bold text-indigo-700">
                      {paddleResult ? `${paddleResult.devanagariWords.length} tokens` : '—'}
                    </td>
                    <td className="py-2 font-bold text-stone-700">
                      {tesseractResult ? `${tesseractResult.devanagariWords.length} tokens` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Estimated Row Groups</td>
                    <td className="py-2 font-bold text-purple-700">
                      {paddleResult?.estimatedRowCount !== null && paddleResult?.estimatedRowCount !== undefined
                        ? `${paddleResult.estimatedRowCount} rows`
                        : '—'}
                    </td>
                    <td className="py-2 font-bold text-purple-700">
                      {tesseractResult?.estimatedRowCount !== null && tesseractResult?.estimatedRowCount !== undefined
                        ? `${tesseractResult.estimatedRowCount} rows`
                        : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Inference Time</td>
                    <td className="py-2 font-bold text-blue-600">
                      {paddleResult ? `${paddleResult.totalInferenceTimeMs}ms` : '—'}
                    </td>
                    <td className="py-2 font-bold text-blue-600">
                      {tesseractResult ? `${tesseractResult.totalInferenceTimeMs}ms` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {paddleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                <span className="font-bold block">PaddleOCR Notice:</span>
                <p>{paddleError}</p>
              </div>
            )}
          </div>

          {/* PaddleOCR Raw Text & Regions */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> 3. PaddleOCR Output Stream
              </h2>
              {paddleResult && (
                <span className="text-[11px] text-stone-500 font-medium">
                  {paddleResult.regions.length} regions • Conf: {Math.round(paddleResult.confidence)}%
                </span>
              )}
            </div>

            <div className="bg-stone-900 text-stone-100 font-mono text-xs p-3.5 rounded-xl max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-stone-800">
              {paddleResult?.rawText || (
                <span className="text-stone-500 italic">
                  Upload an image and run PaddleOCR to view recognized text...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
