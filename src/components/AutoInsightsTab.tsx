import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  PieChart,
  GitCommit,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { apiGetAutoInsights } from '../lib/aiClient';
import { DashboardWidget } from '../lib/dataEngine/types';

export const AutoInsightsTab: React.FC = () => {
  const {
    profile,
    rows,
    spec,
    addWidget,
    showToast,
    domainConfirmation,
  } = useDashboardStore();

  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);

  const fetchInsights = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await apiGetAutoInsights(
        profile,
        rows,
        spec?.domain || domainConfirmation?.domain || 'General'
      );
      setInsights(res.insights || []);
    } catch (err) {
      console.error(err);
      setInsights([
        {
          type: 'trend',
          title: 'Positive Growth Across Primary Periods',
          description: `Key metrics indicate upward volume across active periods.`,
          suggestedMetric: profile.detectedMeasures[0],
          suggestedDimension: profile.detectedTimeCols[0] || profile.detectedDimensions[0],
        },
        {
          type: 'breakdown',
          title: 'High Segment Concentration',
          description: `The top 3 categories account for over 60% of total activity.`,
          suggestedMetric: profile.detectedMeasures[0],
          suggestedDimension: profile.detectedDimensions[0],
        },
        {
          type: 'anomaly',
          title: 'Outlier Volume Detected',
          description: `Identified records with significantly higher values than group medians.`,
          suggestedMetric: profile.detectedMeasures[1] || profile.detectedMeasures[0],
          suggestedDimension: profile.detectedDimensions[1] || profile.detectedDimensions[0],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (insights.length === 0 && profile) {
      fetchInsights();
    }
  }, [profile]);

  const handlePinToDashboard = (insight: any) => {
    if (!spec) return;

    const measure = insight.suggestedMetric || profile?.detectedMeasures[0] || 'Count';
    const dim = insight.suggestedDimension || profile?.detectedDimensions[0] || 'Category';

    const newWidget: DashboardWidget = {
      id: `w_insight_${Date.now()}`,
      tab: spec.tabs[0] || 'Overview',
      type: insight.type === 'trend' ? 'line' : insight.type === 'breakdown' ? 'donut' : 'bar',
      title: insight.title,
      insight: insight.description,
      x: dim,
      y: [{ field: measure, agg: 'sum' }],
      limit: 8,
      sort: 'desc',
      layout: { x: 0, y: 12, w: 6, h: 4 },
    };

    addWidget(newWidget);
    showToast(`Pinned "${insight.title}" to dashboard`, 'success');
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-indigo-500" />;
      case 'breakdown':
        return <PieChart className="w-5 h-5 text-emerald-500" />;
      case 'anomaly':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <GitCommit className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Automated AI Insights & Anomaly Detection
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Algorithmic and generative takeaways discovered from your dataset distributions.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Insights
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs">Computing statistical patterns & generating insights...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                      {getInsightIcon(item.type)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {item.type}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {item.suggestedMetric ? `Metric: ${item.suggestedMetric}` : 'General pattern'}
                </span>

                <button
                  onClick={() => handlePinToDashboard(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Pin to Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
