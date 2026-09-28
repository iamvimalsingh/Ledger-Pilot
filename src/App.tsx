import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { UploadCapture } from './components/UploadCapture';
import { ExtractionReview } from './components/ExtractionReview';
import { VerifiedLedger } from './components/VerifiedLedger';
import { ReconciliationSummary } from './components/ReconciliationSummary';
import { HouseholdManager } from './components/HouseholdManager';
import { ReportsView } from './components/ReportsView';
import { SourceImageViewer } from './components/SourceImageViewer';
import { DuplicateReviewModal } from './components/DuplicateReviewModal';
import { SettingsModal } from './components/SettingsModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { PrintView } from './components/PrintView';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ExceptionInbox } from './components/ExceptionInbox';
import { LocalOCRTestLab } from './components/LocalOCRTestLab';

import {
  ExtractedRecord,
  SourceDocument,
  DuplicateCandidate,
  Household,
  LedgerSettings,
  ProjectMetadata,
} from './types/ledger';

import {
  INITIAL_SAMPLE_DOCS,
  INITIAL_SAMPLE_RECORDS,
  SAMPLE_HOUSEHOLDS,
  DEMO_PROJECT_METADATA,
} from './utils/sampleData';

import { detectDuplicates } from './utils/duplicates';
import {
  saveDocumentImage,
  getAllDocumentImages,
  clearAllDocuments,
} from './utils/indexedDb';
import { migrateRecordTransactionType } from './utils/reconciliation';
import { getLedgerExceptions } from './utils/exceptions';

const STORAGE_KEY_RECORDS = 'ledgerpilot_records_v1';
const STORAGE_KEY_HOUSEHOLDS = 'ledgerpilot_households_v1';
const STORAGE_KEY_SETTINGS = 'ledgerpilot_settings_v1';
const STORAGE_KEY_PROJECT = 'ledgerpilot_project_metadata_v1';

const DEFAULT_CATEGORIES = [
  'Donation',
  'Contribution',
  'Member Fee',
  'Expense',
  'Maintenance',
  'Operations',
  'Other',
];

const DEFAULT_PROJECT_METADATA: ProjectMetadata = {
  id: 'proj-default',
  name: 'New Ledger',
  description: 'Default financial ledger',
  createdAt: 1724544000000,
};

