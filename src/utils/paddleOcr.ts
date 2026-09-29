import { PaddleOCR, OcrResult, OcrResultItem, Point2D } from '@paddleocr/paddleocr-js';

export interface PaddleOCRRegion {
  poly: Point2D[];
  text: string;
  score: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface PaddleOCRResult {
  rawText: string;
  regions: PaddleOCRRegion[];
  confidence: number;
  modelInitTimeMs: number;
  detMs: number;
  recMs: number;
  totalInferenceTimeMs: number;
  estimatedRowCount: number | null;
  amountCandidates: Array<{ text: string; score: number; poly?: Point2D[] }>;
  devanagariWords: Array<{ text: string; score: number; poly?: Point2D[] }>;
  latinWords: Array<{ text: string; score: number; poly?: Point2D[] }>;
  runtimeInfo: {
    backend: string;
    detProvider: string;
    recProvider: string;
  };
}

let cachedPaddleInstance: any = null;
let lastInitDuration = 0;

/**
 * Executes local in-browser inference using @paddleocr/paddleocr-js.
 * ZERO Gemini calls. ZERO external OCR API calls.
 */
export async function executePaddleOCR(
  imageSource: File | Blob | HTMLImageElement | HTMLCanvasElement,
  onProgress?: (status: string, percent: number) => void
): Promise<PaddleOCRResult> {
  const initStart = performance.now();

  if (!cachedPaddleInstance) {
    onProgress?.('Initializing PaddleOCR browser WASM/ONNX runtime...', 15);

    cachedPaddleInstance = await PaddleOCR.create({
      lang: 'ch', // Built-in multilingual character detection & recognition
      ocrVersion: 'PP-OCRv5',
      ortOptions: {
        backend: 'wasm',
        numThreads: 1,
        simd: true,
      },
    });

    const initEnd = performance.now();
    lastInitDuration = Math.round(initEnd - initStart);
  }

  onProgress?.('Running local neural text detection (PP-OCR Det)...', 50);
  const inferenceStart = performance.now();

  const [ocrOutput] = (await cachedPaddleInstance.predict(imageSource)) as OcrResult[];
  const inferenceEnd = performance.now();
  const overallDuration = Math.round(inferenceEnd - inferenceStart);

  onProgress?.('Parsing detected polygons and character sequences...', 90);

  const items = ocrOutput.items || [];
  const regions: PaddleOCRRegion[] = [];
  const amountCandidates: Array<{ text: string; score: number; poly?: Point2D[] }> = [];
  const devanagariWords: Array<{ text: string; score: number; poly?: Point2D[] }> = [];
  const latinWords: Array<{ text: string; score: number; poly?: Point2D[] }> = [];

  let totalScore = 0;

  items.forEach((item: OcrResultItem) => {
    const poly: Point2D[] = item.poly || [];
    let x0 = 0;
    let y0 = 0;
    let x1 = 0;
    let y1 = 0;

    if (poly.length > 0) {
      const xs = poly.map((p) => (Array.isArray(p) ? p[0] : (p as any).x || 0));
      const ys = poly.map((p) => (Array.isArray(p) ? p[1] : (p as any).y || 0));
      x0 = Math.min(...xs);
      y0 = Math.min(...ys);
      x1 = Math.max(...xs);
      y1 = Math.max(...ys);
    }

    const trimmed = (item.text || '').trim();
    const regionObj: PaddleOCRRegion = {
      poly,
      text: trimmed,
      score: item.score || 0,
      bbox: { x0, y0, x1, y1 },
    };

    if (trimmed) {
      regions.push(regionObj);
      totalScore += item.score || 0;

      // Numeric check
      const cleanNum = trimmed.replace(/[₹,./\-]/g, '').trim();
      if (/^\d{2,7}$/.test(cleanNum)) {
        amountCandidates.push({
          text: trimmed,
          score: item.score,
          poly,
        });
      }

      // Script check
      if (/[\u0900-\u097F]/.test(trimmed)) {
        devanagariWords.push({
          text: trimmed,
          score: item.score,
          poly,
        });
      } else if (/[a-zA-Z]/.test(trimmed)) {
        latinWords.push({
          text: trimmed,
          score: item.score,
          poly,
        });
      }
    }
  });

  const avgConfidence = regions.length > 0 ? (totalScore / regions.length) * 100 : 0;
  const rawText = regions.map((r) => r.text).join('\n');

  // Estimate rows using vertical bounding centroid clustering
  let estimatedRowCount: number | null = null;
  if (regions.length > 0) {
    const rowBuckets: { [bucket: number]: PaddleOCRRegion[] } = {};
    regions.forEach((r) => {
      const yMid = (r.bbox.y0 + r.bbox.y1) / 2;
      const bucket = Math.floor(yMid / 26) * 26;
      if (!rowBuckets[bucket]) rowBuckets[bucket] = [];
      rowBuckets[bucket].push(r);
    });
    estimatedRowCount = Object.keys(rowBuckets).length;
  }

  return {
    rawText,
    regions,
    confidence: avgConfidence,
    modelInitTimeMs: lastInitDuration,
    detMs: ocrOutput.metrics?.detMs || 0,
    recMs: ocrOutput.metrics?.recMs || 0,
    totalInferenceTimeMs: overallDuration,
    estimatedRowCount,
    amountCandidates,
    devanagariWords,
    latinWords,
    runtimeInfo: {
      backend: ocrOutput.runtime?.requestedBackend || 'wasm',
      detProvider: ocrOutput.runtime?.detProvider || 'cpu',
      recProvider: ocrOutput.runtime?.recProvider || 'cpu',
    },
  };
}
