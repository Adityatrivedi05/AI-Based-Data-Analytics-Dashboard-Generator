import { create } from 'zustand';
import {
  CalculatedField,
  DashboardSpec,
  DashboardWidget,
  DatasetProfile,
  DatasetRow,
  Filter,
} from '../lib/dataEngine/types';
import { profileDataset } from '../lib/dataEngine/profiler';
import { SAMPLE_DATASETS } from '../lib/dataEngine/sampleDatasets';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCall?: string;
  undoSpec?: DashboardSpec;
}

export type MainNavView = 'dashboard' | 'preview' | 'columns' | 'insights';

interface DashboardState {
  // Dataset state
  datasetName: string;
  rows: DatasetRow[];
  headers: string[];
  profile: DatasetProfile | null;
  rawRowsBackup: DatasetRow[]; // For cleaning undo

  // Modal & Confirmation states
  isUploadModalOpen: boolean;
  showDomainConfirmationModal: boolean;
  domainConfirmation: {
    domain: string;
    description: string;
    recommendedGoal: string;
    keyMetrics: string[];
    suggestedPrompts: string[];
  } | null;

  // Dashboard Spec & History
  spec: DashboardSpec | null;
  history: DashboardSpec[];
  historyIndex: number;
  activeTab: string;
  activeNavView: MainNavView;

  // Widget editing & Cross-filtering
  selectedWidgetId: string | null;
  highlightedWidgetId: string | null;
  crossFilter: { field: string; value: any } | null;

  // AI Assistant Chat
  isChatOpen: boolean;
  chatMessages: ChatMessage[];
  isChatBusy: boolean;

  // Loading states & Toasts
  isAnalyzing: boolean;
  isGeneratingDashboard: boolean;
  toastMessage: { text: string; type: 'success' | 'info' | 'error' } | null;

