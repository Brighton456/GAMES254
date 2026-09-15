/**
 * Games254 checkers engine — pure logic, zero React.
 * Supports 6x6 up to 12x12 boards, king-flight variants, forced captures,
 * full multi-jump chains, promotion-stop rule, and replay serialization.
 */

import { cryptoRng, type Rng } from '../../lib/random';

export type PieceColor = 'gold' | 'forest';
export type Cell = { color: PieceColor; king: boolean };
export type Board = (Cell | null)[][];
export type Square = { row: number; col: number };
export type Move = { from: Square; path: Square[]; captures: Square[] };

export type KingMode = 'fly-far' | 'fly-one' | 'hop';
export type GameRules = {
  size: number; // 6 | 8 | 10 | 12
  kingMode: KingMode; // fly-far = flying kings, fly-one = one-step kings (classic), hop = flying kings that must land adjacent after a jump
  forcedCapture: boolean;
  promotionStop: boolean; // true: a jump chain ends when the piece promotes
};

export type StepKind = 'slide' | 'jump';
export type Step = { kind: StepKind; from: Square; to: Square; captured?: Square; promoted?: boolean };
export type GameSnapshot = { board: Board; turn: PieceColor };
export type ReplayMove = { steps: Step[]; boardAfter: Board; turnAfter: PieceColor; color: PieceColor; captureCount: number };
export type Outcome = { winner: PieceColor | null; reason: 'no-moves' | 'no-pieces' | 'resign' | 'draw-agreed' | 'timeout' | 'draw-rule' };

const DIRS_GOLD: [number, number][] = [[-1, -1], [-1, 1]];
const DIRS_FOREST: [number, number][] = [[1, -1], [1, 1]];
export const BOARD_SIZES = [6, 8, 10, 12];
export const KING_MODES: { value: KingMode; label: string; hint: string }[] = [
  { value: 'fly-far', label: 'Flying kings', hint: 'Slide any distance on open diagonals' },
  { value: 'fly-one', label: 'Classic kings', hint: 'One step at a time, both directions' },
  { value: 'hop', label: 'Sky-hop kings', hint: 'Fly far to attack, land beside the capture' },
];

export function makeBoard(size: number): Board {
  const board: Board = Array.from({ length: size }, () => Array<Cell | null>(size).fill(null));
  const rowsPerSide = size >= 10 ? 4 : size >= 8 ? 3 : 2;
  for (let row = 0; row < rowsPerSide; row++) {
    for (let col = 0; col < size; col++) {
      if ((row + col) % 2 === 1) board[row][col] = { color: 'forest', king: false };
    }
  }
  for (let row = size - rowsPerSide; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if ((row + col) % 2 === 1) board[row][col] = { color: 'gold', king: false };
    }
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function boardKey(board: Board): string {
  let key = '';
  for (const row of board) {
    for (const cell of row) {
      key += cell ? (cell.color === 'gold' ? (cell.king ? 'G' : 'g') : cell.king ? 'F' : 'f') : '.';
    }
  }
  return key;
}

export function countPieces(board: Board, color: PieceColor): number {
  let count = 0;
  for (const row of board) for (const cell of row) if (cell && cell.color === color) count++;
  return count;
}

function dirSteps(color: PieceColor): [number, number][] {
  return color === 'gold' ? DIRS_GOLD : DIRS_FOREST;
}

/** Sliding destinations (no jump) for a piece. */
function slidesFor(board: Board, from: Square, rules: GameRules): Square[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const out: Square[] = [];
  const dirs = piece.king ? dirSteps('gold').concat(dirSteps('forest')) : dirSteps(piece.color);
  for (const [dr, dc] of dirs) {
    if (piece.king && rules.kingMode === 'fly-far') {
      let r = from.row + dr;
      let c = from.col + dc;
      while (r >= 0 && r < rules.size && c >= 0 && c < rules.size && !board[r][c]) {
        out.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
    } else {
      const r = from.row + dr;
      const c = from.col + dc;
      if (r >= 0 && r < rules.size && c >= 0 && c < rules.size && !board[r][c]) out.push({ row: r, col: c });
    }
  }
  return out;
}

/** One-step jump landings from a square (used to build multi-jump chains). */
function jumpsFor(board: Board, from: Square, color: PieceColor, rules: GameRules): { to: Square; captured: Square }[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const out: { to: Square; captured: Square }[] = [];
  const dirs = piece.king ? dirSteps('gold').concat(dirSteps('forest')) : dirSteps(color);
  const size = rules.size;
  for (const [dr, dc] of dirs) {
    if (piece.king && rules.kingMode !== 'fly-one') {
      // Flying jump: scan until an occupied square; must be enemy with an empty landing beyond.
      let r = from.row + dr;
      let c = from.col + dc;
      while (r >= 0 && r < size && c >= 0 && c < size && !board[r][c]) {
        r += dr;
        c += dc;
      }
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] && board[r][c]!.color !== color) {
        const landR = rules.kingMode === 'hop' ? r + dr : r + dr;
        const landC = rules.kingMode === 'hop' ? c + dc : c + dc;
        if (landR >= 0 && landR < size && landC >= 0 && landC < size && !board[landR][landC]) {
          out.push({ to: { row: landR, col: landC }, captured: { row: r, col: c } });
        }
      }
    } else {
      const midR = from.row + dr;
      const midC = from.col + dc;
      const landR = from.row + dr * 2;
      const landC = from.col + dc * 2;
      if (
        landR >= 0 && landR < size && landC >= 0 && landC < size &&
        board[midR]?.[midC] && board[midR][midC]!.color !== color && !board[landR][landC]
      ) {
        out.push({ to: { row: landR, col: landC }, captured: { row: midR, col: midC } });
      }
    }
  }
  return out;
}

