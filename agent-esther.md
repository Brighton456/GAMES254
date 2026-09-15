# esther — PLAN & STEP LOG

> Signed by esther (Agent three). Freebuff's feed is `agent-freebuff.md`,
> opencode's is `agent-opencode.md`; live coordination + announcements live in
> `agent-chat.md` (append-only).

## ROLE (re-confirmed)
Third chair on the table. I ship the **Kenyan culture + gameplay content pack**
and a **500-feature registry**, strictly inside my own namespace:
`artifacts/nairobi-checkers/src/features/**` and root `FEATURES.md`.
I consume opencode's libs/engine and freebuff's shell **read-only** — I never
edit their freeze-zones.

## FREEZE-ZONES (from the audit — I stay out of ALL of these)
- opencode: `src/lib/*`, `src/components/game/game-engine.ts`, `src/test/*`,
  `scripts/package.json`, `api-server/**/brightpay.ts`,
  `handleFinish`/`handleCashDeposit` bodies.
- freebuff: `src/pages/*`, `src/components/shell.tsx`, `canvas-fx.tsx`,
  `src/index.css`, `README.md`, `ROADMAP.md`.
- Shared-negotiation `src/App.tsx`: my ONLY touches are 2 additive lines
  (lazy DuelPage import + one `<Route path="/duel">`), announced in chat first.

## PLAN (priority order)
1. **Announce + validate conflicts** in `agent-chat.md` (DONE).
2. **`src/features/estates.ts`** — 12 Nairobi estate venues + venue-of-the-day
   + handshake + board tint.
3. **`src/features/slang.ts`** — seeded Sheng/Swahili pools (taunts, praise,
   win/loss/draw, matatu slogans) + Swahili counting.
4. **`src/features/bets.ts`** — integer-cents side bets (sweep, exact-moves,
   kingmaker, big-chain, no-double, comeback) — odds + deterministic resolve.
5. **`src/features/achievements.ts`** — medal catalog evaluated on Career +
   session stats, persisted.
6. **`src/features/clock.ts`** — Sanza move clock (initial + increment + expiry).
7. **`src/features/variants.ts`** — Kenyan house-rule presets → opencode's
   `GameRules` contract.
8. **`src/features/stats.ts`** — derived analytics (win rate, form, net cash,
   ROI, missions).
9. **`src/features/tactics.ts`** — engine-driven move tips (forced captures,
   chains, threats, king push).
10. **`src/features/code.ts`** — local duel sessions (rooms, seeds, snapshot).
11. **`src/features/ui/*`** — duel-page + room/bets/estate/taunt/clock/medals/
    tips panels (my own route surface).
12. **App.tsx additive route** + **home-page dead-line fix** (announced).
13. **Tests** — `src/features/*.test.ts`, run via `tsx --test` (NOT scripts pkg,
    that's opencode's).
14. **`FEATURES.md`** — the 500-item registry.
15. **Verify** — artifact typecheck + `vite build` + tests green. Report.

## DECISIONS SNAPSHOT
- Everything money-adjacent is integer **cents**; I reuse `lib/money` helpers
  where useful rather than inventing a parallel maths.
- All randomness flows through `lib/random` (seeded/crypto) — no `Math.random`.
- The `/duel` route does NOT touch `cashBalance` or career state; it's a
  pass-and-play "Duel Lab". Money/ledger wiring stays with freebuff+opencode.
- My UI mirrors the `glass-panel` / `.btn-quiet` / `.font-display` design
  tokens from `index.css` — no CSS file of mine, no edits to theirs.
- **Verdict on gathoni's two surgical edits (2026-09-15): KEEP.** `bets.ts`
  target-based odds keys and `code.ts` `createdAt` + host/guest-seed fields
  compile, keep my 42/42 suite green, and match the `roomcodes`/`GameRules`
  contracts. No rollback; pencil picked up, signature recorded.
- `code.ts` satisfies opencode's O2 in-zone (`joinDuel`/`expiresIn`/`sessionRng`/
  `toSeed`) → O2 is optional-on-their-side, no shared helper needed.

## STEP LOG
- [x] Greeted + conflict-validated in `agent-chat.md`
- [x] `estates.ts` — 12 Nairobi estates + venues + venue-of-day + handshake + tints
- [x] `slang.ts` — seeded Sheng/Swahili pools + Swahili counting
- [x] `bets.ts` — 6 integer-cent side wagers, odds (incl. target keys), resolve
- [x] `achievements.ts` — 18 medals, progress + persistence
- [x] `clock.ts` — Sanza move clock (initial + increment + expiry)
- [x] `variants.ts` — 6 Kenyan house-rule presets → `GameRules`
- [x] `stats.ts` — win rate, form, net cash, ROI, missions
- [x] `tactics.ts` — engine-driven move tips (chains, threats, king push)
- [x] `code.ts` — duel sessions (rooms, seeds, snapshot, join)
- [x] `features/ui/*` panels — duel-page + room/bets/estate/taunt/clock/medals/coach
- [x] App.tsx additive route + home-page dead-line fix (announced first)
- [x] Tests green — `features/*.test.ts` 42/42 (via `tsx --test`)
- [x] `FEATURES.md` registry — 500 items, 223 SHIPPED
- [x] typecheck + `vite build` green (duel-page = own 37.18 kB chunk)
- [x] Final report to user

## FINAL REPORT (for the room)
- **Shipped:** culture+gameplay pack in `src/features/**` (10 modules + 8 UI
  panels), `/duel` "Mtaa Duel Lab" route (2 additive App.tsx lines), 42/42
  feature tests, root `FEATURES.md` (500 items / 223 SHIPPED).
- **Kept:** gathoni's `bets.ts` odds-key + `code.ts` `createdAt`/host-seed edits.
- **Cross-verified:** artifact typecheck 0 errors; `vite build` green; opencode
  41/41 + esther 42/42 = 83 green; `/duel` chunk 37.18 kB (12.74 kB gzip).