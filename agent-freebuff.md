# freebuff — PLAN & STEP LOG

> Signed by freebuff (parallel tab). opencode's feed is `agent-opencode.md`;
> live coordination + announcements live in `agent-chat.md` (append-only).

## ROLE (re-confirmed)
UI shell owner: **`App.tsx`, `index.css`, page UI, animations, wallet drawer,
room-code screen, tournament page.** Backend + service layer + tests + engine
hardenings belong to opencode — I read them, I don't rewrite them.

## PASS GOAL
Burn the highest-value **UI-side** gaps from the 100-item audit + deliver the
BrightPay M-Pesa integration end-to-end, while leaving opencode's surgical money
fixes an untouched landing zone.

## PLAN (priority order)
1. **App.tsx split (audit #1, #43).** Extract `Home`, `WalletPage`,
   `TournamentPage` → `src/pages/*`. Extract shared chrome
   (`Shell`, `ModeSwitch`, `InstallAppButton`, `PageTitle`, `useToastMessage`,
   `Toast`, `money`, `secureInt`) → `src/components/shell.tsx`. Keep every
   `data-testid` and prop contract identical. Lazy-load the heavy routes.
2. **BrightPay withdraw, client-side (#6/#11/#12/#13).** WalletPage stops
   decrementing locally on trust; it POSTs `/api/brightpay/withdraw` (the
   HMAC-signed server proxy opencode built) with a **sticky**
   `external_reference` per intent so retries are idempotent, then calls
   `onWithdrawConfirmed` pass-through for opencode's balance/career/alert logic.
   Deposit flow: keep the proxy POLL loop (already solid), add same
   idempotency + a settled-guard against double-credit.
3. **Route-level code-splitting (#43).** `React.lazy` + `Suspense` for
   wallet/tournament/profile/admin. Home stays eager (above the fold).
4. **Perf + a11y (#48/#49/#84).** `prefers-reduced-motion` short-circuit on all
   three canvas FX; tab-hidden pause for the always-running dust loop; CSS
   `prefers-reduced-motion` block for `.reveal` / `.wheel-spin` / `.pulse-dot` /
   `.city-lights`.
5. **Docs (#35/#76/#99).** Root `README.md` (env, BrightPay contract, run) +
   `ROADMAP.md` (the 100 gaps mapped with owner + status).
6. **Verify.** `pnpm --filter @workspace/nairobi-checkers run typecheck`, api-server
   typecheck, `vite build`.

## OWNERSHIP MAP (this pass)
- **Mine (new files):** `src/pages/home-page.tsx`, `src/pages/wallet-page.tsx`,
  `src/pages/tournament-page.tsx`, `src/components/shell.tsx`, `README.md`,
  `ROADMAP.md`.
- **Mine (surgical):** `src/App.tsx` (callsites + withdraw pass-through only),
  `src/components/game/canvas-fx.tsx` (motion guards), `src/index.css` (media
  query block).
- **THEIRS (hands off):** `src/lib/*`, `game-engine.ts`, `*.test.ts`,
  `api-server/src/routes/brightpay.ts`, `handleFinish`/`handleCashDeposit`
  bodies.

## STEP LOG
- [x] Audit opencode's seams: `brightpay.ts` (pay/status/withdraw proxy all
      present, HMAC-SHA256 server-side), `wallet-service.ts` (escrow state
      machine), `money.ts` (integer cents), `roomcodes.ts`, `settings-store`,
      `player-store`, `canvas-fx.tsx`, tsconfig (noUnusedLocals off, isolatedModules
      on). → Build on top of ALL of it.
- [x] Ping sent to opencode (`agent-chat.md`), plan written here, live-feed
      seeded into `agent-opencode.md`.
- [x] **Concurrence detected 10:10Z:** opencode is LIVE in `scripts/package.json`
      + `src/test/` (their slice). Re-pinged in `agent-chat.md` with freeze-zones.
      Mitigation: re-read `App.tsx` immediately before my own write; never touch
      their zones.
- [x] Extract `src/components/shell.tsx`
- [x] Extract `src/pages/home-page.tsx`
- [x] Extract `src/pages/wallet-page.tsx` (+ server withdraw + idempotency:
      sticky external_reference per intent, settledRef double-credit guard,
      withdraw hits `/api/brightpay/withdraw`, debits only on 200)
- [x] Extract `src/pages/tournament-page.tsx`
- [x] Slim `App.tsx` (state stays in AppRouter, lazy wallet/tournament/profile/
      admin, `handleDepositConfirmed` + `handleWithdrawConfirmed` pass-throughs,
      `handleFinish` byte-identical)
- [x] canvas-fx motion/visibility guards + index.css reduced-motion block
      (verified present in-tree: all 3 FX short-circuit on prefers-reduced-motion,
      dust loop pauses on tab-hide; `index.css:235` media block for
      `.reveal/.wheel-spin/.pulse-dot/.city-lights`)
- [x] Re-read `App.tsx` post-slim: opencode's escrow hunks intact (launch lock,
      draw refund, double-lock) — nothing clobbered them.
- [x] esther joined (third chair) + delegated F1/F2/F3; confirmed `src/features/`
      is fully shipped (10 modules) and `missions(career)` contract.
- [x] **F1** — `shell.tsx` navItems += `{ href:'/duel', label:'Duel Lab', icon:Flame }`
      (testid auto `link-nav-duel`; bottom rail keeps first 5)
- [x] **F2** — `home-page.tsx` hard-coded `<Mission>` rows → `missions(career)`
      from `@/features/stats` (`label→title` at callsite; component untouched)
- [x] Typecheck trip: api-server ✅; artifact ⚠️ 3 reds in esther's `code.ts`
      (stale `seedRng(number)` call + `DuelSession` missing `createdAt` +
      O2 `expiresIn/touch` not yet landed) → handed seam over in chat
- [x] **F3** — `README.md` (env table, BrightPay contract, scripts, culture-pack
      section) + `ROADMAP.md` (100-gap map with owner/status, F-001…F-120 SHIPPED)
- [x] **artifact typecheck green** (esther fixed `code.ts`: `DuelSession.createdAt`
      + string-seed `seedRng`) — 0 errors
- [x] **`vite build` green** (PORT=5173 BASE_PATH=/, 1787 modules, lazy chunks
      confirmed: wallet-page/admin-dashboard/profile-analytics/tournament-page split)
- [x] Final report + handoff notes posted to `agent-chat.md`
- [x] **Full-workspace `pnpm run build` green** (exit 0, sync with gathoni's door;
      artifact 1805 modules; esther's `duel-page-*.js` chunk in the bundle — her
      2 additive App.tsx lines landed: `App.tsx:29` lazy import + `:295` route)
- [x] esther's feature suite **42/42 green** via `scripts/` tsx (9 suites:
      estates/slang/bets/achievements/clock/variants/stats/tactics/code) —
      her `code.ts` now exports `joinDuel`/`expiresIn`/`sessionRng`/`toSeed`;
      O2 (`expiresIn`/`touch` on roomcodes) superseded by her own session TTL
- [x] `/duel` smoke-check: nav (`link-nav-duel`) → lazy `DuelPage` → zero-props
      render; full `src/features/ui/*` module set on disk (8 panels)
- [x] Zone drift: none — `App.tsx` escrow hunks intact, my pages/shell untouched
      by the other three; Windows-bin devDeps (gathoni) + esther's features
      reconciled into the green tree
- [ ] Backburner: api-server withdrawal sandbox e2e (#54), admin real auth (#65),
      CI pipeline (#36), ledger export pass-through

## DECISIONS SNAPSHOT
- Withdraw debits balance **only after the server returns 200** — trust no local
  success. The state mutation itself stays in `AppRouter` (opencode-owned block).
- `external_reference` is generated once per withdraw *intent* and reused across
  retries of that intent (idempotency, avoids double-payout on a flaky retry);
  cleared on success / flow switch.
- Deposit polling: keep 3s cadence, 120s cap, but flip a `settledRef` on
  COMPLETED so a re-fire of the effect can never double-credit.
- I will NOT convert the UI to integer-cents this pass (opencode's money-settlement
  work churns that same surface); I note it in ROADMAP.

---

## TASK INBOX FROM ESTHER (read-only for you — appended by esther, 2026-09-15)

Habari freebuff! User says nobody sits idle, so here are 3 tasks squarely in
your zone. Full text + acceptance rules are in `agent-chat.md` (delegation
block). Short version:

- **F1 — Duel Lab nav entry.** Add `{ href: '/duel', label: 'Duel Lab' }` to
  `navItems` in `src/components/shell.tsx` (testid `link-nav-duel`). Decide
  whether it joins the mobile `slice(0, 5)` bottom bar or stays desktop-only.
  My route takes zero props — nothing to wire.
- **F2 — Live missions on Home.** Swap the three hard-coded `<Mission>` rows in
  `src/pages/home-page.tsx` for `missions(career)` from `@/features/stats`
  (read-only import, stable API). Same component, data-driven.
- **F3 — Docs.** In your `README.md`/`ROADMAP.md`, add a "Culture pack
  (esther)" section linking `FEATURES.md`; mark F-001…F-120 SHIPPED.

Also a heads-up: I'm deleting the 2 dead lines at the bottom of
`src/pages/home-page.tsx` (`Tb` referencing undefined `RefreshCw`/`Trophy` —
currently breaking `tsc`). Nothing else in your files. Reply `TAKE: F1` etc.
in chat when you start, `DONE: Fx + file:line` when you land.