function promotesAt(color: PieceColor, row: number, size: number): boolean {
  return color === 'gold' ? row === 0 : row === size - 1;
}

/** All moves for `color`. Each move is a full multi-jump chain when captures exist. */
export function legalMoves(board: Board, color: PieceColor, rules: GameRules): Move[] {
  const jumps: Move[] = [];
  const slides: Move[] = [];
  for (let row = 0; row < rules.size; row++) {
    for (let col = 0; col < rules.size; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      const from = { row, col };
      // Multi-jump chains via DFS.
      const walk = (work: Board, pos: Square, path: Square[], captured: Square[], justPromoted: boolean) => {
        if (justPromoted && rules.promotionStop) {
          jumps.push({ from, path: [...path], captures: [...captured] });
          return;
        }
        const nexts = jumpsFor(work, pos, color, rules);
        if (!nexts.length) {
          if (captured.length) jumps.push({ from, path: [...path], captures: [...captured] });
          return;
        }
        let extended = false;
        for (const { to, captured: cap } of nexts) {
          const nextBoard = cloneBoard(work);
          const mover = nextBoard[pos.row][pos.col]!;
          nextBoard[pos.row][pos.col] = null;
          nextBoard[cap.row][cap.col] = null;
          const promoted = !mover.king && promotesAt(color, to.row, rules.size);
          if (promoted) mover.king = true;
          nextBoard[to.row][to.col] = mover;
          extended = true;
          walk(nextBoard, to, [...path, to], [...captured, cap], promoted);
        }
        if (!extended && captured.length) jumps.push({ from, path: [...path], captures: [...captured] });
      };
      walk(board, from, [from], [], false);
      for (const to of slidesFor(board, from, rules)) slides.push({ from, path: [from, to], captures: [] });
    }
  }
  if (rules.forcedCapture && jumps.length) return jumps;
  return [...jumps, ...slides];
}

export function applyMove(board: Board, move: Move, rules: GameRules): { board: Board; steps: Step[] } {
  const next = cloneBoard(board);
  const piece = next[move.from.row][move.from.col];
  if (!piece) return { board: next, steps: [] };
  const steps: Step[] = [];
  let current = move.from;
  let mover = { ...piece };
  next[move.from.row][move.from.col] = null;
  if (move.captures.length === 0) {
    const to = move.path[move.path.length - 1];
    next[to.row][to.col] = mover;
    const promoted = !mover.king && promotesAt(mover.color, to.row, rules.size);
    if (promoted) {
      mover.king = true;
      next[to.row][to.col] = mover;
    }
    steps.push({ kind: 'slide', from: move.from, to, promoted });
    return { board: next, steps };
  }
  move.path.slice(1).forEach((to, index) => {
    const cap = move.captures[index];
    if (cap) next[cap.row][cap.col] = null;
    const promoted = !mover.king && promotesAt(mover.color, to.row, rules.size);
    if (promoted) mover.king = true;
    next[to.row][to.col] = mover;
    steps.push({ kind: 'jump', from: current, to, captured: cap, promoted });
    current = to;
  });
  return { board: next, steps };
}

export function outcomeFor(board: Board, color: PieceColor, rules: GameRules): Outcome | null {
  if (countPieces(board, color) === 0) return { winner: color === 'gold' ? 'forest' : 'gold', reason: 'no-pieces' };
  if (legalMoves(board, color, rules).length === 0) return { winner: color === 'gold' ? 'forest' : 'gold', reason: 'no-moves' };
  return null;
}

