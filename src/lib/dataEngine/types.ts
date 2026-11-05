export type ColumnType = 'number' | 'string' | 'date' | 'boolean';

export type SemanticRole =
  | 'measure'      // Numeric values that can be aggregated (Sales, Cost, Quantity)
  | 'dimension'    // Categorical variables (Category, Region, Department)
  | 'time'         // Dates and timestamps (OrderDate, Year, Month)
  | 'identifier'   // Unique keys or IDs (never aggregated, e.g. CustomerID, UUID)
  | 'geo'          // Geographical fields (Country, State, City, Zip)
  | 'boolean'      // True/false flags (IsActive, Churned)
  | 'text';        // Freeform descriptive text (Comments, Notes)

export type FormatType =
  | 'auto'
  | 'currency'
  | 'percent'
  | 'duration'
  | 'integer'
  | 'decimal'
  | 'compact'
  | 'date'
  | 'string';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  role: SemanticRole;
  format: FormatType;
  totalCount: number;
  missingCount: number;
  missingRate: number;
  uniqueCount: number;
  cardinalityRatio: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  stdDev?: number;
  sampleValues: (string | number | boolean)[];
  topValues?: { value: string; count: number }[];
  outliersCount: number;
}

export interface DatasetProfile {
  rowCount: number;
  colCount: number;
  qualityScore: number; // 0 - 100
  duplicateRowsCount: number;
  columns: Record<string, ColumnProfile>;
  columnNames: string[];
  detectedMeasures: string[];
  detectedDimensions: string[];
  detectedTimeCols: string[];
  detectedGeoCols: string[];
}

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'nin'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'between'
  | 'contains';

export interface Filter {
  id?: string;
  field: string;
  op: FilterOperator;
  value: any;
  isCrossFilter?: boolean;
}

export interface CalculatedField {
  name: string;
  formula: string; // e.g., "sum(Clicks) / sum(Impressions)" or "Revenue - Cost"
  format: FormatType;
  isRatio?: boolean;
}

export type AggregationType =
  | 'sum'
  | 'avg'
  | 'count'
  | 'distinct'
  | 'min'
  | 'max'
  | 'median';

export type WidgetType =
  | 'kpi'
  | 'line'
  | 'area'
  | 'bar'
  | 'bar_horizontal'
  | 'bar_stacked'
  | 'bar_grouped'
  | 'combo'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'histogram'
  | 'box_plot'
  | 'heatmap'
  | 'treemap'
  | 'funnel'
  | 'waterfall'
  | 'gauge'
  | 'pivot_table'
  | 'data_table';

export interface WidgetMetric {
  field: string;
  agg?: AggregationType;
  label?: string;
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetStyle {
  color?: string;
  colors?: string[];
  legend?: boolean;
  labels?: boolean;
  sparkline?: boolean;
  stack?: boolean;
  smooth?: boolean;
  horizontal?: boolean;
}

export interface DashboardWidget {
  id: string;
  tab: string;
  type: WidgetType;
  title: string;
  description?: string;
  insight?: string;
  x?: string; // Main dimension or time column
  y?: WidgetMetric[]; // Measures to plot
  seriesBy?: string; // Secondary dimension for grouped / stacked charts
  sizeBy?: string; // For bubble chart
  metric?: WidgetMetric; // For KPI cards
  compareTo?: 'previous_period' | 'target' | 'none';
  targetValue?: number;
  sort?: 'asc' | 'desc' | 'none';
  limit?: number; // Top N limit
  timeBucket?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'auto';
  style?: WidgetStyle;
  layout: WidgetLayout;
}

export interface DashboardSpec {
  title: string;
  domain: string;
  description?: string;
  goal?: string;
  theme: 'light' | 'dark';
  calculatedFields: CalculatedField[];
  filters: Filter[];
  tabs: string[];
  widgets: DashboardWidget[];
}

export type DatasetRow = Record<string, any>;
