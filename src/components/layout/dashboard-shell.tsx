'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar, MobileSidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { hasRole, type CrmUser } from '@/lib/auth-client';
import type { TenantConfig } from '@/features/tenant/types';

// GlobalOverlays bundles cmdk + Gemini SDK chunks. Lazy-load to keep the
// initial dashboard payload small.
const GlobalOverlays = dynamic(
  () => import('@/components/layout/global-overlays').then((m) => m.GlobalOverlays),
  { ssr: false }
);

// ChatPanel pulls the AI chat hook + SSE streaming code; lazy-load it too so
// it doesn't ship in the initial dashboard bundle.
const ChatPanel = dynamic(
  () => import('@/features/ai-chat/components/chat-panel').then((m) => m.ChatPanel),
  { ssr: false }
);

const CHAT_OPEN_STORAGE_KEY = 'autopilot:chat-open';

interface DashboardShellProps {
  user: CrmUser;
  tenant: TenantConfig;
  children: React.ReactNode;
}

export function DashboardShell({ user, tenant, children }: DashboardShellProps) {
  const aiChatEnabled = tenant.flags.feat_ai_chat;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<string | undefined>(undefined);

  // Restore chat open state from localStorage on mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CHAT_OPEN_STORAGE_KEY);
      if (saved === '1') startTransition(() => setChatOpen(true));
    } catch {
      // ignore (private mode etc.)
    }
  }, []);

  // Persist chat open state
  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_OPEN_STORAGE_KEY, chatOpen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [chatOpen]);

  const openChat = useCallback((seed?: string) => {
    setChatSeed(seed);
    setChatOpen(true);
  }, []);
  const closeChat = useCallback(() => {
    setChatOpen(false);
    setChatSeed(undefined);
  }, []);
  const toggleChat = useCallback(() => setChatOpen((v) => !v), []);

  const canCreateLead = hasRole(user, 'admin', 'direccion');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} tenant={tenant} />
      <MobileSidebar
        user={user}
        tenant={tenant}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
          {children}
        </main>
        {/* Floating toggle (anchored to the main column so it follows the
            shrink when the chat panel docks open). Hidden entirely when the
            AI chat feature flag is off so the surface looks identical to a
            tenant that never had it. */}
        {aiChatEnabled && (
          <Button
            onClick={toggleChat}
            size="icon"
            aria-label={chatOpen ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
            aria-pressed={chatOpen}
            className="absolute bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        )}
        <GlobalOverlays
          onOpenChat={openChat}
          canCreateLead={canCreateLead}
        />
      </div>
      {/* Docked, non-modal AI chat panel — flex sibling so the main column
          reflows instead of being covered by an overlay. */}
      {aiChatEnabled && (
        <ChatPanel
          open={chatOpen}
          onClose={closeChat}
          initialMessage={chatSeed}
        />
      )}
    </div>
  );
}
