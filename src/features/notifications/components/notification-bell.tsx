'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatRelativeTime } from '@/lib/formatting';

interface Notification {
  id: string;
  titulo: string;
  contenido: string;
  tipo: string;
  leido: boolean;
  referencia_id: string | null;
  created_at: string;
  link: string | null;
}

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(
    async (n: Notification) => {
      // Optimistically mark as read in the UI
      if (!n.leido) {
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, leido: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        // Persist (fire and forget — UI already updated)
        fetch('/api/notificaciones', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [n.id] }),
        }).catch(() => {});
      }
      if (n.link) {
        setOpen(false);
        router.push(n.link);
      }
    },
    [router]
  );

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = () => {
      fetch('/api/notificaciones/count')
        .then((r) => r.json())
        .then((d) => setUnreadCount(d.count ?? 0))
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch full list when opening
  useEffect(() => {
    if (!open) return;
    fetch('/api/notificaciones')
      .then((r) => r.json())
      .then((d) => setNotifications(d.notificaciones ?? []))
      .catch(() => {});
  }, [open]);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.leido).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const res = await fetch('/api/notificaciones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unreadIds }),
    });

    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, leido: true }))
      );
      setUnreadCount(0);
    }
  }, [notifications]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 !p-0" side="bottom" align="end">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-accent"
              onClick={markAllRead}
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No notifications
            </p>
          ) : (
            notifications.map((n) => {
              const clickable = Boolean(n.link);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  disabled={!clickable && n.leido}
                  className={`block w-full border-b px-3 py-2.5 text-left last:border-b-0 ${
                    n.leido ? '' : 'bg-primary/5'
                  } ${clickable ? 'cursor-pointer hover:bg-accent' : 'cursor-default'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{n.titulo}</span>
                    {!n.leido && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {n.contenido}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatRelativeTime(n.created_at)}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
