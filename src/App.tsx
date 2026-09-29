import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { VerifiedLedger } from './components/VerifiedLedger';
import { ReportsView } from './components/ReportsView';
import { UploadCapture } from './components/UploadCapture';
import { ExtractionReview } from './components/ExtractionReview';
import { WelcomeOnboarding } from './components/WelcomeOnboarding';
import { QuickEntryModal } from './components/QuickEntryModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { SettingsModal } from './components/SettingsModal';
import { PrintView } from './components/PrintView';
import { FloatingActionButton } from './components/FloatingActionButton';
import { SourceImageViewer } from './components/SourceImageViewer';
import { AuditHistoryModal } from './components/AuditHistoryModal';

import {
  LedgerProject,
  LedgerEntry,
  SourceDocument,
  DuplicateCandidate,
  LedgerSettings,
  ProjectType,
  AIBudgetStats,
} from './types/ledger';

import {
  getProjects,
  saveProject,
  deleteProject,
  getEntries,
  saveEntry,
  saveEntries,
  deleteEntry,
  getAppMeta,
  setAppMeta,
  clearAllData,
  migrateFromLocalStorage,
  getAllDocumentImages,
  saveDocumentImage,
} from './utils/indexedDb';

import { detectDuplicates } from './utils/duplicates';
import { extractLocalCandidatesFromImage } from './utils/localCandidateExtractor';
import { runGeminiBatchAssist } from './utils/geminiAssist';
import { INITIAL_SAMPLE_DOCS, INITIAL_SAMPLE_RECORDS } from './utils/sampleData';

const DEFAULT_CATEGORIES = [
  'Donation',
  'Member Fee',
  'Expense',
  'Maintenance',
  'Operations',
  'Other',
];

