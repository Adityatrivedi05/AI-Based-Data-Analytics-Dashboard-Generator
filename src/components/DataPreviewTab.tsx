import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { dropDuplicateRows, fillMissingValues, trimAllStrings } from '../lib/dataEngine/cleaner';
import { formatValue } from '../lib/dataEngine/aggregator';

export const DataPreviewTab: React.FC = () => {
  const {
    rows,
    headers,
    profile,
    applyCleanedRows,
    undoCleaning,
    datasetName,
  } = useDashboardStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  if (!profile) return null;

  // Filter rows based on search
  const filteredRows = searchQuery
    ? rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : rows;

  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const paginatedRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

  // Cleaner handlers
  const handleDropDuplicates = () => {
    const { cleanedRows, report } = dropDuplicateRows(rows, headers);
    applyCleanedRows(cleanedRows, report.description);
  };

  const handleTrimStrings = () => {
    const { cleanedRows, report } = trimAllStrings(rows, headers);
    applyCleanedRows(cleanedRows, report.description);
  };

  const handleFillMissing = (colName: string) => {
    const colProfile = profile.columns[colName];
    const strategy = colProfile?.type === 'number' ? 'mean' : 'mode';
    const { cleanedRows, report } = fillMissingValues(rows, colName, strategy);
    applyCleanedRows(cleanedRows, report.description);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Section: Data Quality & Quick Cleaning Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quality Score Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Data Quality Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {profile.qualityScore}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {profile.duplicateRowsCount} duplicate rows • {profile.rowCount.toLocaleString()} rows •{' '}
              {profile.colCount} fields
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        {/* Cleaning Actions */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Non-Destructive Cleaning
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Clean missing data and duplicates without losing original records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={handleDropDuplicates}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Remove Duplicates ({profile.duplicateRowsCount})
            </button>

            <button
              onClick={handleTrimStrings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Trim Whitespace
            </button>

            <button
              onClick={undoCleaning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Raw
            </button>
          </div>
        </div>
      </div>

      {/* Columns Stat Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
          Column Profiling & Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {headers.map((h) => {
            const col = profile.columns[h];
            if (!col) return null;
            return (
              <div
                key={h}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100" title={h}>
                      {h}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {col.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">{col.type} • {col.format}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Distinct:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{col.uniqueCount}</span>
                  </div>
                  {col.mean !== undefined && (
                    <div className="flex justify-between">
                      <span>Mean:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-200">{formatValue(col.mean)}</span>
                    </div>
                  )}
                  {col.missingCount > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Missing:</span>
                      <span>{col.missingCount} ({Math.round(col.missingRate * 100)}%)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Paginated Raw Data Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
        {/* Table header bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Raw Data Table ({filteredRows.length.toLocaleString()} rows)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search values..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-48"
              />
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Page {page + 1} of {Math.max(1, totalPages)}
              </span>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table rows */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 font-semibold text-slate-400 w-12 text-center">#</th>
                {headers.map((h) => (
                  <th key={h} className="p-3 font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-3 text-slate-400 text-center font-mono text-[10px]">
                    {page * pageSize + rIdx + 1}
                  </td>
                  {headers.map((h) => {
                    const val = row[h];
                    const isMissing = val === null || val === undefined || val === '';
                    return (
                      <td
                        key={h}
                        className={`p-3 truncate max-w-[200px] ${
                          isMissing ? 'text-amber-500 italic font-mono text-[11px]' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isMissing ? 'null' : String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
