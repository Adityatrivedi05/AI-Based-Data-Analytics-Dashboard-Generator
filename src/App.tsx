import React, { useEffect } from 'react';
import { useDashboardStore } from './store/useDashboardStore';
import { Navbar } from './components/Navbar';
import { GlobalFilterBar } from './components/GlobalFilterBar';
import { DashboardGrid } from './components/DashboardGrid';
import { DataPreviewTab } from './components/DataPreviewTab';
import { ColumnsConfigTab } from './components/ColumnsConfigTab';
import { AutoInsightsTab } from './components/AutoInsightsTab';
import { WidgetPropertiesPanel } from './components/WidgetPropertiesPanel';
import { AiAssistantSidebar } from './components/AiAssistantSidebar';
import { DataIngestionModal } from './components/DataIngestionModal';
import { DomainConfirmationModal } from './components/DomainConfirmationModal';
import { apiGenerateDashboard } from './lib/aiClient';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export default function App() {
  const {
    spec,
    setSpec,
    profile,
    rows,
    domainConfirmation,
    activeNavView,
    toastMessage,
    clearToast,
    isGeneratingDashboard,
    setIsGeneratingDashboard,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDashboardStore();

  const isDark = spec?.theme === 'dark';

  // Keyboard shortcuts (Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        if (canRedo()) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <Navbar />

      {/* Global Filter Bar (shown on Dashboard tab) */}
      {activeNavView === 'dashboard' && <GlobalFilterBar />}

      {/* Main Workspace Area with Center Canvas and Right Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Main View Canvas */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {isGeneratingDashboard && !spec ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center animate-pulse">
                <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Architecting Tailored Analytics Dashboard...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesizing domain metrics, optimal chart distributions, and executive takeaways.
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeNavView === 'dashboard' && <DashboardGrid />}
              {activeNavView === 'preview' && <DataPreviewTab />}
              {activeNavView === 'columns' && <ColumnsConfigTab />}
              {activeNavView === 'insights' && <AutoInsightsTab />}
            </>
          )}
        </main>

        {/* Right Panel 1: Widget Inspector */}
        <WidgetPropertiesPanel />

        {/* Right Panel 2: AI Assistant Sidebar */}
        <AiAssistantSidebar />
      </div>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border animate-in slide-in-from-bottom-2 duration-200 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          {toastMessage.type === 'info' && (
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          )}
          {toastMessage.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={clearToast}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dialog Modals */}
      <DataIngestionModal />
      <DomainConfirmationModal />
    </div>
  );
}
