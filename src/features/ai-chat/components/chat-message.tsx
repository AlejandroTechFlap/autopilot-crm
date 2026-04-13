'use client';

import { Bot, User } from 'lucide-react';
import { ChatMarkdown } from './markdown';
import { ChatWidget } from './chat-widget';
import type { ChatMessage as ChatMessageType } from '../hooks/use-chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasWidgets = !isUser && message.widgets && message.widgets.length > 0;

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-primary text-white' : 'bg-muted'
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.text}</div>
        ) : (
          <div className="break-words">
            <ChatMarkdown>{message.text}</ChatMarkdown>
            {hasWidgets &&
              message.widgets!.map((w) => (
                <ChatWidget key={w.id} widget={w} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
