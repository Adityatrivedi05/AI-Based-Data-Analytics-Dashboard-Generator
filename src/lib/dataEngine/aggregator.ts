import {
  AggregationType,
  CalculatedField,
  DashboardWidget,
  DatasetRow,
  Filter,
  FormatType,
  WidgetMetric,
} from './types';
import { cleanNumericValue, parseDateValue } from './parser';
import {
  evaluateAggregateFormula,
  evaluateRowFormula,
  isAggregateFormula,
} from './formulaParser';

/**
 * Filter dataset rows based on active filters and cross-filters
 */
export function applyFilters(rows: DatasetRow[], filters: Filter[]): DatasetRow[] {
  if (!filters || filters.length === 0) return rows;

  return rows.filter((row) => {
    for (const filter of filters) {
      const val = row[filter.field];

      if (filter.op === 'eq') {
        if (String(val).toLowerCase() !== String(filter.value).toLowerCase()) return false;
      } else if (filter.op === 'neq') {
        if (String(val).toLowerCase() === String(filter.value).toLowerCase()) return false;
      } else if (filter.op === 'in') {
        const arr = Array.isArray(filter.value) ? filter.value : [filter.value];
        const valStr = String(val).toLowerCase();
        if (!arr.some((item) => String(item).toLowerCase() === valStr)) return false;
      } else if (filter.op === 'nin') {
        const arr = Array.isArray(filter.value) ? filter.value : [filter.value];
        const valStr = String(val).toLowerCase();
        if (arr.some((item) => String(item).toLowerCase() === valStr)) return false;
      } else if (filter.op === 'gt') {
        const n = cleanNumericValue(val);
        if (n === null || n <= Number(filter.value)) return false;
      } else if (filter.op === 'lt') {
        const n = cleanNumericValue(val);
        if (n === null || n >= Number(filter.value)) return false;
      } else if (filter.op === 'gte') {
        const n = cleanNumericValue(val);
        if (n === null || n < Number(filter.value)) return false;
      } else if (filter.op === 'lte') {
        const n = cleanNumericValue(val);
        if (n === null || n > Number(filter.value)) return false;
      } else if (filter.op === 'between') {
        const [low, high] = Array.isArray(filter.value) ? filter.value : [null, null];
        const n = cleanNumericValue(val);
        if (n !== null) {
          if (low !== null && n < Number(low)) return false;
          if (high !== null && n > Number(high)) return false;
        } else {
          // Compare as date or string
          const s = String(val);
          if (low && s < String(low)) return false;
          if (high && s > String(high)) return false;
        }
      } else if (filter.op === 'contains') {
        if (!String(val).toLowerCase().includes(String(filter.value).toLowerCase())) return false;
      }
    }
    return true;
  });
}

/**
 * Augment rows with row-level calculated fields
 */
export function augmentWithCalculatedFields(
  rows: DatasetRow[],
  calculatedFields: CalculatedField[]
): DatasetRow[] {
  if (!calculatedFields || calculatedFields.length === 0) return rows;

  const rowCalcs = calculatedFields.filter((cf) => !isAggregateFormula(cf.formula));
  if (rowCalcs.length === 0) return rows;

  return rows.map((row) => {
    const copy = { ...row };
    for (const cf of rowCalcs) {
      copy[cf.name] = evaluateRowFormula(cf.formula, row);
    }
    return copy;
  });
}

/**
 * Aggregates a metric over an array of rows
 */
