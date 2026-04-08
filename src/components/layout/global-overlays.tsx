'use client';

import { CommandPalette } from '@/features/command-palette/components/command-palette';
import { useFeatureFlag } from '@/features/tenant/lib/tenant-context';

interface GlobalOverlaysProps {
  onOpenChat: (seed?: string) => void;
  canCreateLead: boolean;
}

export function GlobalOverlays({
  onOpenChat,
  canCreateLead,
}: GlobalOverlaysProps) {
  const commandPaletteEnabled = useFeatureFlag('feat_command_palette');
  if (!commandPaletteEnabled) return null;
  return (
    <CommandPalette onOpenChat={onOpenChat} canCreateLead={canCreateLead} />
  );
}
