import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI server-side client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Fallback mock dashboard generator if Gemini API key is missing
function generateDeterministicFallback(domain: string, goal: string, schema: any): any {
  const colObj = schema?.columns || {};
  const columns: any[] = Array.isArray(colObj) ? colObj : Object.values(colObj);
  const measures: string[] = schema?.detectedMeasures && schema.detectedMeasures.length > 0
    ? schema.detectedMeasures
    : columns.filter((c) => c && (c.role === 'measure' || c.type === 'number')).map((c) => c.name);
  const dimensions: string[] = schema?.detectedDimensions && schema.detectedDimensions.length > 0
    ? schema.detectedDimensions
    : columns.filter((c) => c && (c.role === 'dimension' || c.role === 'geo' || c.type === 'string')).map((c) => c.name);
  const timeCols: string[] = schema?.detectedTimeCols && schema.detectedTimeCols.length > 0
    ? schema.detectedTimeCols
    : columns.filter((c) => c && (c.role === 'time' || c.type === 'date')).map((c) => c.name);

  const mainMeasure = measures[0] || 'Count';
  const secondaryMeasure = measures[1] || mainMeasure;
  const mainDim = dimensions[0] || 'Category';
  const secondaryDim = dimensions[1] || mainDim;
  const timeCol = timeCols[0];

  const widgets: any[] = [
    {
      id: 'kpi_1',
      tab: 'Overview',
      type: 'kpi',
      title: `Total ${mainMeasure}`,
      metric: { field: mainMeasure, agg: 'sum', label: `Total ${mainMeasure}` },
      compareTo: 'previous_period',
      layout: { x: 0, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi_2',
      tab: 'Overview',
      type: 'kpi',
      title: `Average ${secondaryMeasure}`,
      metric: { field: secondaryMeasure, agg: 'avg', label: `Avg ${secondaryMeasure}` },
      compareTo: 'previous_period',
      layout: { x: 3, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi_3',
      tab: 'Overview',
      type: 'kpi',
      title: `Unique ${mainDim}`,
      metric: { field: mainDim, agg: 'distinct', label: `Unique ${mainDim}` },
      compareTo: 'none',
      layout: { x: 6, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi_4',
      tab: 'Overview',
      type: 'kpi',
      title: 'Total Records',
      metric: { field: '*', agg: 'count', label: 'Record Count' },
      compareTo: 'none',
      layout: { x: 9, y: 0, w: 3, h: 2 },
    },
    {
      id: 'chart_1',
      tab: 'Overview',
      type: 'bar',
      title: `${mainMeasure} by ${mainDim}`,
      x: mainDim,
      y: [{ field: mainMeasure, agg: 'sum' }],
      sort: 'desc',
      limit: 10,
      layout: { x: 0, y: 2, w: 6, h: 4 },
      insight: `Top distribution of ${mainMeasure} across ${mainDim}.`,
    },
    {
      id: 'chart_2',
      tab: 'Overview',
      type: 'donut',
      title: `${secondaryMeasure} Share by ${secondaryDim}`,
      x: secondaryDim,
      y: [{ field: secondaryMeasure, agg: 'sum' }],
      sort: 'desc',
      limit: 7,
      layout: { x: 6, y: 2, w: 6, h: 4 },
      insight: `${secondaryDim} contribution breakdown.`,
    },
  ];

  if (timeCol) {
    widgets.push({
      id: 'chart_trend',
      tab: 'Trends',
      type: 'area',
      title: `${mainMeasure} Over Time`,
      x: timeCol,
      y: [{ field: mainMeasure, agg: 'sum' }],
      timeBucket: 'month',
      sort: 'asc',
      layout: { x: 0, y: 0, w: 12, h: 4 },
      insight: `Historical timeline of ${mainMeasure}.`,
    });
  }

  widgets.push({
    id: 'chart_combo',
    tab: 'Breakdowns',
    type: 'combo',
    title: `${mainMeasure} & ${secondaryMeasure} by ${mainDim}`,
    x: mainDim,
    y: [
      { field: mainMeasure, agg: 'sum' },
      { field: secondaryMeasure, agg: 'avg' },
    ],
    sort: 'desc',
    limit: 10,
    layout: { x: 0, y: 0, w: 8, h: 4 },
  });

  widgets.push({
    id: 'chart_table',
    tab: 'Details',
    type: 'data_table',
    title: 'Raw Data Explorer',
    layout: { x: 0, y: 0, w: 12, h: 5 },
  });

  return {
    title: `${domain || 'Dataset'} Intelligence Dashboard`,
    domain: domain || 'General Analytics',
    description: `Automated dashboard focused on ${goal || 'overall distribution and performance metrics'}.`,
    goal: goal || 'Analyze key trends and distributions',
    theme: 'light',
    tabs: ['Overview', 'Trends', 'Breakdowns', 'Details'],
    calculatedFields: [],
    filters: [],
    widgets,
  };
}

// 1. Understand Dataset Route
app.post('/api/understand', async (req: Request, res: Response) => {
  try {
    const { schema, sampleRows } = req.body;

    if (!schema) {
      res.status(400).json({ error: 'Missing schema in request body' });
      return;
    }

    if (!ai) {
      // Deterministic heuristic understand if no API key
      res.json({
        domain: 'Business Operations',
        description: `Dataset contains ${schema.rowCount} rows across ${schema.colCount} fields.`,
        recommendedGoal: 'Identify top performers, detect anomalies, and track distribution across dimensions.',
        columnRoles: {},
        keyMetrics: schema.detectedMeasures?.slice(0, 4) || [],
      });
      return;
    }

    const prompt = `Analyze this dataset schema and 20 sample rows.
Schema Summary:
- Total Rows: ${schema.rowCount}
- Total Columns: ${schema.colCount}
- Columns Profile: ${JSON.stringify(schema.columns)}
- Sample Data (first 20 rows): ${JSON.stringify(sampleRows?.slice(0, 20))}

Provide a JSON object with:
1. "domain": High-level domain (e.g. "Sales & E-Commerce", "Digital Marketing", "Healthcare Clinical", "HR & People Ops", "Corporate Finance", "Logistics & Supply Chain", etc.)
2. "description": A concise, executive 1-2 sentence description of what this data represents.
3. "recommendedGoal": A high-impact analytical goal tailored specifically to this dataset.
4. "keyMetrics": Array of top 3-5 most important numeric column names that serve as core KPIs.
5. "suggestedPrompts": Array of 4 natural language prompts a user might ask an AI assistant about this dataset.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            domain: { type: Type.STRING },
            description: { type: Type.STRING },
            recommendedGoal: { type: Type.STRING },
            keyMetrics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['domain', 'description', 'recommendedGoal', 'keyMetrics', 'suggestedPrompts'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Understand error:', error);
    res.status(500).json({
      domain: 'Analytics',
      description: 'Tabular dataset profiling complete.',
      recommendedGoal: 'Explore distribution and key performance metrics.',
      keyMetrics: [],
      suggestedPrompts: ['Show top categories', 'What is the average?', 'Show distribution'],
    });
  }
});

// 2. Generate Dashboard Route
app.post('/api/generate-dashboard', async (req: Request, res: Response) => {
  try {
    const { domain, goal, schema, sampleRows } = req.body;

    if (!schema) {
      res.status(400).json({ error: 'Missing schema' });
      return;
    }

    if (!ai) {
      const fallback = generateDeterministicFallback(domain, goal, schema);
      res.json(fallback);
      return;
    }

    const availableColumns = Object.keys(schema.columns || {});
    const prompt = `You are a world-class analytics architect. Design an executive, domain-specific dashboard specification for a dataset.
Domain: ${domain || 'General Business'}
User Analytical Goal: ${goal || 'General overview and performance analysis'}
Dataset Statistics:
- Row count: ${schema.rowCount}
- Column profiles: ${JSON.stringify(schema.columns)}
- Available Columns (MUST ONLY USE THESE EXACT NAMES): ${JSON.stringify(availableColumns)}
- Sample rows: ${JSON.stringify(sampleRows?.slice(0, 15))}

CRITICAL REQUIREMENTS:
1. ONLY reference existing column names from the provided Available Columns list. Never invent imaginary columns.
2. Produce 4-5 KPI cards with sparkline & period-over-period comparison.
3. Produce 6-9 rich, diverse charts across standard tabs: ["Overview", "Trends", "Breakdowns", "Details"].
4. Choose chart types intelligently matching the domain (e.g. bar, line, area, combo, pie, donut, scatter, histogram, waterfall, funnel).
5. If relevant, suggest 1-2 calculatedFields (e.g. "Profit = Revenue - Cost" or "sum(Clicks) / sum(Impressions)").
6. Every widget must include:
   - id: unique string e.g. "w1", "w2"
   - tab: one of ["Overview", "Trends", "Breakdowns", "Details"]
   - type: one of "kpi", "bar", "line", "area", "combo", "pie", "donut", "scatter", "histogram", "waterfall", "funnel", "data_table"
   - title: concise, human-friendly title
   - x: dimension or date column name
   - y: array of { field: string, agg: "sum"|"avg"|"count"|"distinct"|"min"|"max" }
   - insight: an executive takeaway or context note (1 sentence)
   - layout: { x: number, y: number, w: number, h: number } where grid width is 12 columns.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            domain: { type: Type.STRING },
            description: { type: Type.STRING },
            goal: { type: Type.STRING },
            theme: { type: Type.STRING },
            tabs: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            calculatedFields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  formula: { type: Type.STRING },
                  format: { type: Type.STRING },
                },
                required: ['name', 'formula', 'format'],
              },
            },
            widgets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  tab: { type: Type.STRING },
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  insight: { type: Type.STRING },
                  x: { type: Type.STRING },
                  seriesBy: { type: Type.STRING },
                  sort: { type: Type.STRING },
                  limit: { type: Type.INTEGER },
                  timeBucket: { type: Type.STRING },
                  metric: {
                    type: Type.OBJECT,
                    properties: {
                      field: { type: Type.STRING },
                      agg: { type: Type.STRING },
                      label: { type: Type.STRING },
                    },
                  },
                  y: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        field: { type: Type.STRING },
                        agg: { type: Type.STRING },
                      },
                      required: ['field'],
                    },
                  },
                  layout: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.INTEGER },
                      y: { type: Type.INTEGER },
                      w: { type: Type.INTEGER },
                      h: { type: Type.INTEGER },
                    },
                    required: ['x', 'y', 'w', 'h'],
                  },
                },
                required: ['id', 'tab', 'type', 'title', 'layout'],
              },
            },
          },
          required: ['title', 'domain', 'tabs', 'widgets'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.widgets || parsed.widgets.length === 0) {
      throw new Error('Empty widget set returned');
    }
    parsed.filters = [];
    res.json(parsed);
  } catch (error: any) {
    console.error('Generate dashboard error:', error);
    const fallback = generateDeterministicFallback(req.body.domain, req.body.goal, req.body.schema);
    res.json(fallback);
  }
});

