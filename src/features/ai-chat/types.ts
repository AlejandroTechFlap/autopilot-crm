/**
 * Shared types for the AI chat feature — widgets, messages, and response
 * protocol. Used by both server (API route) and client (components/hooks).
 *
 * Phase 11: AI Data Analytics & Interactive Visualization.
 */

// ---------------------------------------------------------------------------
// Chart data
// ---------------------------------------------------------------------------

export interface ChartDataPoint {
  label: string;
  value: number;
  /** Optional series name for multi-series charts. */
  series?: string;
}

// ---------------------------------------------------------------------------
// Widget types — rendered inline in chat messages
// ---------------------------------------------------------------------------

export interface ChartWidget {
  id: string;
  type: 'chart';
  chartType: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  data: ChartDataPoint[];
  xLabel?: string;
  yLabel?: string;
}

export interface TableWidget {
  id: string;
  type: 'table';
  title: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
}

export interface CitationWidget {
  id: string;
  type: 'citation';
  query: string;
  rowCount: number;
  title?: string;
}

export type Widget = ChartWidget | TableWidget | CitationWidget;

// ---------------------------------------------------------------------------
// SSE response payload
// ---------------------------------------------------------------------------

/** Shape of each SSE `data:` chunk sent by POST /api/chat. */
export interface ChatResponsePayload {
  text?: string;
  widgets?: Widget[];
  error?: string;
}