export function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Core Data State with safe backward-compatibility migration
  const [records, setRecords] = useState<ExtractedRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(migrateRecordTransactionType);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SAMPLE_RECORDS;
  });

  const [documents, setDocuments] = useState<SourceDocument[]>(INITIAL_SAMPLE_DOCS);

  const [households, setHouseholds] = useState<Household[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HOUSEHOLDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return SAMPLE_HOUSEHOLDS;
  });

  const [activeProject, setActiveProject] = useState<ProjectMetadata>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.name !== 'श्री गणेश उत्सव - वसंत विहार') {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PROJECT_METADATA;
  });

  const [settings, setSettings] = useState<LedgerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sanitize legacy festival string to clean neutral default
        if (
          parsed.eventOrColony === 'श्री गणेश उत्सव - वसंत विहार' ||
          (parsed.projectName === 'LedgerPilot' && parsed.eventOrColony === 'श्री गणेश उत्सव - वसंत विहार')
        ) {
          parsed.projectName = 'New Ledger';
          parsed.eventOrColony = 'New Ledger';
        }
        if (parsed.categories && parsed.categories.includes('General Chanda')) {
          parsed.categories = DEFAULT_CATEGORIES;
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      projectName: 'New Ledger',
      eventOrColony: 'New Ledger',
      currency: 'INR',
      categories: DEFAULT_CATEGORIES,
      language: 'hi',
    };
  });

  // Duplicates State
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);

  // Modals & Overlays
  const [viewerDocId, setViewerDocId] = useState<string | null>(null);
  const [highlightRecordId, setHighlightRecordId] = useState<string | null>(null);
  const [auditRecord, setAuditRecord] = useState<ExtractedRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load documents from IndexedDB on startup
  useEffect(() => {
    async function loadDocs() {
      try {
        const idbDocs = await getAllDocumentImages();
        if (idbDocs && idbDocs.length > 0) {
          setDocuments(idbDocs);
        } else {
          // Initialize sample doc into IndexedDB
          for (const doc of INITIAL_SAMPLE_DOCS) {
            await saveDocumentImage(doc);
          }
        }
      } catch (err) {
        console.error('Error loading documents from IndexedDB:', err);
      }
    }
    loadDocs();
  }, []);

  // Save records & households to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records to localStorage:', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HOUSEHOLDS, JSON.stringify(households));
    } catch (e) {
      console.error('Failed to save households to localStorage:', e);
    }
  }, [households]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  // Recalculate Duplicates when records change
  useEffect(() => {
    const unverified = records.filter((r) => !r.verified);
    const verified = records.filter((r) => r.verified);

    // Also detect internal duplicates within unverified batch
    const foundDuplicates = detectDuplicates(unverified, verified);

    // Maintain resolved statuses
    setDuplicates((prevDups) => {
      const resolvedMap = new Map(prevDups.map((d) => [d.id, d.status]));
      return foundDuplicates.map((dup) => ({
        ...dup,
        status: resolvedMap.get(dup.id) || 'pending',
      }));
    });
  }, [records]);

  // Handle Gemini Extraction
  const handleStartExtraction = async (
    items: Array<{ previewUrl: string; fileName: string; pageNumber: number }>
  ) => {
    setIsExtracting(true);

    let extractedCount = 0;
    const newRecordsBatch: ExtractedRecord[] = [];
    const newDocsBatch: SourceDocument[] = [];
    const failedErrors: string[] = [];

    for (const item of items) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const response = await fetch('/api/extract-ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: item.previewUrl,
            pageNumber: item.pageNumber,
            projectName: settings.projectName,
            categories: settings.categories,
            existingHouseholds: households.map((h) => h.name),
          }),
        });

        if (!response.ok) {
          let errorMsg = `Server returned status ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.error) errorMsg = errData.error;
          } catch {
            // response was not JSON
          }
          throw new Error(errorMsg);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.records) && data.records.length > 0) {
          const doc: SourceDocument = {
            id: docId,
            fileName: item.fileName,
            dataUrl: item.previewUrl,
            pageNumber: item.pageNumber,
            uploadedAt: Date.now(),
            recordCount: data.records.length,
            detectedPageTotal: data.detectedPageTotal,
            pageHeader: data.pageHeader || item.fileName,
            qualityNotes: data.qualityNotes || '',
          };

          await saveDocumentImage(doc);
          newDocsBatch.push(doc);

          // Map extracted records
          const mappedRecords: ExtractedRecord[] = data.records.map((r: any, idx: number) => ({
            id: `rec-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            sourceImageId: docId,
            sourcePage: item.pageNumber,
            name: r.name,
            amount: Math.abs(Number(r.amount)) || 0,
            transactionType:
              r.transactionType === 'EXPENSE'
                ? 'EXPENSE'
                : r.transactionType === 'INCOME'
                ? 'INCOME'
                : 'UNCLASSIFIED',
            currency: r.currency || '₹',
            paymentMode: r.paymentMode,
            category: r.category,
            purpose: r.purpose || '',
            date: r.date || '',
            householdName: r.householdName || '',
            confidence: r.confidence,
            ambiguityNotes: r.ambiguityNotes || '',
            rawText: r.rawText || '',
            verified: false, // Requires human confirmation!
            createdAt: Date.now(),
          }));

          newRecordsBatch.push(...mappedRecords);
          extractedCount += mappedRecords.length;
        } else {
          throw new Error(data.error || 'No recognizable ledger records found on this page.');
        }
      } catch (err: any) {
        console.error('AI Extraction failed for item:', item.fileName, err);
        failedErrors.push(`${item.fileName || `Page ${item.pageNumber}`}: ${err?.message || 'Extraction failed'}`);
      }
    }

    setIsExtracting(false);

    if (newDocsBatch.length > 0) {
      setDocuments((prev) => [...prev, ...newDocsBatch]);
      setRecords((prev) => [...prev, ...newRecordsBatch]);
    }

    if (failedErrors.length > 0 && newDocsBatch.length === 0) {
      // Total failure - show error toast and fail closed
      showToast(
        settings.language === 'hi'
          ? `❌ AI निष्कर्षण विफल: ${failedErrors[0]}। कृपया पुनः प्रयास करें।`
          : `❌ Extraction failed: ${failedErrors[0]}. Please retry.`
      );
      return;
    }

    if (failedErrors.length > 0 && newDocsBatch.length > 0) {
      // Partial failure
      showToast(
        settings.language === 'hi'
          ? `⚠️ ${extractedCount} रिकॉर्ड्स निकाले गए, परंतु कुछ पन्नों में त्रुटि हुई: ${failedErrors.join('; ')}`
          : `⚠️ Extracted ${extractedCount} records, but some pages failed: ${failedErrors.join('; ')}`
      );
      setCurrentTab('review');
      return;
    }

    showToast(
      settings.language === 'hi'
        ? `🤖 AI ने सफलता से ${extractedCount} प्रविष्टियां निकालीं! अब समीक्षा करें।`
        : `🤖 AI extracted ${extractedCount} records! Please review.`
    );

    // Switch to Review Tab on success
    setCurrentTab('review');
  };

  // Record Actions
  const handleApproveRecord = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.transactionType === 'UNCLASSIFIED') return r; // Cannot verify without selecting transaction direction
        return { ...r, verified: true };
      })
    );
    showToast(settings.language === 'hi' ? '✓ रिकॉर्ड सत्यापित हुआ' : 'Record verified');
  };

  const handleApproveAll = (ids: string[]) => {
    const idSet = new Set(ids);
    setRecords((prev) =>
      prev.map((r) => {
        if (!idSet.has(r.id)) return r;
        if (r.transactionType === 'UNCLASSIFIED') return r; // Skip unclassified records in bulk approval
        return { ...r, verified: true };
      })
    );
    showToast(
      settings.language === 'hi'
        ? `✓ रिकॉर्ड्स स्वीकृत एवं सत्यापित हुए`
        : `Records verified`
    );
  };

  const handleUpdateRecord = (
    id: string,
    updated: Partial<ExtractedRecord>,
    reason: string = 'User manual edit'
  ) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        // Preserve audit trail if amount, name, paymentMode, or transactionType is modified
        const hasChange =
          (updated.name && updated.name !== r.name) ||
          (updated.amount !== undefined && updated.amount !== r.amount) ||
          (updated.paymentMode && updated.paymentMode !== r.paymentMode) ||
          (updated.transactionType && updated.transactionType !== r.transactionType);

        const auditTrail = hasChange
          ? {
              originalAIValue: r.auditTrail?.originalAIValue || {
                name: r.name,
                amount: r.amount,
                transactionType: r.transactionType,
                paymentMode: r.paymentMode,
                category: r.category,
                confidence: r.confidence,
              },
              userCorrectedValue: {
                name: updated.name || r.name,
                amount: updated.amount !== undefined ? updated.amount : r.amount,
                transactionType: updated.transactionType || r.transactionType,
                paymentMode: updated.paymentMode || r.paymentMode,
                category: updated.category || r.category,
              },
              correctedAt: Date.now(),
              correctedReason: reason,
            }
          : r.auditTrail;

        return {
          ...r,
          ...updated,
          auditTrail,
        };
      })
    );

    showToast(settings.language === 'hi' ? 'परिवर्तन सहेज लिए गए' : 'Record updated');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast(settings.language === 'hi' ? 'रिकॉर्ड हटाया गया' : 'Record deleted');
  };

  const handleToggleUncertain = (id: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              confidence: r.confidence === 'low' ? 'high' : 'low',
              ambiguityNotes:
                r.confidence === 'low'
                  ? ''
                  : 'Manually flagged as uncertain by human auditor.',
            }
          : r
      )
    );
  };

  // Duplicate Actions
  const handleMergeDuplicate = (candidateId: string, mergedRecord: ExtractedRecord) => {
    const candidate = duplicates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Remove the new record, update the existing record
    setRecords((prev) =>
      prev
        .filter((r) => r.id !== candidate.newRecordId)
        .map((r) => (r.id === candidate.existingRecordId ? mergedRecord : r))
    );

    setDuplicates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'merged' } : c))
    );

    showToast(settings.language === 'hi' ? 'डुप्लिकेट सफलतापूर्वक मर्ज हुआ' : 'Duplicate merged');
  };

  const handleKeepSeparate = (candidateId: string) => {
    setDuplicates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'kept_separate' } : c))
    );
    showToast(settings.language === 'hi' ? 'दोनों प्रविष्टियां अलग रखी गईं' : 'Kept separate');
  };

  const handleIgnoreDuplicate = (candidateId: string) => {
    setDuplicates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'ignored' } : c))
    );
  };

  // Update Document Handwritten Total (Deterministic Mathematical Validation)
  const handleUpdateDocumentTotal = async (docId: string, newTotal: number | undefined) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, detectedPageTotal: newTotal } : doc))
    );
    const targetDoc = documents.find((d) => d.id === docId);
    if (targetDoc) {
      await saveDocumentImage({ ...targetDoc, detectedPageTotal: newTotal });
    }
    showToast(
      settings.language === 'hi'
        ? 'पृष्ठ कुल योग अद्यतन किया गया'
        : 'Handwritten page total updated'
    );
  };

  // View Source Document
  const handleViewSource = (docId: string, recordId?: string) => {
    setViewerDocId(docId);
    setHighlightRecordId(recordId || null);
  };

  // Drilldown from Summary
  const handleSummaryDrilldown = (filterType: string, filterValue: string) => {
    setCurrentTab('ledger');
  };

  // Approve Proposed Reconciliation
  const handleApproveProposedReconciliation = () => {
    setRecords((prev) =>
      prev.map((r) => (r.transactionType === 'UNCLASSIFIED' ? r : { ...r, verified: true }))
    );
    showToast(
      settings.language === 'hi'
        ? '✓ प्रस्तावित सामंजस्य स्वीकृत हुआ! सभी वर्गीकृत रिकॉर्ड्स सत्यापित लेजर में दर्ज हुए।'
        : 'Reconciliation approved! Classified records moved to verified ledger.'
    );
    setCurrentTab('ledger');
  };

  // Create New Project (Single source of truth)
  const handleCreateProject = (newProjectName: string, initialCategories: string[]) => {
    const trimmed = newProjectName.trim() || 'New Ledger';
    const newProj: ProjectMetadata = {
      id: `proj-${Date.now()}`,
      name: trimmed,
      createdAt: Date.now(),
    };
    setActiveProject(newProj);
    const updatedSettings: LedgerSettings = {
      ...settings,
      projectName: trimmed,
      eventOrColony: trimmed,
      categories: initialCategories.length > 0 ? initialCategories : DEFAULT_CATEGORIES,
    };
    setSettings(updatedSettings);

    // Initialize clean state for the new project
    setRecords([]);
    setDocuments([]);
    setHouseholds([]);
    setDuplicates([]);
    clearAllDocuments().catch(console.error);

    try {
      localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(newProj));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSettings));
      localStorage.removeItem(STORAGE_KEY_RECORDS);
      localStorage.removeItem(STORAGE_KEY_HOUSEHOLDS);
    } catch (e) {
      console.error(e);
    }

    showToast(
      settings.language === 'hi'
        ? `नया प्रोजेक्ट "${trimmed}" तैयार है`
        : `New project "${trimmed}" created`
    );
    setCurrentTab('dashboard');
  };

  // Update Settings
  const handleUpdateSettings = (newSettings: LedgerSettings) => {
    const updated: LedgerSettings = {
      ...newSettings,
      eventOrColony: newSettings.projectName,
    };
    setSettings(updated);
    if (newSettings.projectName && newSettings.projectName !== activeProject.name) {
      const updatedProj: ProjectMetadata = {
        ...activeProject,
        name: newSettings.projectName,
      };
      setActiveProject(updatedProj);
      try {
        localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(updatedProj));
      } catch (e) {
        console.error(e);
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Reset to initial sample data (Explicit DEMO fixture)
  const handleResetSampleData = async () => {
    await clearAllDocuments();
    for (const doc of INITIAL_SAMPLE_DOCS) {
      await saveDocumentImage(doc);
    }
    setDocuments(INITIAL_SAMPLE_DOCS);
    setRecords(INITIAL_SAMPLE_RECORDS);
    setHouseholds(SAMPLE_HOUSEHOLDS);
    setActiveProject(DEMO_PROJECT_METADATA);
    const demoSettings: LedgerSettings = {
      ...settings,
      projectName: DEMO_PROJECT_METADATA.name,
      eventOrColony: DEMO_PROJECT_METADATA.name,
    };
    setSettings(demoSettings);
    try {
      localStorage.setItem(STORAGE_KEY_PROJECT, JSON.stringify(DEMO_PROJECT_METADATA));
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(demoSettings));
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(INITIAL_SAMPLE_RECORDS));
      localStorage.setItem(STORAGE_KEY_HOUSEHOLDS, JSON.stringify(SAMPLE_HOUSEHOLDS));
    } catch (e) {
      console.error(e);
    }
    setIsSettingsOpen(false);
    showToast(
      settings.language === 'hi'
        ? 'डेमो नमूना लेजर पुनः लोड किया गया'
        : 'Demo sample ledger reloaded'
    );
  };

  // Export JSON
  const handleExportJSON = () => {
    const backup = {
      version: 1,
      appName: 'LedgerPilot',
      exportedAt: new Date().toISOString(),
      settings,
      records,
      households,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LedgerPilot_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.records && Array.isArray(parsed.records)) {
          setRecords(parsed.records);
          if (parsed.households) setHouseholds(parsed.households);
          if (parsed.settings) setSettings(parsed.settings);
          showToast(settings.language === 'hi' ? 'बैकअप सफलता से बहाल किया गया!' : 'Backup restored!');
          setIsSettingsOpen(false);
        }
      } catch (err) {
        showToast('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  // If Print view is active, render full printable sheet
  if (isPrintOpen) {
    return (
      <PrintView
        records={records}
        documents={documents}
        settings={settings}
        onBack={() => setIsPrintOpen(false)}
        language={settings.language}
      />
    );
  }

  const unverifiedCount = records.filter((r) => !r.verified).length;
  const pendingDuplicateCount = duplicates.filter((d) => d.status === 'pending').length;
  const exceptions = getLedgerExceptions(records, documents, duplicates);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-100 flex flex-col">
      {/* Top Sticky Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unverifiedCount={unverifiedCount}
        duplicateCount={pendingDuplicateCount}
        exceptionCount={exceptions.length}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            records={records}
            documents={documents}
            duplicates={duplicates}
            onSelectTab={setCurrentTab}
            onViewSource={handleViewSource}
            settings={settings}
            language={settings.language}
            onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          />
        )}

        {currentTab === 'inbox' && (
          <ExceptionInbox
            records={records}
            documents={documents}
            duplicates={duplicates}
            onViewSource={handleViewSource}
            onReviewRecord={(recordId) => {
              setCurrentTab('review');
            }}
            onReviewDuplicate={(candidateId) => {
              setCurrentTab('duplicates');
            }}
            onReviewPageTotal={(docId) => {
              setCurrentTab('review');
            }}
            onUpdateRecord={handleUpdateRecord}
            onNavigateToTab={setCurrentTab}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'upload' && (
          <UploadCapture
            onStartExtraction={handleStartExtraction}
            isExtracting={isExtracting}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'review' && (
          <ExtractionReview
            records={records}
            documents={documents}
            onUpdateDocumentTotal={handleUpdateDocumentTotal}
            onApproveRecord={handleApproveRecord}
            onApproveAll={handleApproveAll}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onToggleUncertain={handleToggleUncertain}
            onViewSource={handleViewSource}
            onOpenAuditHistory={(rec) => setAuditRecord(rec)}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'ledger' && (
          <VerifiedLedger
            records={records}
            onViewSource={handleViewSource}
            onOpenAuditHistory={(rec) => setAuditRecord(rec)}
            onDeleteRecord={handleDeleteRecord}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'summary' && (
          <ReconciliationSummary
            records={records}
            documents={documents}
            duplicates={duplicates}
            onDrilldown={handleSummaryDrilldown}
            onApproveProposedReconciliation={handleApproveProposedReconciliation}
            onViewSource={handleViewSource}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'households' && (
          <HouseholdManager
            households={households}
            records={records}
            onAddHousehold={(h) => setHouseholds((prev) => [...prev, h])}
            onUpdateHousehold={(id, updated) =>
              setHouseholds((prev) => prev.map((h) => (h.id === id ? { ...h, ...updated } : h)))
            }
            onDeleteHousehold={(id) => setHouseholds((prev) => prev.filter((h) => h.id !== id))}
            onViewHouseholdRecords={(name) => {
              setCurrentTab('ledger');
            }}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            records={records}
            documents={documents}
            onViewSource={handleViewSource}
            onOpenPrint={() => setIsPrintOpen(true)}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'duplicates' && (
          <DuplicateReviewModal
            candidates={duplicates}
            onMerge={handleMergeDuplicate}
            onKeepSeparate={handleKeepSeparate}
            onIgnore={handleIgnoreDuplicate}
            onClose={() => setCurrentTab('review')}
            language={settings.language}
          />
        )}

        {currentTab === 'local-ocr-test' && <LocalOCRTestLab />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        unverifiedCount={unverifiedCount}
        exceptionCount={exceptions.length}
        settings={settings}
      />

      {/* Original Image Viewer Modal */}
      {viewerDocId && (
        <SourceImageViewer
          documents={documents}
          currentDocId={viewerDocId}
          highlightRecordId={highlightRecordId}
          records={records}
          onUpdateDocumentTotal={handleUpdateDocumentTotal}
          onClose={() => {
            setViewerDocId(null);
            setHighlightRecordId(null);
          }}
          onSelectDoc={(id) => setViewerDocId(id)}
          language={settings.language}
        />
      )}

      {/* Audit History Modal */}
      {auditRecord && (
        <AuditHistoryModal
          record={auditRecord}
          onClose={() => setAuditRecord(null)}
          language={settings.language}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleUpdateSettings}
          onResetSampleData={handleResetSampleData}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onClose={() => setIsSettingsOpen(false)}
          language={settings.language}
        />
      )}

      {/* Create New Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreate={handleCreateProject}
        language={settings.language}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-18 md:bottom-6 right-4 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-stone-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
export default App;
