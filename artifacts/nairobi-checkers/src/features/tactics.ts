/**
 * esther · TACTICS — engine-driven move tips. Read-only over opencode's
 * `game-engine.ts`: legal moves, captures, threats, king pushes. Pure and
 * deterministic; the UI renders the copies.
 */

import {
  applyMove,
  countPieces,
  legalMoves,
  type Board,
  type GameRules,
  type Move,
  type PieceColor,
} from '../components/game/game-engine';

export type TipKind = 'forced' | 'chain' | 'threat' | 'king' | 'guard' | 'center';

export type Tip = {
  id: string;
  kind: TipKind;
  copy: string;
  sw: string;
};

/** Moves for `color` that capture at least one piece. */
export function captureMoves(board: Board, color: PieceColor, rules: GameRules): Move[] {
  return legalMoves(board, color, rules).filter((m) => m.captures.length > 0);
}

/** Longest capture chain available right now (0 = no capture on). */
export function longestChain(board: Board, color: PieceColor, rules: GameRules): number {
  let best = 0;
  for (const m of captureMoves(board, color, rules)) {
    best = Math.max(best, m.captures.length);
  }
  return best;
}

/**
 * Count of your pieces that the opponent could capture on their next ply
 * (threat scan: simulate each enemy move, see what it takes).
 */
export function threatenedCount(board: Board, color: PieceColor, rules: GameRules): number {
  const enemy: PieceColor = color === 'gold' ? 'forest' : 'gold';
  const mine = new Set<string>();
  for (let r = 0; r < rules.size; r++) {
    for (let c = 0; c < rules.size; c++) {
      const cell = board[r]?.[c];
      if (cell && cell.color === color) mine.add(`${r}:${c}`);
    }
  }
  const hit = new Set<string>();
  for (const m of captureMoves(board, enemy, rules)) {
    for (const cap of m.captures) {
      if (mine.has(`${cap.row}:${cap.col}`)) hit.add(`${cap.row}:${cap.col}`);
    }
  }
  return hit.size;
}

/** How close your nearest man is to promotion (rows away, 0 = a king exists). */
export function kingDistance(board: Board, color: PieceColor, rules: GameRules): number {
  let best = Infinity;
  for (let r = 0; r < rules.size; r++) {
    for (let c = 0; c < rules.size; c++) {
      const cell = board[r]?.[c];
      if (!cell || cell.color !== color || cell.king) continue;
      const d = color === 'gold' ? r : rules.size - 1 - r;
      best = Math.min(best, d);
    }
  }
  return best === Infinity
    ? 0
    : best;
}

/** Material swing if you play `move` (your pieces minus theirs, after). */
export function swingAfter(board: Board, color: PieceColor, rules: GameRules, move: Move): number {
  const { board: after } = applyMove(board, move, rules);
  const enemy: PieceColor = color === 'gold' ? 'forest' : 'gold';
  return countPieces(after, color) - countPieces(after, enemy);
}

/** Ranked tips for the side to move. Deterministic, cheapest first. */
export function suggestions(board: Board, color: PieceColor, rules: GameRules): Tip[] {
  const tips: Tip[] = [];
  const captures = captureMoves(board, color, rules);
  const chain = longestChain(board, color, rules);
  const threats = threatenedCount(board, color, rules);
  const dist = kingDistance(board, color, rules);

  if (captures.length > 0 && rules.forcedCapture) {
    tips.push({
      id: 'forced',
      kind: 'forced',
      copy: `Capture is forced — ${captures.length} taking move${captures.length > 1 ? 's' : ''} on the board.`,
      sw: 'Kula lazima',
    });
  }
  if (chain >= 2) {
    tips.push({
      id: 'chain',
      kind: 'chain',
      copy: `A ${chain}-jump chain is available — take the long road home.`,
      sw: 'Mnyororo mkubwa',
    });
  }
  if (threats > 0) {
    tips.push({
      id: 'threat',
      kind: 'threat',
      copy: `${threats} of your pieces are hanging — guard them or trade up.`,
      sw: 'Vibao viko hatarini',
    });
  }
  if (dist > 0 && dist <= 2) {
    tips.push({
      id: 'king',
      kind: 'king',
      copy: 'A man is 1–2 steps from the crown — push the coronation.',
      sw: 'Mfalme karibu',
    });
  }
  if (threats === 0 && captures.length === 0) {
    tips.push({
      id: 'guard',
      kind: 'guard',
      copy: 'Quiet board — keep your back row home and own the center.',
      sw: 'Tulia na ushike katikati',
    });
  }
  return tips;
}

/** One-liner for a move just played (used by the taunt strip). */
export function moveFlavor(move: Move): string {
  if (move.captures.length >= 3) return 'a monster chain — the crowd goes wild';
  if (move.captures.length === 2) return 'a double helping — street justice';
  if (move.captures.length === 1) return 'a clean take — pole pole';
  return 'a quiet slide — setting the trap';
}