export function App() {
  // Application Loading & Project State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<LedgerProject[]>([]);
  const [activeProject, setActiveProject] = useState<LedgerProject | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modals
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState<boolean>(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrintOpen, setIsPrintOpen] = useState<boolean>(false);
  const [viewerDocId, setViewerDocId] = useState<string | null>(null);
  const [auditRecord, setAuditRecord] = useState<LedgerEntry | null>(null);

  // Settings
  const [settings, setSettings] = useState<LedgerSettings>({
    projectName: 'My Ledger',
    eventOrColony: 'My Ledger',
    currency: 'INR',
    categories: DEFAULT_CATEGORIES,
    language: 'hi',
  });

  // Extraction State (Optional secondary Scan tool)
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [aiBudgetStats, setAiBudgetStats] = useState<AIBudgetStats>({
    pagesProcessed: 0,
    totalRows: 0,
    localOnlyRows: 0,
    aiAssistedRows: 0,
    geminiRequests: 0,
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Load & Migration
  useEffect(() => {
    async function initApp() {
      try {
        // Attempt migration of real user data if present in localStorage
        const migrated = await migrateFromLocalStorage();

        // Load existing projects from IndexedDB
        let allProjects = await getProjects();

        if (allProjects.length === 0 && migrated && migrated.projects.length > 0) {
          allProjects = migrated.projects;
        }

        setProjects(allProjects);

        if (allProjects.length > 0) {
          // Find previously active project or default to first
          const savedActiveId = await getAppMeta<string>('activeProjectId');
          const matched = allProjects.find((p) => p.id === savedActiveId) || allProjects[0];
          setActiveProject(matched);

          setSettings((prev) => ({
            ...prev,
            projectName: matched.name,
            categories: matched.categories || DEFAULT_CATEGORIES,
            currency: matched.currency || 'INR',
          }));

          // Load entries for this active project
          const projEntries = await getEntries(matched.id);
          setEntries(projEntries);
        } else {
          setActiveProject(null);
          setEntries([]);
        }

        // Load any stored documents
        const idbDocs = await getAllDocumentImages();
        if (idbDocs && idbDocs.length > 0) {
          setDocuments(idbDocs);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initApp();
  }, []);

  // 2. Detect Duplicates when entries change
  useEffect(() => {
    const unverified = entries.filter((r) => !r.verified);
    const verified = entries.filter((r) => r.verified);
    const foundDuplicates = detectDuplicates(unverified, verified);

    setDuplicates((prevDups) => {
      const resolvedMap = new Map(prevDups.map((d) => [d.id, d.status]));
      return foundDuplicates.map((dup) => ({
        ...dup,
        status: resolvedMap.get(dup.id) || 'pending',
      }));
    });
  }, [entries]);

  // Project Actions
  const handleCreateProject = async (
    name: string,
    initialCategories: string[],
    type: ProjectType = 'general'
  ) => {
    const newProj: LedgerProject = {
      id: 'proj-' + Date.now(),
      name: name.trim(),
      type,
      currency: 'INR',
      categories: initialCategories,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProject(newProj);
    await setAppMeta('activeProjectId', newProj.id);

    setProjects((prev) => [...prev, newProj]);
    setActiveProject(newProj);
    setEntries([]);
    setSettings((prev) => ({
      ...prev,
      projectName: newProj.name,
      categories: newProj.categories,
    }));

    setCurrentTab('dashboard');
    showToast(
      settings.language === 'hi'
        ? `बहीखाता "${newProj.name}" तैयार है!`
        : `Ledger "${newProj.name}" created!`
    );
  };

  const handleSelectProject = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    setActiveProject(target);
    await setAppMeta('activeProjectId', target.id);

    setSettings((prev) => ({
      ...prev,
      projectName: target.name,
      categories: target.categories || DEFAULT_CATEGORIES,
      currency: target.currency || 'INR',
    }));

    const projEntries = await getEntries(target.id);
    setEntries(projEntries);
    showToast(target.name);
  };

  const handleUpdateProjectName = async (newName: string) => {
    if (!activeProject) return;
    const updated: LedgerProject = {
      ...activeProject,
      name: newName,
      updatedAt: Date.now(),
    };
    await saveProject(updated);
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSettings((prev) => ({ ...prev, projectName: newName }));
  };

  // Entry Actions (Deterministic & Local-First)
  const handleSaveQuickEntry = async (
    entryData: Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt'>,
    addAnother: boolean
  ) => {
    if (!activeProject) return;

    // Deterministic auto-serial number calculation
    const existingSerials = entries.map((e) => e.serialNumber || 0);
    const maxSerial = existingSerials.length > 0 ? Math.max(...existingSerials) : 0;
    const nextSerial = maxSerial + 1;

    const newEntry: LedgerEntry = {
      ...entryData,
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId: activeProject.id,
      serialNumber: nextSerial,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      verified: true, // Manual entries are verified by default
      source: 'MANUAL',
    };

    await saveEntry(newEntry);
    setEntries((prev) => [...prev, newEntry]);

    showToast(
      settings.language === 'hi'
        ? `✓ हिसाब #${nextSerial} सहेज लिया गया`
        : `✓ Entry #${nextSerial} saved`
    );

    if (!addAnother) {
      setIsQuickEntryOpen(false);
    }
  };

  const handleUpdateRecord = async (
    id: string,
    updated: Partial<LedgerEntry>,
    reason: string = 'User manual edit'
  ) => {
    const existing = entries.find((e) => e.id === id);
    if (!existing) return;

    const updatedEntry: LedgerEntry = {
      ...existing,
      ...updated,
      updatedAt: Date.now(),
      auditTrail: {
        originalAIValue: existing.auditTrail?.originalAIValue || {
          name: existing.name,
          amount: existing.amount,
          transactionType: existing.transactionType,
          paymentMode: existing.paymentMode,
          category: existing.category,
        },
        userCorrectedValue: {
          name: updated.name || existing.name,
          amount: updated.amount !== undefined ? updated.amount : existing.amount,
          transactionType: updated.transactionType || existing.transactionType,
          paymentMode: updated.paymentMode || existing.paymentMode,
          category: updated.category || existing.category,
        },
        correctedAt: Date.now(),
        correctedReason: reason,
      },
    };

    await saveEntry(updatedEntry);
    setEntries((prev) => prev.map((e) => (e.id === id ? updatedEntry : e)));
    showToast(settings.language === 'hi' ? 'परिवर्तन सहेज लिए गए' : 'Record updated');
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast(settings.language === 'hi' ? 'हिसाब हटा दिया गया' : 'Record deleted');
  };

  // Backup & Restore
  const handleExportBackup = async () => {
    const allProjects = await getProjects();
    const allEntries = await getEntries();

    const backupData = {
      app: 'LedgerPilot',
      version: 2,
      exportedAt: Date.now(),
      projects: allProjects,
      entries: allEntries,
      settings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LedgerPilot_Backup_${(activeProject?.name || 'Ledger').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(settings.language === 'hi' ? 'बैकअप डाउनलोड हुआ' : 'Backup downloaded');
  };

  const handleRestoreBackupFile = async (file: File, mode: 'replace' | 'import_new') => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (mode === 'replace') {
        await clearAllData();

        if (parsed.version === 2 && Array.isArray(parsed.projects)) {
          for (const p of parsed.projects) {
            await saveProject(p);
          }
          if (Array.isArray(parsed.entries)) {
            await saveEntries(parsed.entries);
          }

          setProjects(parsed.projects);
          const firstProj = parsed.projects[0];
          setActiveProject(firstProj || null);
          if (firstProj) {
            const e = await getEntries(firstProj.id);
            setEntries(e);
          } else {
            setEntries([]);
          }
        } else if (Array.isArray(parsed.records)) {
          // v1 legacy restore
          const pId = 'proj-restored-' + Date.now();
          const restoredProj: LedgerProject = {
            id: pId,
            name: parsed.settings?.projectName || 'Restored Ledger',
            type: 'general',
            currency: 'INR',
            categories: parsed.settings?.categories || DEFAULT_CATEGORIES,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await saveProject(restoredProj);

          const restoredEntries: LedgerEntry[] = parsed.records.map((r: any, idx: number) => ({
            ...r,
            id: r.id || `entry-r-${idx}`,
            projectId: pId,
            serialNumber: idx + 1,
            source: 'IMPORT',
            verified: true,
          }));

          await saveEntries(restoredEntries);
          setProjects([restoredProj]);
          setActiveProject(restoredProj);
          setEntries(restoredEntries);
        }

        showToast(
          settings.language === 'hi'
            ? 'बैकअप सफलता से बहाल किया गया!'
            : 'Backup restored successfully!'
        );
      } else {
        // mode === 'import_new'
        const importPrefix = 'imp-' + Date.now() + '-';

        if (parsed.version === 2 && Array.isArray(parsed.projects)) {
          for (const p of parsed.projects) {
            const newId = importPrefix + p.id;
            const newProj = { ...p, id: newId, name: `${p.name} (Imported)` };
            await saveProject(newProj);

            // Import corresponding entries
            const pEntries = (parsed.entries || []).filter((e: any) => e.projectId === p.id);
            const remappedEntries = pEntries.map((e: any) => ({
              ...e,
              id: importPrefix + e.id,
              projectId: newId,
            }));
            await saveEntries(remappedEntries);
          }

          const reloadedProjects = await getProjects();
          setProjects(reloadedProjects);
          const imported = reloadedProjects[reloadedProjects.length - 1];
          setActiveProject(imported);
          const e = await getEntries(imported.id);
          setEntries(e);
        }

        showToast(
          settings.language === 'hi'
            ? 'खाता नए रूप में सफलतापूर्वक आयात हुआ!'
            : 'Imported as new ledger successfully!'
        );
      }
    } catch (err) {
      console.error(err);
      showToast(
        settings.language === 'hi'
          ? 'अमान्य बैकअप फ़ाइल'
          : 'Invalid backup file format'
      );
    }
  };

  // Optional Demo Loader for Testing/Preview
  const handleLoadDemoData = async () => {
    const demoId = 'proj-demo-' + Date.now();
    const demoProj: LedgerProject = {
      id: demoId,
      name: 'श्री गणेश उत्सव (Demo)',
      type: 'society',
      currency: 'INR',
      categories: ['General Chanda', 'Bhandara', 'Sunderkand', 'Expense', 'Maintenance'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveProject(demoProj);
    await setAppMeta('activeProjectId', demoId);

    const demoEntries: LedgerEntry[] = INITIAL_SAMPLE_RECORDS.map((r, idx) => ({
      ...r,
      projectId: demoId,
      serialNumber: idx + 1,
      source: 'MANUAL',
      verified: true,
    }));

    await saveEntries(demoEntries);

    setProjects((prev) => [...prev, demoProj]);
    setActiveProject(demoProj);
    setEntries(demoEntries);
    setSettings((prev) => ({
      ...prev,
      projectName: demoProj.name,
      categories: demoProj.categories,
    }));

    setCurrentTab('dashboard');
    showToast(
      settings.language === 'hi'
        ? '💡 नमूना डेमो डेटा लोड कर दिया गया है'
        : 'Demo ledger loaded'
    );
  };

  const handleResetAllData = async () => {
    await clearAllData();
    setProjects([]);
    setActiveProject(null);
    setEntries([]);
    setDocuments([]);
    setCurrentTab('dashboard');
    showToast(settings.language === 'hi' ? 'सारा डेटा हटा दिया गया' : 'All data reset');
  };

  // Optional Local-First OCR Extraction (Under Scan Tab)
  const handleStartLocalExtraction = async (
    items: Array<{ previewUrl: string; fileName: string; pageNumber: number; file?: File }>
  ) => {
    if (!activeProject) return;
    setIsExtracting(true);

    let extractedCount = 0;
    const newRecordsBatch: LedgerEntry[] = [];
    const newDocsBatch: SourceDocument[] = [];

    const existingSerials = entries.map((e) => e.serialNumber || 0);
    let currentSerial = existingSerials.length > 0 ? Math.max(...existingSerials) : 0;

    for (const item of items) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        const imageSource = item.file || item.previewUrl;
        const localResult = await extractLocalCandidatesFromImage(imageSource, {
          pageNumber: item.pageNumber,
          docId,
          currency: settings.currency,
          existingCategories: settings.categories,
        });

        const newDoc: SourceDocument = {
          id: docId,
          fileName: item.fileName,
          dataUrl: item.previewUrl,
          pageNumber: item.pageNumber,
          uploadedAt: Date.now(),
          recordCount: localResult.records.length,
          detectedPageTotal: localResult.detectedPageTotal,
          pageHeader: localResult.pageHeader,
          qualityNotes: localResult.qualityNotes,
          extractionEngine: 'LOCAL_PADDLEOCR',
        };

        newDocsBatch.push(newDoc);
        await saveDocumentImage(newDoc);

        for (const r of localResult.records) {
          currentSerial += 1;
          newRecordsBatch.push({
            ...r,
            projectId: activeProject.id,
            serialNumber: currentSerial,
            verified: false, // OCR candidates start unverified
          });
        }

        extractedCount += localResult.records.length;
      } catch (err) {
        console.error('Scan error:', err);
      }
    }

    if (newRecordsBatch.length > 0) {
      await saveEntries(newRecordsBatch);
      setEntries((prev) => [...prev, ...newRecordsBatch]);
      setDocuments((prev) => [...prev, ...newDocsBatch]);
    }

    setIsExtracting(false);
    showToast(
      settings.language === 'hi'
        ? `पर्चे से ${extractedCount} प्रविष्टियां खोजी गईं`
        : `Extracted ${extractedCount} candidates`
    );

    setCurrentTab('ledger');
  };

  // If loading IndexedDB, render minimal neutral splash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-stone-300 border-t-emerald-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-stone-500">LedgerPilot...</p>
        </div>
      </div>
    );
  }

  // FIRST LAUNCH / ZERO PROJECTS: Show Welcome Onboarding Screen!
  if (projects.length === 0 || !activeProject) {
    return (
      <>
        <WelcomeOnboarding
          onStartNewProject={() => setIsCreateProjectOpen(true)}
          onRestoreBackup={(file) => handleRestoreBackupFile(file, 'replace')}
          onLoadDemo={handleLoadDemoData}
          language={settings.language}
        />

        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          onCreate={handleCreateProject}
          language={settings.language}
        />

        {toastMessage && (
          <div className="fixed bottom-6 right-4 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in">
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  // Full formal print view
  if (isPrintOpen) {
    return (
      <PrintView
        records={entries}
        documents={documents}
        settings={settings}
        onBack={() => setIsPrintOpen(false)}
        language={settings.language}
      />
    );
  }

  const existingPartyNames = Array.from(new Set(entries.map((e) => e.name).filter(Boolean)));
  const nextSerialNum =
    entries.length > 0 ? Math.max(...entries.map((e) => e.serialNumber || 0)) + 1 : 1;
  const unverifiedCount = entries.filter((e) => !e.verified).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col selection:bg-emerald-100">
      {/* 1. Desktop & Mobile Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        onOpenBackupModal={handleExportBackup}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        onUpdateSettings={setSettings}
        unverifiedCount={unverifiedCount}
      />

      {/* 2. Main Content View Router */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            records={entries}
            documents={documents}
            duplicates={duplicates}
            onSelectTab={setCurrentTab}
            onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
            onOpenBackupModal={handleExportBackup}
            onEditRecord={() => setCurrentTab('ledger')}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'ledger' && (
          <VerifiedLedger
            records={entries}
            onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onViewSource={(docId) => setViewerDocId(docId)}
            onOpenAuditHistory={(r) => setAuditRecord(r)}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            records={entries}
            documents={documents}
            onOpenPrint={() => setIsPrintOpen(true)}
            settings={settings}
            language={settings.language}
          />
        )}

        {currentTab === 'scan' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-stone-900">
                {settings.language === 'hi' ? '📷 पर्ची / रजिस्टर स्कैन' : 'Scan Page / Register'}
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                {settings.language === 'hi'
                  ? 'हस्तलिखित पन्ने की फोटो से स्वचालित प्रविष्टियां निकालें (वैकल्पिक)'
                  : 'Optionally scan handwritten pages into line items'}
              </p>
            </div>
            <UploadCapture
              onStartLocalExtraction={handleStartLocalExtraction}
              isExtracting={isExtracting}
              settings={settings}
              language={settings.language}
              aiBudgetStats={aiBudgetStats}
              onUpdateSettings={setSettings}
            />
          </div>
        )}
      </main>

      {/* 3. Mobile Persistent Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        unverifiedCount={unverifiedCount}
      />

      {/* 4. Mobile Persistent Floating Action Button (FAB) */}
      <FloatingActionButton
        onClick={() => setIsQuickEntryOpen(true)}
        language={settings.language}
      />

      {/* 5. Quick Entry Modal (The primary manual creation flow) */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        onSave={handleSaveQuickEntry}
        nextSerialNumber={nextSerialNum}
        categories={settings.categories}
        existingNames={existingPartyNames}
        currency={settings.currency === 'INR' ? '₹' : settings.currency}
        language={settings.language}
      />

      {/* 6. Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreate={handleCreateProject}
        language={settings.language}
      />

      {/* 7. Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        activeProject={activeProject}
        onUpdateProjectName={handleUpdateProjectName}
        onExportBackup={handleExportBackup}
        onRestoreBackupFile={handleRestoreBackupFile}
        onLoadDemoData={handleLoadDemoData}
        onResetAllData={handleResetAllData}
        language={settings.language}
      />

      {/* 8. Source Image Viewer Modal */}
      {viewerDocId && (
        <SourceImageViewer
          documents={documents}
          currentDocId={viewerDocId}
          records={entries}
          onClose={() => setViewerDocId(null)}
          onSelectDoc={(id) => setViewerDocId(id)}
          language={settings.language}
        />
      )}

      {/* 9. Audit History Modal */}
      {auditRecord && (
        <AuditHistoryModal
          record={auditRecord}
          onClose={() => setAuditRecord(null)}
          language={settings.language}
        />
      )}

      {/* 10. Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