export function computeAggregation(
  rows: DatasetRow[],
  field: string,
  agg: AggregationType = 'sum',
  calculatedFields: CalculatedField[] = []
): number {
  if (rows.length === 0) return 0;

  // Check if this field is a calculated aggregate ratio e.g. sum(Clicks)/sum(Impressions)
  const calcField = calculatedFields.find((cf) => cf.name === field);
  if (calcField && isAggregateFormula(calcField.formula)) {
    return evaluateAggregateFormula(calcField.formula, rows);
  }

  if (agg === 'count') {
    if (!field || field === '*' || field === 'count') return rows.length;
    return rows.filter((r) => r[field] !== null && r[field] !== undefined && r[field] !== '').length;
  }

  if (agg === 'distinct') {
    const set = new Set();
    for (const r of rows) {
      const v = r[field];
      if (v !== null && v !== undefined && v !== '') set.add(v);
    }
    return set.size;
  }

  const values: number[] = [];
  for (const r of rows) {
    const num = cleanNumericValue(r[field]);
    if (num !== null) values.push(num);
  }

  if (values.length === 0) return 0;

  if (agg === 'sum') {
    return values.reduce((a, b) => a + b, 0);
  }

  if (agg === 'avg') {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  if (agg === 'min') {
    return Math.min(...values);
  }

  if (agg === 'max') {
    return Math.max(...values);
  }

  if (agg === 'median') {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  }

  return 0;
}

/**
 * Format date value according to bucket (day, week, month, quarter, year)
 */
export function bucketDate(dateStr: string, bucket: string = 'month'): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  if (bucket === 'year') return `${y}`;
  if (bucket === 'quarter') {
    const q = Math.floor(d.getUTCMonth() / 3) + 1;
    return `${y} Q${q}`;
  }
  if (bucket === 'month') return `${y}-${m}`;
  if (bucket === 'week') {
    // Round to week start
    const dayOfWeek = d.getUTCDay();
    const diff = d.getUTCDate() - dayOfWeek;
    const weekDate = new Date(d.setUTCDate(diff));
    return `${weekDate.getUTCFullYear()}-${String(weekDate.getUTCMonth() + 1).padStart(2, '0')}-${String(
      weekDate.getUTCDate()
    ).padStart(2, '0')}`;
  }
  return `${y}-${m}-${day}`;
}

/**
 * Formatter for numbers based on semantic format
 */
