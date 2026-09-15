/**
 * esther · VARIANTS — Kenyan house-rule presets. Thin adapters that emit the
 * exact `GameRules` contract opencode's engine consumes, plus a suggested
 * clock for the UI. Read-only over `game-engine.ts`.
 */

import type { GameRules, KingMode } from '../components/game/game-engine';

export type VariantSuggestion = {
  initialSec: number;
  incrementSec: number;
};

export type Variant = {
  id: string;
  name: string;
  hus: string;            // house Swahili alias
  hint: string;
  rules: GameRules;
  clock: VariantSuggestion | null;
};

const BASE: Omit<GameRules, 'size' | 'kingMode'> = {
  forcedCapture: true,
  promotionStop: true,
};

export const VARIANTS: readonly Variant[] = [
  {
    id: 'kawaida', name: 'Classic', hus: 'Kawaida',
    hint: '8×8, one-step kings, forced captures — the national standard.',
    rules: { ...BASE, size: 8, kingMode: 'fly-one' },
    clock: { initialSec: 600, incrementSec: 5 },
  },
  {
    id: 'sanza', name: 'Sanza', hus: 'Sanza',
    hint: '8×8 flying kings on a speed clock — think fast, play faster.',
    rules: { ...BASE, size: 8, kingMode: 'fly-far' },
    clock: { initialSec: 60, incrementSec: 8 },
  },
  {
    id: 'matatu', name: 'Matatu', hus: 'Matatu',
    hint: '10×10 flying kings — a long route with full crowd noise.',
    rules: { ...BASE, size: 10, kingMode: 'fly-far' },
    clock: { initialSec: 300, incrementSec: 6 },
  },
  {
    id: 'kibao', name: 'Kibao', hus: 'Kibao',
    hint: '6×6 blitz — every three minutes is a full rush-hour.',
    rules: { ...BASE, size: 6, kingMode: 'fly-one' },
    clock: { initialSec: 180, incrementSec: 4 },
  },
  {
    id: 'goliath', name: 'Goliath', hus: 'Goliath',
    hint: '12×12 flying kings — the whole estate shows up.',
    rules: { ...BASE, size: 12, kingMode: 'fly-far' },
    clock: { initialSec: 900, incrementSec: 10 },
  },
  {
    id: 'kaskazini', name: 'Kaskazini', hus: 'Kaskazini',
    hint: '8×8 flying kings, no promotion stop — chains run wild.',
    rules: {
      size: 8,
      kingMode: 'hop',
      forcedCapture: true,
      promotionStop: false,
    },
    clock: { initialSec: 240, incrementSec: 6 },
  },
];

export function variantById(id: string): Variant | null {
  return VARIANTS.find((v) => v.id === id) ?? null;
}

export function rulesForVariant(id: string): GameRules | null {
  return variantById(id)?.rules ?? null;
}

/** King-mode label helpers for the UI, consistent with engine choices. */
export function kingModeLabel(mode: KingMode): string {
  switch (mode) {
    case 'fly-far':
      return 'Flying kings';
    case 'fly-one':
      return 'Classic kings';
    case 'hop':
      return 'Sky-hop kings';
  }
}

export const VARIANT_IDS: readonly string[] = VARIANTS.map((v) => v.id);