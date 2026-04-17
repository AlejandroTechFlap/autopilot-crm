import { describe, it, expect } from 'vitest';
import { getSuggestedPrompts } from './suggested-prompts';

describe('getSuggestedPrompts', () => {
  it.each(['vendedor', 'direccion', 'admin'] as const)(
    'returns exactly 3 prompts for %s',
    (rol) => {
      expect(getSuggestedPrompts(rol)).toHaveLength(3);
    },
  );

  it('returns vendedor prompts for unknown role (safe default)', () => {
    expect(getSuggestedPrompts('mystery')).toEqual(getSuggestedPrompts('vendedor'));
  });

  it('every prompt has both a label and a non-empty prompt body', () => {
    for (const rol of ['vendedor', 'direccion', 'admin'] as const) {
      for (const p of getSuggestedPrompts(rol)) {
        expect(p.label.length).toBeGreaterThan(0);
        expect(p.prompt.length).toBeGreaterThan(10);
      }
    }
  });

  it('vendedor and direccion prompts are distinct', () => {
    const v = getSuggestedPrompts('vendedor').map((p) => p.prompt);
    const d = getSuggestedPrompts('direccion').map((p) => p.prompt);
    expect(v).not.toEqual(d);
  });
});