export function formatValue(value: number | null | undefined, format?: FormatType): string {
  if (value === null || value === undefined || isNaN(value)) return '0';

  if (format === 'percent') {
    // If value is e.g. 0.154 -> 15.4%, or if already 15.4
    const pct = Math.abs(value) <= 1 && value !== 0 ? value * 100 : value;
    return `${pct.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  }

  if (format === 'currency') {
    if (Math.abs(value) >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 10_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  if (format === 'compact') {
    if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  }

  if (format === 'integer') {
    return Math.round(value).toLocaleString();
  }

  if (format === 'duration') {
    if (value > 3600) return `${(value / 3600).toFixed(1)}h`;
    if (value > 60) return `${(value / 60).toFixed(1)}m`;
    return `${Math.round(value)}s`;
  }

  if (format === 'decimal') {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Auto format: compact if large, decimal if fractional
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Result structure for widgets
 */
export interface ComputedWidgetData {
  type: string;
  categories: string[];
  series: Array<{
    name: string;
    data: (number | null)[];
    type?: string;
  }>;
  kpi?: {
    current: number;
    previous?: number;
    changeRate?: number;
    sparkline: number[];
    target?: number;
    targetProgress?: number;
  };
  scatterPoints?: Array<[number, number, string, number?]>; // [x, y, label, size]
  histogramBins?: Array<{ range: string; count: number }>;
  boxPlotData?: Array<{ category: string; min: number; q1: number; median: number; q3: number; max: number }>;
  tableRows?: DatasetRow[];
  tableColumns?: string[];
  funnelData?: Array<{ name: string; value: number }>;
  waterfallData?: Array<{ name: string; value: number; isTotal?: boolean }>;
}

/**
 * Main widget computation function that maps real rows to chart ready series
 */
export function computeWidgetData(
  widget: DashboardWidget,
  allRows: DatasetRow[],
  activeFilters: Filter[],
  calculatedFields: CalculatedField[] = [],
  timeColumn?: string
): ComputedWidgetData {
  // 1. Augment with row-level calculated fields
  const augmented = augmentWithCalculatedFields(allRows, calculatedFields);

  // 2. Filter rows
  const filtered = applyFilters(augmented, activeFilters);

  // Fallback if no filtered data
  if (filtered.length === 0) {
    return {
      type: widget.type,
      categories: [],
      series: [],
      kpi: { current: 0, sparkline: [] },
      tableRows: [],
    };
  }

  // --- KPI Widget ---
  if (widget.type === 'kpi') {
    const metric = widget.metric || (widget.y && widget.y[0]) || { field: '*', agg: 'count' };
    const currentTotal = computeAggregation(filtered, metric.field, metric.agg, calculatedFields);

    // Period over period comparison
    let prevTotal: number | undefined = undefined;
    let changeRate: number | undefined = undefined;
    const sparkline: number[] = [];

    // Find time column (from widget or detected)
    const dateCol = timeColumn || Object.keys(filtered[0] || {}).find((k) => parseDateValue(filtered[0][k]));

    if (dateCol) {
      // Sort rows by date to generate sparkline and half-period comparison
      const sorted = [...filtered].sort((a, b) => {
        const da = String(a[dateCol] || '');
        const db = String(b[dateCol] || '');
        return da.localeCompare(db);
      });

      // Split into two halves for period-over-period
      const mid = Math.floor(sorted.length / 2);
      if (mid > 0) {
        const firstHalf = sorted.slice(0, mid);
        const secondHalf = sorted.slice(mid);
        prevTotal = computeAggregation(firstHalf, metric.field, metric.agg, calculatedFields);
        const currentHalf = computeAggregation(secondHalf, metric.field, metric.agg, calculatedFields);
        if (prevTotal !== 0) {
          changeRate = (currentHalf - prevTotal) / Math.abs(prevTotal);
        }
      }

      // Generate 10-point sparkline
      const chunks = 10;
      const chunkSize = Math.max(1, Math.floor(sorted.length / chunks));
      for (let i = 0; i < sorted.length; i += chunkSize) {
        const slice = sorted.slice(i, i + chunkSize);
        sparkline.push(computeAggregation(slice, metric.field, metric.agg, calculatedFields));
      }
    }

    const targetProgress = widget.targetValue && widget.targetValue > 0
      ? (currentTotal / widget.targetValue) * 100
      : undefined;

    return {
      type: 'kpi',
      categories: [],
      series: [],
      kpi: {
        current: currentTotal,
        previous: prevTotal,
        changeRate,
        sparkline,
        target: widget.targetValue,
        targetProgress,
      },
    };
  }

  // --- Data Table Widget ---
  if (widget.type === 'data_table') {
    const tableColumns = widget.y && widget.y.length > 0
      ? [widget.x, ...widget.y.map((m) => m.field)].filter((c): c is string => Boolean(c))
      : Object.keys(filtered[0] || {}).slice(0, 8);

    return {
      type: 'data_table',
      categories: [],
      series: [],
      tableRows: filtered.slice(0, 100),
      tableColumns,
    };
  }

  // --- Histogram Widget ---
  if (widget.type === 'histogram') {
    const field = widget.x || (widget.y && widget.y[0]?.field) || '';
    const numbers: number[] = [];
    for (const r of filtered) {
      const n = cleanNumericValue(r[field]);
      if (n !== null) numbers.push(n);
    }

    if (numbers.length === 0) {
      return { type: 'histogram', categories: [], series: [] };
    }

    numbers.sort((a, b) => a - b);
    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const binCount = Math.min(10, Math.max(5, Math.ceil(Math.log2(numbers.length) + 1)));
    const binWidth = (max - min) / (binCount || 1);

    const bins: number[] = new Array(binCount).fill(0);
    const binLabels: string[] = [];

    for (let i = 0; i < binCount; i++) {
      const start = min + i * binWidth;
      const end = start + binWidth;
      binLabels.push(`${formatValue(start)} - ${formatValue(end)}`);
    }

    for (const n of numbers) {
      let idx = Math.floor((n - min) / (binWidth || 1));
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx]++;
    }

    return {
      type: 'histogram',
      categories: binLabels,
      series: [{ name: 'Frequency', data: bins }],
    };
  }

  // --- Scatter / Bubble Widget ---
  if (widget.type === 'scatter' || widget.type === 'bubble') {
    const xField = widget.x || '';
    const yField = widget.y && widget.y[0]?.field || '';
    const labelField = widget.seriesBy || '';
    const sizeField = widget.sizeBy || (widget.y && widget.y[1]?.field);

    const scatterPoints: Array<[number, number, string, number?]> = [];
    const sampleLimit = Math.min(filtered.length, 250);

    for (let i = 0; i < sampleLimit; i++) {
      const r = filtered[i];
      const xVal = cleanNumericValue(r[xField]);
      const yVal = cleanNumericValue(r[yField]);
      if (xVal !== null && yVal !== null) {
        const label = labelField ? String(r[labelField] ?? '') : `#${i + 1}`;
        const size = sizeField ? cleanNumericValue(r[sizeField]) || 10 : 10;
        scatterPoints.push([xVal, yVal, label, size]);
      }
    }

    return {
      type: widget.type,
      categories: [],
      series: [],
      scatterPoints,
    };
  }

  // --- Funnel Widget ---
  if (widget.type === 'funnel') {
    const xField = widget.x || '';
    const metric = (widget.y && widget.y[0]) || { field: '*', agg: 'count' };

    // Group by stage
    const groups = new Map<string, DatasetRow[]>();
    for (const r of filtered) {
      const stage = String(r[xField] ?? 'Unknown');
      if (!groups.has(stage)) groups.set(stage, []);
      groups.get(stage)!.push(r);
    }

    const funnelData: Array<{ name: string; value: number }> = [];
    for (const [stage, gRows] of groups.entries()) {
      const val = computeAggregation(gRows, metric.field, metric.agg, calculatedFields);
      funnelData.push({ name: stage, value: val });
    }

    // Default funnel sort desc
    funnelData.sort((a, b) => b.value - a.value);

    return {
      type: 'funnel',
      categories: funnelData.map((d) => d.name),
      series: [{ name: metric.label || metric.field, data: funnelData.map((d) => d.value) }],
      funnelData,
    };
  }

  // --- Waterfall Widget ---
  if (widget.type === 'waterfall') {
    const xField = widget.x || '';
    const metric = (widget.y && widget.y[0]) || { field: '*', agg: 'sum' };

    const groups = new Map<string, DatasetRow[]>();
    for (const r of filtered) {
      const stage = String(r[xField] ?? 'Unknown');
      if (!groups.has(stage)) groups.set(stage, []);
      groups.get(stage)!.push(r);
    }

    const waterfallData: Array<{ name: string; value: number; isTotal?: boolean }> = [];
    let runningTotal = 0;
    for (const [stage, gRows] of groups.entries()) {
      const val = computeAggregation(gRows, metric.field, metric.agg, calculatedFields);
      runningTotal += val;
      waterfallData.push({ name: stage, value: val });
    }

    waterfallData.push({ name: 'Total', value: runningTotal, isTotal: true });

    return {
      type: 'waterfall',
      categories: waterfallData.map((d) => d.name),
      series: [{ name: metric.label || metric.field, data: waterfallData.map((d) => d.value) }],
      waterfallData,
    };
  }

  // --- Standard Group-By Charts (Bar, Line, Area, Combo, Pie, Donut, Heatmap, Treemap) ---
  const xField = widget.x || Object.keys(filtered[0] || {})[0] || 'Category';
  const metrics = widget.y && widget.y.length > 0 ? widget.y : [{ field: '*', agg: 'count' as AggregationType }];
  const seriesByField = widget.seriesBy;

  // Grouping logic
  const groupMap = new Map<string, DatasetRow[]>();

  for (const r of filtered) {
    let key = r[xField];
    if (key === null || key === undefined || key === '') {
      key = 'Unknown';
    } else {
      // Check if date bucketing needed
      const d = parseDateValue(key);
      if (d) {
        key = bucketDate(d, widget.timeBucket || 'month');
      } else {
        key = String(key);
      }
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(r);
  }

  // Calculate totals per category for sorting & top N
  const primaryMetric = metrics[0];
  const categoryTotals: Array<{ key: string; total: number; rows: DatasetRow[] }> = [];

  for (const [key, gRows] of groupMap.entries()) {
    const tot = computeAggregation(gRows, primaryMetric.field, primaryMetric.agg, calculatedFields);
    categoryTotals.push({ key, total: tot, rows: gRows });
  }

  // Sort categories
  const sortDirection = widget.sort || 'desc';
  if (sortDirection === 'desc') {
    categoryTotals.sort((a, b) => b.total - a.total);
  } else if (sortDirection === 'asc') {
    categoryTotals.sort((a, b) => a.total - b.total);
  }

  // Top N limit with "Other" grouping if high cardinality
  const limit = widget.limit || (widget.type === 'pie' || widget.type === 'donut' ? 8 : 12);
  let categories: string[] = [];
  let finalRowsPerCat: Array<{ key: string; rows: DatasetRow[] }> = [];

  if (categoryTotals.length > limit) {
    const topSlice = categoryTotals.slice(0, limit);
    const otherSlice = categoryTotals.slice(limit);
    const otherRows = otherSlice.flatMap((s) => s.rows);

    categories = [...topSlice.map((s) => s.key), 'Other'];
    finalRowsPerCat = [
      ...topSlice.map((s) => ({ key: s.key, rows: s.rows })),
      { key: 'Other', rows: otherRows },
    ];
  } else {
    categories = categoryTotals.map((s) => s.key);
    finalRowsPerCat = categoryTotals.map((s) => ({ key: s.key, rows: s.rows }));
  }

  // If seriesBy is provided (e.g. Grouped or Stacked bar)
  if (seriesByField) {
    // Find top secondary series
    const seriesValCounts = new Map<string, number>();
    for (const r of filtered) {
      const sVal = String(r[seriesByField] ?? 'Unknown');
      seriesValCounts.set(sVal, (seriesValCounts.get(sVal) || 0) + 1);
    }
    const topSeriesNames = Array.from(seriesValCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map((entry) => entry[0]);

    const series = topSeriesNames.map((sName) => {
      const data = finalRowsPerCat.map(({ rows }) => {
        const subRows = rows.filter((r) => String(r[seriesByField] ?? 'Unknown') === sName);
        return computeAggregation(subRows, primaryMetric.field, primaryMetric.agg, calculatedFields);
      });
      return {
        name: sName,
        data,
        type: widget.type === 'area' ? 'line' : 'bar',
      };
    });

    return {
      type: widget.type,
      categories,
      series,
    };
  }

  // Standard multi-metric series
  const series = metrics.map((m, idx) => {
    const data = finalRowsPerCat.map(({ rows }) => {
      return computeAggregation(rows, m.field, m.agg, calculatedFields);
    });

    let seriesType: string = 'bar';
    if (widget.type === 'line' || widget.type === 'area') seriesType = 'line';
    else if (widget.type === 'combo') {
      seriesType = idx === 0 ? 'bar' : 'line';
    } else if (widget.type === 'pie' || widget.type === 'donut') {
      seriesType = 'pie';
    }

    return {
      name: m.label || `${m.agg ? `${m.agg}(${m.field})` : m.field}`,
      data,
      type: seriesType,
    };
  });

  return {
    type: widget.type,
    categories,
    series,
  };
}