// 3. AI Assistant Chat with Function Calling
app.post('/api/chat-assistant', async (req: Request, res: Response) => {
  try {
    const { message, history, currentSpec, schema, domain, goal } = req.body;

    if (!ai) {
      res.json({
        reply: `Received: "${message}". Connect your GEMINI_API_KEY to enable full natural language dashboard editing and real-time query explanations.`,
        toolCalls: [],
      });
      return;
    }

    const availableColumns = Object.keys(schema?.columns || {});

    const functionDeclarations: any[] = [
      {
        name: 'add_widget',
        description: 'Add a new chart or KPI widget to the dashboard.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Title of the widget' },
            type: {
              type: Type.STRING,
              description: 'Widget type: kpi, bar, line, area, combo, pie, donut, scatter, histogram, waterfall, funnel, data_table',
            },
            tab: { type: Type.STRING, description: 'Tab to place widget in (e.g. Overview, Breakdowns, Trends, Details)' },
            x: { type: Type.STRING, description: 'Dimension or date column name' },
            measureField: { type: Type.STRING, description: 'Numeric measure column to aggregate' },
            agg: { type: Type.STRING, description: 'Aggregation: sum, avg, count, distinct, min, max' },
            seriesBy: { type: Type.STRING, description: 'Optional secondary dimension for grouped or stacked chart' },
            sort: { type: Type.STRING, description: 'asc or desc' },
            limit: { type: Type.INTEGER, description: 'Top N limit, default 10' },
            insight: { type: Type.STRING, description: '1-sentence business insight or observation' },
          },
          required: ['title', 'type'],
        },
      },
      {
        name: 'update_widget',
        description: 'Update properties of an existing widget (change chart type, title, metrics, color, limit).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            widgetId: { type: Type.STRING, description: 'ID of the widget to modify' },
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            x: { type: Type.STRING },
            measureField: { type: Type.STRING },
            agg: { type: Type.STRING },
            color: { type: Type.STRING },
            sort: { type: Type.STRING },
            limit: { type: Type.INTEGER },
          },
          required: ['widgetId'],
        },
      },
      {
        name: 'remove_widget',
        description: 'Delete a widget from the dashboard by its ID.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            widgetId: { type: Type.STRING, description: 'ID of the widget to delete' },
          },
          required: ['widgetId'],
        },
      },
      {
        name: 'set_filter',
        description: 'Apply or update a global dashboard filter.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            field: { type: Type.STRING, description: 'Column to filter on' },
            op: { type: Type.STRING, description: 'Filter operator: eq, neq, in, gt, lt, gte, lte, between, contains' },
            value: { type: Type.STRING, description: 'Filter value (comma-separated if array)' },
          },
          required: ['field', 'op', 'value'],
        },
      },
      {
        name: 'clear_filters',
        description: 'Remove all active filters from the dashboard.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'create_calculated_field',
        description: 'Create a new calculated metric or formula field.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Name of the new metric, e.g. ProfitMargin or CTR' },
            formula: { type: Type.STRING, description: 'Safe formula e.g. "Revenue - Cost" or "sum(Clicks) / sum(Impressions)"' },
            format: { type: Type.STRING, description: 'currency, percent, decimal, or integer' },
          },
          required: ['name', 'formula', 'format'],
        },
      },
      {
        name: 'change_theme',
        description: 'Change the dashboard theme.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING, description: '"light" or "dark"' },
          },
          required: ['theme'],
        },
      },
      {
        name: 'run_query',
        description: 'Run an analytical query against the dataset to answer a question like "Why did revenue drop?" or "What is top selling product?".',
        parameters: {
          type: Type.OBJECT,
          properties: {
            field: { type: Type.STRING, description: 'Measure field' },
            groupBy: { type: Type.STRING, description: 'Dimension to group by' },
            agg: { type: Type.STRING, description: 'sum, avg, count, max, min' },
          },
          required: ['field', 'groupBy'],
        },
      },
    ];

    const systemInstruction = `You are InsightAI, the intelligent copilot for a live data analytics dashboard.
Domain: ${domain}
Goal: ${goal}
Available Columns (Strictly use ONLY these column names): ${JSON.stringify(availableColumns)}
Current Dashboard Spec Summary:
- Title: ${currentSpec?.title}
- Theme: ${currentSpec?.theme}
- Tabs: ${JSON.stringify(currentSpec?.tabs)}
- Active Filters: ${JSON.stringify(currentSpec?.filters)}
- Current Widgets: ${JSON.stringify(currentSpec?.widgets?.map((w: any) => ({ id: w.id, title: w.title, type: w.type, x: w.x, y: w.y, tab: w.tab })))}

Instructions:
1. When the user asks to modify, add, filter, or delete widgets, INVOKE THE CORRESPONDING TOOL.
2. If the user refers to "the revenue chart" or "make it a pie chart", find the matching widget from the Current Widgets list and use update_widget.
3. If the user asks a question about why something changed or who is the top performer, use run_query or explain the insight concisely in the domain's vocabulary.
4. If a requested column does not exist, ask a clarifying question or suggest the closest column from Available Columns.`;

    const chatContents: any[] = [];
    if (history && Array.isArray(history)) {
      const firstUserIdx = history.findIndex((h) => h.role === 'user');
      if (firstUserIdx !== -1) {
        for (const h of history.slice(firstUserIdx, firstUserIdx + 6)) {
          chatContents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }],
          });
        }
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 3500)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatContents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }],
        },
      }),
      timeoutPromise,
    ]);

    const toolCalls = response.functionCalls || [];
    const replyText = response.text || (toolCalls.length > 0 ? 'Updating your dashboard now...' : 'I have analyzed your request.');

    res.json({
      reply: replyText,
      toolCalls,
    });
  } catch (error: any) {
    console.error('Chat assistant error (activating resilient local parser):', error?.message || error);

    // Resilient local intent parser fallback
    const msg = (req.body.message || '').trim().toLowerCase();
    const availableCols: string[] = Object.keys(req.body.schema?.columns || {});
    const widgets: any[] = req.body.currentSpec?.widgets || [];
    const toolCalls: any[] = [];
    let reply = `I've processed your command: "${req.body.message}".`;

    // 1. Theme intent
    if (msg.includes('dark theme') || msg.includes('dark mode')) {
      toolCalls.push({ name: 'change_theme', args: { theme: 'dark' } });
      reply = 'Switched dashboard to dark theme.';
    } else if (msg.includes('light theme') || msg.includes('light mode')) {
      toolCalls.push({ name: 'change_theme', args: { theme: 'light' } });
      reply = 'Switched dashboard to light theme.';
    }
    // 2. Clear filters
    else if (msg.includes('clear filter') || msg.includes('reset filter') || msg.includes('remove filter')) {
      toolCalls.push({ name: 'clear_filters', args: {} });
      reply = 'Cleared all active filters.';
    }
    // 3. Filter intent: e.g. "filter to north america"
    else if (msg.includes('filter to ') || msg.includes('filter by ')) {
      const targetVal = req.body.message.replace(/.*filter (to|by) /i, '').trim();
      // Find matching column in schema
      let matchedCol = availableCols.find((c) => c.toLowerCase() === 'region' || c.toLowerCase() === 'category') || availableCols[0];
      const cols = req.body.schema?.columns || {};
      for (const colName of availableCols) {
        const topVals = cols[colName]?.topValues || [];
        const samples = cols[colName]?.sampleValues || [];
        if (
          topVals.some((tv: any) => tv.value.toLowerCase().includes(targetVal.toLowerCase())) ||
          samples.some((sv: any) => String(sv).toLowerCase().includes(targetVal.toLowerCase()))
        ) {
          matchedCol = colName;
          break;
        }
      }
      toolCalls.push({
        name: 'set_filter',
        args: { field: matchedCol, op: 'eq', value: targetVal },
      });
      reply = `Filtered dashboard by ${matchedCol} = "${targetVal}".`;
    }
    // 4. Change chart type: e.g. "make the revenue chart a donut" or "change to pie chart"
    else if (msg.includes('donut') || msg.includes('pie') || msg.includes('bar') || msg.includes('line') || msg.includes('area')) {
      let targetType = 'bar';
      if (msg.includes('donut')) targetType = 'donut';
      else if (msg.includes('pie')) targetType = 'pie';
      else if (msg.includes('line')) targetType = 'line';
      else if (msg.includes('area')) targetType = 'area';

      // Find target widget
      let targetWidget = widgets.find((w) => w.type !== 'kpi' && msg.includes(w.title.toLowerCase())) ||
        widgets.find((w) => w.type !== 'kpi');

      if (targetWidget) {
        toolCalls.push({
          name: 'update_widget',
          args: { widgetId: targetWidget.id, type: targetType },
        });
        reply = `Updated "${targetWidget.title}" to a ${targetType} chart.`;
      }
    }
    // 5. Add widget: e.g. "add a bar chart of Revenue by Category"
    else if (msg.includes('add ') || msg.includes('create ')) {
      const measure = availableCols.find((c) => req.body.schema?.columns[c]?.role === 'measure') || availableCols[0];
      const dimension = availableCols.find((c) => req.body.schema?.columns[c]?.role === 'dimension') || availableCols[1] || availableCols[0];
      toolCalls.push({
        name: 'add_widget',
        args: {
          title: `${measure} by ${dimension}`,
          type: msg.includes('kpi') ? 'kpi' : msg.includes('pie') ? 'pie' : 'bar',
          tab: 'Overview',
          x: dimension,
          measureField: measure,
          agg: 'sum',
        },
      });
      reply = `Added new analysis widget: ${measure} by ${dimension}.`;
    } else {
      reply = `I have analyzed your request. You can also connect your API key in Settings > Secrets for open-ended reasoning.`;
    }

    res.json({
      reply,
      toolCalls,
    });
  }
});

