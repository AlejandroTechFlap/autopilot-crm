/**
 * Gemini client + thin re-export surface for the AI chat feature.
 *
 * The bulk of the assistant's behavior lives in three sibling modules:
 *   - `./context`  → role-specific framing data
 *   - `./prompts`  → role-specific system prompts (sales coach, performance
 *                    coach, ops analyst)
 *   - `./tools`    → DB-aware function-calling tools the model can invoke
 *
 * This file is intentionally tiny: just the SDK client singleton + the
 * model id + re-exports so callers (`/api/chat/*`) only need one import
 * path.
 */

import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.1-flash-lite-preview';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set');
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

export function getModel(): string {
  return MODEL;
}

export function getClient(): GoogleGenAI {
  return getAI();
}

// Re-exports for the API routes — single import surface.
export { buildRoleContext } from './context';
export type { RoleContext, VendedorContext, DireccionContext, AdminContext } from './context';
export { buildRolePrompt } from './prompts';
export { registerTools, MAX_TURNS } from './tools';
