/**
 * esther · FEATURES tests — estates, slang, bets, achievements, clock,
 * variants, stats, tactics, code. Run with `tsx --test` directly (not via the
 * scripts package — that belongs to opencode).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ESTATES, ESTATE_IDS, estateById, pickEstate, venueOfDay, freshVenue } from './estates';
import { LINES, line, voice, swahiliCount, playByPlay } from './slang';
import { placeBet, payoutFor, resolveBet, netResult, oddsFor, minimumTarget, maximumTarget } from './bets';
import { MEDALS, satisfiedMedals, medalById, progress, loadUnlocked } from './achievements';
import { createClock, startClock, remainingMs, isExpired, afterMove, formatClock, isLow } from './clock';
import { VARIANTS, variantById, rulesForVariant, VARIANT_IDS } from './variants';
import { winRate, form, netCash, roi, missions, capturePerGame, bestMatch } from './stats';
import { captureMoves, longestChain, threatenedCount, kingDistance, suggestions, moveFlavor } from './tactics';
import { createDuelSession, joinDuel, isLive, expiresIn, sessionRng, toSeed } from './code';
import { seedRng } from '../lib/random';
import { makeBoard, type GameRules, type Board } from '../components/game/game-engine';
import { emptyCareer, type Career } from '../components/game/player-store';

const rng = seedRng('esther-test');

describe('estates', () => {
  test('has 12 estates with all fields', () => {
    assert.equal(ESTATES.length, 12);
    for (const e of ESTATES) {
      assert.ok(e.id && e.name && e.vibe && e.handshake);
      assert.ok(e.venues.length >= 3);
      assert.match(e.tint.dark, /^#/);
    }
  });

  test('ids are unique and resolvable', () => {
    assert.equal(new Set(ESTATE_IDS).size, ESTATE_IDS.length);
    assert.ok(estateById('kilimani'));
    assert.equal(estateById('nowhere'), null);
  });

  test('pickEstate avoids the trail, falls back when depleted', () => {
    const first = pickEstate(rng, ['kilimani', 'westlands']);
    assert.notEqual(first.id, 'kilimani');
    assert.notEqual(first.id, 'westlands');
    const all = pickEstate(rng, ESTATE_IDS.slice(0, 11));
    assert.ok(all);
  });

  test('venueOfDay is stable per day, varies across days', () => {
    const monday = venueOfDay('kilimani', 'Mon Sep 15 2026');
    const mondayAgain = venueOfDay('kilimani', 'Mon Sep 15 2026');
    const tuesday = venueOfDay('kilimani', 'Tue Sep 16 2026');
    assert.equal(monday, mondayAgain);
    assert.ok(monday);
    assert.equal(venueOfDay('nope', 'x'), null);
    assert.notEqual(monday, tuesday); // unlikely to collide across 3 venues
  });

  test('freshVenue returns an estate + a venue', () => {
    const { estate, venue } = freshVenue(rng);
    assert.ok(estateById(estate.id));
    assert.ok(venue.length > 0);
  });
});

describe('slang', () => {
  test('every kind has lines and draws deterministically', () => {
    for (const kind of Object.keys(LINES) as (keyof typeof LINES)[]) {
      assert.ok(LINES[kind].length >= 5);
      assert.equal(line(kind, seedRng('same-seed')), line(kind, seedRng('same-seed')));
    }
  });

  test('voice does not repeat within a pool', () => {
    const out = voice('taunt', rng, 4);
    assert.equal(out.length, 4);
    assert.equal(new Set(out).size, 4);
  });

  test('swahiliCount covers 0..12 and falls back to digits', () => {
    assert.equal(swahiliCount(1), 'moja');
    assert.equal(swahiliCount(12), 'kumi na mbili');
    assert.equal(swahiliCount(13), '13');
    assert.equal(swahiliCount(-1), '');
  });

  test('playByPlay is deterministic for same seed', () => {
    assert.equal(playByPlay(seedRng('s'), 4, 2), playByPlay(seedRng('s'), 4, 2));
  });
});

describe('bets', () => {
  test('placeBet normalizes integer cents', () => {
    const a = placeBet({ kind: 'sweep', amount: 100 });
    assert.ok(a.ok);
    if (a.ok) assert.equal(a.bet.amountCents, 10000);
    const bad = placeBet({ kind: 'sweep', amount: -5 });
    assert.equal(bad.ok, false);
  });

  test('target bounds enforced per kind', () => {
    assert.ok(placeBet({ kind: 'exact-moves', amount: 20, target: 5 }).ok);
    assert.equal(placeBet({ kind: 'exact-moves', amount: 20, target: 3 }).ok, false);
    assert.equal(placeBet({ kind: 'sweep', amount: 20, target: 5 }).ok, false); // sweep has no target
  });

  test('sweep pays on a gold win, burns on a forest win', () => {
    const bet = placeBet({ kind: 'sweep', amount: '100' });
    assert.ok(bet.ok);
    if (!bet.ok) return;
    const won = resolveBet(bet.bet, {
      winner: 'gold', actualMoves: 20, playerFirstKingMove: 5,
      opponentFirstKingMove: null, longestChainCaptures: 1, acceptedDouble: false, sawTrailing: false,
    });
    assert.equal(won.won, true);
    assert.equal(won.payoutCents, Math.round(10000 * oddsFor('sweep')));
    const lost = resolveBet(bet.bet, {
      winner: 'forest', actualMoves: 20, playerFirstKingMove: 5,
      opponentFirstKingMove: null, longestChainCaptures: 1, acceptedDouble: false, sawTrailing: false,
    });
    assert.equal(lost.won, false);
    assert.equal(lost.payoutCents, 0);
  });

  test('exact-moves needs the exact count AND a win', () => {
    const bet = placeBet({ kind: 'exact-moves', amount: 50, target: 7 });
    assert.ok(bet.ok);
    if (!bet.ok) return;
    const base = {
      winner: 'gold' as const, playerFirstKingMove: null, opponentFirstKingMove: null,
      longestChainCaptures: 0, acceptedDouble: false, sawTrailing: false,
    };
    assert.equal(resolveBet(bet.bet, { ...base, actualMoves: 7 }).won, true);
    assert.equal(resolveBet(bet.bet, { ...base, actualMoves: 8 }).won, false);
    assert.equal(resolveBet(bet.bet, { ...base, actualMoves: 7, winner: 'forest' }).won, false);
  });

  test('kingmaker crowns-first decides ties and wins', () => {
    const bet = placeBet({ kind: 'kingmaker', amount: 100 });
    assert.ok(bet.ok);
    if (!bet.ok) return;
    const base = {
      actualMoves: 10, longestChainCaptures: 0, acceptedDouble: false, sawTrailing: false as boolean,
      winner: 'gold' as const, playerFirstKingMove: 6, opponentFirstKingMove: 9,
    };
    assert.equal(resolveBet(bet.bet, base).won, true);
    assert.equal(resolveBet(bet.bet, { ...base, playerFirstKingMove: 9, opponentFirstKingMove: 6 }).won, false);
    assert.equal(resolveBet(bet.bet, { ...base, playerFirstKingMove: null }).won, false);
  });

  test('big-chain ignores winner, requires target jumps', () => {
    const bet = placeBet({ kind: 'big-chain', amount: 50, target: 3 });
    assert.ok(bet.ok);
    if (!bet.ok) return;
    const base = {
      actualMoves: 4, playerFirstKingMove: null, opponentFirstKingMove: null,
      acceptedDouble: false, sawTrailing: false, winner: 'forest' as const,
    };
    assert.equal(resolveBet(bet.bet, { ...base, longestChainCaptures: 3 }).won, true);
    assert.equal(resolveBet(bet.bet, { ...base, longestChainCaptures: 2 }).won, false);
    // 5-jump chain should pay the bonus multiple
    const five = placeBet({ kind: 'big-chain', amount: 50, target: 5 });
    assert.ok(five.ok);
    if (five.ok) assert.equal(payoutFor(five.bet), 5000 * 8);
  });

  test('no-double and comeback conditions hold', () => {
    const nd = placeBet({ kind: 'no-double', amount: 40 });
    assert.ok(nd.ok);
    if (!nd.ok) return;
    const base = {
      actualMoves: 9, playerFirstKingMove: null, opponentFirstKingMove: null,
      longestChainCaptures: 0, sawTrailing: false, winner: 'gold' as const, acceptedDouble: false,
    };
    assert.equal(resolveBet(nd.bet, base).won, true);
    assert.equal(resolveBet(nd.bet, { ...base, acceptedDouble: true }).won, false);

    const cb = placeBet({ kind: 'comeback', amount: 40 });
    assert.ok(cb.ok);
    if (!cb.ok) return;
    assert.equal(resolveBet(cb.bet, { ...base, sawTrailing: true }).won, true);
    assert.equal(resolveBet(cb.bet, { ...base, sawTrailing: false }).won, false);
  });

  test('minimum/maximum targets are sane', () => {
    assert.equal(minimumTarget('exact-moves'), 4);
    assert.equal(maximumTarget('exact-moves'), 30);
    assert.equal(minimumTarget('big-chain'), 2);
    assert.equal(minimumTarget('sweep'), 0);
  });

  test('netResult signs profit vs burn', () => {
    const bet = placeBet({ kind: 'sweep', amount: 100 });
    assert.ok(bet.ok);
    if (!bet.ok) return;
    const winStats = {
      winner: 'gold' as const, actualMoves: 5, playerFirstKingMove: 1, opponentFirstKingMove: null,
      longestChainCaptures: 0, acceptedDouble: false, sawTrailing: false,
    };
    assert.equal(netResult(bet.bet, winStats), Math.round(10000 * 1.9) - 10000);
  });
});

describe('achievements', () => {
  function career(overrides: Partial<Career>): Career {
    return { ...emptyCareer(), ...overrides, matches: overrides.matches ?? [] };
  }

  test('catalog is 18 medals, ids unique', () => {
    assert.equal(MEDALS.length, 18);
    assert.equal(new Set(MEDALS.map((m) => m.id)).size, MEDALS.length);
    assert.ok(medalById('kwanza'));
    assert.equal(medalById('nope'), null);
  });

  test('win-triggered medals', () => {
    const c = career({ wins: 1, bestStreak: 1 });
    const got = satisfiedMedals(c, { ...emptySlice(), perfectWin: true });
    assert.ok(got.includes('kwanza'));
  });

  test('streak + boss medals', () => {
    const c = career({ wins: 30, bestStreak: 7, totalKings: 12, totalCaptures: 60 });
    const got = satisfiedMedals(c, { ...emptySlice(), beatHardBot: true, wonHighStake: 600, estatesVisited: 6 });
    for (const id of ['streak5', 'kingpin', 'capturex', 'gladiator', 'hardbeater', 'cash500', 'hopper']) {
      assert.ok(got.includes(id), `missing ${id}`);
    }
    assert.ok(!got.includes('streak10'));
  });

  test('session flags light up nightowl / earlybird / perfect / comeback', () => {
    const got = satisfiedMedals(emptyCareer(), {
      ...emptySlice(), playedLate: true, playedEarly: true, perfectWin: true, comeback: true,
    });
    for (const id of ['nightowl', 'earlybird', 'perfect', 'comeback']) assert.ok(got.includes(id));
  });

  test('progress diff returns only newly unlocked', () => {
    const got = satisfiedMedals(career({ wins: 1 }), emptySlice());
    const { newIds } = progress(career({ wins: 1 }), emptySlice(), new Set(got));
    assert.deepEqual(newIds, []);
    const { newIds: fresh } = progress(career({ wins: 1 }), emptySlice(), new Set());
    assert.deepEqual(fresh, ['kwanza']);
  });

  test('loadUnlocked is safe in non-browser envs', () => {
    assert.ok(loadUnlocked() instanceof Set);
  });
});

function emptySlice() {
  return {
    playedEarly: false, playedLate: false, beatHardBot: false, wonHighStake: 0,
    perfectWin: false, comeback: false, estatesVisited: 0, matchesPlayed: 0,
  };
}

describe('clock', () => {
  test('createClock seeds budget from seconds', () => {
    const c = createClock(60, 5);
    assert.equal(c.budgetMs, 60000);
    assert.equal(c.running, false);
  });

  test('remainingMs drains while running, floors at 0', () => {
    let c = createClock(10);
    c = startClock(c, 1000);
    assert.equal(remainingMs(c, 2000), 9000);
    assert.equal(remainingMs(c, 12000), 0);
    assert.equal(isExpired(c, 12000), true);
  });

  test('afterMove banks increment and advances ply', () => {
    let c = createClock(10, 3);
    c = startClock(c, 1000);
    const after = afterMove(c, 2000); // used 1s, +3s increment -> 12s
    assert.equal(after.budgetMs, 12000);
    assert.equal(after.ply, 1);
  });

  test('formatClock renders casino style', () => {
    assert.equal(formatClock(83000), '1:23');
    assert.equal(formatClock(0), '0:00');
  });

  test('isLow flags nearing zero', () => {
    let c = createClock(5, 1);
    c = startClock(c, 0);
    assert.equal(isLow(c, 3, 3000), true);
    assert.equal(isLow(c, 3, 1000), false);
  });
});

describe('variants', () => {
  test('6 presets, resolvable, all map to GameRules shape', () => {
    assert.equal(VARIANTS.length, 6);
    for (const id of VARIANT_IDS) {
      const v = variantById(id);
      assert.ok(v);
      const rules = rulesForVariant(id);
      assert.ok(rules);
      assert.ok(rules.size >= 6 && rules.size <= 12);
      assert.ok(['fly-far', 'fly-one', 'hop'].includes(rules.kingMode));
    }
    assert.equal(variantById('banana'), null);
    assert.equal(rulesForVariant('banana'), null);
  });

  test('whitelisted GameRules contract compiles against engine', () => {
    const rules: GameRules = rulesForVariant('sanza')!;
    const board: Board = makeBoard(rules.size);
    assert.equal(board.length, 8);
    assert.equal(board[0]!.length, 8);
  });
});

describe('stats', () => {
  function career(overrides: Partial<Career>): Career {
    return { ...emptyCareer(), ...overrides, matches: overrides.matches ?? [] };
  }

  test('winRate, form, aggregates', () => {
    const baseMatch = (outcome: 'win' | 'loss'): Career['matches'][number] => ({
      id: `${outcome}-${Math.random()}`, at: Date.now(), kind: 'bot', outcome, opponent: 'House AI',
      captureCount: 3, kingCount: 1, moves: 10, xpDelta: 100, stake: 0, cashDelta: 0,
      rules: { size: 8, kingMode: 'fly-far', forcedCapture: true },
    });
    const c = {
      wins: 3,
      losses: 1,
      totalCaptures: 12,
      totalKings: 4,
      xp: 480,
      lifetimePrize: 0,
      lifetimeStake: 0,
      cashIns: 0,
      cashOuts: 0,
      bestStreak: 0,
      currentStreak: 0,
      matches: [baseMatch('loss'), baseMatch('win'), baseMatch('win'), baseMatch('win')],
    };
    assert.equal(winRate(c), 75);
    assert.deepEqual(form(c, 10).slice(0, 4), ['L', 'W', 'W', 'W']);
    assert.equal(capturePerGame(c), 3);
    assert.equal(Math.round(c.xp / 4), xpPerGameSafe(c));
  });

  test('netCash and roi sign correctly', () => {
    const c = career({ lifetimePrize: 1200, lifetimeStake: 1000 });
    assert.equal(netCash(c), 200);
    assert.equal(roi(c), 20);
    assert.equal(roi(emptyCareer()), 0);
  });

  test('missions reflect king wins and chains', () => {
    const c = career({
      matches: [
        { id: 'm1', at: Date.now(), kind: 'bot', outcome: 'win', opponent: 'House AI', captureCount: 3, kingCount: 1, moves: 10, xpDelta: 100, stake: 0, cashDelta: 0, rules: { size: 8, kingMode: 'fly-far', forcedCapture: true } },
      ],
    });
    const ms = missions(c);
    assert.equal(ms.find((m) => m.id === 'king-win')?.done, false);
    assert.equal(ms.find((m) => m.id === 'chain')?.done, true);
  });

  test('bestMatch picks the capture-heavy game', () => {
    const moves = [2, 5, 9].map((captureCount, i) => ({
      id: `m${i}`, at: Date.now(), kind: 'bot' as const, outcome: 'win' as const, opponent: 'House AI',
      captureCount, kingCount: 0, moves: 10, xpDelta: 100, stake: 0, cashDelta: 0,
      rules: { size: 8, kingMode: 'fly-far' as const, forcedCapture: true },
    }));
    const best = bestMatch(career({ matches: moves }));
    assert.equal(best?.captureCount, 9);
    assert.equal(bestMatch(emptyCareer()), null);
  });
});

function xpPerGameSafe(c: Career): number {
  return Math.round(c.xp / (c.wins + c.losses));
}

describe('tactics (engine bridge)', () => {
  function rules(size = 8, forced = true): GameRules {
    return { size, kingMode: 'fly-far', forcedCapture: forced, promotionStop: true };
  }

  test('captureMoves / longestChain on a blank board are empty/zero', () => {
    const board = makeBoard(8);
    assert.equal(captureMoves(board, 'gold', rules()).length, 0);
    assert.equal(longestChain(board, 'gold', rules()), 0);
  });

  test('suggestions on an empty board prefer guard silence', () => {
    const tips = suggestions(makeBoard(8), 'gold', rules());
    assert.ok(tips.some((t) => t.kind === 'guard'));
    assert.equal(tips.length, 1);
  });

  test('kingDistance measured from home row', () => {
    const board = makeBoard(8);
    const mounted = board.map((row) => row.slice()) as Board;
    // put a gold pawn at row 5 -> distance to row 0 = 5
    mounted[5]![4] = { color: 'gold', king: false };
    assert.equal(kingDistance(mounted, 'gold', rules()), 5);
  });

  test('moveFlavor differentiates chains', () => {
    const chain: MoveLike = { from: { row: 1, col: 1 }, path: [], captures: [{ row: 2, col: 2 }, { row: 3, col: 3 }, { row: 4, col: 4 }] };
    const single: MoveLike = { from: { row: 1, col: 1 }, path: [], captures: [{ row: 2, col: 2 }] };
    assert.ok(moveFlavor(chain as never).includes('monster'));
    assert.ok(moveFlavor(single as never).includes('clean'));
  });
});

type MoveLike = { from: { row: number; col: number }; path: { row: number; col: number }[]; captures: { row: number; col: number }[] };

describe('code (duel sessions)', () => {
  test('createDuelSession builds a live seedable session', () => {
    const s = createDuelSession({ estateId: 'kibera', variantId: 'sanza', cash: true, stakeKsh: 100 });
    assert.ok(s);
    assert.match(s.code, /^[A-HJ-NP-Z2-9]{6}$/);
    assert.equal(s.estateId, 'kibera');
    assert.equal(s.variantId, 'sanza');
    assert.ok(isLive(s));
    assert.ok(expiresIn(s) > 0);
    assert.equal(sessionRng(s)(), sessionRng(s)());
  });

  test('joinDuel normalizes and rejects unknown codes', () => {
    const created = createDuelSession({ estateId: 'kilimani' });
    assert.ok(created);
    const joined = joinDuel(` ${created.code.toLowerCase()} `);
    assert.ok(joined);
    assert.equal(joined.code, created.code);
    assert.equal(joined.joined, true);
    assert.equal(joinDuel('AB12ZZ'), null);
  });

  test('toSeed differs for host vs guest', () => {
    const a = toSeed({ code: 'ABCDEF', estateId: 'kib', variantId: 'sanza', joined: false });
    const b = toSeed({ code: 'ABCDEF', estateId: 'kib', variantId: 'sanza', joined: true });
    assert.notEqual(a, b);
  });
});