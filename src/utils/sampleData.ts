import { ExtractedRecord, SourceDocument, Household, ProjectMetadata } from '../types/ledger';

// ============================================================================
// DEMO / SAMPLE FIXTURE DATA ONLY
// ----------------------------------------------------------------------------
// This file contains mock fixture data strictly for interactive UI demonstrations,
// automated testing, and previewing the multi-modal OCR verification features.
// It is explicitly isolated as a demo fixture and MUST NEVER be used as the
// default application identity or default project name.
// ============================================================================

export const DEMO_PROJECT_METADATA: ProjectMetadata = {
  id: 'proj-demo-utsav',
  name: 'Shree Ganesh Utsav Vasant Vihar',
  description: 'Demonstration festival ledger fixture (Sample Only)',
  createdAt: 1724544000000,
};

/**
 * Creates an authentic-looking handwritten ledger page rendered as an SVG Data URI.
 * This guarantees the user has a realistic document immediately available to test
 * the full workflow (zoom/pan viewer, source linking, AI extraction, duplicate resolution).
 */
export function generateHandwrittenLedgerSVG(pageType: 'colony' | 'school'): string {
  if (pageType === 'colony') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1150" width="800" height="1150" style="background:#fbf8ee;font-family:'Courier New',cursive,sans-serif;">
  <defs>
    <!-- Paper texture / ruled lines pattern -->
    <pattern id="ruledLines" width="100" height="42" patternUnits="userSpaceOnUse">
      <line x1="0" y1="41" x2="100" y2="41" stroke="#cfc7b0" stroke-width="1.2" />
    </pattern>
    <filter id="inkRough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
    </filter>
  </defs>

  <!-- Notebook page background with slight warm aging -->
  <rect width="800" height="1150" fill="#fbf7ec" />
  <rect x="0" y="160" width="800" height="960" fill="url(#ruledLines)" />

  <!-- Red left margin line -->
  <line x1="140" y1="0" x2="140" y2="1150" stroke="#f28b82" stroke-width="2" />
  <line x1="144" y1="0" x2="144" y2="1150" stroke="#f28b82" stroke-width="0.8" opacity="0.6" />

  <!-- Column guide lines -->
  <line x1="420" y1="160" x2="420" y2="1080" stroke="#d5ceb8" stroke-width="1" stroke-dasharray="3,3" />
  <line x1="560" y1="160" x2="560" y2="1080" stroke="#d5ceb8" stroke-width="1" stroke-dasharray="3,3" />
  <line x1="680" y1="160" x2="680" y2="1080" stroke="#d5ceb8" stroke-width="1" stroke-dasharray="3,3" />

  <!-- Page Header written in blue/black ink -->
  <g filter="url(#inkRough)">
    <text x="240" y="80" font-size="28" font-weight="bold" fill="#1a237e" font-family="'Segoe UI', 'Devanagari', cursive">
      श्री गणेश उत्सव चंदा संग्रह - 2026
    </text>
    <text x="320" y="115" font-size="16" fill="#3949ab" font-family="cursive">
      (वसंत विहार कॉलोनी - पेज सं. 01)
    </text>
    <text x="620" y="60" font-size="15" fill="#424242" font-family="cursive">दिनांक: 25/08/2026</text>
    <text x="40" y="60" font-size="14" fill="#616161">Reg. No: VV/2026</text>

    <!-- Table Header -->
    <rect x="20" y="160" width="760" height="42" fill="#ece6d2" stroke="#b0a88f" stroke-width="1.2" />
    <text x="50" y="188" font-size="16" font-weight="bold" fill="#212121">क्र.</text>
    <text x="170" y="188" font-size="16" font-weight="bold" fill="#212121">नाम (Name) / परिवार</text>
    <text x="440" y="188" font-size="16" font-weight="bold" fill="#212121">मद / Category</text>
    <text x="580" y="188" font-size="16" font-weight="bold" fill="#212121">मोड (Mode)</text>
    <text x="700" y="188" font-size="16" font-weight="bold" fill="#212121">रुपये (₹)</text>
  </g>

  <!-- Row Items in handwritten cursive / Hindi script -->
  <g filter="url(#inkRough)" font-family="cursive, 'Segoe UI', sans-serif" fill="#0d235c">
    <!-- Item 1 -->
    <text x="55" y="232" font-size="17">1.</text>
    <text x="160" y="232" font-size="19" font-weight="600">Vimal Singh (सिंह परिवार)</text>
    <text x="430" y="232" font-size="16" fill="#1b5e20">General Chanda</text>
    <text x="575" y="232" font-size="16" fill="#004d40">GPay (Online)</text>
    <text x="700" y="232" font-size="20" font-weight="bold">₹2,100</text>

    <!-- Item 2 -->
    <text x="55" y="274" font-size="17">2.</text>
    <text x="160" y="274" font-size="19" font-weight="600">Neha Singh (म.नं. B-12)</text>
    <text x="430" y="274" font-size="16" fill="#bf360c">Bhandara</text>
    <text x="575" y="274" font-size="16" fill="#004d40">Online / UPI</text>
    <text x="700" y="274" font-size="20" font-weight="bold">₹1,100</text>

    <!-- Item 3 - with crossed out amount corrected -->
    <text x="55" y="316" font-size="17">3.</text>
    <text x="160" y="316" font-size="19" font-weight="600">Raghav Singh</text>
    <text x="430" y="316" font-size="16">Sunderkand</text>
    <text x="575" y="316" font-size="16">Cash (नकद)</text>
    <text x="690" y="316" font-size="16" fill="#888" text-decoration="line-through">₹500</text>
    <text x="735" y="316" font-size="20" font-weight="bold" fill="#b71c1c">₹1,500</text>

    <!-- Item 4 -->
    <text x="55" y="358" font-size="17">4.</text>
    <text x="160" y="358" font-size="19" font-weight="600">Ramesh Chandra Gupta</text>
    <text x="430" y="358" font-size="16" fill="#1b5e20">General Chanda</text>
    <text x="575" y="358" font-size="16">Cash</text>
    <text x="700" y="358" font-size="20" font-weight="bold">₹5,000</text>

    <!-- Item 5 - slightly unclear handwriting -->
    <text x="55" y="400" font-size="17">5.</text>
    <text x="160" y="400" font-size="18" fill="#1a237e">Sunita Devi (गुप्ता जी की तरफ से)</text>
    <text x="430" y="400" font-size="16" fill="#bf360c">Bhandara</text>
    <text x="575" y="400" font-size="16">Cash</text>
    <text x="700" y="400" font-size="20" font-weight="bold">₹1,000</text>

    <!-- Item 6 -->
    <text x="55" y="442" font-size="17">6.</text>
    <text x="160" y="442" font-size="19" font-weight="600">Vikas Sharma (Flat 402)</text>
    <text x="430" y="442" font-size="16">Murti Support</text>
    <text x="575" y="442" font-size="16" fill="#004d40">PhonePe</text>
    <text x="700" y="442" font-size="20" font-weight="bold">₹3,500</text>

    <!-- Item 7 -->
    <text x="55" y="484" font-size="17">7.</text>
    <text x="160" y="484" font-size="19" font-weight="600">Anand Verma</text>
    <text x="430" y="484" font-size="16" fill="#1b5e20">General Chanda</text>
    <text x="575" y="484" font-size="16">Cash</text>
    <text x="700" y="484" font-size="20" font-weight="bold">₹2,000</text>

    <!-- Item 8 - Potential duplicate entry test -->
    <text x="55" y="526" font-size="17">8.</text>
    <text x="160" y="526" font-size="19" font-weight="600">Vimal Kumar Singh (Singh Fam)</text>
    <text x="430" y="526" font-size="16" fill="#1b5e20">General Chanda</text>
    <text x="575" y="526" font-size="16" fill="#004d40">Online</text>
    <text x="700" y="526" font-size="20" font-weight="bold">₹2,100</text>

    <!-- Item 9 - Scribbled / Low confidence test -->
    <text x="55" y="568" font-size="17">9.</text>
    <text x="160" y="568" font-size="18" fill="#37474f">Pooja Patel (? unclear flat)</text>
    <text x="430" y="568" font-size="16" fill="#bf360c">Bhandara</text>
    <text x="575" y="568" font-size="16">Cash</text>
    <text x="700" y="568" font-size="19" font-weight="bold" fill="#d84315">₹500 / ₹5000 (?)</text>

    <!-- Item 10 -->
    <text x="55" y="610" font-size="17">10.</text>
    <text x="160" y="610" font-size="19" font-weight="600">Kuldeep Yadav</text>
    <text x="430" y="610" font-size="16">Sunderkand</text>
    <text x="575" y="610" font-size="16">Cash</text>
    <text x="700" y="610" font-size="20" font-weight="bold">₹1,100</text>

    <!-- Item 11 -->
    <text x="55" y="652" font-size="17">11.</text>
    <text x="160" y="652" font-size="19" font-weight="600">Alok Mishra</text>
    <text x="430" y="652" font-size="16" fill="#1b5e20">General Chanda</text>
    <text x="575" y="652" font-size="16" fill="#004d40">Paytm QR</text>
    <text x="700" y="652" font-size="20" font-weight="bold">₹2,500</text>

    <!-- Item 12 - Expense note -->
    <text x="55" y="694" font-size="17">12.</text>
    <text x="160" y="694" font-size="18" font-weight="600" fill="#c62828">[खर्च] शाम की चाय व नाश्ता</text>
    <text x="430" y="694" font-size="16" fill="#c62828">Expense</text>
    <text x="575" y="694" font-size="16">Cash</text>
    <text x="700" y="694" font-size="20" font-weight="bold" fill="#c62828">₹450</text>
  </g>

  <!-- Bottom Page Total Section -->
  <g filter="url(#inkRough)">
    <line x1="40" y1="780" x2="760" y2="780" stroke="#1a237e" stroke-width="2" />
    <line x1="40" y1="784" x2="760" y2="784" stroke="#1a237e" stroke-width="1" />

    <text x="160" y="820" font-size="22" font-weight="bold" fill="#1a237e" font-family="'Segoe UI', cursive">
      पेज 1 कुल संग्रह (Total Collection):
    </text>
    <text x="640" y="820" font-size="26" font-weight="bold" fill="#0d47a1" font-family="cursive">
      ₹22,950
    </text>

    <text x="160" y="860" font-size="16" fill="#424242" font-family="cursive">
      (ऑनलाइन: ₹11,300 | नकद: ₹11,650 | खर्च: ₹450)
    </text>

    <!-- Handwritten signature note -->
    <text x="520" y="930" font-size="16" fill="#1a237e" font-family="cursive">
      हस्ताक्षर: राजेश शर्मा (कोषाध्यक्ष)
    </text>
    <path d="M 520,950 Q 560,930 620,955 T 700,940" stroke="#0d47a1" stroke-width="1.8" fill="none" />
  </g>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    // School / Community Donation Register
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1150" width="800" height="1150" style="background:#f4f9f4;font-family:cursive,sans-serif;">
  <rect width="800" height="1150" fill="#f8faf6" />
  <line x1="120" y1="0" x2="120" y2="1150" stroke="#ef9a9a" stroke-width="1.5" />
  <text x="220" y="70" font-size="26" font-weight="bold" fill="#1b5e20">सरस्वती शिशु मंदिर - वार्षिक उत्सव दान सूची</text>
  <text x="320" y="105" font-size="16" fill="#2e7d32">पेज सं. 02 | सत्र 2026</text>
  <g font-size="18" fill="#1a237e">
    <text x="140" y="200">1. दीपक कुमार (कक्षा 8A) - ₹500 [Cash]</text>
    <text x="140" y="245">2. प्रो. एस. के. श्रीवास्तव - ₹2,500 [Online - UPI]</text>
    <text x="140" y="290">3. श्रीमती अनीता जैन - ₹1,100 [Cash - पुरस्कार कोष]</text>
    <text x="140" y="335">4. विजय चौधरी - ₹1,000 [PhonePe - खेलकूद]</text>
    <text x="140" y="380">5. महेश जोशी - ₹500 [Cash]</text>
  </g>
  <line x1="120" y1="450" x2="700" y2="450" stroke="#1b5e20" stroke-width="2" />
  <text x="140" y="490" font-size="22" font-weight="bold" fill="#1b5e20">कुल संग्रह (Page 2 Total): ₹5,600</text>
</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

export const SAMPLE_HOUSEHOLDS: Household[] = [
  {
    id: 'hh-singh',
    name: 'Singh Family (सिंह परिवार)',
    members: ['Vimal Singh', 'Neha Singh', 'Raghav Singh', 'Vimal Kumar Singh'],
    flatOrAddress: 'मकान नं. B-12, वसंत विहार',
    notes: 'कमेटी के सक्रिय सदस्य',
  },
  {
    id: 'hh-gupta',
    name: 'Gupta Family (गुप्ता परिवार)',
    members: ['Ramesh Chandra Gupta', 'Sunita Devi', 'Mohit Gupta'],
    flatOrAddress: 'मकान नं. C-04',
    notes: 'भंडारा प्रायोजक',
  },
  {
    id: 'hh-sharma',
    name: 'Sharma Family (शर्मा परिवार)',
    members: ['Vikas Sharma', 'Kavita Sharma'],
    flatOrAddress: 'Flat 402, टावर A',
    notes: 'मूर्ति स्थापना सहयोग',
  },
];

export const INITIAL_SAMPLE_DOCS: SourceDocument[] = [
  {
    id: 'doc-page-1',
    fileName: 'VasantVihar_Chanda_Page1.png',
    dataUrl: generateHandwrittenLedgerSVG('colony'),
    pageNumber: 1,
    uploadedAt: Date.now() - 3600000,
    recordCount: 11,
    detectedPageTotal: 22950,
    pageHeader: 'श्री गणेश उत्सव चंदा संग्रह - 2026 (पेज 1)',
    qualityNotes: 'Spotted single strike-through on line 3, ambiguous amount loop on line 9 (Pooja Patel).',
  },
];

export const INITIAL_SAMPLE_RECORDS: ExtractedRecord[] = [
  {
    id: 'rec-1',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Vimal Singh',
    amount: 2100,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Online',
    category: 'General Chanda',
    purpose: 'सामान्य चंदा (GPay)',
    date: '2026-08-25',
    householdName: 'Singh Family (सिंह परिवार)',
    householdId: 'hh-singh',
    confidence: 'high',
    rawText: '1. Vimal Singh (सिंह परिवार) - General Chanda - GPay (Online) - ₹2,100',
    verified: true,
    createdAt: Date.now() - 3500000,
  },
  {
    id: 'rec-2',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Neha Singh',
    amount: 1100,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Online',
    category: 'Bhandara',
    purpose: 'भंडारा प्रसाद सेवा (म.नं. B-12)',
    date: '2026-08-25',
    householdName: 'Singh Family (सिंह परिवार)',
    householdId: 'hh-singh',
    confidence: 'high',
    rawText: '2. Neha Singh (म.नं. B-12) - Bhandara - Online / UPI - ₹1,100',
    verified: true,
    createdAt: Date.now() - 3400000,
  },
  {
    id: 'rec-3',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Raghav Singh',
    amount: 1500,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Cash',
    category: 'Sunderkand',
    purpose: 'सुंदरकांड पाठ योगदान',
    date: '2026-08-25',
    householdName: 'Singh Family (सिंह परिवार)',
    householdId: 'hh-singh',
    confidence: 'medium',
    ambiguityNotes: 'Original ₹500 crossed out, rewritten to ₹1,500 with red ink tick.',
    rawText: '3. Raghav Singh - Sunderkand - Cash - ₹500 ₹1,500',
    verified: true,
    createdAt: Date.now() - 3300000,
    auditTrail: {
      originalAIValue: {
        amount: 500,
        transactionType: 'INCOME',
        confidence: 'medium',
      },
      userCorrectedValue: {
        amount: 1500,
        transactionType: 'INCOME',
      },
      correctedAt: Date.now() - 3000000,
      correctedReason: 'Human confirmed strikethrough was ₹1,500 update',
    },
  },
  {
    id: 'rec-4',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Ramesh Chandra Gupta',
    amount: 5000,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Cash',
    category: 'General Chanda',
    purpose: 'वार्षिक सहयोग',
    date: '2026-08-25',
    householdName: 'Gupta Family (गुpta परिवार)',
    householdId: 'hh-gupta',
    confidence: 'high',
    rawText: '4. Ramesh Chandra Gupta - General Chanda - Cash - ₹5,000',
    verified: true,
    createdAt: Date.now() - 3200000,
  },
  {
    id: 'rec-5',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Sunita Devi',
    amount: 1000,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Cash',
    category: 'Bhandara',
    purpose: 'गुप्ता जी की तरफ से भंडारा',
    date: '2026-08-25',
    householdName: 'Gupta Family (गुप्ता परिवार)',
    householdId: 'hh-gupta',
    confidence: 'high',
    rawText: '5. Sunita Devi (गुप्ता जी की तरफ से) - Bhandara - Cash - ₹1,000',
    verified: true,
    createdAt: Date.now() - 3100000,
  },
  {
    id: 'rec-6',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Vikas Sharma',
    amount: 3500,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Online',
    category: 'Murti Support',
    purpose: 'मूर्ति स्थापना एवं सजावट',
    date: '2026-08-25',
    householdName: 'Sharma Family (शर्मा परिवार)',
    householdId: 'hh-sharma',
    confidence: 'high',
    rawText: '6. Vikas Sharma (Flat 402) - Murti Support - PhonePe - ₹3,500',
    verified: true,
    createdAt: Date.now() - 3000000,
  },
  {
    id: 'rec-7',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Anand Verma',
    amount: 2000,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Cash',
    category: 'General Chanda',
    purpose: 'सामान्य चंदा',
    date: '2026-08-25',
    confidence: 'high',
    rawText: '7. Anand Verma - General Chanda - Cash - ₹2,000',
    verified: true,
    createdAt: Date.now() - 2900000,
  },
  {
    id: 'rec-8',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Vimal Kumar Singh',
    amount: 2100,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Online',
    category: 'General Chanda',
    purpose: 'Online payment entry',
    date: '2026-08-25',
    householdName: 'Singh Family (सिंह परिवार)',
    householdId: 'hh-singh',
    confidence: 'high',
    rawText: '8. Vimal Kumar Singh (Singh Fam) - General Chanda - Online - ₹2,100',
    verified: false, // Pending duplicate review
    createdAt: Date.now() - 2800000,
  },
  {
    id: 'rec-9',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Pooja Patel',
    amount: 500,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Cash',
    category: 'Bhandara',
    purpose: 'भंडारा सेवा',
    date: '2026-08-25',
    confidence: 'low',
    ambiguityNotes: 'Unclear trailing loop in handwritten amount: could be ₹500 or ₹5,000.',
    rawText: '9. Pooja Patel (? unclear flat) - Bhandara - Cash - ₹500 / ₹5000 (?)',
    verified: false,
    createdAt: Date.now() - 2700000,
  },
  {
    id: 'rec-10',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Kuldeep Yadav',
    amount: 1100,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Cash',
    category: 'Sunderkand',
    purpose: 'सुंदरकांड पाठ',
    date: '2026-08-25',
    confidence: 'high',
    rawText: '10. Kuldeep Yadav - Sunderkand - Cash - ₹1,100',
    verified: true,
    createdAt: Date.now() - 2600000,
  },
  {
    id: 'rec-11',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: 'Alok Mishra',
    amount: 2500,
    transactionType: 'INCOME',
    currency: '₹',
    paymentMode: 'Online',
    category: 'General Chanda',
    purpose: 'Paytm QR',
    date: '2026-08-25',
    confidence: 'high',
    rawText: '11. Alok Mishra - General Chanda - Paytm QR - ₹2,500',
    verified: true,
    createdAt: Date.now() - 2500000,
  },
  {
    id: 'rec-12',
    sourceImageId: 'doc-page-1',
    sourcePage: 1,
    name: '[खर्च] शाम की चाय व नाश्ता',
    amount: 450,
    transactionType: 'EXPENSE',
    currency: '₹',
    paymentMode: 'Cash',
    category: 'Expense',
    purpose: 'शाम की चाय व नाश्ता (स्वयंसेवक)',
    date: '2026-08-25',
    confidence: 'high',
    rawText: '12. [खर्च] शाम की चाय व नाश्ता - Expense - Cash - ₹450',
    verified: true,
    createdAt: Date.now() - 2400000,
  },
];
