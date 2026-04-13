import { describe, it, expect } from 'vitest';
import {
  RenderChartSchema,
  RenderTableSchema,
  renderChart,
  renderTable,
  isPresentationResult,
} from './presentation';

const WIDGET_ID_RE = /^w_\d+_\d+$/;

/* ===== RenderChartSchema ===== */

describe('RenderChartSchema', () => {
  const validChart = {
    type: 'bar',
    title: 'Sales by Month',
    data: [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 200 },
    ],
  };

  it('accepts valid bar chart input', () => {
    expect(RenderChartSchema.safeParse(validChart).success).toBe(true);
  });

  it('accepts pie chart with series data', () => {
    const r = RenderChartSchema.safeParse({
      ...validChart,
      type: 'pie',
      data: [{ label: 'A', value: 50, series: 'Q1' }],
    });
    expect(r.success).toBe(true);
  });

  it('accepts all valid chart types', () => {
    for (const type of ['bar', 'line', 'area', 'pie']) {
      expect(
        RenderChartSchema.safeParse({ ...validChart, type }).success
      ).toBe(true);
    }
  });

  it('rejects invalid chart type', () => {
    expect(
      RenderChartSchema.safeParse({ ...validChart, type: 'scatter' }).success
    ).toBe(false);
  });

  it('rejects empty data array', () => {
    expect(
      RenderChartSchema.safeParse({ ...validChart, data: [] }).success
    ).toBe(false);
  });

  it('rejects data > 200 items', () => {
    const data = Array.from({ length: 201 }, (_, i) => ({
      label: `L${i}`,
      value: i,
    }));
    expect(
      RenderChartSchema.safeParse({ ...validChart, data }).success
    ).toBe(false);
  });

  it('rejects empty title', () => {
    expect(
      RenderChartSchema.safeParse({ ...validChart, title: '' }).success
    ).toBe(false);
  });

  it('rejects title > 200 chars', () => {
    expect(
      RenderChartSchema.safeParse({ ...validChart, title: 'x'.repeat(201) })
        .success
    ).toBe(false);
  });

  it('accepts optional xLabel and yLabel', () => {
    const r = RenderChartSchema.safeParse({
      ...validChart,
      xLabel: 'Month',
      yLabel: 'Revenue',
    });
    expect(r.success).toBe(true);
  });
});

/* ===== RenderTableSchema ===== */

describe('RenderTableSchema', () => {
  const validTable = {
    title: 'Top Deals',
    columns: [{ key: 'name', label: 'Name' }],
    rows: [{ name: 'Deal 1' }],
  };

  it('accepts valid input', () => {
    expect(RenderTableSchema.safeParse(validTable).success).toBe(true);
  });

  it('rejects empty columns', () => {
    expect(
      RenderTableSchema.safeParse({ ...validTable, columns: [] }).success
    ).toBe(false);
  });

  it('rejects empty rows', () => {
    expect(
      RenderTableSchema.safeParse({ ...validTable, rows: [] }).success
    ).toBe(false);
  });

  it('rejects rows > 200', () => {
    const rows = Array.from({ length: 201 }, (_, i) => ({ name: `R${i}` }));
    expect(
      RenderTableSchema.safeParse({ ...validTable, rows }).success
    ).toBe(false);
  });
});

/* ===== renderChart ===== */

describe('renderChart', () => {
  const input = {
    type: 'bar' as const,
    title: 'Test Chart',
    data: [{ label: 'A', value: 10 }],
    xLabel: 'X',
    yLabel: 'Y',
  };

  it('returns ack and widget', () => {
    const result = renderChart(input);
    expect(result.ack.rendered).toBe(true);
    expect(result.widget).toBeDefined();
  });

  it('widget has type "chart"', () => {
    expect(renderChart(input).widget.type).toBe('chart');
  });

  it('widget.chartType matches input.type', () => {
    expect(renderChart(input).widget.chartType).toBe('bar');
  });

  it('widget.id matches pattern', () => {
    expect(renderChart(input).widget.id).toMatch(WIDGET_ID_RE);
  });

  it('widget.data equals input.data', () => {
    expect(renderChart(input).widget.data).toEqual(input.data);
  });

  it('ack.widgetId matches widget.id', () => {
    const r = renderChart(input);
    expect(r.ack.widgetId).toBe(r.widget.id);
  });

  it('passes through xLabel and yLabel', () => {
    const r = renderChart(input);
    expect(r.widget.xLabel).toBe('X');
    expect(r.widget.yLabel).toBe('Y');
  });
});

/* ===== renderTable ===== */

describe('renderTable', () => {
  const input = {
    title: 'Test Table',
    columns: [{ key: 'name', label: 'Name' }],
    rows: [{ name: 'Row 1' }],
  };

  it('returns ack and widget', () => {
    const r = renderTable(input);
    expect(r.ack.rendered).toBe(true);
    expect(r.widget).toBeDefined();
  });

  it('widget has type "table"', () => {
    expect(renderTable(input).widget.type).toBe('table');
  });

  it('widget.id matches pattern', () => {
    expect(renderTable(input).widget.id).toMatch(WIDGET_ID_RE);
  });

  it('widget columns and rows match input', () => {
    const r = renderTable(input);
    expect(r.widget.columns).toEqual(input.columns);
    expect(r.widget.rows).toEqual(input.rows);
  });
});

/* ===== isPresentationResult ===== */

describe('isPresentationResult', () => {
  it('returns true for renderChart result', () => {
    const r = renderChart({
      type: 'bar',
      title: 'T',
      data: [{ label: 'A', value: 1 }],
    });
    expect(isPresentationResult(r)).toBe(true);
  });

  it('returns true for renderTable result', () => {
    const r = renderTable({
      title: 'T',
      columns: [{ key: 'k', label: 'L' }],
      rows: [{ k: 1 }],
    });
    expect(isPresentationResult(r)).toBe(true);
  });

  it('returns false for object missing widget key', () => {
    expect(isPresentationResult({ ack: true })).toBe(false);
  });

  it('returns false for plain object', () => {
    expect(isPresentationResult({ foo: 'bar' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPresentationResult(null)).toBe(false);
  });
});
