import { LedgerEntry, LedgerProject } from '../types/ledger';

const DB_NAME = 'LedgerPilotDB';
const DB_VERSION = 2;

export const STORE_PROJECTS = 'projects';
export const STORE_ENTRIES = 'entries';
export const STORE_DOCS = 'source_documents';
export const STORE_META = 'app_meta';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Projects store
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }

      // Entries store
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const entryStore = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
        entryStore.createIndex('projectId', 'projectId', { unique: false });
        entryStore.createIndex('transactionType', 'transactionType', { unique: false });
        entryStore.createIndex('date', 'date', { unique: false });
        entryStore.createIndex('serialNumber', 'serialNumber', { unique: false });
      }

      // Source documents store (preserves scanned page images)
      if (!db.objectStoreNames.contains(STORE_DOCS)) {
        db.createObjectStore(STORE_DOCS, { keyPath: 'id' });
      }

      // Metadata store
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects(): Promise<LedgerProject[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error fetching projects from IndexedDB:', err);
    return [];
  }
}

export async function saveProject(project: LedgerProject): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.put(project);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROJECTS, STORE_ENTRIES], 'readwrite');
    const projectStore = tx.objectStore(STORE_PROJECTS);
    const entryStore = tx.objectStore(STORE_ENTRIES);

    projectStore.delete(projectId);

    // Delete associated entries
    const index = entryStore.index('projectId');
    const req = index.openCursor(IDBKeyRange.only(projectId));
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================================================
// ENTRIES
// ============================================================================

export async function getEntries(projectId?: string): Promise<LedgerEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ENTRIES, 'readonly');
      const store = tx.objectStore(STORE_ENTRIES);

      if (projectId) {
        const index = store.index('projectId');
        const req = index.getAll(IDBKeyRange.only(projectId));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } else {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }
    });
  } catch (err) {
    console.error('Error fetching entries from IndexedDB:', err);
    return [];
  }
}

export async function saveEntry(entry: LedgerEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_ENTRIES);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveEntries(entries: LedgerEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_ENTRIES);
    for (const entry of entries) {
      store.put(entry);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ENTRIES, 'readwrite');
    const store = tx.objectStore(STORE_ENTRIES);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ============================================================================
// APP METADATA
// ============================================================================

export async function getAppMeta<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error getting app metadata:', err);
    return null;
  }
}

export async function setAppMeta(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, 'readwrite');
      const store = tx.objectStore(STORE_META);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error setting app metadata:', err);
  }
}

// ============================================================================
// SOURCE DOCUMENTS
// ============================================================================

export async function saveDocumentImage(doc: {
  id: string;
  fileName: string;
  dataUrl: string;
  pageNumber: number;
  uploadedAt: number;
  detectedPageTotal?: number;
  pageHeader?: string;
  qualityNotes?: string;
}): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.put(doc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error saving document to IndexedDB:', err);
  }
}

export async function getDocumentImage(id: string): Promise<any | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readonly');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error getting document from IndexedDB:', err);
    return null;
  }
}

export async function getAllDocumentImages(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readonly');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error getting all documents from IndexedDB:', err);
    return [];
  }
}

export async function deleteDocumentImage(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error deleting document from IndexedDB:', err);
  }
}

export async function clearAllDocuments(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCS, 'readwrite');
      const store = tx.objectStore(STORE_DOCS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error clearing documents:', err);
  }
}

// ============================================================================
// RESET & MIGRATION
// ============================================================================

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_PROJECTS, STORE_ENTRIES, STORE_DOCS, STORE_META], 'readwrite');
    tx.objectStore(STORE_PROJECTS).clear();
    tx.objectStore(STORE_ENTRIES).clear();
    tx.objectStore(STORE_DOCS).clear();
    tx.objectStore(STORE_META).clear();
    tx.oncomplete = () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ledgerpilot_records_v1');
        localStorage.removeItem('ledgerpilot_households_v1');
        localStorage.removeItem('ledgerpilot_settings_v1');
        localStorage.removeItem('ledgerpilot_project_metadata_v1');
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Migrates existing data from localStorage if real user records exist.
 * Checks for known sample names (Vimal Singh, Neha Singh, etc.).
 * If only sample data is found, it is safely cleared so fresh launch is clean.
 */
export async function migrateFromLocalStorage(): Promise<{
  projects: LedgerProject[];
  entries: LedgerEntry[];
  activeProjectId?: string;
} | null> {
  if (typeof window === 'undefined') return null;

  try {
    const rawRecords = localStorage.getItem('ledgerpilot_records_v1');
    if (!rawRecords) return null;

    const parsed = JSON.parse(rawRecords);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    // Detect if this is only the sample mock data
    const SAMPLE_NAMES = new Set([
      'Vimal Singh',
      'Neha Singh',
      'Raghav Singh',
      'Ramesh Chandra Gupta',
      'Sunita Sharma',
      'Prakash Verma',
      'Anand Mohan Mishra',
      'Tent & Sound Service',
    ]);

    const isAllSample = parsed.every((r: any) => SAMPLE_NAMES.has(r.name) || r.id?.startsWith('rec-00'));

    if (isAllSample) {
      // Clean up mock fixtures from localStorage so they don't corrupt fresh state
      localStorage.removeItem('ledgerpilot_records_v1');
      localStorage.removeItem('ledgerpilot_households_v1');
      return null;
    }

    // Real user data detected! Migrate to IndexedDB
    const savedSettings = localStorage.getItem('ledgerpilot_settings_v1');
    const parsedSettings = savedSettings ? JSON.parse(savedSettings) : null;
    const projectName = parsedSettings?.projectName || 'My Ledger';

    const projectId = 'proj-migrated-' + Date.now();
    const newProject: LedgerProject = {
      id: projectId,
      name: projectName,
      type: 'general',
      currency: parsedSettings?.currency || 'INR',
      categories: parsedSettings?.categories || [
        'Donation',
        'Member Fee',
        'Expense',
        'Maintenance',
        'Operations',
        'Other',
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const entriesToSave: LedgerEntry[] = parsed.map((r: any, idx: number) => ({
      id: r.id || `entry-migrated-${idx}-${Date.now()}`,
      projectId,
      serialNumber: idx + 1,
      transactionType: r.transactionType || 'INCOME',
      name: r.name || 'Unnamed',
      amount: Math.abs(Number(r.amount)) || 0,
      currency: r.currency || 'INR',
      paymentMode: r.paymentMode || 'Cash',
      category: r.category || 'Other',
      purpose: r.purpose || '',
      date: r.date || new Date().toISOString().split('T')[0],
      source: 'MANUAL',
      verified: Boolean(r.verified),
      createdAt: r.createdAt || Date.now(),
      updatedAt: Date.now(),
      notes: r.notes || r.ambiguityNotes,
      auditTrail: r.auditTrail,
    }));

    await saveProject(newProject);
    await saveEntries(entriesToSave);
    await setAppMeta('activeProjectId', projectId);

    // Clean up localStorage records to avoid double-migration
    localStorage.removeItem('ledgerpilot_records_v1');

    return {
      projects: [newProject],
      entries: entriesToSave,
      activeProjectId: projectId,
    };
  } catch (err) {
    console.error('Migration error:', err);
    return null;
  }
}
