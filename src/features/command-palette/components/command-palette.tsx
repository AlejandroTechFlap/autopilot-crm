'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  ListTodo,
  Phone,
  Plus,
  Sparkles,
  User,
  Handshake,
  Columns3,
} from 'lucide-react';
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeatureFlag } from '@/features/tenant/lib/tenant-context';

interface SearchResults {
  empresas: Array<{ id: string; nombre: string; lifecycle_stage: string; provincia: string | null }>;
  contactos: Array<{ id: string; nombre_completo: string; cargo: string | null; empresa_id: string; empresa: { nombre: string } | null }>;
  deals: Array<{ id: string; valor: number; resultado: string | null; empresa: { id: string; nombre: string } | null }>;
}

interface CommandPaletteProps {
  onOpenChat?: (seed?: string) => void;
  /**
   * Whether the current user can create leads. Vendedores cannot — see
   * `docs/phase-2-pipeline-company.md` → "Lead creation — role gating".
   */
  canCreateLead: boolean;
}

export function CommandPalette({
  onOpenChat,
  canCreateLead,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const debouncedQuery = useDebounce(query, 250);
  const router = useRouter();
  const aiChatEnabled = useFeatureFlag('feat_ai_chat');

  // Register Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      startTransition(() => setResults(null));
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((d) => startTransition(() => setResults(d)))
      .catch(() => startTransition(() => setResults(null)));
  }, [debouncedQuery]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery('');
      router.push(path);
    },
    [router]
  );

  const handleOpenChat = useCallback(
    (seed?: string) => {
      setOpen(false);
      setQuery('');
      onOpenChat?.(seed);
    },
    [onOpenChat]
  );

  const hasResults =
    results &&
    (results.empresas.length > 0 ||
      results.contactos.length > 0 ||
      results.deals.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Buscar empresas, contactos u oportunidades..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {aiChatEnabled && debouncedQuery.length >= 2 && !hasResults && (
            <CommandGroup heading="Asistente IA">
              <CommandItem
                onSelect={() => handleOpenChat(debouncedQuery)}
                className="data-[selected=true]:bg-primary/10"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>
                  Preguntar a la IA:{' '}
                  <span className="italic">&quot;{debouncedQuery}&quot;</span>
                </span>
              </CommandItem>
            </CommandGroup>
          )}

          {/* Search results */}
          {results?.empresas && results.empresas.length > 0 && (
            <CommandGroup heading="Empresas">
              {results.empresas.map((e) => (
                <CommandItem
                  key={`emp-${e.id}`}
                  onSelect={() => navigate(`/empresa/${e.id}`)}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{e.nombre}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {e.lifecycle_stage}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.contactos && results.contactos.length > 0 && (
            <CommandGroup heading="Contactos">
              {results.contactos.map((c) => (
                <CommandItem
                  key={`con-${c.id}`}
                  onSelect={() => navigate(`/empresa/${c.empresa_id}`)}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{c.nombre_completo}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.empresa?.nombre ?? ''}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.deals && results.deals.length > 0 && (
            <CommandGroup heading="Oportunidades">
              {results.deals.map((d) => (
                <CommandItem
                  key={`deal-${d.id}`}
                  onSelect={() =>
                    navigate(`/empresa/${d.empresa?.id ?? ''}`)
                  }
                >
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                  <span>{d.empresa?.nombre ?? 'Oportunidad'}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {Number(d.valor).toLocaleString('es-ES')} €
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Quick actions — always show when no search or no results */}
          {!hasResults && (
            <>
              <CommandGroup heading="Acciones rápidas">
                {canCreateLead && (
                  <CommandItem onSelect={() => navigate('/pipeline')}>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span>Crear nuevo lead</span>
                  </CommandItem>
                )}
                {aiChatEnabled && (
                  <CommandItem
                    onSelect={() =>
                      handleOpenChat(debouncedQuery || undefined)
                    }
                  >
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span>Consultar al asistente IA</span>
                  </CommandItem>
                )}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Navegar">
                <CommandItem onSelect={() => navigate('/pipeline')}>
                  <Columns3 className="h-4 w-4 text-muted-foreground" />
                  <span>Embudo</span>
                </CommandItem>
                <CommandItem onSelect={() => navigate('/mis-tareas')}>
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  <span>Mis tareas</span>
                </CommandItem>
                <CommandItem onSelect={() => navigate('/empresas')}>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Empresas</span>
                </CommandItem>
                <CommandItem onSelect={() => navigate('/contactos')}>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Contactos</span>
                </CommandItem>
                <CommandItem onSelect={() => navigate('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <span>Panel</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
