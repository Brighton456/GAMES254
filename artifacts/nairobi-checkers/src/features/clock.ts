/**
 * esther · CLOCK — the "Sanza" move clock. A match runs on a per-ply budget
 * with an increment awarded after each move. Pure state machine, wall-clock
 * injected so tests stay deterministic.
 */

export type MoveClock = {
  initialSec: number;
  incrementSec: number;
  running: boolean;
  startedAt: number | null;   // ms epoch
  budgetMs: number;           // remaining for the current mover
  ply: number;                // moves made (both sides)
};

export function createClock(initialSec: number, incrementSec = 0): MoveClock {
  const safe = Math.max(1, Math.floor(initialSec));
  return {
    initialSec: safe,
    incrementSec: Math.max(0, Math.floor(incrementSec)),
    running: false,
    startedAt: null,
    budgetMs: safe * 1000,
    ply: 0,
  };
}

export function startClock(clock: MoveClock, now = Date.now()): MoveClock {
  if (clock.running) return clock;
  return { ...clock, running: true, startedAt: now };
}

export function pauseClock(clock: MoveClock): MoveClock {
  return { ...clock, running: false };
}

/** ms left on the current mover; floor at 0. */
export function remainingMs(clock: MoveClock, now = Date.now()): number {
  if (!clock.running || clock.startedAt === null) return clock.budgetMs;
  return Math.max(0, clock.budgetMs - (now - clock.startedAt));
}

export function isExpired(clock: MoveClock, now = Date.now()): boolean {
  return clock.running && remainingMs(clock, now) <= 0;
}

/**
 * A move completed: consume what was used, bank the increment, hand the clock
 * to the next mover with a fresh start reference.
 */
export function afterMove(clock: MoveClock, now = Date.now()): MoveClock {
  if (!clock.running || clock.startedAt === null) {
    return clock.ply === 0 ? clock : createClock(clock.initialSec, clock.incrementSec);
  }
  const used = now - clock.startedAt;
  const nextBudget = clock.budgetMs - used + clock.incrementSec * 1000;
  const floor = Math.max(0, Math.floor(nextBudget));
  return {
    ...clock,
    budgetMs: floor,
    startedAt: now,
    ply: clock.ply + 1,
  };
}

/** Force a fresh budget (e.g. new variant, new game). */
export function resetClock(clock: MoveClock): MoveClock {
  return createClock(clock.initialSec, clock.incrementSec);
}

/** Fresh budget for the OTHER mover after a move without increment rolling over. */
export function handOff(clock: MoveClock, now = Date.now()): MoveClock {
  return afterMove(clock, now);
}

/** Casino-style "1:23" display. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function isLow(clock: MoveClock, warnSeconds: number, now = Date.now()): boolean {
  return remainingMs(clock, now) <= warnSeconds * 1000;
}