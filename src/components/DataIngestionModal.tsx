import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Code,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { parseCSV, parseExcelSheet, getExcelSheets, parseJSON } from '../lib/dataEngine/parser';
import { SAMPLE_DATASETS } from '../lib/dataEngine/sampleDatasets';
import { apiUnderstandDataset } from '../lib/aiClient';
import { profileDataset } from '../lib/dataEngine/profiler';

export const DataIngestionModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    setDataset,
    loadSampleDataset,
    setDomainConfirmation,
    setShowDomainConfirmationModal,
    setIsAnalyzing,
    isAnalyzing,
    showToast,
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('samples');
  const [pastedText, setPastedText] = useState('');
  const [pasteFormat, setPasteFormat] = useState<'csv' | 'json'>('csv');
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [excelBuffer, setExcelBuffer] = useState<ArrayBuffer | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [excelFileName, setExcelFileName] = useState('');

  if (!isUploadModalOpen) return null;

  const processLoadedData = async (fileName: string, rows: any[], headers: string[]) => {
    setIsAnalyzing(true);
    try {
      const profile = profileDataset(rows, headers);
      setDataset(fileName, rows, headers);

      // Call Gemini understand route
      const understandResult = await apiUnderstandDataset(profile, rows);
      setDomainConfirmation(understandResult);
      setIsUploadModalOpen(false);
      setShowDomainConfirmationModal(true);
      showToast(`Dataset loaded: ${rows.length.toLocaleString()} rows`, 'success');
    } catch (err: any) {
      console.error(err);
      const profile = profileDataset(rows, headers);
      setDataset(fileName, rows, headers);
      setDomainConfirmation({
        domain: 'Data Analytics',
        description: `Imported ${rows.length} rows across ${headers.length} columns.`,
        recommendedGoal: 'Explore distribution, top performers, and primary trends.',
        keyMetrics: profile.detectedMeasures.slice(0, 3),
        suggestedPrompts: ['Show breakdown', 'Highlight top performers', 'Show trend'],
      });
      setIsUploadModalOpen(false);
      setShowDomainConfirmationModal(true);
      showToast('Loaded dataset successfully', 'success');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isJson = file.name.endsWith('.json') || file.type === 'application/json';

    if (isCsv) {
      const text = await file.text();
      const { rows, headers } = await parseCSV(text);
      if (rows.length === 0) {
        showToast('CSV file is empty', 'error');
        return;
      }
      processLoadedData(fileName, rows, headers);
    } else if (isXlsx) {
      const buffer = await file.arrayBuffer();
      const sheets = getExcelSheets(buffer);
      if (sheets.length > 1) {
        setExcelBuffer(buffer);
        setExcelSheets(sheets);
        setSelectedSheet(sheets[0]);
        setExcelFileName(fileName);
      } else {
        const { rows, headers } = parseExcelSheet(buffer);
        processLoadedData(fileName, rows, headers);
      }
    } else if (isJson) {
      const text = await file.text();
      const { rows, headers } = parseJSON(text);
      processLoadedData(fileName, rows, headers);
    } else {
      showToast('Unsupported file format. Please upload CSV, XLSX, or JSON.', 'error');
    }
  };

  const handleSheetConfirm = () => {
    if (!excelBuffer) return;
    const { rows, headers } = parseExcelSheet(excelBuffer, selectedSheet);
    processLoadedData(`${excelFileName} (${selectedSheet})`, rows, headers);
    setExcelBuffer(null);
    setExcelSheets([]);
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return;

    try {
      if (pasteFormat === 'csv') {
        const { rows, headers } = await parseCSV(pastedText);
        processLoadedData('Pasted Dataset.csv', rows, headers);
      } else {
        const { rows, headers } = parseJSON(pastedText);
        processLoadedData('Pasted Dataset.json', rows, headers);
      }
    } catch (err: any) {
      showToast(`Parse error: ${err.message}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Load Tabular Dataset
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CSV, XLSX (Excel), JSON, or select a pre-loaded business domain dataset
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Excel Multi-Sheet Selector overlay if file has multiple sheets */}
        {excelSheets.length > 0 ? (
          <div className="py-6 space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-200 mb-1">
                Multiple Sheets Detected in Excel File
              </h4>
              <p className="text-slate-600 dark:text-slate-400">
                Please select which worksheet you would like to analyze:
              </p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {excelSheets.map((sheet) => (
                <label
                  key={sheet}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedSheet === sheet
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {sheet}
                  </span>
                  <input
                    type="radio"
                    name="excel-sheet"
                    checked={selectedSheet === sheet}
                    onChange={() => setSelectedSheet(sheet)}
                    className="accent-indigo-600"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setExcelSheets([])}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Back
              </button>
              <button
                onClick={handleSheetConfirm}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Load Sheet
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 my-4 text-xs">
              <button
                onClick={() => setActiveTab('samples')}
                className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors ${
                  activeTab === 'samples'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Built-in Sample Datasets
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors ${
                  activeTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Upload File (CSV, XLSX, JSON)
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-2 font-semibold border-b-2 text-center transition-colors ${
                  activeTab === 'paste'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Paste Raw Data
              </button>
            </div>

            {/* Tab 1: Sample Datasets */}
            {activeTab === 'samples' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 overflow-y-auto">
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => {
                      loadSampleDataset(sample.id);
                      setIsUploadModalOpen(false);
                      showToast(`Loaded ${sample.name}`, 'success');
                    }}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {sample.domain}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {sample.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {sample.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{sample.rows.length} records • {sample.headers.length} cols</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 2: Upload File */}
            {activeTab === 'upload' && (
              <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                <FileSpreadsheet className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-3" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Choose or drag and drop a data file
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center max-w-sm">
                  Supports CSV, Excel .xlsx / .xls, and JSON. Handles up to 100k rows smoothly.
                </p>

                <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Browse Local File</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Tab 3: Paste Data */}
            {activeTab === 'paste' && (
              <div className="py-2 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Paste CSV or JSON format
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPasteFormat('csv')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        pasteFormat === 'csv'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasteFormat('json')}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                        pasteFormat === 'json'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={
                    pasteFormat === 'csv'
                      ? 'Region,Product,Sales,Units\nNorth,Laptop,1200,3\nSouth,Phone,800,2'
                      : '[{ "Region": "North", "Sales": 1200 }, { "Region": "South", "Sales": 800 }]'
                  }
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handlePasteSubmit}
                    disabled={!pastedText.trim() || isAnalyzing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold shadow-xs"
                  >
                    <span>Parse & Ingest Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