  // Actions
  setDataset: (name: string, rows: DatasetRow[], headers: string[]) => void;
  loadSampleDataset: (sampleId: string) => void;
  setDomainConfirmation: (data: any) => void;
  setShowDomainConfirmationModal: (show: boolean) => void;
  setIsUploadModalOpen: (open: boolean) => void;
  setSpec: (spec: DashboardSpec, saveToHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setActiveTab: (tab: string) => void;
  setActiveNavView: (view: MainNavView) => void;
  setSelectedWidgetId: (id: string | null) => void;
  setHighlightedWidgetId: (id: string | null) => void;
  setCrossFilter: (field: string | null, value?: any) => void;
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  deleteWidget: (widgetId: string) => void;
  duplicateWidget: (widgetId: string) => void;
  addWidget: (widget: DashboardWidget) => void;
  addCalculatedField: (field: CalculatedField) => void;
  toggleTheme: () => void;
  setIsChatOpen: (open: boolean) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setIsChatBusy: (busy: boolean) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setIsGeneratingDashboard: (generating: boolean) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  clearToast: () => void;
  updateColumnRole: (colName: string, role: any, format: any) => void;
  applyCleanedRows: (newRows: DatasetRow[], desc: string) => void;
  undoCleaning: () => void;
}

const initialSample = SAMPLE_DATASETS[0];
const initialProfile = profileDataset(initialSample.rows, initialSample.headers);

const initialBaselineSpec: DashboardSpec = {
  title: 'Global E-Commerce Executive Dashboard',
  domain: initialSample.domain,
  description: initialSample.description,
  goal: initialSample.recommendedGoal,
  theme: 'light',
  tabs: ['Overview', 'Trends', 'Breakdowns', 'Details'],
  calculatedFields: [
    { name: 'ProfitMargin', formula: 'Profit / Revenue', format: 'percent' },
  ],
  filters: [],
  widgets: [
    {
      id: 'kpi_revenue',
      tab: 'Overview',
      type: 'kpi',
      title: 'Total Revenue',
      metric: { field: 'Revenue', agg: 'sum', label: 'Total Revenue' },
      compareTo: 'previous_period',
      layout: { x: 0, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi_profit',
      tab: 'Overview',
      type: 'kpi',
      title: 'Total Profit',
      metric: { field: 'Profit', agg: 'sum', label: 'Total Profit' },
      compareTo: 'previous_period',
      targetValue: 60000,
      layout: { x: 3, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi_units',
      tab: 'Overview',
      type: 'kpi',
      title: 'Units Sold',
      metric: { field: 'Units', agg: 'sum', label: 'Units Sold' },
      compareTo: 'previous_period',
      layout: { x: 6, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi_orders',
      tab: 'Overview',
      type: 'kpi',
      title: 'Total Orders',
      metric: { field: '*', agg: 'count', label: 'Order Count' },
      compareTo: 'none',
      layout: { x: 9, y: 0, w: 3, h: 2 },
    },
    {
      id: 'chart_rev_region',
      tab: 'Overview',
      type: 'bar',
      title: 'Revenue by Region',
      insight: 'North America and Asia Pacific generate 72% of total commercial volume.',
      x: 'Region',
      y: [{ field: 'Revenue', agg: 'sum' }],
      sort: 'desc',
      limit: 10,
      layout: { x: 0, y: 2, w: 6, h: 4 },
    },
    {
      id: 'chart_profit_cat',
      tab: 'Overview',
      type: 'donut',
      title: 'Profit Share by Category',
      insight: 'Electronics delivers the highest margin dollar contribution.',
      x: 'Category',
      y: [{ field: 'Profit', agg: 'sum' }],
      sort: 'desc',
      limit: 7,
      layout: { x: 6, y: 2, w: 6, h: 4 },
    },
    {
      id: 'chart_timeline',
      tab: 'Trends',
      type: 'area',
      title: 'Monthly Revenue Velocity',
      insight: 'Q4 holiday surge exhibits peak revenue acceleration.',
      x: 'Date',
      timeBucket: 'month',
      y: [{ field: 'Revenue', agg: 'sum' }],
      sort: 'asc',
      layout: { x: 0, y: 0, w: 12, h: 4 },
    },
    {
      id: 'chart_combo_cat',
      tab: 'Breakdowns',
      type: 'combo',
      title: 'Revenue & Profit by SubCategory',
      x: 'SubCategory',
      y: [
        { field: 'Revenue', agg: 'sum' },
        { field: 'Profit', agg: 'sum' },
      ],
      sort: 'desc',
      limit: 10,
      layout: { x: 0, y: 0, w: 8, h: 4 },
    },
    {
      id: 'chart_scatter',
      tab: 'Breakdowns',
      type: 'scatter',
      title: 'Revenue vs Profit Distribution',
      x: 'Revenue',
      y: [{ field: 'Profit', agg: 'sum' }],
      seriesBy: 'Category',
      layout: { x: 8, y: 0, w: 4, h: 4 },
    },
    {
      id: 'chart_raw_table',
      tab: 'Details',
      type: 'data_table',
      title: 'Detailed Transaction Ledger',
      layout: { x: 0, y: 0, w: 12, h: 5 },
    },
  ],
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  datasetName: initialSample.name,
  rows: initialSample.rows,
  headers: initialSample.headers,
  profile: initialProfile,
  rawRowsBackup: initialSample.rows,

  isUploadModalOpen: false,
  showDomainConfirmationModal: false,
  domainConfirmation: {
    domain: initialSample.domain,
    description: initialSample.description,
    recommendedGoal: initialSample.recommendedGoal,
    keyMetrics: ['Revenue', 'Profit', 'Units'],
    suggestedPrompts: [
      'Show profit margin by region',
      'Make the revenue chart a donut',
      'Filter to North America',
      'Which product has the highest profit?',
    ],
  },

  spec: initialBaselineSpec,
  history: [initialBaselineSpec],
  historyIndex: 0,
  activeTab: 'Overview',
  activeNavView: 'dashboard',

  selectedWidgetId: null,
  highlightedWidgetId: null,
  crossFilter: null,

  isChatOpen: true,
  chatMessages: [
    {
      id: 'm1',
      role: 'assistant',
      text: 'Hello! I am your InsightAI copilot. Ask me anything about your data, or tell me how you want to refine your dashboard.',
      timestamp: 'Just now',
    },
  ],
  isChatBusy: false,

  isAnalyzing: false,
  isGeneratingDashboard: false,
  toastMessage: null,

  setDataset: (name, rows, headers) => {
    const profile = profileDataset(rows, headers);
    set({
      datasetName: name,
      rows,
      headers,
      profile,
      rawRowsBackup: rows,
      spec: null,
      history: [],
      historyIndex: -1,
      crossFilter: null,
      selectedWidgetId: null,
    });
  },

  loadSampleDataset: (sampleId) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId) || SAMPLE_DATASETS[0];
    const profile = profileDataset(sample.rows, sample.headers);
    set({
      datasetName: sample.name,
      rows: sample.rows,
      headers: sample.headers,
      profile,
      rawRowsBackup: sample.rows,
      spec: null,
      history: [],
      historyIndex: -1,
      crossFilter: null,
      selectedWidgetId: null,
      domainConfirmation: {
        domain: sample.domain,
        description: sample.description,
        recommendedGoal: sample.recommendedGoal,
        keyMetrics: profile.detectedMeasures.slice(0, 3),
        suggestedPrompts: [
          `Analyze top ${profile.detectedDimensions[0] || 'categories'}`,
          `Show trend over time`,
          `Filter to highest performance`,
        ],
      },
      showDomainConfirmationModal: true,
    });
  },

  setDomainConfirmation: (data) => set({ domainConfirmation: data }),
  setShowDomainConfirmationModal: (show) => set({ showDomainConfirmationModal: show }),
  setIsUploadModalOpen: (open) => set({ isUploadModalOpen: open }),

  setSpec: (spec, saveToHistory = true) => {
    const { history, historyIndex } = get();
    if (!saveToHistory) {
      set({ spec, activeTab: spec.tabs?.[0] || 'Overview' });
      return;
    }

    const newHistory = [...history.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(spec))];
    set({
      spec,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      activeTab: spec.tabs?.[0] || 'Overview',
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        spec: JSON.parse(JSON.stringify(prev)),
        historyIndex: historyIndex - 1,
      });
      get().showToast('Undone previous change', 'info');
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        spec: JSON.parse(JSON.stringify(next)),
        historyIndex: historyIndex + 1,
      });
      get().showToast('Redone change', 'info');
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveNavView: (view) => set({ activeNavView: view }),
  setSelectedWidgetId: (id) => set({ selectedWidgetId: id }),
  setHighlightedWidgetId: (id) => set({ highlightedWidgetId: id }),

