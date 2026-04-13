'use client';

import type { Widget } from '../types';
import { ChatChart } from './chat-chart';
import { ChatTable } from './chat-table';
import { ChatCitation } from './chat-citation';

interface ChatWidgetProps {
  widget: Widget;
}

export function ChatWidget({ widget }: ChatWidgetProps) {
  switch (widget.type) {
    case 'chart':
      return <ChatChart widget={widget} />;
    case 'table':
      return <ChatTable widget={widget} />;
    case 'citation':
      return <ChatCitation widget={widget} />;
    default:
      return null;
  }
}
