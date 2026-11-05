import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Bot,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';
import { apiChatAssistant } from '../lib/aiClient';
import { computeAggregation, formatValue } from '../lib/dataEngine/aggregator';
import { DashboardWidget } from '../lib/dataEngine/types';

export const AiAssistantSidebar: React.FC = () => {
  const {
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    addChatMessage,
    isChatBusy,
    setIsChatBusy,
    spec,
    setSpec,
    undo,
    profile,
    domainConfirmation,
    rows,
    showToast,
  } = useDashboardStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatBusy]);

  if (!isChatOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isChatBusy || !spec || !profile) return;

    setInput('');
    addChatMessage({
      role: 'user',
      text: textToSend,
    });

    setIsChatBusy(true);

    try {
      const history = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await apiChatAssistant(
        textToSend,
        history,
        spec,
        profile,
        spec.domain || domainConfirmation?.domain || 'Analytics',
        spec.goal || domainConfirmation?.recommendedGoal || 'Analyze data'
      );

      // Save previous state for undo capability
      const previousSpecState = JSON.parse(JSON.stringify(spec));
      let actionAppliedDesc = '';

      // Execute tool calls returned from Gemini function calling
      if (res.toolCalls && res.toolCalls.length > 0) {
        let updatedSpec = { ...spec };

        for (const tool of res.toolCalls) {
          const { name, args } = tool;

          if (name === 'add_widget') {
            const newWidget: DashboardWidget = {
              id: `w_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              tab: args.tab || spec.tabs[0] || 'Overview',
              type: args.type || 'bar',
              title: args.title || 'New Analysis',
              x: args.x || profile.detectedDimensions[0],
              y: args.measureField ? [{ field: args.measureField, agg: (args.agg as any) || 'sum' }] : undefined,
              metric: args.type === 'kpi' && args.measureField ? { field: args.measureField, agg: (args.agg as any) || 'sum' } : undefined,
              seriesBy: args.seriesBy,
              sort: args.sort as any,
              limit: args.limit || 10,
              insight: args.insight,
              layout: { x: 0, y: 10, w: args.type === 'kpi' ? 3 : 6, h: args.type === 'kpi' ? 2 : 4 },
            };
            updatedSpec = {
              ...updatedSpec,
              widgets: [...updatedSpec.widgets, newWidget],
            };
            actionAppliedDesc = `Added ${newWidget.title} (${newWidget.type})`;
          } else if (name === 'update_widget') {
            const targetWidget = updatedSpec.widgets.find((w) => w.id === args.widgetId || w.title.toLowerCase().includes((args.title || '').toLowerCase()));
            if (targetWidget) {
              const updatedWidgets = updatedSpec.widgets.map((w) => {
                if (w.id === targetWidget.id) {
                  return {
                    ...w,
                    ...(args.title ? { title: args.title } : {}),
                    ...(args.type ? { type: args.type as any } : {}),
                    ...(args.x ? { x: args.x } : {}),
                    ...(args.measureField ? { y: [{ field: args.measureField, agg: (args.agg as any) || 'sum' }] } : {}),
                    ...(args.color ? { style: { ...w.style, color: args.color } } : {}),
                    ...(args.limit ? { limit: args.limit } : {}),
                    ...(args.sort ? { sort: args.sort as any } : {}),
                  };
                }
                return w;
              });
              updatedSpec = { ...updatedSpec, widgets: updatedWidgets };
              actionAppliedDesc = `Updated widget "${targetWidget.title}"`;
            }
          } else if (name === 'remove_widget') {
            updatedSpec = {
              ...updatedSpec,
              widgets: updatedSpec.widgets.filter((w) => w.id !== args.widgetId),
            };
            actionAppliedDesc = `Removed widget`;
          } else if (name === 'set_filter') {
            const val = args.value.includes(',') ? args.value.split(',').map((s: string) => s.trim()) : args.value;
            const newFilters = [...(updatedSpec.filters || []), { field: args.field, op: args.op as any, value: val }];
            updatedSpec = { ...updatedSpec, filters: newFilters };
            actionAppliedDesc = `Filtered by ${args.field} ${args.op} ${args.value}`;
          } else if (name === 'clear_filters') {
            updatedSpec = { ...updatedSpec, filters: [] };
            actionAppliedDesc = `Cleared all dashboard filters`;
          } else if (name === 'create_calculated_field') {
            updatedSpec = {
              ...updatedSpec,
              calculatedFields: [
                ...(updatedSpec.calculatedFields || []),
                { name: args.name, formula: args.formula, format: args.format as any },
              ],
            };
            actionAppliedDesc = `Created calculated metric: ${args.name}`;
          } else if (name === 'change_theme') {
            updatedSpec = { ...updatedSpec, theme: args.theme as any };
            actionAppliedDesc = `Changed theme to ${args.theme}`;
          } else if (name === 'run_query') {
            // Local query execution
            const metricField = args.field;
            const groupField = args.groupBy;
            const agg = (args.agg as any) || 'sum';
            const total = computeAggregation(rows, metricField, agg, updatedSpec.calculatedFields);
            actionAppliedDesc = `Query: ${agg}(${metricField}) across ${groupField} = ${formatValue(total)}`;
          }
        }

        setSpec(updatedSpec, true);
        showToast(actionAppliedDesc || 'Dashboard updated', 'success');
      }

      addChatMessage({
        role: 'assistant',
        text: res.reply,
        toolCall: actionAppliedDesc || undefined,
        undoSpec: actionAppliedDesc ? previousSpecState : undefined,
      });
    } catch (err: any) {
      addChatMessage({
        role: 'assistant',
        text: `Sorry, I encountered an issue: ${err.message || 'Please retry.'}`,
      });
    } finally {
      setIsChatBusy(false);
    }
  };

  const suggestedPrompts = domainConfirmation?.suggestedPrompts || [
    'Change the first chart to a donut',
    'Filter to the top performing region',
    'Add a KPI of total revenue',
    'Why did the highest metric spike?',
  ];

  return (
    <div className="w-84 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-xl z-20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              InsightAI Assistant
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Natural language dashboard commands
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsChatOpen(false)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
          title="Close chat"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Prompts Pills */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
          Suggested Actions
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestedPrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={isChatBusy}
              className="text-left text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
              {msg.role === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-indigo-500" />
                  <span>InsightAI</span>
                </>
              )}
              <span>• {msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Action Confirmation pill */}
              {msg.toolCall && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{msg.toolCall}</span>
                  </div>

                  {msg.undoSpec && (
                    <button
                      onClick={() => {
                        setSpec(msg.undoSpec!, true);
                        showToast('Reverted assistant changes', 'info');
                      }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Undo this action"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Undo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isChatBusy && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs w-max animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>Analyzing dataset & updating dashboard...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Make revenue a bar chart..."
          disabled={isChatBusy}
          className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isChatBusy}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white transition-colors"
          title="Send command"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
