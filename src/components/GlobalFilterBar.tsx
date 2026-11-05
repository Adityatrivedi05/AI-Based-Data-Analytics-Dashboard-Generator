import React, { useState } from 'react';
import { Filter as FilterIcon, X, Plus, Calendar, RotateCcw } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Filter, FilterOperator } from '../lib/dataEngine/types';

export const GlobalFilterBar: React.FC = () => {
  const {
    spec,
    headers,
    profile,
    crossFilter,
    setCrossFilter,
    addFilter,
    removeFilter,
    clearFilters,
  } = useDashboardStore();

  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [selectedField, setSelectedField] = useState(headers[0] || '');
  const [selectedOp, setSelectedOp] = useState<FilterOperator>('eq');
  const [filterValue, setFilterValue] = useState('');

  const activeFilters = spec?.filters || [];
  const hasAnyFilter = activeFilters.length > 0 || crossFilter !== null;

  const handleCreateFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField || filterValue === '') return;

    const newFilter: Filter = {
      field: selectedField,
      op: selectedOp,
      value: filterValue,
    };

    addFilter(newFilter);
    setFilterValue('');
    setIsOpenAddModal(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
          <FilterIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Filters</span>
        </div>

        {/* Cross-Filter Chip */}
        {crossFilter && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-in fade-in">
            <span className="font-semibold">{crossFilter.field}:</span>
            <span>{String(crossFilter.value)}</span>
            <button
              onClick={() => setCrossFilter(null)}
              className="p-0.5 rounded-full hover:bg-amber-500/20 transition-colors"
              title="Remove cross filter"
              aria-label="Remove cross filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Global Filter Chips */}
        {activeFilters.map((f, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 animate-in fade-in"
          >
            <span className="font-semibold">{f.field}</span>
            <span className="text-slate-400">{f.op}</span>
            <span>{String(f.value)}</span>
            <button
              onClick={() => removeFilter(idx)}
              className="p-0.5 rounded-full hover:bg-indigo-200/60 dark:hover:bg-indigo-900 transition-colors"
              title="Remove filter"
              aria-label="Remove filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {!hasAnyFilter && (
          <span className="text-xs text-slate-400 italic">No active filters (click chart elements to cross-filter)</span>
        )}

        {/* Add Filter Button */}
        <button
          onClick={() => setIsOpenAddModal(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Filter</span>
        </button>
      </div>

      {hasAnyFilter && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      )}

      {/* Add Filter Modal */}
      {isOpenAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Add Global Filter
              </h3>
              <button
                onClick={() => setIsOpenAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFilter} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Field
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h} ({profile?.columns[h]?.role || 'field'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Operator
                </label>
                <select
                  value={selectedOp}
                  onChange={(e) => setSelectedOp(e.target.value as FilterOperator)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="eq">Equals (=)</option>
                  <option value="neq">Not Equals (!=)</option>
                  <option value="contains">Contains text</option>
                  <option value="gt">Greater Than (&gt;)</option>
                  <option value="lt">Less Than (&lt;)</option>
                  <option value="gte">Greater or Equal (&gt;=)</option>
                  <option value="lte">Less or Equal (&lt;=)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Filter Value
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North America, 5000"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
