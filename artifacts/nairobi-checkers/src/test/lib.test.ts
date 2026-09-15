/**
 * Games254 service-layer tests: random, money, wallet, room codes, tournaments.
 * Run via `tsx --test` from the workspace scripts package.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { code6, normalizeCode, randomInt, randomIntBetween, seedRng, shuffle } from '../lib/random';
import { centsToKsh, fmtKsh, settle, toCents } from '../lib/money';
import { emptyWallet, escrowStake, settleMatch, deposit, withdraw, confirmDeposit } from '../lib/wallet-service';
import { createRoom, generateRoomCode, isRoomLive, parseRoomCode } from '../lib/roomcodes';
import {
  createTournament,
  submitEntry,
  qualify,
  leaderboard,
  standings,
  buildLadder,
  prizeTiers,
  type TournamentConfig,
} from '../lib/tournament-service';

// ---------------------------------------------------------------------------
// random
// ---------------------------------------------------------------------------

describe('random', () => {
  test('seeded RNG is deterministic', () => {
    assert.equal(seedRng('xyz')(), seedRng('xyz')());
    assert.equal(code6('test-seed'), code6('test-seed'));
  });

  test('randomInt stays in bounds; degenerate max returns 0', () => {
    const rng = seedRng('a');
    for (let i = 0; i < 500; i++) {
      const v = randomInt(rng, 10);
      assert.ok(v >= 0 && v < 10);
    }
    assert.equal(randomInt(rng, 0), 0);
  });

  test('randomIntBetween is inclusive both ends', () => {
    const rng = seedRng('b');
    const lo = randomIntBetween(rng, 5, 5);
    assert.equal(lo, 5);
    for (let i = 0; i < 200; i++) {
      const v = randomIntBetween(rng, 5, 7);
      assert.ok(v === 5 || v === 6 || v === 7);
    }
  });

  test('shuffle returns a permutation of the same elements', () => {
    const rng = seedRng('c');
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(rng, input);
    assert.deepEqual([...out].sort((a, b) => a - b), input);
    assert.deepEqual(input, [1, 2, 3, 4, 5]); // untouched
  });

  test('code6 uses a human-friendly alphabet', () => {
    const code = code6('room-1');
    assert.equal(code.length, 6);
    // No I, O, 0 or 1; uppercase alnum only.
    assert.match(code, /^[A-HJ-NP-Z2-9]+$/);
  });

  test('normalizeCode validates exactly 6 stripped alnum chars', () => {
    assert.equal(normalizeCode('g7k2mQ'), 'G7K2MQ');
    assert.equal(normalizeCode(' g7k2mq! '), 'G7K2MQ');
    assert.equal(normalizeCode('short'), null);
  });
});

// ---------------------------------------------------------------------------
// money
// ---------------------------------------------------------------------------

describe('money', () => {
  test('toCents converts KSh strings/numbers to integer cents', () => {
    assert.equal(toCents(1250), 125000);
    assert.equal(toCents('12.5'), 1250);
    assert.equal(toCents('1250'), 125000);
    assert.equal(toCents(-1), null);
    assert.equal(toCents('abc'), null);
  });

  test('centsToKsh and fmtKsh round-trip', () => {
    assert.equal(centsToKsh(125000), 1250);
    assert.equal(fmtKsh(1250), 'KSh 12.50');
    assert.equal(fmtKsh(125000), 'KSh 1,250.00');
  });

  test('settle computes pool, fee and prize from stake', () => {
    // 500 KSh stake, 5% house fee.
    assert.deepEqual(settle(50000, 5), { pool: 100000, fee: 5000, prize: 95000 });
    // 2.5% fee rounds to a whole cent.
    assert.deepEqual(settle(5000, 2.5), { pool: 10000, fee: 250, prize: 9750 });
  });

  test('never introduces float drift across many divisions', () => {
    let cents = 1;
    for (let i = 0; i < 10_000; i++) {
      const { prize } = settle(cents, 5);
      assert.ok(Number.isInteger(prize));
      cents = (cents * 7 + 1) % 97_001;
    }
  });
});

// ---------------------------------------------------------------------------
// wallet-service
// ---------------------------------------------------------------------------

describe('wallet-service', () => {
  test('emptyWallet seeds the starting balance', () => {
    assert.equal(emptyWallet(100).available, 10000);
    assert.equal(emptyWallet(0).available, 0);
  });

  test('escrowStake holds available balance', () => {
    const wallet = emptyWallet(100);
    const res = escrowStake(wallet, 5000, 'stake');
    assert.ok(res.ok);
    assert.equal(res.state!.available, 5000);
    assert.equal(res.state!.escrow, 5000);
  });

  test('escrowStake rejects over-balance stakes', () => {
    const res = escrowStake(emptyWallet(10), 5000, 'stake');
    assert.equal(res.ok, false);
    assert.ok(res.error);
  });

  test('win pays prize; loser burns; draw refunds', () => {
    const stake = 5000; // 50 KSh
    const fee = 5;
    const won = escrowStake(emptyWallet(100), stake, 'stake');
    const winRes = settleMatch(won.state!, fee, true, 'match');
    assert.ok(winRes.ok);
    // payout = pool(10000) - fee(500) = 9500 onto available.
    assert.equal(winRes.state!.available, 10000 - stake + 9500);
    assert.equal(winRes.state!.escrow, 0);

    const lost = escrowStake(emptyWallet(100), stake, 'stake');
    const lossRes = settleMatch(lost.state!, fee, false, 'match');
    assert.ok(lossRes.ok);
    assert.equal(lossRes.state!.available, 10000 - stake); // stake is gone
    assert.equal(lossRes.state!.escrow, 0);

    const drew = escrowStake(emptyWallet(100), stake, 'stake');
    const drawRes = settleMatch(drew.state!, fee, null, 'match');
    assert.ok(drawRes.ok);
    assert.equal(drawRes.state!.available, 10000); // refunded in full
  });

  test('settleMatch is a no-op without escrow', () => {
    const res = settleMatch(emptyWallet(100), 5, true, 'match');
    assert.equal(res.ok, false);
  });

  test('deposit/withdraw respect the balance bound', () => {
    const w = emptyWallet(50);
    const dep = deposit(w, 2500, 'top-up');
    assert.ok(dep.ok);
    assert.equal(dep.state!.available, 7500);
    const wd = withdraw(dep.state!, 7500, 'cash-out');
    assert.ok(wd.ok);
    assert.equal(wd.state!.available, 0);
    const over = withdraw(wd.state!, 1, 'nope');
    assert.equal(over.ok, false);
  });

  test('confirmDeposit records an M-Pesa code', () => {
    const res = confirmDeposit(emptyWallet(0), 200, 'MP123');
    assert.ok(res.ok);
    assert.equal(res.state!.available, 20000);
    assert.ok(res.state!.txs.some((t) => t.note.includes('MP123')));
  });
});

// ---------------------------------------------------------------------------
// roomcodes
// ---------------------------------------------------------------------------

describe('roomcodes', () => {
  test('createRoom produces a valid 6-char code and stays live', () => {
    const room = createRoom(
      { hostId: 'h1', kind: 'cash', stakeKsh: 100, rulesVersion: 'v1' },
      new Set(),
    );
    assert.match(room.code, /^[A-HJ-NP-Z2-9]{6}$/);
    assert.ok(isRoomLive(room));
  });

  test('generateRoomCode avoids collisions', () => {
    const seeded = generateRoomCode(new Set(), 'h1');
    const colliding = generateRoomCode(new Set([seeded]), 'h1');
    assert.notEqual(colliding, seeded);
  });

  test('isRoomLive expires after 30 minutes', () => {
    const now = Date.now();
    const room = { createdAt: now };
    assert.ok(isRoomLive(room as never, now));
    assert.equal(isRoomLive(room as never, now + 60 * 60 * 1000), false);
  });

  test('parseRoomCode normalizes input', () => {
    const parsed = parseRoomCode(' abCd12! ');
    assert.equal(parsed, 'ABCD12');
    assert.equal(parseRoomCode('xy'), null);
  });
});

// ---------------------------------------------------------------------------
// tournament-service
// ---------------------------------------------------------------------------

function baseConfig(overrides: Partial<TournamentConfig> = {}): TournamentConfig {
  const now = Date.now();
  return {
    id: 't1',
    name: 'Test Cup',
    tiebreak: 'score',
    entryFeeCents: 1000,
    prizePoolCents: 50000,
    opensAt: now - 1000,
    closesAt: now + 60_000,
    ...overrides,
  };
}

describe('tournament-service', () => {
  test('submission guarded by window + duplicates', () => {
    const t = createTournament(baseConfig());
    const first = submitEntry(t, { playerId: 'p1', displayName: 'One', attemptedAt: 0, score: 100, moveLog: [] });
    assert.ok(first.ok);
    const dup = submitEntry(first.tournament!, { playerId: 'p1', displayName: 'One', attemptedAt: 0, score: 200, moveLog: [] });
    assert.equal(dup.ok, false);

    const closed = createTournament(baseConfig({ closesAt: Date.now() - 1 }));
    const late = submitEntry(closed, { playerId: 'p2', displayName: 'Two', attemptedAt: 0, score: 100, moveLog: [] });
    assert.equal(late.ok, false);
  });

  test('leaderboard ranks by effective score, ties broken by earlier submission', () => {
    let t = createTournament(baseConfig());
    for (const [playerId, score, submittedAt] of [
      ['a', 100, 5],
      ['b', 100, 2],
      ['c', 80, 1],
    ] as const) {
      const res = submitEntry(t, { playerId, displayName: playerId, attemptedAt: 0, score, moveLog: [], now: 1, submittedAt });
      t = res.tournament!;
    }
    t = qualify(t, 2, Date.now() + 120_000);
    const rank = standings(t).map((e) => e.playerId);
    assert.deepEqual(rank, ['b', 'a', 'c']); // same score, earlier submission first
    const top = leaderboard(t).map((e) => e.playerId);
    assert.deepEqual(top, ['b', 'a']);
  });

  test('moves tiebreak favors fewer moves', () => {
    let t = createTournament(baseConfig({ tiebreak: 'moves' }));
    for (const [id, moves] of [['a', 50], ['b', 30]] as const) {
      const res = submitEntry(t, { playerId: id, displayName: id, attemptedAt: 0, score: 0, moves, moveLog: [] });
      t = res.tournament!;
    }
    t = qualify(t, 1, Date.now() + 120_000);
    const top = leaderboard(t);
    assert.equal(top[0]?.playerId, 'b');
  });

  test('qualify refuses to rank while the window is still open', () => {
    const t = createTournament(baseConfig({ closesAt: Date.now() + 60_000 }));
    const res = qualify(t, 2, Date.now());
    assert.equal(res.window, 'open');
    assert.ok(res.entries.every((e) => !e.qualified));
  });

  test('buildLadder slices cutoffs and labels the final', () => {
    let t = createTournament(baseConfig());
    for (let i = 1; i <= 8; i++) {
      const res = submitEntry(t, { playerId: `p${i}`, displayName: `P${i}`, attemptedAt: 0, score: i, moveLog: [] });
      t = res.tournament!;
    }
    t = qualify(t, 4, Date.now() + 120_000);
    const rounds = buildLadder(t, [2, 2]);
    assert.ok(rounds[0]!.label.startsWith('Advancing'));
    assert.equal(rounds[1]!.label, 'Final');
    assert.equal(rounds[0]!.matchups.length, 2);
  });

  test('prizeTiers divides the pool evenly in whole cents', () => {
    const tiers = prizeTiers(10001, 3);
    assert.equal(tiers.length, 3);
    assert.ok(tiers.every((v) => Number.isInteger(v)));
  });
});