/**
 * Shared settings store — game preferences plus owner controls, persisted
 * locally. Defaults follow the configured fee plan: 2.5% / 5% / 7.5%.
 */

export type Settings = {
  rules: { size: number; kingMode: 'fly-far' | 'fly-one' | 'hop'; forcedCapture: boolean; promotionStop: boolean };
  difficulty: 'Easy' | 'Medium' | 'Hard';
  showHints: boolean;
  ambientSound: boolean;
  houseFeePercent: number;
  feeSplit: { winners: number; treasury: number };
  withdrawalsEnabled: boolean;
  maintenance: boolean;
};

const KEY = 'games254-settings-v1';

export const FEE_PRESETS = [2.5, 5, 7.5];

export const DEFAULT_SETTINGS: Settings = {
  rules: { size: 8, kingMode: 'fly-far', forcedCapture: true, promotionStop: true },
  difficulty: 'Medium',
  showHints: true,
  ambientSound: true,
  houseFeePercent: 5,
  feeSplit: { winners: 70, treasury: 30 },
  withdrawalsEnabled: false,
  maintenance: false,
};

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      rules: { ...DEFAULT_SETTINGS.rules, ...(parsed.rules ?? {}) },
      feeSplit: { ...DEFAULT_SETTINGS.feeSplit, ...(parsed.feeSplit ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* non-critical */
  }
}

/** Prize pool math — returns what the winner takes and the house keeps. */
export function settleStake(stake: number, feePercent: number): { pool: number; fee: number; prize: number } {
  const pool = stake * 2;
  const fee = Math.round(pool * (feePercent / 100) * 100) / 100;
  return { pool, fee, prize: pool - fee };
}
