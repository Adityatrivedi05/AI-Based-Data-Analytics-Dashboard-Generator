import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  BarChart,
  LayoutGrid,
  TrendingUp,
  Sliders,
  FolderPlus,
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { WidgetCard } from '../charts/WidgetCard';
import { DashboardWidget } from '../lib/dataEngine/types';

export const DashboardGrid: React.FC = () => {
  const {
    spec,
    setSpec,
    activeTab,
    setActiveTab,
    rows,
    profile,
    addWidget,
    showToast,
    setSelectedWidgetId,
  } = useDashboardStore();

  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  if (!spec) return null;

  const currentTab = activeTab || spec.tabs[0] || 'Overview';
  const tabWidgets = spec.widgets.filter((w) => w.tab === currentTab);
  const kpiWidgets = tabWidgets.filter((w) => w.type === 'kpi');
  const chartWidgets = tabWidgets.filter((w) => w.type !== 'kpi');

  const handleAddWidget = (type: 'kpi' | 'bar' | 'line' | 'donut') => {
    const measure = profile?.detectedMeasures[0] || 'Value';
    const dim = profile?.detectedDimensions[0] || 'Category';

    const newWidget: DashboardWidget = {
      id: `w_${Date.now()}`,
      tab: currentTab,
      type,
      title: type === 'kpi' ? `Total ${measure}` : `${measure} by ${dim}`,
      x: dim,
      y: [{ field: measure, agg: 'sum' }],
      metric: type === 'kpi' ? { field: measure, agg: 'sum', label: `Total ${measure}` } : undefined,
      limit: 10,
      sort: 'desc',
      layout: { x: 0, y: 0, w: type === 'kpi' ? 3 : 6, h: type === 'kpi' ? 2 : 4 },
    };

    addWidget(newWidget);
    setSelectedWidgetId(newWidget.id);
  };

  const handleAddTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabName.trim()) return;
    const name = newTabName.trim();
    if (!spec.tabs.includes(name)) {
      setSpec({ ...spec, tabs: [...spec.tabs, name] }, true);
      setActiveTab(name);
      showToast(`Added tab "${name}"`, 'success');
    }
    setNewTabName('');
    setIsAddTabModalOpen(false);
  };

  const handleSuggestMoreInsights = () => {
    const measure = profile?.detectedMeasures[1] || profile?.detectedMeasures[0] || 'Count';
    const dim = profile?.detectedDimensions[1] || profile?.detectedDimensions[0] || 'Category';

    const suggested: DashboardWidget = {
      id: `w_suggest_${Date.now()}`,
      tab: currentTab,
      type: 'donut',
      title: `${measure} Distribution by ${dim}`,
      insight: `Top 3 ${dim} account for primary contribution of ${measure}.`,
      x: dim,
      y: [{ field: measure, agg: 'sum' }],
      limit: 7,
      sort: 'desc',
      layout: { x: 0, y: 0, w: 6, h: 4 },
    };

    addWidget(suggested);
    showToast(`Suggested & pinned: ${suggested.title}`, 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Tab Navigation & Canvas Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-xs">
          {spec.tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === tab
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}

          <button
            onClick={() => setIsAddTabModalOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-300/40 dark:hover:bg-slate-700 transition-colors"
            title="Add tab"
            aria-label="Add tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSuggestMoreInsights}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Suggest More Insights</span>
          </button>

          <button
            onClick={() => handleAddWidget('bar')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Widget</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {kpiWidgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiWidgets.map((w) => (
            <div key={w.id} className="min-h-[140px]">
              <WidgetCard widget={w} allRows={rows} filters={spec.filters} />
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      {chartWidgets.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {chartWidgets.map((w) => {
            // Map widget layout.w (out of 12) to responsive column spans
            const colSpan = w.layout.w >= 10 ? 'lg:col-span-12' : w.layout.w >= 7 ? 'lg:col-span-8' : w.layout.w >= 5 ? 'lg:col-span-6' : 'lg:col-span-4';
            return (
              <div key={w.id} className={`${colSpan} min-h-[340px]`}>
                <WidgetCard widget={w} allRows={rows} filters={spec.filters} />
              </div>
            );
          })}
        </div>
      ) : kpiWidgets.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center space-y-3 bg-white/40 dark:bg-slate-900/40">
          <LayoutGrid className="w-10 h-10 text-slate-400" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No widgets in "{currentTab}" tab yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Add your first metric or chart, or ask the AI assistant in the right panel.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => handleAddWidget('kpi')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
            >
              + Add KPI Card
            </button>
            <button
              onClick={() => handleAddWidget('bar')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              + Add Bar Chart
            </button>
          </div>
        </div>
      ) : null}

      {/* Add Tab Modal */}
      {isAddTabModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              Add New Dashboard Tab
            </h3>
            <form onSubmit={handleAddTab} className="space-y-4 text-xs">
              <input
                type="text"
                required
                placeholder="e.g. Cohorts, Regional, Financials"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTabModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Create Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
