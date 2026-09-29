import { createWorker } from 'tesseract.js';

export interface OCRBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox?: OCRBox;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox?: OCRBox;
  words: OCRWord[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  bbox?: OCRBox;
  lines: OCRLine[];
}

export interface LocalOCRResult {
  rawText: string;
  blocks: OCRBlock[];
  lines: OCRLine[];
  words: OCRWord[];
  confidence: number;
  modelInitTimeMs: number;
  firstInferenceTimeMs: number;
  totalInferenceTimeMs: number;
  hasBbox: boolean;
  estimatedRowCount: number | null; // null if bbox unavailable
  amountCandidates: Array<{ text: string; confidence: number; bbox?: OCRBox }>;
  devanagariWords: Array<{ text: string; confidence: number; bbox?: OCRBox }>;
  latinWords: Array<{ text: string; confidence: number; bbox?: OCRBox }>;
}

export interface PreprocessingOptions {
  grayscale?: boolean;
  contrast?: number; // 0 to 100
  binarize?: boolean;
}

/**
 * Preprocesses an image source (dataUrl/url) on an HTML5 canvas locally in browser.
 */
export async function preprocessImageLocally(
  imageUrl: string,
  options: PreprocessingOptions
): Promise<string> {
  if (!options.grayscale && !options.binarize && (!options.contrast || options.contrast === 0)) {
    return imageUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const contrast = options.contrast || 0;
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Grayscale luminance
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Contrast adjustment
        if (contrast > 0) {
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
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

/**
 * Runs 100% in-browser Local OCR using Tesseract WASM with Hindi + English character sets.
 * ZERO Gemini calls. ZERO external OCR API requests.
 */
export async function executeLocalOCR(
  imageSource: string | File | Blob,
  onProgress?: (status: string, percent: number) => void
): Promise<LocalOCRResult> {
  const initStart = performance.now();
  onProgress?.('Initializing in-browser WASM OCR worker (hin+eng)...', 5);

  const worker = await createWorker('hin+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const p = Math.round((m.progress || 0) * 100);
        onProgress?.(`Recognizing characters locally: ${p}%`, p);
      } else {
        onProgress?.(`Engine: ${m.status}`, 10);
      }
    },
  });

  const initEnd = performance.now();
  const initDuration = Math.round(initEnd - initStart);

  onProgress?.('Processing image text and layout locally...', 80);
  const inferenceStart = performance.now();

  // Request full blocks & text layout output from Tesseract
  const ret = await worker.recognize(
    imageSource as any,
    {},
    {
      blocks: true,
      text: true,
      hocr: false,
      tsv: false,
    }
  );
  const inferenceEnd = performance.now();
  const inferenceDuration = Math.round(inferenceEnd - inferenceStart);

  const rawText = ret.data.text || '';
  const overallConfidence = ret.data.confidence || 0;

  const blocks: OCRBlock[] = [];
  const lines: OCRLine[] = [];
  const words: OCRWord[] = [];

  let hasValidBbox = false;

  // 1. Primary Parse: Extract from Tesseract Page.blocks -> Paragraphs -> Lines -> Words
  const rawBlocks = ret.data.blocks;
  if (Array.isArray(rawBlocks) && rawBlocks.length > 0) {
    for (const b of rawBlocks) {
      const blockLines: OCRLine[] = [];

      if (Array.isArray(b.paragraphs)) {
        for (const p of b.paragraphs) {
          if (Array.isArray(p.lines)) {
            for (const l of p.lines) {
              const lineWords: OCRWord[] = [];

              if (Array.isArray(l.words)) {
                for (const w of l.words) {
                  const wordText = (w.text || '').trim();
                  if (wordText) {
                    const wordObj: OCRWord = {
                      text: wordText,
                      confidence: w.confidence || 0,
                      bbox: w.bbox
                        ? { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }
                        : undefined,
                    };
                    if (w.bbox && (w.bbox.x1 > w.bbox.x0 || w.bbox.y1 > w.bbox.y0)) {
                      hasValidBbox = true;
                    }
                    lineWords.push(wordObj);
                    words.push(wordObj);
                  }
                }
              }

              const lineText = (l.text || '').trim();
              if (lineText || lineWords.length > 0) {
                const lineObj: OCRLine = {
                  text: lineText || lineWords.map((w) => w.text).join(' '),
                  confidence: l.confidence || 0,
                  bbox: l.bbox
                    ? { x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1 }
                    : undefined,
                  words: lineWords,
                };
                if (l.bbox && (l.bbox.x1 > l.bbox.x0 || l.bbox.y1 > l.bbox.y0)) {
                  hasValidBbox = true;
                }
                blockLines.push(lineObj);
                lines.push(lineObj);
              }
            }
          }
        }
      }

      const blockText = (b.text || '').trim();
      if (blockText || blockLines.length > 0) {
        blocks.push({
          text: blockText || blockLines.map((l) => l.text).join('\n'),
          confidence: b.confidence || 0,
          bbox: b.bbox
            ? { x0: b.bbox.x0, y0: b.bbox.y0, x1: b.bbox.x1, y1: b.bbox.y1 }
            : undefined,
          lines: blockLines,
        });
      }
    }
  }

  // 2. Direct Lines fallback if blocks was empty or missing lines
  if (lines.length === 0 && Array.isArray((ret.data as any).lines)) {
    for (const l of (ret.data as any).lines) {
      const lineWords: OCRWord[] = [];
      if (Array.isArray(l.words)) {
        for (const w of l.words) {
          const wordText = (w.text || '').trim();
          if (wordText) {
            const wordObj: OCRWord = {
              text: wordText,
              confidence: w.confidence || 0,
              bbox: w.bbox
                ? { x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1 }
                : undefined,
            };
            if (w.bbox && (w.bbox.x1 > w.bbox.x0 || w.bbox.y1 > w.bbox.y0)) {
              hasValidBbox = true;
            }
            lineWords.push(wordObj);
            words.push(wordObj);
          }
        }
      }

      const lineText = (l.text || '').trim();
      if (lineText || lineWords.length > 0) {
        const lineObj: OCRLine = {
          text: lineText || lineWords.map((w) => w.text).join(' '),
          confidence: l.confidence || 0,
          bbox: l.bbox
            ? { x0: l.bbox.x0, y0: l.bbox.y0, x1: l.bbox.x1, y1: l.bbox.y1 }
            : undefined,
          words: lineWords,
        };
        lines.push(lineObj);
      }
    }
  }

  // 3. Fallback to rawText line tokens if structural blocks/lines were not generated
  if (lines.length === 0 && rawText.trim().length > 0) {
    const rawLineStrings = rawText.split('\n').map((s) => s.trim()).filter(Boolean);
    for (const lineStr of rawLineStrings) {
      const wordTokens = lineStr.split(/\s+/).filter(Boolean);
      const lineWords: OCRWord[] = wordTokens.map((wt) => {
        const wObj: OCRWord = {
          text: wt,
          confidence: overallConfidence,
        };
        words.push(wObj);
        return wObj;
      });

      lines.push({
        text: lineStr,
        confidence: overallConfidence,
        words: lineWords,
      });
    }

    if (blocks.length === 0 && lines.length > 0) {
      blocks.push({
        text: rawText.trim(),
        confidence: overallConfidence,
        lines: [...lines],
      });
    }
  }

  await worker.terminate();

  // Heuristic Analysis on extracted tokens
  // Numeric/amount candidates: 2-7 digits, currency symbols, clean integers or decimals
  const amountCandidates: Array<{ text: string; confidence: number; bbox?: OCRBox }> = [];
  const devanagariWords: Array<{ text: string; confidence: number; bbox?: OCRBox }> = [];
  const latinWords: Array<{ text: string; confidence: number; bbox?: OCRBox }> = [];

  for (const w of words) {
    const cleanNum = w.text.replace(/[₹,./\-]/g, '').trim();
    if (/^\d{2,7}$/.test(cleanNum)) {
      amountCandidates.push({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      });
    }

    if (/[\u0900-\u097F]/.test(w.text)) {
      devanagariWords.push({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      });
    } else if (/[a-zA-Z]/.test(w.text)) {
      latinWords.push({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      });
    }
  }

  // Row group estimation using vertical Y coordinates (only when valid bounding coordinates exist)
  let estimatedRowCount: number | null = null;
  const linesWithValidY = lines.filter((l) => l.bbox && (l.bbox.y1 > l.bbox.y0));

  if (linesWithValidY.length > 0) {
    const rowGroupBuckets: { [bucketKey: number]: OCRLine[] } = {};
    linesWithValidY.forEach((l) => {
      const yMid = (l.bbox!.y0 + l.bbox!.y1) / 2;
      const bucketKey = Math.floor(yMid / 28) * 28; // 28px vertical bucket
      if (!rowGroupBuckets[bucketKey]) rowGroupBuckets[bucketKey] = [];
      rowGroupBuckets[bucketKey].push(l);
    });
    estimatedRowCount = Object.keys(rowGroupBuckets).length;
  } else if (lines.length > 0) {
    // If no coordinates, row count is text line count
    estimatedRowCount = lines.length;
  }

  return {
    rawText,
    blocks,
    lines,
    words,
    confidence: overallConfidence,
    modelInitTimeMs: initDuration,
    firstInferenceTimeMs: inferenceDuration,
    totalInferenceTimeMs: initDuration + inferenceDuration,
    hasBbox: hasValidBbox,
    estimatedRowCount,
    amountCandidates,
    devanagariWords,
    latinWords,
  };
}
