/**
 * Games254 tournament service — ASYNC LEADERBOARD / TIME-ATTACK model.
 * Players compete independently against the system within a submission window
 * (score, fewest moves, or fastest time). Top qualifying entries feed a bracket
 * that re-ranks dynamically as results land, then advances cutoffs per round.
 *
 * Deliberately UI-agnostic + pure: swap localStorage for supabase later.
 */

export type TournamentTiebreak = 'score' | 'moves' | 'time';
export type WindowState = 'open' | 'closed';

export type TournamentConfig = {
  id: string;
  name: string;
  tiebreak: TournamentTiebreak;
  entryFeeCents: number;
  prizePoolCents: number;
  opensAt: number;
  closesAt: number;
};

export type TourneyEntry = {
  id: string;
  playerId: string;
  displayName: string;
  submittedAt: number;
  attemptedAt: number;
  score: number; // raw score (ignored when tiebreak is moves/time)
  moves?: number;
  seconds?: number;
  moveLog: string[]; // anti-cheat: full moves/actions log
  qualified: boolean;
};

export type BracketRound = {
  label: string;
  matchups: { id: string; name: string }[];
};

export type Tournament = {
  config: TournamentConfig;
  entries: TourneyEntry[];
  window: WindowState;
};

export function createTournament(config: TournamentConfig): Tournament {
  return { config, entries: [], window: 'open' };
}

export function windowState(t: Tournament, now = Date.now()): WindowState {
  return now < t.config.closesAt ? 'open' : 'closed';
}

/** Rank-eligible score for sorting. higher = better. */
function effectiveScore(e: TourneyEntry, tiebreak: TournamentTiebreak): number {
  switch (tiebreak) {
    case 'moves':
      return -e.moves!;
    case 'time':
      return -e.seconds!;
    default:
      return e.score;
  }
}

export type SubmitInput = {
  playerId: string;
  displayName: string;
  attemptedAt: number;
  score: number;
  moves?: number;
  seconds?: number;
  moveLog: string[];
  now?: number;
  submittedAt?: number;
};

/**
 * Submit a result. Validates window-open + unique player. Records the move log
 * verbatim for anti-cheat. Entry is unqualified until the qualification pass.
 */
export function submitEntry(t: Tournament, input: SubmitInput): { ok: boolean; tournament?: Tournament; error?: string } {
  if (windowState(t, input.now ?? Date.now()) === 'closed') {
    return { ok: false, error: 'Submission window closed.' };
  }
  if (t.entries.some((e) => e.playerId === input.playerId)) {
    return { ok: false, error: 'Player already submitted.' };
  }
  const entry: TourneyEntry = {
    id: `sub-${t.config.id}-${t.entries.length + 1}`,
    playerId: input.playerId,
    displayName: input.displayName,
    submittedAt: input.submittedAt ?? Date.now(),
    attemptedAt: input.attemptedAt,
    score: input.score,
    moves: input.moves,
    seconds: input.seconds,
    moveLog: input.moveLog,
    qualified: false,
  };
  return {
    ok: true,
    tournament: { ...t, window: windowState(t), entries: [...t.entries, entry] },
  };
}

/** Leading entries by effective score. */
export function leaderboard(t: Tournament): TourneyEntry[] {
  return [...t.entries]
    .filter((e) => e.qualified)
    .sort((a, b) => {
      const by = effectiveScore(b, t.config.tiebreak) - effectiveScore(a, t.config.tiebreak);
      return by !== 0 ? by : a.submittedAt - b.submittedAt; // earlier ties win
    });
}

/** All entries ranked (before qualification) by effective score. */
export function standings(t: Tournament): TourneyEntry[] {
  return [...t.entries].sort((a, b) => {
    const by = effectiveScore(b, t.config.tiebreak) - effectiveScore(a, t.config.tiebreak);
    return by !== 0 ? by : a.submittedAt - b.submittedAt;
  });
}

/**
 * Qualification pass: mark the top-N of the pool qualified. Intended to run
 * once the window closes; prizes/advancement derive from this ordering.
 */
export function qualify(t: Tournament, seats: number, now = Date.now()): Tournament {
  if (windowState(t, now) === 'open') return { ...t, window: windowState(t) }; // no early ranking
  const ranked = standings(t);
  return {
    ...t,
    window: 'closed',
    entries: ranked.map((e, i) => ({ ...e, qualified: i < seats })),
  };
}

/**
 * Build the visible ladder/bracket from the qualifying entries. Because the
 * format is async/time-attack, "rounds" are cutoffs of the leaderboard, not
 * head-to-head pairings — advancement is deterministic from submission order.
 */
export function buildLadder(t: Tournament, cutoffs: number[]): BracketRound[] {
  const q = leaderboard(t);
  const rounds: BracketRound[] = [];
  let cursor = 0;
  cutoffs.forEach((seat, index) => {
    const slice = q.slice(cursor, cursor + seat);
    cursor += seat;
    if (!slice.length) return;
    rounds.push({
      label: index === cutoffs.length - 1 ? 'Final' : `Advancing ${seat} seat${seat > 1 ? 's' : ''}`,
      matchups: slice.map((e) => ({ id: e.playerId, name: e.displayName })),
    });
  });
  return rounds;
}

/** Prize tiers from the prize pool (flat descending allocation). */
export function prizeTiers(prizePoolCents: number, seats: number): number[] {
  const share = Math.floor(prizePoolCents / Math.max(1, seats));
  return Array.from({ length: seats }, () => share);
}