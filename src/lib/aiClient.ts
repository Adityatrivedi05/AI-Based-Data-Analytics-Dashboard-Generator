import { DashboardSpec, DatasetProfile, DatasetRow } from './dataEngine/types';

export interface UnderstandResult {
  domain: string;
  description: string;
  recommendedGoal: string;
  keyMetrics: string[];
  suggestedPrompts: string[];
}

export async function apiUnderstandDataset(
  schema: DatasetProfile,
  sampleRows: DatasetRow[]
): Promise<UnderstandResult> {
  const res = await fetch('/api/understand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schema, sampleRows: sampleRows.slice(0, 25) }),
  });

  if (!res.ok) {
    throw new Error(`Failed to analyze dataset (${res.status})`);
  }

  return res.json();
}

export async function apiGenerateDashboard(
  domain: string,
  goal: string,
  schema: DatasetProfile,
  sampleRows: DatasetRow[]
): Promise<DashboardSpec> {
  const res = await fetch('/api/generate-dashboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain,
      goal,
      schema,
      sampleRows: sampleRows.slice(0, 25),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate dashboard (${res.status})`);
  }

  return res.json();
}

export async function apiChatAssistant(
  message: string,
  history: any[],
  currentSpec: DashboardSpec,
  schema: DatasetProfile,
  domain: string,
  goal: string
): Promise<{ reply: string; toolCalls: any[] }> {
  const res = await fetch('/api/chat-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history,
      currentSpec,
      schema,
      domain,
      goal,
    }),
  });

  if (!res.ok) {
    throw new Error(`Chat assistant request failed (${res.status})`);
  }

  return res.json();
}

export async function apiGetAutoInsights(
  schema: DatasetProfile,
  sampleRows: DatasetRow[],
  domain: string
): Promise<{
  insights: Array<{
    type: 'trend' | 'breakdown' | 'anomaly' | 'correlation';
    title: string;
    description: string;
    suggestedMetric?: string;
    suggestedDimension?: string;
  }>;
}> {
  const res = await fetch('/api/auto-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema,
      sampleRows: sampleRows.slice(0, 20),
      domain,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate auto-insights (${res.status})`);
  }

  return res.json();
}
