'use client';

/**
 * Phase 10 — client-side tenant context.
 *
 * The dashboard layout loads `getTenantConfig()` once on the server, then
 * passes the result into `<TenantProvider>`. Any client component below can
 * `useTenantConfig()` to read brand + flags without re-fetching.
 *
 * No fetching, no Supabase. Pure context plumbing.
 */

import { createContext, useContext, useMemo } from 'react';
import type { FeatureFlag, TenantConfig } from '../types';

const TenantContext = createContext<TenantConfig | null>(null);

interface TenantProviderProps {
  value: TenantConfig;
  children: React.ReactNode;
}

export function TenantProvider({ value, children }: TenantProviderProps) {
  // Memoise so referential identity stays stable across re-renders.
  const memo = useMemo(() => value, [value]);
  return <TenantContext.Provider value={memo}>{children}</TenantContext.Provider>;
}

/** Read the full tenant config from context. Throws if used outside provider. */
export function useTenantConfig(): TenantConfig {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenantConfig must be used inside <TenantProvider>');
  }
  return ctx;
}

/** Convenience hook: returns true iff the named feature flag is enabled. */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const config = useTenantConfig();
  return config.flags[flag];
}