  setCrossFilter: (field, value) => {
    if (!field) {
      set({ crossFilter: null });
      return;
    }
    const current = get().crossFilter;
    if (current && current.field === field && current.value === value) {
      // Toggle off
      set({ crossFilter: null });
    } else {
      set({ crossFilter: { field, value } });
    }
  },

  addFilter: (filter) => {
    const { spec } = get();
    if (!spec) return;
    const filters = [...(spec.filters || []), filter];
    const newSpec = { ...spec, filters };
    get().setSpec(newSpec, true);
  },

  removeFilter: (index) => {
    const { spec } = get();
    if (!spec) return;
    const filters = spec.filters.filter((_, i) => i !== index);
    const newSpec = { ...spec, filters };
    get().setSpec(newSpec, true);
  },

  clearFilters: () => {
    const { spec } = get();
    if (!spec) return;
    const newSpec = { ...spec, filters: [] };
    set({ crossFilter: null });
    get().setSpec(newSpec, true);
  },

  updateWidget: (widgetId, updates) => {
    const { spec } = get();
    if (!spec) return;
    const widgets = spec.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w));
    get().setSpec({ ...spec, widgets }, true);
    set({ highlightedWidgetId: widgetId });
    setTimeout(() => set({ highlightedWidgetId: null }), 2000);
  },

  deleteWidget: (widgetId) => {
    const { spec } = get();
    if (!spec) return;
    const widgets = spec.widgets.filter((w) => w.id !== widgetId);
    get().setSpec({ ...spec, widgets }, true);
    set({ selectedWidgetId: null });
    get().showToast('Widget deleted', 'info');
  },

  duplicateWidget: (widgetId) => {
    const { spec } = get();
    if (!spec) return;
    const target = spec.widgets.find((w) => w.id === widgetId);
    if (!target) return;
    const newWidget: DashboardWidget = {
      ...JSON.parse(JSON.stringify(target)),
      id: `w_${Date.now()}`,
      title: `${target.title} (Copy)`,
      layout: { ...target.layout, y: target.layout.y + target.layout.h },
    };
    get().setSpec({ ...spec, widgets: [...spec.widgets, newWidget] }, true);
    get().showToast('Widget duplicated', 'success');
  },

  addWidget: (widget) => {
    const { spec } = get();
    if (!spec) return;
    get().setSpec({ ...spec, widgets: [...spec.widgets, widget] }, true);
    set({ highlightedWidgetId: widget.id });
    setTimeout(() => set({ highlightedWidgetId: null }), 2000);
    get().showToast('Widget added to dashboard', 'success');
  },

  addCalculatedField: (field) => {
    const { spec } = get();
    if (!spec) return;
    const calculatedFields = [...(spec.calculatedFields || []), field];
    get().setSpec({ ...spec, calculatedFields }, true);
    get().showToast(`Calculated field "${field.name}" created`, 'success');
  },

  toggleTheme: () => {
    const { spec } = get();
    if (!spec) return;
    const newTheme = spec.theme === 'dark' ? 'light' : 'dark';
    get().setSpec({ ...spec, theme: newTheme }, true);
  },

  setIsChatOpen: (open) => set({ isChatOpen: open }),

  addChatMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({ chatMessages: [...state.chatMessages, newMsg] }));
  },

  setIsChatBusy: (busy) => set({ isChatBusy: busy }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setIsGeneratingDashboard: (generating) => set({ isGeneratingDashboard: generating }),

  showToast: (text, type = 'success') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      set((state) => (state.toastMessage?.text === text ? { toastMessage: null } : state));
    }, 3500);
  },

  clearToast: () => set({ toastMessage: null }),

  updateColumnRole: (colName, role, format) => {
    const { profile } = get();
    if (!profile) return;
    const col = profile.columns[colName];
    if (!col) return;
    const updated = {
      ...profile,
      columns: {
        ...profile.columns,
        [colName]: { ...col, role, format },
      },
    };
    set({ profile: updated });
    get().showToast(`Updated role for ${colName}`, 'info');
  },

  applyCleanedRows: (newRows, desc) => {
    const { headers, datasetName } = get();
    const newProfile = profileDataset(newRows, headers);
    set({
      rows: newRows,
      profile: newProfile,
    });
    get().showToast(desc, 'success');
  },

  undoCleaning: () => {
    const { rawRowsBackup, headers } = get();
    const profile = profileDataset(rawRowsBackup, headers);
    set({ rows: rawRowsBackup, profile });
    get().showToast('Reverted cleaning to raw uploaded dataset', 'info');
  },
}));
