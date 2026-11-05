import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  Edit2,
  Trash2,
  Copy,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DashboardWidget, DatasetRow, Filter } from '../lib/dataEngine/types';
import { computeWidgetData, formatValue } from '../lib/dataEngine/aggregator';
import { useDashboardStore } from '../store/useDashboardStore';
import { UniversalChart } from './UniversalChart';

interface WidgetCardProps {
  widget: DashboardWidget;
  allRows: DatasetRow[];
  filters: Filter[];
}

export const WidgetCard: React.FC<WidgetCardProps> = ({ widget, allRows, filters }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const {
    spec,
    selectedWidgetId,
    setSelectedWidgetId,
    deleteWidget,
    duplicateWidget,
    highlightedWidgetId,
    crossFilter,
    setCrossFilter,
  } = useDashboardStore();

  const isDark = spec?.theme === 'dark';
  const isHighlighted = highlightedWidgetId === widget.id;
  const isSelected = selectedWidgetId === widget.id;

  // Compute live data from real dataset rows
  const computedData = computeWidgetData(
    widget,
    allRows,
    filters,
    spec?.calculatedFields || []
  );

  const getWidgetIcon = () => {
    switch (widget.type) {
      case 'kpi':
        return <TrendingUp className="w-4 h-4 text-indigo-500" />;
      case 'line':
      case 'area':
        return <LineChartIcon className="w-4 h-4 text-cyan-500" />;
      case 'pie':
      case 'donut':
        return <PieChartIcon className="w-4 h-4 text-emerald-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-indigo-500" />;
    }
  };

  const handleCrossFilter = (field: string, val: any) => {
    setCrossFilter(field, val);
  };

  const cardContent = (
    <div
      className={`relative flex flex-col h-full rounded-xl transition-all duration-300 border ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200/80 text-slate-900 shadow-xs hover:shadow-md'
      } ${
        isHighlighted
          ? 'ring-2 ring-indigo-500 ring-offset-2 scale-[1.01] transition-transform'
          : ''
      } ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800">
            {getWidgetIcon()}
          </div>
          <h3 className="text-sm font-semibold truncate tracking-tight" title={widget.title}>
            {widget.title}
          </h3>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
          <button
            onClick={() => setSelectedWidgetId(widget.id)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="Edit widget properties"
            aria-label="Edit widget"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => duplicateWidget(widget.id)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="Duplicate widget"
            aria-label="Duplicate widget"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => deleteWidget(widget.id)}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
            title="Delete widget"
            aria-label="Delete widget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Insight Badge */}
      {widget.insight && (
        <div className="mx-4 mt-2.5 px-3 py-1.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-950 dark:text-indigo-200 line-clamp-2 leading-relaxed">
            {widget.insight}
          </p>
        </div>
      )}

      {/* Body Content */}
      <div className="flex-1 p-4 min-h-0 flex flex-col justify-center">
        {widget.type === 'kpi' ? (
          <div className="flex flex-col justify-between h-full py-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {formatValue(computedData.kpi?.current, widget.metric?.agg === 'avg' ? 'decimal' : 'auto')}
              </span>
              {computedData.kpi?.changeRate !== undefined && (
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    computedData.kpi.changeRate >= 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                  }`}
                >
                  {computedData.kpi.changeRate >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(computedData.kpi.changeRate * 100).toFixed(1)}% vs prev
                </div>
              )}
            </div>

            {/* Sparkline & Target */}
            <div className="mt-4 flex items-end justify-between gap-4">
              {computedData.kpi?.sparkline && computedData.kpi.sparkline.length > 1 && (
                <div className="flex-1 h-8 flex items-end gap-1">
                  {computedData.kpi.sparkline.map((val, i) => {
                    const min = Math.min(...computedData.kpi!.sparkline);
                    const max = Math.max(...computedData.kpi!.sparkline);
                    const pct = max > min ? Math.max(15, ((val - min) / (max - min)) * 100) : 50;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-xs bg-indigo-500/70 hover:bg-indigo-600 transition-all"
                        style={{ height: `${pct}%` }}
                        title={`${formatValue(val)}`}
                      />
                    );
                  })}
                </div>
              )}

              {computedData.kpi?.targetProgress !== undefined && (
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Target: {formatValue(computedData.kpi.target)}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {computedData.kpi.targetProgress.toFixed(0)}% reached
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : widget.type === 'data_table' ? (
          <div className="w-full h-full overflow-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  {computedData.tableColumns?.map((col) => (
                    <th key={col} className="p-2 font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computedData.tableRows?.slice(0, 15).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    {computedData.tableColumns?.map((col) => (
                      <td key={col} className="p-2 truncate max-w-[140px]">
                        {String(row[col] ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full h-full min-h-[220px]">
            <UniversalChart
              widget={widget}
              data={computedData}
              theme={isDark ? 'dark' : 'light'}
              onCrossFilter={handleCrossFilter}
              activeFilterValue={crossFilter && crossFilter.field === widget.x ? crossFilter.value : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 p-6 bg-slate-900/80 backdrop-blur-md flex items-center justify-center animate-in fade-in">
        <div className="w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {cardContent}
        </div>
      </div>
    );
  }

  return cardContent;
};
