'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { TableWidget } from '../types';

const INITIAL_VISIBLE = 10;

interface ChatTableProps {
  widget: TableWidget;
}

export function ChatTable({ widget }: ChatTableProps) {
  const { title, columns, rows } = widget;
  const [expanded, setExpanded] = useState(false);
  const hasMore = rows.length > INITIAL_VISIBLE;
  const visibleRows = expanded ? rows : rows.slice(0, INITIAL_VISIBLE);

  return (
    <div className="mt-2 rounded-lg border bg-background p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-muted-foreground/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-muted-foreground/10 last:border-b-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-2 py-1.5">
                    {String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Mostrar {rows.length - INITIAL_VISIBLE} filas
              mas
            </>
          )}
        </button>
      )}
    </div>
  );
}