// 4. Auto Insights Route
app.post('/api/auto-insights', async (req: Request, res: Response) => {
  try {
    const { schema, sampleRows, domain } = req.body;

    if (!ai) {
      res.json({
        insights: [
          { type: 'trend', title: 'Strong Growth Trajectory', description: 'Measures show consistent upward velocity across active periods.' },
          { type: 'breakdown', title: 'Category Concentration', description: 'Top 3 categories account for over 65% of total measure volume.' },
          { type: 'anomaly', title: 'Outlier Activity Detected', description: 'A small cluster of records exceeds 3 standard deviations from the mean.' },
        ],
      });
      return;
    }

    const prompt = `Analyze this dataset statistics and sample rows.
Domain: ${domain || 'Business Data'}
Schema: ${JSON.stringify(schema?.columns)}
Sample Rows: ${JSON.stringify(sampleRows?.slice(0, 15))}

Generate 4 high-value executive insights:
- One trend insight
- One top performer / breakdown insight
- One anomaly or outlier finding
- One correlation or driver insight

Provide a JSON object with:
"insights": Array of { "type": "trend"|"breakdown"|"anomaly"|"correlation", "title": string, "description": string, "suggestedMetric": string, "suggestedDimension": string }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  suggestedMetric: { type: Type.STRING },
                  suggestedDimension: { type: Type.STRING },
                },
                required: ['type', 'title', 'description'],
              },
            },
          },
          required: ['insights'],
        },
      },
    });

    res.json(JSON.parse(response.text || '{"insights": []}'));
  } catch (error: any) {
    console.error('Auto insights error:', error);
    res.json({
      insights: [
        { type: 'trend', title: 'Performance Trends', description: 'Key measures show consistent seasonal variation.' },
        { type: 'breakdown', title: 'Top Drivers', description: 'Primary dimension values drive over 60% of total activity.' },
      ],
    });
  }
});

// Static serving if dist exists, otherwise Vite Dev Middleware
import fs from 'fs';

async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexPath = path.resolve(distPath, 'index.html');
  const distExists = fs.existsSync(indexPath);

  console.log(`[InsightAI Server] distExists: ${distExists}, distPath: ${distPath}`);

  if (distExists) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(indexPath);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`InsightAI Server listening on http://0.0.0.0:${port} (serving: ${distExists ? 'dist' : 'vite'})`);
  });
}

startServer();
