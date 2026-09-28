import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Scale,
  Edit2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SourceDocument, ExtractedRecord } from '../types/ledger';
import { formatINR, validatePageTotalMath } from '../utils/reconciliation';

interface SourceImageViewerProps {
  documents: SourceDocument[];
  currentDocId: string | null;
  highlightRecordId?: string | null;
  records: ExtractedRecord[];
  onUpdateDocumentTotal?: (docId: string, newTotal: number | undefined) => void;
  onClose: () => void;
  onSelectDoc: (docId: string) => void;
  language: 'hi' | 'en';
}

export const SourceImageViewer: React.FC<SourceImageViewerProps> = ({
  documents,
  currentDocId,
  highlightRecordId,
  records,
  onUpdateDocumentTotal,
  onClose,
  onSelectDoc,
  language,
}) => {
  const isHi = language === 'hi';
  const currentDocIndex = documents.findIndex((d) => d.id === currentDocId);
  const activeDoc = documents[currentDocIndex] || documents[0];

  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showRecordDrawer, setShowRecordDrawer] = useState<boolean>(true);
  const [isEditingTotal, setIsEditingTotal] = useState<boolean>(false);
  const [tempTotalInput, setTempTotalInput] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number | null>(null);

  // Reset zoom & pan when document changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentDocId]);

  if (!activeDoc) return null;

  // Filter records belonging to this page
  const pageRecords = records.filter(
    (r) => r.sourceImageId === activeDoc.id || r.sourcePage === activeDoc.pageNumber
  );

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.3, 0.4));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch handlers (Pan and Pinch Zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // Calculate distance between two fingers
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = newDist / touchStartDistRef.current;
      setScale((prev) => Math.min(Math.max(prev * factor, 0.4), 4));
      touchStartDistRef.current = newDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  const handlePrevPage = () => {
    if (currentDocIndex > 0) {
      onSelectDoc(documents[currentDocIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentDocIndex < documents.length - 1) {
      onSelectDoc(documents[currentDocIndex + 1].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 flex flex-col backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-stone-900 border-b border-stone-800 text-white z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
            title="Close / बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base text-stone-100 truncate max-w-[200px] sm:max-w-md">
                {activeDoc.pageHeader || activeDoc.fileName}
              </span>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30">
                {isHi ? `पेज ${activeDoc.pageNumber}` : `Page ${activeDoc.pageNumber}`}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {isHi ? 'मूल हस्तलिखित दस्तावेज (Original Image)' : 'Original Handwritten Document'} •{' '}
              {pageRecords.length} {isHi ? 'रिकॉर्ड्स जुड़े' : 'records linked'}
            </p>
          </div>
        </div>

        {/* Zoom & Page Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-700 rounded transition"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold px-1.5 text-stone-300 select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-700 rounded transition"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-700 rounded transition ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle linked records panel */}
          <button
            onClick={() => setShowRecordDrawer(!showRecordDrawer)}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              showRecordDrawer
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{isHi ? 'रिकॉर्ड्स' : 'Records'}</span>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-bold">
              {pageRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {/* Document Viewport */}
        <div
          ref={containerRef}
          className="flex-1 h-full w-full relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none bg-stone-950 p-2 sm:p-4 touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handwritten image wrapper with transform */}
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="max-h-[85vh] max-w-[95vw] shadow-2xl rounded-sm ring-1 ring-white/10"
          >
            <img
              src={activeDoc.dataUrl}
              alt={`Page ${activeDoc.pageNumber} handwritten ledger`}
              className="max-h-[82vh] w-auto object-contain rounded-xs select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Document page navigation buttons overlay */}
          {documents.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-stone-900/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-stone-700 shadow-xl">
              <button
                disabled={currentDocIndex === 0}
                onClick={handlePrevPage}
                className="p-1 rounded-full text-stone-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-800 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-stone-200">
                {currentDocIndex + 1} / {documents.length}
              </span>
              <button
                disabled={currentDocIndex === documents.length - 1}
                onClick={handleNextPage}
                className="p-1 rounded-full text-stone-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-800 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Mobile gesture hint */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-[10px] text-stone-400 px-2.5 py-1 rounded-full pointer-events-none">
            {isHi ? 'पिंच करके ज़ूम या ड्रैग करें' : 'Pinch to zoom • Drag to pan'}
          </div>
        </div>

        {/* Linked Records Side Panel / Drawer */}
        {showRecordDrawer && (
          <div className="w-full md:w-80 lg:w-96 bg-stone-900 border-t md:border-t-0 md:border-l border-stone-800 flex flex-col max-h-64 md:max-h-full overflow-hidden shadow-2xl z-20">
            {/* Drawer Header with Mathematical Validation */}
            <div className="p-3 border-b border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    {isHi ? 'इस पेज के रिकॉर्ड्स' : 'Records on this Page'}
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    {pageRecords.length} {isHi ? 'प्रविष्टियां निकाली गईं' : 'extracted items'}
                  </p>
                </div>

                {/* Mathematical Validation Pill */}
                {(() => {
                  const math = validatePageTotalMath(activeDoc.detectedPageTotal, pageRecords);
                  if (math.status === 'MATCH') {
                    return (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-600/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{isHi ? '✓ योग सुसंगत' : '✓ MATCH'}</span>
                      </span>
                    );
                  } else if (math.status === 'MISMATCH') {
                    return (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/80">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>
                          {isHi ? '⚠️ योग असंगत' : '⚠️ MISMATCH'}
                          <span className="font-mono ml-0.5">
                            ({math.difference > 0 ? '+' : ''}{formatINR(math.difference)})
                          </span>
                        </span>
                      </span>
                    );
                  }
                  return (
                    <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
                      {isHi ? 'कुल योग दर्ज नहीं' : 'No Page Total'}
                    </span>
                  );
                })()}
              </div>

              {/* Math Reconciliation Comparison Bar */}
              {(() => {
                const math = validatePageTotalMath(activeDoc.detectedPageTotal, pageRecords);
                return (
                  <div className="bg-stone-800/80 rounded-lg p-2 border border-stone-700/70 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-center pb-1 border-b border-stone-700/50">
                      <div>
                        <span className="text-[10px] text-stone-400 block">
                          {isHi ? 'पन्ने पर लिखा योग' : 'Handwritten Total'}
                        </span>
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-stone-100 font-mono">
                            {activeDoc.detectedPageTotal !== undefined
                              ? formatINR(activeDoc.detectedPageTotal)
                              : isHi
                              ? 'उपलब्ध नहीं'
                              : 'None'}
                          </span>
                          {onUpdateDocumentTotal && !isEditingTotal && (
                            <button
                              onClick={() => {
                                setIsEditingTotal(true);
                                setTempTotalInput(
                                  activeDoc.detectedPageTotal !== undefined
                                    ? String(activeDoc.detectedPageTotal)
                                    : ''
                                );
                              }}
                              className="text-stone-400 hover:text-amber-400 p-0.5"
                              title="Edit handwritten page total"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 block">
                          {isHi ? 'निकाला गया जोड़' : 'Calculated Sum'}
                        </span>
                        <span className="font-bold text-stone-100 font-mono">
                          {formatINR(math.calculatedLineItemSum)}
                        </span>
                      </div>
                    </div>

                    {/* Inline edit total form */}
                    {isEditingTotal && (
                      <div className="pt-2 flex items-center gap-1.5">
                        <input
                          type="number"
                          value={tempTotalInput}
                          onChange={(e) => setTempTotalInput(e.target.value)}
                          placeholder="e.g. 22950"
                          className="flex-1 bg-stone-900 border border-stone-600 rounded px-2 py-1 text-xs text-white font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (onUpdateDocumentTotal) {
                              const val = tempTotalInput.trim() === '' ? undefined : Number(tempTotalInput);
                              onUpdateDocumentTotal(activeDoc.id, isNaN(Number(val)) ? undefined : val);
                            }
                            setIsEditingTotal(false);
                          }}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold"
                        >
                          {isHi ? 'सहेजें' : 'Save'}
                        </button>
                        <button
                          onClick={() => setIsEditingTotal(false)}
                          className="px-1.5 py-1 text-stone-400 hover:text-stone-200 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="pt-1 text-[10px] text-center">
                      {math.status === 'MATCH' ? (
                        <span className="text-emerald-400 font-semibold">
                          {isHi ? '✓ स्वतंत्र प्रविष्टियों का जोड़ पन्ने के योग से पूर्णतः मिलता है।' : '✓ Line items sum equals handwritten page total.'}
                        </span>
                      ) : math.status === 'MISMATCH' ? (
                        <span className="text-rose-300 font-semibold">
                          {math.difference < 0
                            ? isHi
                              ? `⚠️ कमी: प्रविष्टियों का जोड़ पन्ने के योग से ${formatINR(Math.abs(math.difference))} कम है!`
                              : `⚠️ Shortfall: Line items sum is ${formatINR(Math.abs(math.difference))} less than page total!`
                            : isHi
                            ? `⚠️ अधिकता: प्रविष्टियों का जोड़ पन्ने के योग से ${formatINR(math.difference)} अधिक है!`
                            : `⚠️ Excess: Line items sum exceeds page total by ${formatINR(math.difference)}!`}
                        </span>
                      ) : (
                        <span className="text-stone-400">
                          {isHi ? 'हस्तलिखित योग दर्ज करके मिलान जांचें।' : 'Enter page total to verify arithmetic.'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* List of items extracted from this page */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {pageRecords.length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-xs">
                  {isHi ? 'इस पेज पर कोई रिकॉर्ड नहीं मिला' : 'No records extracted for this page'}
                </div>
              ) : (
                pageRecords.map((rec) => {
                  const isHighlighted = rec.id === highlightRecordId;
                  return (
                    <div
                      key={rec.id}
                      className={`p-2.5 rounded-lg border text-xs transition ${
                        isHighlighted
                          ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/50'
                          : 'bg-stone-800/60 border-stone-700/60 hover:border-stone-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-stone-200 text-sm">{rec.name}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-stone-700/80 text-stone-300">
                              {rec.category}
                            </span>
                            <span>•</span>
                            <span
                              className={
                                rec.paymentMode === 'Online'
                                  ? 'text-teal-400'
                                  : rec.paymentMode === 'Cash'
                                  ? 'text-emerald-400'
                                  : 'text-stone-400'
                              }
                            >
                              {rec.paymentMode}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm text-stone-100 font-mono">
                            {formatINR(rec.amount)}
                          </span>
                          <div className="mt-0.5">
                            {rec.verified ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                                <CheckCircle className="w-3 h-3" />
                                {isHi ? 'सत्यापित' : 'Verified'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 font-medium">
                                <AlertCircle className="w-3 h-3" />
                                {isHi ? 'लंबित' : 'Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {rec.rawText && (
                        <div className="mt-2 text-[10px] text-stone-400 bg-black/40 p-1.5 rounded font-mono truncate">
                          "{rec.rawText}"
                        </div>
                      )}

                      {rec.ambiguityNotes && (
                        <div className="mt-1.5 text-[10px] text-amber-300 bg-amber-950/40 border border-amber-800/50 p-1.5 rounded">
                          ⚠️ {rec.ambiguityNotes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
