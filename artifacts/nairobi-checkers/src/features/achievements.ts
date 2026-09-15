/**
 * esther · ACHIEVEMENTS — a medal wall for the Kenyan tables. Every medal is a
 * pure predicate over career stats + a thin session slice, so unlocking is
 * deterministic and testable. Unlock state persists locally (separate from
 * freebuff/opencode's stores — my own key).
 */

import type { Career } from '../components/game/player-store';

export type MedalTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type Medal = {
  id: string;
  name: string;         // English
  sw: string;           // Swahili flavor
  tier: MedalTier;
  desc: string;
};

export type SessionSlice = {
  playedEarly: boolean;      // before 07:00 local
  playedLate: boolean;       // at/after 23:00 local
  beatHardBot: boolean;
  wonHighStake: number;      // 0 = none, else stake KSh won
  perfectWin: boolean;       // won & lost no pieces
  comeback: boolean;         // won after trailing
  estatesVisited: number;    // distinct estates this session, tick as you hop
  matchesPlayed: number;     // running total for this session
};

export const MEDALS: readonly Medal[] = [
  { id: 'kwanza', name: 'First Blood', sw: 'Kwanza', tier: 'bronze', desc: 'Win your first game' },
  { id: 'mshindi', name: 'Hat-Trick Hustler', sw: 'Mshindi', tier: 'bronze', desc: 'Reach a 3-win streak' },
  { id: 'streak5', name: 'On Fire', sw: 'Moto', tier: 'silver', desc: 'Reach a 5-win streak' },
  { id: 'streak10', name: 'Untouchable', sw: 'Asiwezi', tier: 'gold', desc: 'Reach a 10-win streak' },
  { id: 'kingmaker', name: 'Kingmaker', sw: 'Mfalme', tier: 'bronze', desc: 'Promote your first king' },
  { id: 'kingpin', name: 'Crown Prince', sw: 'Mfalme wa Taji', tier: 'silver', desc: 'Promote 10 kings in total' },
  { id: 'capturex', name: 'Capture Baron', sw: 'Vibao', tier: 'silver', desc: 'Land 50 lifetime captures' },
  { id: 'gladiator', name: 'Gladiator', sw: 'Kishujaa', tier: 'gold', desc: 'Win 25 games' },
  { id: 'ironman', name: 'Marathoner', sw: 'Nguvu', tier: 'platinum', desc: 'Play 100 games' },
  { id: 'hardbeater', name: 'Boss Killer', sw: 'Mwepesi', tier: 'gold', desc: 'Beat the Hard house bot' },
  { id: 'cash50', name: 'Real Money', sw: 'Fedha', tier: 'silver', desc: 'Win a 50 KSh cash table' },
  { id: 'cash500', name: 'Big Stakes', sw: 'Kibanda Kubwa', tier: 'gold', desc: 'Win a 500 KSh cash table' },
  { id: 'hustler', name: 'Day One', sw: 'Hustler', tier: 'silver', desc: 'Play 10 cash matches' },
  { id: 'perfect', name: 'Textbook', sw: 'Usafi', tier: 'gold', desc: 'Win without losing a piece' },
  { id: 'comeback', name: 'Second Wind', sw: 'Kiviru', tier: 'gold', desc: 'Win from behind' },
  { id: 'nightowl', name: 'Night Owl', sw: 'Usiku', tier: 'silver', desc: 'Play a match after 11pm' },
  { id: 'earlybird', name: 'Asubuhi', sw: 'Asubuhi', tier: 'bronze', desc: 'Play a match before 7am' },
  { id: 'hopper', name: 'Estate Hopper', sw: 'Mtaa Mtaa', tier: 'platinum', desc: 'Play in 5 different estates' },
];

export function medalById(id: string): Medal | null {
  return MEDALS.find((m) => m.id === id) ?? null;
}

/**
 * All medals whose conditions a (career, session) pair currently satisfies.
 * Returns ids sorted in catalog order. Caller diff's against the unlocked set.
 */
export function satisfiedMedals(career: Career, session: SessionSlice): string[] {
  const hit: string[] = [];
  const add = (id: string) => hit.push(id);

  if (career.wins >= 1) add('kwanza');
  if (career.bestStreak >= 3) add('mshindi');
  if (career.bestStreak >= 5) add('streak5');
  if (career.bestStreak >= 10) add('streak10');
  if (career.totalKings >= 1) add('kingmaker');
  if (career.totalKings >= 10) add('kingpin');
  if (career.totalCaptures >= 50) add('capturex');
  if (career.wins >= 25) add('gladiator');
  if (career.wins + career.losses >= 100) add('ironman');
  if (session.beatHardBot) add('hardbeater');
  if (session.wonHighStake >= 50) add('cash50');
  if (session.wonHighStake >= 500) add('cash500');
  if (career.matches.filter((m) => m.kind === 'cash').length >= 10) add('hustler');
  if (session.perfectWin) add('perfect');
  if (session.comeback) add('comeback');
  if (session.playedLate) add('nightowl');
  if (session.playedEarly) add('earlybird');
  if (session.estatesVisited >= 5) add('hopper');

  return MEDALS.map((m) => m.id).filter((id) => hit.includes(id));
}

const KEY = 'esther-medals-v1';

export function loadUnlocked(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

export function saveUnlocked(unlocked: ReadonlySet<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...unlocked]));
  } catch {
    /* cosmetic — ignore */
  }
}

/** Given prior unlocks, return the NEWLY unlocked ids for this snapshot. */
export function progress(
  career: Career,
  session: SessionSlice,
  unlocked: ReadonlySet<string>,
): { newIds: string[]; totalNow: number } {
  const should = satisfiedMedals(career, session);
  const add = should.filter((id) => !unlocked.has(id));
  return { newIds: add, totalNow: should.length };
}

export function unlockedMedals(unlocked: ReadonlySet<string>): Medal[] {
  return MEDALS.filter((m) => unlocked.has(m.id));
}

export function lockedMedals(unlocked: ReadonlySet<string>): Medal[] {
  return MEDALS.filter((m) => !unlocked.has(m.id));
}