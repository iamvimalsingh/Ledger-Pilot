import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow large images in request body (up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI SDK as per gemini-api skill
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn('⚠️ GEMINI_API_KEY is not defined in environment.');
}

// Extraction API
app.post('/api/extract-ledger', async (req, res) => {
  try {
    const {
      image,
      mimeType = 'image/jpeg',
      pageNumber = 1,
      categories = [],
      existingHouseholds = [],
      projectName = '',
    } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    // Strip data URI header if present
    let base64Data = image;
    let actualMimeType = mimeType;
    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      actualMimeType = parts[0].replace('data:', '') || mimeType;
      base64Data = parts[1];
    }

    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Gemini API is not configured on this server (GEMINI_API_KEY missing). Please check your environment variables.',
      });
    }

    const categoryListStr = categories.length > 0
      ? categories.join(', ')
      : 'Donation, Contribution, Fee, Expense, Maintenance, Purchase, Salary, Other';

    const householdListStr = existingHouseholds.length > 0
      ? `Existing groups/households for reference: ${existingHouseholds.join(', ')}`
      : 'Extract any household, family, or apartment grouping directly from text';

    const projectContextStr = projectName
      ? `Active Ledger Project: "${projectName}". Adapt context to this project without assuming unstated themes.`
      : 'Analyze ledger entries neutrally based only on the handwritten content provided.';

    const systemPrompt = `You are a high-precision multimodal financial AI assistant specialized in analyzing handwritten collection sheets, donation registers, accounting ledgers, cash books, expense sheets, and community records (in English, Hindi, or mixed scripts).
${projectContextStr}

YOUR CRITICAL INSTRUCTIONS:
1. Examine every line item carefully: handwriting, numbers, tables, crossed-out values, notes, margins, arrows, totals.
2. Every record must be classified into a transactionType:
   - 'INCOME' for any incoming funds, donation, member collection, contribution, fee, sales, receipt, deposit, etc.
   - 'EXPENSE' for any outgoing funds, vendor payments, purchase, supplies, food/tea/snacks, rent, salary, repair, खर्च, भुगतान, व्यय, etc.
   Amounts must always be positive numbers.
3. If an amount or name is crossed out or rewritten, extract the FINAL intended value. Mention the strike-through in 'ambiguityNotes'.
4. DO NOT SILENTLY GUESS unclear handwriting or uncertain digits!
   - High confidence: very legible text and unmistakable digits.
   - Medium confidence: minor ambiguity, slightly messy or stylized handwriting.
   - Low confidence: unclear digits (e.g. 500 vs 5000), blurred, smudged, illegible letters.
   When low or medium confidence, explicitly explain what is ambiguous in 'ambiguityNotes' (e.g., "Amount could be ₹500 or ₹5000 due to ambiguous zeros; Name could be 'Vikas' or 'Vimal'").
5. Classify payment mode into one of: 'Cash', 'Online', 'Other'.
   - 'Online' includes notes like UPI, GPay, PhonePe, Paytm, NEFT, QR, Trx ID, or tick marks in an Online column.
   - 'Cash' includes Cash, नकद, Rokad, or untagged entries unless specified otherwise.
   - 'Other' includes Cheque, Kind, Food grain, etc.
6. Classify category into a descriptive financial category (e.g. ${categoryListStr}).
7. Detect household / member / family groupings if mentioned (${householdListStr}, "मकान नं", "परिवार", "House/Flat").
8. Identify any handwritten page total written at the bottom or top of the page.
9. Retain raw text as closely as possible in 'rawText'.`;

    const userPrompt = `Please extract all ledger entries from page ${pageNumber} of this handwritten document into structured data according to the schema. Classify each entry explicitly as INCOME or EXPENSE. Also note the page title/header and any overall page total written by the recorder.`;

    let response: any = null;
    let lastError: any = null;

    // Retry up to 3 times for transient 503/high-demand spikes
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: actualMimeType,
                  data: base64Data,
                },
              },
              {
                text: `${systemPrompt}\n\n${userPrompt}`,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                pageHeader: {
                  type: Type.STRING,
                  description: 'Title or header written on the handwritten page (e.g. "Collection Register 2026", "Page 1")',
                },
                detectedPageTotal: {
                  type: Type.NUMBER,
                  description: 'Any handwritten sum or grand total explicitly written on the sheet by the human recorder. 0 if none.',
                },
                qualityNotes: {
                  type: Type.STRING,
                  description: 'Overview of handwriting legibility, page condition, or overall remarks.',
                },
                records: {
                  type: Type.ARRAY,
                  description: 'List of individual financial transaction records extracted from the page.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: 'Name of the contributor, donor, member, or expense recipient/payee.',
                      },
                      amount: {
                        type: Type.NUMBER,
                        description: 'Positive monetary amount (e.g. 500, 1100, 2100). Never negative.',
                      },
                      transactionType: {
                        type: Type.STRING,
                        enum: ['INCOME', 'EXPENSE', 'UNCLASSIFIED'],
                        description:
                          'Whether this entry represents incoming revenue/donation (INCOME), outgoing expense/payment (EXPENSE), or ambiguous/unknown direction (UNCLASSIFIED).',
                      },
                      currency: {
                        type: Type.STRING,
                        description: 'Currency symbol or code, default "INR" or "₹".',
                      },
                      paymentMode: {
                        type: Type.STRING,
                        enum: ['Cash', 'Online', 'Other'],
                        description: 'Mode of collection/payment: Cash, Online (UPI/GPay/PhonePe), or Other.',
                      },
                      category: {
                        type: Type.STRING,
                        description: 'Category of entry (e.g. Donation, Fee, Expense, Maintenance, Purchase, Other).',
                      },
                      purpose: {
                        type: Type.STRING,
                        description: 'Specific purpose or note (e.g. "Receipt #12", "Tent & Sound", "Flat 304").',
                      },
                      date: {
                        type: Type.STRING,
                        description: 'Date if visible for this record or on the page (YYYY-MM-DD or readable string).',
                      },
                      householdName: {
                        type: Type.STRING,
                        description: 'Associated family, household, or organization if mentioned.',
                      },
                      confidence: {
                        type: Type.STRING,
                        enum: ['high', 'medium', 'low'],
                        description: 'Confidence rating. Must be "low" if handwriting or digits are uncertain.',
                      },
                      ambiguityNotes: {
                        type: Type.STRING,
                        description: 'Detailed doubt or reason if confidence is medium or low. Empty if high.',
                      },
                      rawText: {
                        type: Type.STRING,
                        description: 'Verbatim transcription of the line as seen on the page.',
                      },
                    },
                    required: ['name', 'amount', 'transactionType', 'paymentMode', 'category', 'confidence'],
                  },
                },
              },
              required: ['records'],
            },
          },
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Extraction attempt ${attempt} failed:`, err?.message);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Empty response received from Gemini model after retries.');
    }

    const textOutput = response.text;
    const parsedData = JSON.parse(textOutput);

    // Validate and sanitize records
    const sanitizedRecords = (parsedData.records || []).map((rec: any) => ({
      name: String(rec.name || 'अज्ञात (Unknown)').trim(),
      amount: Math.abs(Number(rec.amount) || 0),
      transactionType:
        rec.transactionType === 'EXPENSE'
          ? 'EXPENSE'
          : rec.transactionType === 'INCOME'
          ? 'INCOME'
          : 'UNCLASSIFIED',
      currency: rec.currency || '₹',
      paymentMode: ['Cash', 'Online', 'Other'].includes(rec.paymentMode) ? rec.paymentMode : 'Cash',
      category:
        rec.category ||
        (rec.transactionType === 'EXPENSE'
          ? 'Expense'
          : rec.transactionType === 'INCOME'
          ? 'General'
          : 'Unclassified'),
      purpose: rec.purpose || '',
      date: rec.date || '',
      householdName: rec.householdName || '',
      confidence: ['high', 'medium', 'low'].includes(rec.confidence) ? rec.confidence : 'medium',
      ambiguityNotes: rec.ambiguityNotes || '',
      rawText: rec.rawText || `${rec.name} - ${rec.amount}`,
    }));

    return res.json({
      success: true,
      pageHeader: parsedData.pageHeader || '',
      detectedPageTotal: Number(parsedData.detectedPageTotal) || undefined,
      qualityNotes: parsedData.qualityNotes || '',
      records: sanitizedRecords,
    });
  } catch (error: any) {
    console.error('Extraction API error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to extract ledger records from image',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: Date.now(),
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'public')));
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LedgerPilot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
