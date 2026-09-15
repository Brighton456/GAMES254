/**
 * esther · CODE — local "Duel Lab" sessions. A session snapshots a room code,
 * an estate, a variant, side bets and a clock into one seedable object.
 * Pass-and-play local, persisted to localStorage under my own key. Consumes
 * opencode's `roomcodes` defensively (never requires its internals).
 */

import { createRoom, generateRoomCode, isRoomLive, parseRoomCode } from '../lib/roomcodes';
import { seedRng, type Rng } from '../lib/random';
import { estateById, type Estate } from './estates';
import { variantById, type Variant } from './variants';
import type { SideBet } from './bets';
import { createClock, type MoveClock } from './clock';

export type DuelSession = {
  id: string;
  code: string;
  createdAt: number;
  hostId: string;
  estateId: string;
  variantId: string;
  cash: boolean;
  stakeKsh: number;
  bets: SideBet[];
  clock: Pick<MoveClock, 'initialSec' | 'incrementSec'>;
  seed: string;
  joined: boolean;
};

const KEY = 'esther-duel-sessions-v1';
const ALIVE_MS = 30 * 60 * 1000;

export function isLive(session: DuelSession, now = Date.now()): boolean {
  return now - session.createdAt < ALIVE_MS;
}

export function expiresIn(session: DuelSession, now = Date.now()): number {
  return Math.max(0, ALIVE_MS - (now - session.createdAt));
}

export function sessionRng(session: DuelSession): Rng {
  return seedRng(session.seed);
}

export function toSeed(session: Pick<DuelSession, 'code' | 'estateId' | 'variantId' | 'joined'>): string {
  return `${session.code}::${session.estateId}::${session.variantId}::${session.joined ? 'guest' : 'host'}`;
}

export function createDuelSession(input: {
  hostId?: string;
  estateId?: string;
  variantId?: string;
  cash?: boolean;
  stakeKsh?: number;
  bets?: SideBet[];
  initialSec?: number;
  incrementSec?: number;
}): DuelSession | null {
  const estate = input.estateId ? estateById(input.estateId) : null;
  const variant = input.variantId ? variantById(input.variantId) : null;
  const hostId = input.hostId ?? 'host-254';
  const room = createRoom(
    { hostId, kind: input.cash ? 'cash' : 'demo', stakeKsh: input.stakeKsh ?? 0, rulesVersion: variant?.id ?? 'kawaida' },
    loadCodes(),
  );
  const session: DuelSession = {
    id: `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    code: room.code,
    createdAt: Date.now(),
    hostId,
    estateId: estate?.id ?? 'kilimani',
    variantId: variant?.id ?? 'kawaida',
    cash: input.cash ?? false,
    stakeKsh: input.stakeKsh ?? 0,
    bets: input.bets ?? [],
    clock: {
      initialSec: variant?.clock?.initialSec ?? 600,
      incrementSec: variant?.clock?.incrementSec ?? 5,
    },
    seed: '',
    joined: false,
  };
  session.seed = toSeed({ code: session.code, estateId: session.estateId, variantId: session.variantId, joined: false });
  saveCode(session.code);
  return session;
}

/** Join by human-entered code. Pure validation + local mark. */
export function joinDuel(codeRaw: string): DuelSession | null {
  const normalized = parseRoomCode(codeRaw);
  if (!normalized) return null;
  const seen = loadCodes();
  if (!seen.has(normalized)) return null;
  const estate = pickFallbackEstate(normalized);
  const variant = variantById('sanza');
  const session: DuelSession = {
    id: `join-${normalized}-${Date.now().toString(36)}`,
    code: normalized,
    createdAt: Date.now(),
    hostId: 'guest-254',
    estateId: estate?.id ?? 'kilimani',
    variantId: variant?.id ?? 'kawaida',
    cash: false,
    stakeKsh: 0,
    bets: [],
    clock: { initialSec: 60, incrementSec: 8 },
    seed: '',
    joined: true,
  };
  session.seed = toSeed({ code: normalized, estateId: session.estateId, variantId: session.variantId, joined: true });
  saveCode(normalized);
  return session;
}

function pickFallbackEstate(code: string): Estate | null {
  const rng = seedRng(code);
  const estates = ['kilimani', 'westlands', 'eastleigh', 'kasarani', 'kibera', 'umoja', 'roysambu'];
  return estateById(estates[Math.floor(rng() * estates.length)]) ?? null;
}

export function styleEstate(session: DuelSession): Estate | null {
  return estateById(session.estateId);
}

export function styleVariant(session: DuelSession): Variant | null {
  return variantById(session.variantId);
}

// --- tiny local registry (defensive; opencode's roomcodes owns the shape) ---

/** In-memory registry so sessions work identically in browser AND node/tests. */
const localCodes = new Set<string>();

function loadCodes(): Set<string> {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(KEY);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(list)) {
        localCodes.clear();
        for (const v of list) if (typeof v === 'string') localCodes.add(v);
      }
    } catch {
      /* keep memory copy */
    }
  }
  return new Set(localCodes);
}

function saveCode(code: string) {
  localCodes.add(code);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify([...localCodes].slice(-40)));
    } catch {
      /* memory copy still holds it */
    }
  }
}

export { generateRoomCode, isRoomLive };
export function makeClockFromSession(session: DuelSession): MoveClock {
  return createClock(session.clock.initialSec, session.clock.incrementSec);
}