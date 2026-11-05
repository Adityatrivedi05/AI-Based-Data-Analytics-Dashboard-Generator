import React from 'react';
import { X, Sliders, Palette, BarChart, Hash, Layers } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { AggregationType, WidgetType } from '../lib/dataEngine/types';

export const WidgetPropertiesPanel: React.FC = () => {
  const {
    spec,
    selectedWidgetId,
    setSelectedWidgetId,
    updateWidget,
    headers,
    profile,
  } = useDashboardStore();

  if (!selectedWidgetId || !spec) return null;

  const widget = spec.widgets.find((w) => w.id === selectedWidgetId);
  if (!widget) return null;

  const measures = profile?.detectedMeasures || headers;
  const dimensions = profile?.detectedDimensions || headers;
  const timeCols = profile?.detectedTimeCols || [];

  return (
    <div className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-lg z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Widget Inspector
          </h3>
        </div>
        <button
          onClick={() => setSelectedWidgetId(null)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Close inspector"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Title */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={widget.title}
            onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Tab Placement */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tab Placement
          </label>
          <select
            value={widget.tab}
            onChange={(e) => updateWidget(widget.id, { tab: e.target.value })}
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {spec.tabs.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Chart Type */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Chart Type
          </label>
          <select
            value={widget.type}
            onChange={(e) => updateWidget(widget.id, { type: e.target.value as WidgetType })}
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="kpi">KPI Metric Card</option>
            <option value="bar">Bar Chart (Vertical)</option>
            <option value="bar_horizontal">Bar Chart (Horizontal)</option>
            <option value="bar_stacked">Bar Chart (Stacked)</option>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="combo">Combo (Bar + Line)</option>
            <option value="donut">Donut Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="histogram">Histogram</option>
            <option value="waterfall">Waterfall</option>
            <option value="funnel">Funnel</option>
            <option value="data_table">Data Table</option>
          </select>
        </div>

        {/* Dimension (X Axis) */}
        {widget.type !== 'kpi' && (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dimension (X-Axis)
            </label>
            <select
              value={widget.x || ''}
              onChange={(e) => updateWidget(widget.id, { x: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h} ({profile?.columns[h]?.role || 'dim'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Metric (Y Axis / Aggregation) */}
        {widget.type === 'kpi' ? (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Metric Field
            </label>
            <select
              value={widget.metric?.field || measures[0]}
              onChange={(e) =>
                updateWidget(widget.id, {
                  metric: {
                    field: e.target.value,
                    agg: widget.metric?.agg || 'sum',
                    label: e.target.value,
                  },
                })
              }
              className="w-full p-2 mb-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="*">* (Record Count)</option>
              {measures.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              {spec.calculatedFields?.map((cf) => (
                <option key={cf.name} value={cf.name}>
                  {cf.name} (Calculated)
                </option>
              ))}
            </select>

            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Aggregation
            </label>
            <select
              value={widget.metric?.agg || 'sum'}
              onChange={(e) =>
                updateWidget(widget.id, {
                  metric: {
                    field: widget.metric?.field || measures[0],
                    agg: e.target.value as AggregationType,
                  },
                })
              }
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
              <option value="distinct">Distinct Count</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
              <option value="median">Median</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Measure (Y-Axis)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={widget.y?.[0]?.field || measures[0]}
                onChange={(e) => {
                  const currentAgg = widget.y?.[0]?.agg || 'sum';
                  updateWidget(widget.id, {
                    y: [{ field: e.target.value, agg: currentAgg }],
                  });
                }}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="*">* (Count)</option>
                {measures.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                {spec.calculatedFields?.map((cf) => (
                  <option key={cf.name} value={cf.name}>
                    {cf.name} (Calculated)
                  </option>
                ))}
              </select>

              <select
                value={widget.y?.[0]?.agg || 'sum'}
                onChange={(e) => {
                  const currentField = widget.y?.[0]?.field || measures[0];
                  updateWidget(widget.id, {
                    y: [{ field: currentField, agg: e.target.value as AggregationType }],
                  });
                }}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="count">Count</option>
                <option value="distinct">Distinct</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
                <option value="median">Median</option>
              </select>
            </div>
          </div>
        )}

        {/* Secondary Series Dimension */}
        {['bar', 'bar_stacked', 'bar_grouped', 'line', 'area'].includes(widget.type) && (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Secondary Series (Group by)
            </label>
            <select
              value={widget.seriesBy || ''}
              onChange={(e) => updateWidget(widget.id, { seriesBy: e.target.value || undefined })}
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="">None (Single Series)</option>
              {dimensions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Bucketing */}
        {timeCols.includes(widget.x || '') && (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date Bucketing
            </label>
            <select
              value={widget.timeBucket || 'month'}
              onChange={(e) => updateWidget(widget.id, { timeBucket: e.target.value as any })}
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
        )}

        {/* Top-N Limit */}
        {widget.type !== 'kpi' && widget.type !== 'data_table' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                Top N Limit
              </label>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {widget.limit || 10}
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              value={widget.limit || 10}
              onChange={(e) => updateWidget(widget.id, { limit: parseInt(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>
        )}

        {/* Sort Direction */}
        {widget.type !== 'kpi' && widget.type !== 'data_table' && (
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sorting
            </label>
            <select
              value={widget.sort || 'desc'}
              onChange={(e) => updateWidget(widget.id, { sort: e.target.value as any })}
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="desc">Highest First (Descending)</option>
              <option value="asc">Lowest First (Ascending)</option>
              <option value="none">Dataset Order (None)</option>
            </select>
          </div>
        )}

        {/* Custom AI Insight note */}
        <div>
          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
            Custom Takeaway / Insight Note
          </label>
          <textarea
            rows={2}
            value={widget.insight || ''}
            onChange={(e) => updateWidget(widget.id, { insight: e.target.value })}
            placeholder="Executive takeaway for this chart..."
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
