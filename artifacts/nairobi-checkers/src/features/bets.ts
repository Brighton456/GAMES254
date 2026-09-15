/**
 * esther · BETS — Kenyan-style side wagers on top of a cash table, in integer
 * cents, settled deterministically from match stats. These are book-keeping
 * contracts only: the UI displays, the ledger stays with the wallet seam.
 *
 * read-only consumer of `lib/money`.
 */

import { toCents, type Cents } from '../lib/money';

export type BetKind =
  | 'sweep'          // you win the table, straight up
  | 'exact-moves'    // "Tano kabisa" — you win in exactly N moves
  | 'kingmaker'      // you crown your first king before the opponent
  | 'big-chain'      // you land a capture chain of n jumps (n >= 2)
  | 'no-double'      // you win while never accepting double-or-nothing
  | 'comeback';      // you win after trailing on pieces mid-game

export type SideBet = {
  id: string;
  kind: BetKind;
  amountCents: Cents;
  target?: number; // used by exact-moves (move count) and big-chain (chain length)
};

export type MatchStats = {
  winner: 'gold' | 'forest';        // caller's color is 'gold' by Games254 convention
  actualMoves: number;
  playerFirstKingMove: number | null;
  opponentFirstKingMove: number | null;
  longestChainCaptures: number;
  acceptedDouble: boolean;
  sawTrailing: boolean;             // caller was down on pieces at some point
};

/** Multiplier table. Higher risk ⇒ bigger multiple; capped by law-of-good-taste. */
const ODDS: Record<BetKind, number> = {
  sweep: 1.9,
  'exact-moves': 3.0,
  kingmaker: 2.4,
  'big-chain': 2.2,
  'no-double': 2.6,
  comeback: 3.4,
};

export function oddsFor(kind: BetKind, target?: number): number {
  if (kind === 'exact-moves') {
    if (!target) return 3.0;
    if (target <= 6) return 4.0;   // slim: finish inside six moves
    if (target <= 10) return 3.25;
    if (target <= 14) return 2.75;
    return 2.2;
  }
  if (kind === 'big-chain') {
    const n = target ?? 2;
    if (n >= 5) return 8.0;
    if (n >= 4) return 5.0;
    if (n >= 3) return 3.0;
    return 2.2;
  }
  return ODDS[kind];
}

export function minimumTarget(kind: BetKind): number {
  return kind === 'exact-moves' ? 4 : kind === 'big-chain' ? 2 : 0;
}

export function maximumTarget(kind: BetKind): number {
  return kind === 'exact-moves' ? 30 : kind === 'big-chain' ? 6 : 0;
}

/** Validate + normalize a bet. Returns a clean copy or an error. */
export function placeBet(input: {
  kind: BetKind;
  amount: number | string;
  target?: number;
}): { ok: true; bet: SideBet } | { ok: false; error: string } {
  const cents = toCents(input.amount);
  if (cents === null || cents <= 0) {
    return { ok: false, error: 'Side bet must be a positive KSh amount.' };
  }
  if (cents > 500_000) {
    return { ok: false, error: 'Side bets are capped at KSh 5,000 on this table.' };
  }
  const hasTarget =
    input.kind === 'exact-moves' || input.kind === 'big-chain';
  const target = input.target;
  if (!hasTarget && input.target !== undefined) {
    return { ok: false, error: 'This wager does not take a target number.' };
  }
  if (hasTarget) {
    if (typeof target !== 'number' || !Number.isInteger(target)) {
      return { ok: false, error: `${input.kind} requires a whole-number target.` };
    }
    if (target < minimumTarget(input.kind) || target > maximumTarget(input.kind)) {
      return { ok: false, error: 'Target out of range for this wager.' };
    }
  }
  return {
    ok: true,
    bet: {
      id: `bet-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
      kind: input.kind,
      amountCents: cents,
      target: hasTarget ? target : undefined,
    },
  };
}

/** Payout if the wager wins (integer cents, multiplier already accounts for stake). */
export function payoutFor(bet: SideBet): Cents {
  const multiple = oddsFor(bet.kind, bet.target);
  return Math.round(bet.amountCents * multiple);
}

/** Deterministic resolution against match stats. */
export function resolveBet(bet: SideBet, stats: MatchStats): { won: boolean; payoutCents: Cents } {
  const player = 'gold';
  let won = false;
  switch (bet.kind) {
    case 'sweep':
      won = stats.winner === player;
      break;
    case 'exact-moves':
      won = stats.winner === player && stats.actualMoves === (bet.target ?? 0);
      break;
    case 'kingmaker': {
      if (stats.playerFirstKingMove === null) break;
      if (stats.opponentFirstKingMove === null) {
        won = stats.winner === player;
      } else {
        won = stats.playerFirstKingMove < stats.opponentFirstKingMove;
      }
      break;
    }
    case 'big-chain':
      won = stats.longestChainCaptures >= (bet.target ?? 2);
      break;
    case 'no-double':
      won = stats.winner === player && !stats.acceptedDouble;
      break;
    case 'comeback':
      won = stats.winner === player && stats.sawTrailing;
      break;
  }
  return { won, payoutCents: won ? payoutFor(bet) : 0 };
}

/** Net result in cents (negative = wager gone, positive = profit). */
export function netResult(bet: SideBet, stats: MatchStats): Cents {
  const { won, payoutCents } = resolveBet(bet, stats);
  return won ? payoutCents - bet.amountCents : -bet.amountCents;
}

export const BET_KINDS: readonly { kind: BetKind; label: string; hint: string }[] = [
  { kind: 'sweep', label: 'Sweep', hint: 'You take the whole table' },
  { kind: 'exact-moves', label: 'Tano kabisa', hint: 'Win in exactly N moves' },
  { kind: 'kingmaker', label: 'Kingmaker', hint: 'Crown your king first' },
  { kind: 'big-chain', label: 'Big Chain', hint: 'Land a 2+ jump chain' },
  { kind: 'no-double', label: 'Usidouble', hint: 'Win, never double' },
  { kind: 'comeback', label: 'Comeback', hint: 'Win from behind' },
];