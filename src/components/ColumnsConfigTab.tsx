import React, { useState } from 'react';
import { Columns, Plus, Check, Edit3, Calculator, HelpCircle } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { FormatType, SemanticRole } from '../lib/dataEngine/types';

export const ColumnsConfigTab: React.FC = () => {
  const {
    headers,
    profile,
    updateColumnRole,
    spec,
    addCalculatedField,
  } = useDashboardStore();

  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calcName, setCalcName] = useState('');
  const [calcFormula, setCalcFormula] = useState('');
  const [calcFormat, setCalcFormat] = useState<FormatType>('percent');

  if (!profile) return null;

  const handleAddCalculatedField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcName.trim() || !calcFormula.trim()) return;

    addCalculatedField({
      name: calcName.trim(),
      formula: calcFormula.trim(),
      format: calcFormat,
    });

    setCalcName('');
    setCalcFormula('');
    setIsCalcModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Columns className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Column Schema & Semantic Roles
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Override roles (measure, dimension, time, identifier, geo, boolean) and numeric display formats.
          </p>
        </div>

        <button
          onClick={() => setIsCalcModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
        >
          <Calculator className="w-4 h-4" />
          Add Calculated Field
        </button>
      </div>

      {/* Calculated Fields List */}
      {spec?.calculatedFields && spec.calculatedFields.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider block">
            Active Calculated Metrics
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {spec.calculatedFields.map((cf) => (
              <div
                key={cf.name}
                className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200/80 dark:border-indigo-800/60 text-xs flex flex-col justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">
                    {cf.name}
                  </span>
                  <code className="text-[11px] text-indigo-600 dark:text-indigo-400 block mt-1 font-mono">
                    {cf.formula}
                  </code>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block uppercase">
                  Format: {cf.format}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Columns Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="p-3">Column Name</th>
                <th className="p-3">Detected Type</th>
                <th className="p-3">Semantic Role</th>
                <th className="p-3">Display Format</th>
                <th className="p-3">Missing Rate</th>
                <th className="p-3">Sample Values</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => {
                const col = profile.columns[h];
                if (!col) return null;
                return (
                  <tr
                    key={h}
                    className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      {h}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {col.type}
                      </span>
                    </td>

                    {/* Semantic Role selector */}
                    <td className="p-3">
                      <select
                        value={col.role}
                        onChange={(e) =>
                          updateColumnRole(h, e.target.value as SemanticRole, col.format)
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="measure">Measure (Numeric sum/avg)</option>
                        <option value="dimension">Dimension (Category)</option>
                        <option value="time">Time / Date</option>
                        <option value="identifier">Identifier (ID - never sum)</option>
                        <option value="geo">Geo (Location)</option>
                        <option value="boolean">Boolean Flag</option>
                        <option value="text">Free Text</option>
                      </select>
                    </td>

                    {/* Format Selector */}
                    <td className="p-3">
                      <select
                        value={col.format}
                        onChange={(e) =>
                          updateColumnRole(h, col.role, e.target.value as FormatType)
                        }
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="auto">Auto</option>
                        <option value="currency">Currency ($1.2M)</option>
                        <option value="percent">Percent (15.4%)</option>
                        <option value="compact">Compact (1.2K)</option>
                        <option value="integer">Integer (1,234)</option>
                        <option value="decimal">Decimal (12.34)</option>
                        <option value="duration">Duration (secs/hours)</option>
                        <option value="date">Date</option>
                        <option value="string">String</option>
                      </select>
                    </td>

                    <td className="p-3 text-slate-500">
                      {col.missingCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {col.missingCount} ({Math.round(col.missingRate * 100)}%)
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">0%</span>
                      )}
                    </td>

                    <td className="p-3 text-slate-500 truncate max-w-[200px] font-mono text-[11px]">
                      {col.sampleValues.slice(0, 3).map((v) => String(v)).join(', ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculated Field Modal */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Create Calculated Field
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Row-level arithmetic or aggregate group ratios calculated safely without eval.
            </p>

            <form onSubmit={handleAddCalculatedField} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Metric Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ProfitMargin, CTR, NetAmount"
                  value={calcName}
                  onChange={(e) => setCalcName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Formula Expression
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Revenue - Cost or sum(Clicks) / sum(Impressions)"
                  value={calcFormula}
                  onChange={(e) => setCalcFormula(e.target.value)}
                  className="w-full p-2.5 rounded-lg font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Available functions: <code>sum(X)</code>, <code>avg(X)</code>, <code>count(X)</code>, <code>min</code>, <code>max</code>
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Format
                </label>
                <select
                  value={calcFormat}
                  onChange={(e) => setCalcFormat(e.target.value as FormatType)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="percent">Percent (12.5%)</option>
                  <option value="currency">Currency ($1.2M)</option>
                  <option value="decimal">Decimal (12.34)</option>
                  <option value="integer">Integer (1,200)</option>
                  <option value="compact">Compact (1.2K)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCalcModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Save Calculated Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
