/**
 * Tool registry + dispatcher.
 *
 * `registerTools(user, supabase)` returns:
 *   - `declarations`: the FunctionDeclaration[] passed to Gemini's `tools` config
 *   - `dispatch(name, args)`: invoked by the chat route loop with whatever the
 *     model emits as a function call. Validates args with Zod, runs the tool
 *     against the user's RLS-scoped Supabase client, and returns a
 *     JSON-serialisable result. Errors are returned as `{ error: string }`
 *     (never thrown) so the model can read them and react.
 *
 * Security model:
 *   - The Supabase client is the user's authenticated session — RLS is the
 *     source of truth for what's visible. A vendedor cannot exfiltrate other
 *     vendedores' data through this surface even if the model tries.
 *   - `get_kpis_direccion` has an explicit role gate at dispatch time
 *     (vendedor → forbidden) so the model gets a clean error instead of an
 *     empty result that could be misinterpreted.
 *   - `limit` is hard-capped at MAX_LIMIT in `clampLimit`.
 *   - Tool list is fixed at registration; the model cannot invoke arbitrary
 *     functions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ApiUser } from '@/lib/api-utils';
import { TOOL_DECLARATIONS } from './definitions';
import { searchEmpresas, getEmpresa, SearchEmpresasSchema, GetEmpresaSchema } from './empresas';
import { searchDeals, getDeal, SearchDealsSchema, GetDealSchema } from './deals';
import { searchContactos, SearchContactosSchema } from './contactos';
import { searchTareas, SearchTareasSchema } from './tareas';
import { searchScripts, getScript, SearchScriptsSchema, GetScriptSchema } from './scripts';
import { getActividades, GetActividadesSchema } from './actividades';
import {
  getKpisVendedor,
  getKpisDireccion,
  GetKpisVendedorSchema,
  GetKpisDireccionSchema,
} from './kpis';
import { getPipelinesFases } from './pipelines';

type Supabase = SupabaseClient<Database>;

export interface ToolRegistry {
  declarations: typeof TOOL_DECLARATIONS;
  dispatch: (name: string, args: unknown) => Promise<unknown>;
}

export function registerTools(user: ApiUser, supabase: Supabase): ToolRegistry {
  const dispatch = async (name: string, args: unknown): Promise<unknown> => {
    try {
      switch (name) {
        case 'search_empresas':
          return await searchEmpresas(SearchEmpresasSchema.parse(args ?? {}), supabase);
        case 'get_empresa':
          return await getEmpresa(GetEmpresaSchema.parse(args ?? {}), supabase);
        case 'search_deals':
          return await searchDeals(SearchDealsSchema.parse(args ?? {}), supabase);
        case 'get_deal':
          return await getDeal(GetDealSchema.parse(args ?? {}), supabase);
        case 'search_contactos':
          return await searchContactos(SearchContactosSchema.parse(args ?? {}), supabase);
        case 'search_tareas':
          return await searchTareas(SearchTareasSchema.parse(args ?? {}), supabase);
        case 'search_scripts':
          return await searchScripts(SearchScriptsSchema.parse(args ?? {}), supabase);
        case 'get_script':
          return await getScript(GetScriptSchema.parse(args ?? {}), supabase);
        case 'get_actividades':
          return await getActividades(GetActividadesSchema.parse(args ?? {}), supabase);
        case 'get_kpis_vendedor':
          return await getKpisVendedor(
            GetKpisVendedorSchema.parse(args ?? {}),
            supabase,
            user
          );
        case 'get_kpis_direccion':
          if (user.rol === 'vendedor') {
            return {
              error:
                'forbidden: get_kpis_direccion solo está disponible para dirección y admin',
            };
          }
          return await getKpisDireccion(
            GetKpisDireccionSchema.parse(args ?? {}),
            supabase
          );
        case 'get_pipelines_fases':
          return await getPipelinesFases(supabase);
        default:
          return { error: `unknown tool: ${name}` };
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'tool dispatch error',
      };
    }
  };

  return { declarations: TOOL_DECLARATIONS, dispatch };
}

export { TOOL_DECLARATIONS };
export { MAX_TURNS } from './helpers';
