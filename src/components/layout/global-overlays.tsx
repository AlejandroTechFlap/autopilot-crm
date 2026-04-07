'use client';

import { CommandPalette } from '@/features/command-palette/components/command-palette';

interface GlobalOverlaysProps {
  onOpenChat: (seed?: string) => void;
  canCreateLead: boolean;
}

export function GlobalOverlays({
  onOpenChat,
  canCreateLead,
}: GlobalOverlaysProps) {
  return (
    <CommandPalette onOpenChat={onOpenChat} canCreateLead={canCreateLead} />
  );
}
