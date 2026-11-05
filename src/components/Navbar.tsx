import React, { useState } from 'react';
import {
  BarChart3,
  Upload,
  Undo2,
  Redo2,
  Sun,
  Moon,
  Download,
  Bot,
  Table,
  Columns,
  Sparkles,
  ChevronDown,
  Layers,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { useDashboardStore, MainNavView } from '../store/useDashboardStore';
import { SAMPLE_DATASETS } from '../lib/dataEngine/sampleDatasets';
import Papa from 'papaparse';

export const Navbar: React.FC = () => {
  const {
    datasetName,
    spec,
    profile,
    undo,
    redo,
    canUndo,
    canRedo,
    activeNavView,
    setActiveNavView,
    isChatOpen,
    setIsChatOpen,
    toggleTheme,
    setIsUploadModalOpen,
    loadSampleDataset,
    rows,
    showToast,
  } = useDashboardStore();

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDatasetDropdownOpen, setIsDatasetDropdownOpen] = useState(false);

  const isDark = spec?.theme === 'dark';

  // Export Dashboard Spec JSON
  const handleExportSpec = () => {
    if (!spec) return;
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec.title.toLowerCase().replace(/\s+/g, '_')}_spec.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
    showToast('Dashboard spec exported as JSON', 'success');
  };

  // Export Filtered Data as CSV
  const handleExportCSV = () => {
    if (!rows || rows.length === 0) return;
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName.toLowerCase().replace(/\s+/g, '_')}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportDropdownOpen(false);
    showToast('Filtered dataset exported as CSV', 'success');
  };

  const navItems: { view: MainNavView; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { view: 'preview', label: 'Data Preview', icon: <Table className="w-3.5 h-3.5" /> },
    { view: 'columns', label: 'Columns & Roles', icon: <Columns className="w-3.5 h-3.5" /> },
    { view: 'insights', label: 'Auto Insights', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="h-14 px-5 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-4 z-30 transition-colors">
      {/* Brand & Dataset Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline">
            Insight<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Dataset Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDatasetDropdownOpen(!isDatasetDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors max-w-[210px]"
          >
            <span className="truncate">{datasetName}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          </button>

          {isDatasetDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                Quick Sample Datasets
              </span>
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    loadSampleDataset(sample.id);
                    setIsDatasetDropdownOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {sample.name}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      {sample.domain}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{sample.rows.length} rows</span>
                </button>
              ))}

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => {
                  setIsUploadModalOpen(true);
                  setIsDatasetDropdownOpen(false);
                }}
                className="w-full p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New Data File...
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Views */}
      <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveNavView(item.view)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeNavView === item.view
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Actions & Tools */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle light/dark theme"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Export dashboard or data"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {isExportDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 text-xs animate-in fade-in">
              <button
                onClick={handleExportSpec}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
              >
                <FileJson className="w-4 h-4 text-indigo-500" />
                <span>Dashboard Spec (.json)</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Filtered Dataset (.csv)</span>
              </button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          title="Upload or change dataset"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Copilot Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
            isChatOpen
              ? 'bg-indigo-600 text-white shadow-indigo-500/20'
              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 hover:bg-indigo-100'
          }`}
          title="Toggle AI Copilot"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>
      </div>
    </header>
  );
};