export function serializeReplay(start: Board, rules: GameRules, moves: ReplayMove[]): string {
  return JSON.stringify({
    v: 1,
    rules,
    start: boardKey(start),
    moves: moves.map((m) => ({
      c: m.color,
      s: m.steps.map((st) => ({ k: st.kind[0], f: st.from, t: st.to, c: st.captured, p: st.promoted ? 1 : 0 })),
    })),
  });
}

// ---------------------------------------------------------------------------
// Draw rules + game-state flags (50-move rule, triple repetition)
// ---------------------------------------------------------------------------

/** Tracks the no-capture/no-promotion ply counter used by the 50-move rule. */
export type GameFlags = { noCapturePly: number };

export function initialFlags(): GameFlags {
  return { noCapturePly: 0 };
}

/** Advance the counter after a move: resets on capture, else increments. */
export function advanceFlags(prev: GameFlags, move: Move): GameFlags {
  return { noCapturePly: move.captures.length > 0 ? 0 : prev.noCapturePly + 1 };
}

/** 50-move rule: no capture for 100 plies (50 full moves) => draw. */
export function isDrawByMoves(flags: GameFlags): boolean {
  return flags.noCapturePly >= 100;
}

/** Triple repetition: a board key appeared at least 3 times (incl. now) => draw. */
export function isDrawByRepetition(boardKeys: string[], nowKey: string): boolean {
  let seen = 1; // the current key itself
  for (const key of boardKeys) if (key === nowKey) seen++;
  return seen >= 3;
}

// ---------------------------------------------------------------------------
// AI opponent — the house bot. Difficulty tunes how deep it thinks.
// ---------------------------------------------------------------------------

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

function evaluate(board: Board, forColor: PieceColor, rules: GameRules): number {
  const them: PieceColor = forColor === 'gold' ? 'forest' : 'gold';
  let score = 0;
  for (let row = 0; row < rules.size; row++) {
    for (let col = 0; col < rules.size; col++) {
      const piece = board[row][col];
      if (!piece) continue;
      let value = 10 + (piece.king ? 6 : 0);
      if (!piece.king) value += piece.color === 'gold' ? rules.size - 1 - row : row; // advancement
      score += piece.color === forColor ? value : -value;
    }
  }
  // Slight preference for keeping back-row guard pieces early.
  return score + (countPieces(board, them) === 0 ? 10_000 : 0);
}

function searchBestMove(board: Board, color: PieceColor, rules: GameRules, depth: number): Move | null {
  const moves = legalMoves(board, color, rules);
  if (!moves.length) return null;
  const them: PieceColor = color === 'gold' ? 'forest' : 'gold';

  const value = (work: Board, mover: PieceColor, remaining: number, alpha: number, beta: number): number => {
    if (remaining === 0) return evaluate(work, color, rules);
    const options = legalMoves(work, mover, rules);
    if (!options.length) return mover === color ? -9_000 : 9_000;
    if (mover === color) {
      let best = -Infinity;
      for (const move of options) {
        const { board: after } = applyMove(work, move, rules);
        best = Math.max(best, value(after, them, remaining - 1, alpha, beta));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }
    let best = Infinity;
    for (const move of options) {
      const { board: after } = applyMove(work, move, rules);
      best = Math.min(best, value(after, color, remaining - 1, alpha, beta));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  };

  let bestMove = moves[0];
  let bestScore = -Infinity;
  // Move ordering: captures first sharpens alpha-beta pruning.
  const ordered = [...moves].sort((a, b) => b.captures.length - a.captures.length);
  for (const move of ordered) {
    const { board: after } = applyMove(board, move, rules);
    const score = value(after, them, depth - 1, -Infinity, Infinity) + move.captures.length * 2;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export function chooseBotMove(board: Board, color: PieceColor, rules: GameRules, difficulty: Difficulty, rng: Rng = cryptoRng()): Move | null {
  const moves = legalMoves(board, color, rules);
  if (!moves.length) return null;
  if (difficulty === 'Easy') {
    // Prefers captures (house rules) but otherwise wanders on the RNG stream.
    const captures = moves.filter((move) => move.captures.length);
    return captures.length ? captures[0] : moves[Math.floor(rng() * moves.length)];
  }
  if (difficulty === 'Medium') {
    // Depth-2 search, softened with a dash of randomness from the RNG stream.
    const ranked = moves
      .map((move) => {
        const { board: after } = applyMove(board, move, rules);
        return { move, score: evaluate(after, color, rules) };
      })
      .sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, Math.max(2, Math.ceil(ranked.length / 2)));
    return top[Math.floor(rng() * top.length)].move;
  }
  return searchBestMove(board, color, rules, 4);
}
