/**
 * Games254 engine tests: move generation, rule filters, applyMove, outcomes,
 * draw-rule flags, and seeded bot determinism.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  advanceFlags,
  applyMove,
  boardKey,
  chooseBotMove,
  cloneBoard,
  initialFlags,
  isDrawByMoves,
  isDrawByRepetition,
  legalMoves,
  makeBoard,
  outcomeFor,
  type Board,
  type GameRules,
} from '../components/game/game-engine';
import { seedRng, shuffle } from '../lib/random';

const rules8: GameRules = { size: 8, kingMode: 'fly-one', forcedCapture: true, promotionStop: false };

function empty(size = 8): Board {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function place(board: Board, row: number, col: number, color: 'gold' | 'forest', king = false) {
  board[row][col] = { color, king };
  return board;
}

describe('engine — board & moves', () => {
  test('makeBoard fills exactly the dark squares with the right colors', () => {
    const b = makeBoard(8);
    let forest = 0;
    let gold = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = b[r][c];
        if (cell && cell.color === 'forest') forest++;
        if (cell && cell.color === 'gold') gold++;
      }
    }
    assert.equal(forest, 12);
    assert.equal(gold, 12);
  });

  test('cloneBoard is deep', () => {
    const b = empty();
    place(b, 0, 1, 'gold');
    const copy = cloneBoard(b);
    place(copy, 0, 1, 'forest');
    place(copy, 2, 3, 'forest');
    assert.equal(b[0][1]?.color, 'gold');
    assert.equal(b[2][3], null);
  });

  test('boardKey is stable for identical boards', () => {
    assert.equal(boardKey(makeBoard(8)), boardKey(makeBoard(8)));
  });

  test('forcedCapture: when a jump exists, only captures are legal', () => {
    const b = empty();
    place(b, 5, 0, 'gold');
    place(b, 4, 1, 'forest'); // jumpable
    const moves = legalMoves(b, 'gold', rules8);
    assert.ok(moves.length > 0);
    assert.ok(moves.every((m) => m.captures.length === 1));
  });

  test('applyMove removes the captured piece and lands the mover', () => {
    const b = empty();
    place(b, 5, 0, 'gold');
    place(b, 4, 1, 'forest');
    const move = legalMoves(b, 'gold', rules8)[0]!;
    const { board: after, steps } = applyMove(b, move, rules8);
    assert.equal(after[4][1], null);
    assert.equal(after[3][2]?.color, 'gold');
    assert.equal(steps[0]?.kind, 'jump');
  });

  test('multi-jump chains capture every piece on the path', () => {
    const b = empty(8);
    // Gold king at (7,2). fly-one jumps need an adjacent enemy + empty landing:
    // hop 1 over (6,3) -> land (5,4); hop 2 over (4,5) -> land (3,6).
    place(b, 7, 2, 'gold', true);
    place(b, 6, 3, 'forest');
    place(b, 4, 5, 'forest');
    const moves = legalMoves(b, 'gold', rules8);
    const chain = moves.find((m) => m.captures.length >= 2);
    assert.ok(chain, 'expected a multi-jump chain');
    const { board: after } = applyMove(b, chain!, rules8);
    assert.equal(after[6][3], null);
    assert.equal(after[4][5], null);
    assert.equal(after[3][6]?.color, 'gold');
  });

  test('outcomeFor detects no-pieces', () => {
    const b = empty();
    place(b, 4, 3, 'forest');
    const out = outcomeFor(b, 'gold', rules8);
    assert.ok(out);
    assert.equal(out.winner, 'forest');
    assert.equal(out.reason, 'no-pieces');
  });

  test('outcomeFor detects no-moves', () => {
    const b = empty();
    // A gold man pinned at the top row with no captures available.
    place(b, 0, 5, 'gold');
    place(b, 3, 6, 'forest'); // irrelevant blocker far away
    const out = outcomeFor(b, 'gold', rules8);
    assert.ok(out);
    assert.equal(out.reason, 'no-moves');
  });
});

describe('engine — draw rules & flags', () => {
  test('advanceFlags increments on slides, resets on capture', () => {
    const slide = { from: { row: 2, col: 1 }, path: [{ row: 2, col: 1 }, { row: 3, col: 2 }], captures: [] as { row: number; col: number }[] };
    const capture = { from: { row: 5, col: 0 }, path: [{ row: 5, col: 0 }, { row: 3, col: 2 }], captures: [{ row: 4, col: 1 }] };
    assert.equal(advanceFlags(initialFlags(), slide).noCapturePly, 1);
    assert.equal(advanceFlags({ noCapturePly: 50 }, capture).noCapturePly, 0);
  });

  test('isDrawByMoves triggers at 100 no-capture plies', () => {
    assert.equal(isDrawByMoves({ noCapturePly: 100 }), true);
    assert.equal(isDrawByMoves({ noCapturePly: 99 }), false);
  });

  test('isDrawByRepetition triggers on the third identical key', () => {
    const k1 = boardKey(makeBoard(8));
    const k2 = boardKey(makeBoard(10));
    assert.equal(isDrawByRepetition([k1, k1], k1), true);
    assert.equal(isDrawByRepetition([k1], k1), false);
    assert.equal(isDrawByRepetition([k1, k2], k1), false);
  });
});

describe('engine — seeded bot', () => {
  test('chooseBotMove with the same seed is deterministic', () => {
    const board = makeBoard(8);
    for (const difficulty of ['Easy', 'Medium'] as const) {
      const a = chooseBotMove(board, 'forest', { ...rules8, kingMode: 'fly-one' }, difficulty, seedRng('seed-1'));
      const b = chooseBotMove(board, 'forest', { ...rules8, kingMode: 'fly-one' }, difficulty, seedRng('seed-1'));
      assert.deepEqual(a, b, `${difficulty} should replay identically from a seed`);
    }
  });

  test('chooseBotMove returns null when no moves exist', () => {
    const board = empty();
    assert.equal(chooseBotMove(board, 'forest', rules8, 'Easy', seedRng('x')), null);
  });

  test('shuffle + seeded rng lets the hard bot see a stable ordering utility', () => {
    const rng = seedRng('order');
    const arr = [1, 2, 3, 4, 5];
    const s1 = shuffle(rng, arr);
    const s2 = shuffle(seedRng('order'), arr);
    assert.deepEqual(s1, s2);
  });
});