import React, { useState } from 'react';
import { Sparkles, ArrowRight, Target, Database, Layers, CheckCircle } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { apiGenerateDashboard } from '../lib/aiClient';

export const DomainConfirmationModal: React.FC = () => {
  const {
    showDomainConfirmationModal,
    setShowDomainConfirmationModal,
    domainConfirmation,
    profile,
    rows,
    setSpec,
    setIsGeneratingDashboard,
    isGeneratingDashboard,
    showToast,
  } = useDashboardStore();

  const [domainInput, setDomainInput] = useState(domainConfirmation?.domain || '');
  const [goalInput, setGoalInput] = useState(domainConfirmation?.recommendedGoal || '');

  // Keep inputs synced when domainConfirmation changes
  React.useEffect(() => {
    if (domainConfirmation) {
      setDomainInput(domainConfirmation.domain);
      setGoalInput(domainConfirmation.recommendedGoal);
    }
  }, [domainConfirmation]);

  if (!showDomainConfirmationModal || !domainConfirmation || !profile) return null;

  const handleGenerate = async () => {
    setIsGeneratingDashboard(true);
    try {
      const generatedSpec = await apiGenerateDashboard(
        domainInput || domainConfirmation.domain,
        goalInput || domainConfirmation.recommendedGoal,
        profile,
        rows
      );

      setSpec(generatedSpec, true);
      setShowDomainConfirmationModal(false);
      showToast('Generated executive dashboard', 'success');
    } catch (err: any) {
      console.error('Generation failed:', err);
      showToast('Generated with domain fallback engine', 'info');
      setShowDomainConfirmationModal(false);
    } finally {
      setIsGeneratingDashboard(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-7 animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Dataset Ingestion & Understanding
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Dataset Profile & Analytical Intent
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
          {domainConfirmation.description}
        </p>

        <div className="space-y-4 text-xs">
          {/* Detected Domain */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Detected Business Domain
            </label>
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="e.g. Sales, Marketing, HR, Finance..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Analytical Goal */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              Analytical Goal or Focus Area (Optional)
            </label>
            <textarea
              rows={2}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Find out why customer churn increased, or pinpoint top-margin products..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Detected Column Roles Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Detected Core Metrics & Dimensions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.detectedMeasures.slice(0, 4).map((m) => (
                <span
                  key={m}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  ⚡ {m} (Measure)
                </span>
              ))}
              {profile.detectedDimensions.slice(0, 4).map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  🏷️ {d} (Dimension)
                </span>
              ))}
              {profile.detectedTimeCols.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                >
                  📅 {t} (Time)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowDomainConfirmationModal(false)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isGeneratingDashboard}
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-colors"
          >
            {isGeneratingDashboard ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Designing Dashboard...
              </>
            ) : (
              <>
                <span>Generate Interactive Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
