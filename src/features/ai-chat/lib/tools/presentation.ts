/**
 * AI presentation tools: render_chart and render_table.
 *
 * These tools do NOT query data — they are purely presentational. The AI
 * calls `query_database` first to fetch data, then calls one of these to
 * tell the server "I want to display this as a chart/table". The server
 * captures the widget config and includes it in the response payload.
 *
 * Phase 11: AI Data Analytics & Interactive Visualization.
 */

import { z } from 'zod/v4';
import type { ChartWidget, TableWidget, Widget } from '../../types';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const RenderChartSchema = z.object({
  type: z.enum(['bar', 'line', 'area', 'pie']),
  title: z.string().min(1).max(200),
  data: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        series: z.string().optional(),
      }),
    )
    .min(1)
    .max(200),
  xLabel: z.string().max(100).optional(),
  yLabel: z.string().max(100).optional(),
});

export const RenderTableSchema = z.object({
  title: z.string().min(1).max(200),
  columns: z
    .array(z.object({ key: z.string(), label: z.string() }))
    .min(1)
    .max(20),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(200),
});

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

let widgetCounter = 0;
function nextWidgetId(): string {
  return `w_${Date.now()}_${++widgetCounter}`;
}

/**
 * Creates a ChartWidget from validated input. The widget is returned so the
 * API route can accumulate it; the model gets a simple acknowledgement.
 */
export function renderChart(
  input: z.infer<typeof RenderChartSchema>,
): { ack: { rendered: true; widgetId: string }; widget: ChartWidget } {
  const id = nextWidgetId();
  const widget: ChartWidget = {
    id,
    type: 'chart',
    chartType: input.type,
    title: input.title,
    data: input.data,
    xLabel: input.xLabel,
    yLabel: input.yLabel,
  };
  return {
    ack: { rendered: true, widgetId: id },
    widget,
  };
}

/**
 * Creates a TableWidget from validated input.
 */
export function renderTable(
  input: z.infer<typeof RenderTableSchema>,
): { ack: { rendered: true; widgetId: string }; widget: TableWidget } {
  const id = nextWidgetId();
  const widget: TableWidget = {
    id,
    type: 'table',
    title: input.title,
    columns: input.columns,
    rows: input.rows,
  };
  return {
    ack: { rendered: true, widgetId: id },
    widget,
  };
}

/** Type guard: is a dispatch result a presentation result with a widget? */
export function isPresentationResult(
  value: unknown,
): value is { ack: unknown; widget: Widget } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'widget' in value &&
    'ack' in value
  );
}
