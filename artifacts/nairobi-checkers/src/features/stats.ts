/**
 * esther · STATS — derived career analytics. All pure, all display-safe.
 * Consumes the career store shape opencode/freebuff already use (read-only).
 */

import type { Career, MatchRecord } from '../components/game/player-store';

export function totalMatches(career: Career): number {
  return career.wins + career.losses;
}

export function winRate(career: Career): number {
  const total = totalMatches(career);
  return total ? Math.round((career.wins / total) * 100) : 0;
}

/** Last `k` results as an array of 'W' | 'L' (most recent first). */
export function form(career: Career, k = 10): Array<'W' | 'L'> {
  return career.matches
    .slice(0, k)
    .map((m) => (m.outcome === 'win' ? 'W' : 'L'));
}

export function capturePerGame(career: Career): number {
  const total = totalMatches(career);
  return total ? Math.round((career.totalCaptures / total) * 10) / 10 : 0;
}

export function kingPerGame(career: Career): number {
  const total = totalMatches(career);
  return total ? Math.round((career.totalKings / total) * 10) / 10 : 0;
}

export function xpPerGame(career: Career): number {
  const total = totalMatches(career);
  return total ? Math.round(career.xp / total) : 0;
}

/** Cash made/lost across all matched tables (integer KSh). */
export function netCash(career: Career): number {
  return career.lifetimePrize - career.lifetimeStake;
}

/** Return-on-stake as a whole percentage (rounded). */
export function roi(career: Career): number {
  if (career.lifetimeStake <= 0) return 0;
  return Math.round((netCash(career) / career.lifetimeStake) * 100);
}

export function bestTitle(career: Career): string {
  const tiers = [
    { at: 9000, name: 'House of 254' },
    { at: 6000, name: 'Nairobi Legend' },
    { at: 4000, name: 'Checkers Governor' },
    { at: 2500, name: 'Board Boss' },
    { at: 1500, name: 'Night Owl' },
    { at: 800, name: 'Mtaa Tactician' },
    { at: 300, name: 'Matatu Maestro' },
    { at: 0, name: 'Rookie of the Estate' },
  ];
  return tiers.find((t) => career.xp >= t.at)?.name ?? tiers[tiers.length - 1]!.name;
}

export type Mission = {
  id: string;
  label: string;
  progress: string;
  done: boolean;
};

/** "Tonight's missions" — data the UI renders. */
export function missions(career: Career): Mission[] {
  const winsWithKing = career.matches.filter((m) => m.outcome === 'win' && m.kingCount > 0).length;
  const chains = career.matches.filter((m) => m.captureCount >= 2).length;
  const hardBot = career.matches.filter(
    (m) => m.kind === 'bot' && m.outcome === 'win' && m.opponent === 'House AI',
  ).length;
  return [
    {
      id: 'king-win',
      label: 'Win with a king',
      progress: `${winsWithKing} / 2`,
      done: winsWithKing >= 2,
    },
    {
      id: 'chain',
      label: 'Make a capture chain',
      progress: `${chains} / 1`,
      done: chains >= 1,
    },
    {
      id: 'hard',
      label: 'Beat the Hard bot',
      progress: hardBot >= 1 ? '1 / 1' : '0 / 1',
      done: hardBot >= 1,
    },
  ];
}

export function bestMatch(career: Career): MatchRecord | null {
  if (!career.matches.length) return null;
  return career.matches.reduce((a, b) => (b.captureCount > a.captureCount ? b : a));
}