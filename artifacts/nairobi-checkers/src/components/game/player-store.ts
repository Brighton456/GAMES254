/**
 * Player career store — persistent via localStorage.
 * Tracks XP, titles, wins/losses, streaks, and cumulative M-Pesa flows.
 */

export type MatchKind = 'bot' | 'partner' | 'cash';
export type MatchOutcome = 'win' | 'loss';

export type MatchRecord = {
  id: string;
  at: number;
  kind: MatchKind;
  outcome: MatchOutcome;
  opponent: string;
  captureCount: number;
  kingCount: number;
  moves: number;
  xpDelta: number;
  stake: number;
  cashDelta: number;
  rules: { size: number; kingMode: string; forcedCapture: boolean };
};

export type Career = {
  xp: number;
  wins: number;
  losses: number;
  bestStreak: number;
  currentStreak: number;
  totalCaptures: number;
  totalKings: number;
  cashIns: number;
  cashOuts: number;
  lifetimeStake: number;
  lifetimePrize: number;
  matches: MatchRecord[];
};

const KEY = 'games254-career-v1';

export const TITLES: { at: number; name: string }[] = [
  { at: 0, name: 'Rookie of the Estate' },
  { at: 300, name: 'Matatu Maestro' },
  { at: 800, name: 'Mtaa Tactician' },
  { at: 1500, name: 'Night Owl' },
  { at: 2500, name: 'Board Boss' },
  { at: 4000, name: 'Checkers Governor' },
  { at: 6000, name: 'Nairobi Legend' },
  { at: 9000, name: 'House of 254' },
];

export function titleFor(xp: number): { name: string; level: number; next: { name: string; at: number } | null; floor: number; ceiling: number } {
  let index = 0;
  for (let i = 0; i < TITLES.length; i++) if (xp >= TITLES[i].at) index = i;
  const floor = TITLES[index].at;
  const next = TITLES[index + 1] ?? null;
  return {
    name: TITLES[index].name,
    level: index + 1,
    next: next ? { name: next.name, at: next.at } : null,
    floor,
    ceiling: next ? next.at : floor + 2000,
  };
}

export function emptyCareer(): Career {
  return {
    xp: 0, wins: 0, losses: 0, bestStreak: 0, currentStreak: 0,
    totalCaptures: 0, totalKings: 0, cashIns: 0, cashOuts: 0,
    lifetimeStake: 0, lifetimePrize: 0, matches: [],
  };
}

export function loadCareer(): Career {
  if (typeof window === 'undefined') return emptyCareer();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyCareer();
    const parsed = JSON.parse(raw) as Partial<Career>;
    return { ...emptyCareer(), ...parsed, matches: Array.isArray(parsed.matches) ? parsed.matches : [] };
  } catch {
    return emptyCareer();
  }
}

export function saveCareer(career: Career) {
  if (typeof window === 'undefined') return;
  try {
    // Keep the ledger lean — last 120 matches are plenty for profile analytics.
    const trimmed = { ...career, matches: career.matches.slice(0, 120) };
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage full — career stats are cosmetic, carry on */
  }
}

export function winXp(level: number): number {
  return 120 + Math.min(5, level) * 15;
}

export function lossXp(level: number): number {
  return 45 + Math.min(5, level) * 5;
}
