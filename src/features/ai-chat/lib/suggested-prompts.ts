/**
 * Role-specific suggested prompts shown in the empty chat state.
 *
 * Inspired by HubSpot Breeze Assistant's onboarding chips: a small set of
 * high-value starter prompts per role makes the AI panel feel useful before
 * the user has typed anything. Three per role keeps the surface clean.
 */

export type Rol = 'vendedor' | 'direccion' | 'admin';

export interface SuggestedPrompt {
  /** Short label rendered as a chip. */
  label: string;
  /** Full prompt text sent when the chip is clicked. */
  prompt: string;
}

const VENDEDOR: readonly SuggestedPrompt[] = [
  {
    label: 'Priorizar leads',
    prompt: '¿A qué lead le debería dar prioridad y por qué?',
  },
  {
    label: 'Próxima acción',
    prompt: '¿Cuál es la siguiente acción pendiente más importante en mi embudo?',
  },
  {
    label: 'Resumen de hoy',
    prompt: 'Hazme un resumen breve del estado de mi embudo hoy.',
  },
];

const DIRECCION: readonly SuggestedPrompt[] = [
  {
    label: 'KPIs del equipo',
    prompt: 'Dame los KPIs del equipo esta semana con cualquier alerta relevante.',
  },
  {
    label: 'Deals estancados',
    prompt: '¿Qué deals abiertos llevan demasiado tiempo en su fase actual?',
  },
  {
    label: 'Top vendedor',
    prompt: '¿Qué vendedor tiene más oportunidades abiertas y cuál es su tasa de cierre?',
  },
];

const ADMIN: readonly SuggestedPrompt[] = [
  {
    label: 'Salud global',
    prompt: 'Hazme un diagnóstico de la salud global del embudo ahora mismo.',
  },
  {
    label: 'Consulta SQL',
    prompt: 'Ejecuta una consulta SQL para mostrar deals ganados por mes en el último año.',
  },
  {
    label: 'Gráfico de fases',
    prompt: 'Renderiza un gráfico de barras con el conteo de deals abiertos por fase.',
  },
];

export function getSuggestedPrompts(rol: Rol | string): readonly SuggestedPrompt[] {
  switch (rol) {
    case 'vendedor':
      return VENDEDOR;
    case 'direccion':
      return DIRECCION;
    case 'admin':
      return ADMIN;
    default:
      return VENDEDOR;
  }
}
