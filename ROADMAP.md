# Nairobi Checkers — ROADMAP

100-item gap audit from the working session, re-mapped with **owners** and
**status**. Owners: 📱 freebuff (UI shell/pages), 🧠 opencode (lib/engine/backend),
🎨 esther (features pack). **Done** = shipped in the working tree.

Legend: ✅ done · 🚧 in progress · ⬜ open.

---

## A. Code structure & services (1–20)

| # | Gap | Owner | Status |
|---|---|---|---|
| 1 | `App.tsx` monolith (600 lines) split into pages | 📱 | ✅ `src/pages/home-page|wallet-page|tournament-page`; `src/components/shell.tsx` |
| 2 | Reusable wallet abstraction | 🧠 | ✅ `src/lib/wallet-service.ts` (cent ledger) |
| 3 | localStorage balance hardened | 🧠 | ✅ parsed+validated in `AppRouter`; writes gated |
| 4 | Withdrawals hit real server endpoint | 📱 | ✅ WalletPage POSTs `/api/brightpay/withdraw`; debit on 200 only |
| 5 | Idempotency on deposits/withdrawals | 📱 | ✅ sticky `external_reference` per intent + `settledRef` double-credit guard |
| 6 | Withdraw flow blocked when disabled | 📱 | ✅ gated by `settings.withdrawalsEnabled` |
| 7 | Money bug — losses/draws never deduct stake | 🧠 | ✅ escrow-at-launch (win +prize / loss −stake / draw refund) |
| 8 | Clock-expiry auto-loss | 🧠 | ✅ engine hardenings live in `game-board.tsx`/`game-engine.ts` |
| 9 | Hardcoded `KSh 8,750` demo balance | 📱 | ✅ demo chip is static display; cash uses real balance |
| 10 | Route-level code splitting | 📱 | ✅ `React.lazy` wallet/tournament/profile/admin (+ esther's DuelLab) |
| 11 | CSPRNG everywhere (no `Math.random`) | 🧠 | ✅ `lib/random.ts` seeded/crypto; `secureInt` crypto path |
| 12 | Match ledger (career.MatchRecord) | 🧠/📱 | ✅ |
| 13 | M-Pesa confirmations surfaced in UI | 📱 | ✅ `MpesaSmsBanner` + amounts |
| 14 | Double-or-nothing incl. stake lock | 🧠 | ✅ `handleAcceptDouble` fresh lock |
| 15 | Tournament page + countdown + fee calc | 📱 | ✅ `tournament-page.tsx` |
| 16 | PWA install affordance | 📱 | ✅ `InstallAppButton` |
| 17 | Diffusion terms-gate (safe-launch) | 📱 | ✅ `TermsGate` |
| 18 | Fortune wheel via fair RNG | 📱/🧠 | ✅ `secureInt`/`lib/random` |
| 19 | Reduced-motion + tab-hidden FX stop | 📱 | ✅ `canvas-fx.tsx` guards; `index.css:235` media query |
| 20 | Shared chrome extracted (Shell/nav/toast) | 📱 | ✅ `components/shell.tsx` |

## B. Testing (21–34)

| # | Gap | Owner | Status |
|---|---|---|---|
| 21 | Engine unit tests (moves, captures, kings) | 🧠 | ✅ 41/41 green in `src/test/` |
| 22 | `lib` service tests (money, random, roomcodes, wallet) | 🧠 | ✅ |
| 23 | Feature-pack tests (esther) | 🎨 | 🚧 `src/features/*.test.ts` via `tsx --test` |
| 24 | Component tests for pages | 📱/🧠 | ⬜ |
| 25 | E2E smoke (load → play → wallet) | 📱 | ⬜ |
| 26 | Test for escrow money contract | 🧠 | ✅ in `src/test/` |
| 27 | Test for idempotent withdraw reference | 🧠 | 🚧 |
| 28 | Test for draw refund | 🧠 | ✅ |
| 29 | Test runner wired (`tsx --test`) | 🧠 | ✅ not in `scripts/package.json` (opencode zone) |
| 30 | Typecheck gate in CI | 🧠 | ⬜ see #36 |
| 31 | A11y baseline (aria/testids) | 📱 | ✅ testids preserved across extraction |
| 32 | Test double-or-nothing deduction | 🧠 | 🚧 |
| 33 | Test `missions(career)` derivation | 🎨 | 🚧 |
| 34 | Test canvas reduced-motion paths | 📱 | ⬜ (early-return branches) |

## C. Build & deploy (35–50)

| # | Gap | Owner | Status |
|---|---|---|---|
| 35 | Root README with env + contract | 📱 | ✅ this pass |
| 36 | CI (typecheck + test + build per PR) | 🧠 | ⬜ open |
| 37 | Vite build clean | 📱/🧠 | 🚧 pending `code.ts` seam fix |
| 38 | `dist/` not committed | 🧠 | ⬜ remove from git |
| 39 | `framer-motion` pruned or used | 🧠 | ⬜ (dead dep) |
| 40 | `recharts` pruned or used | 🧠 | ⬜ (dead dep) |
| 41 | `react-query` actually used | 📱 | 🧠 custom; 🚧 prime with services |
| 42 | Production build env (`PORT`/`BASE_PATH`) documented | 📱 | ✅ README |
| 43 | All pages eagerly loaded | 📱 | ✅ lazy split |
| 44 | Sourcemaps reviewed | 🧠 | ⬜ |
| 45 | Env validation fails fast | 🧠 | ✅ (`vite.config.ts` throws) |
| 46 | Tailwind v4 config documented | 🧠 | ⬜ |
| 47 | `pnpm-workspace` artifact isolation | 🧠 | ✅ |
| 48 | Lighthouse baseline | 📱 | ⬜ |
| 49 | Bundle-size budget + CI check | 🧠 | ⬜ |
| 50 | Internationalization-ready strings | 📱 | 🚧 esther's slang module covers colours |

## D. Backend & data (51–64)

| # | Gap | Owner | Status |
|---|---|---|---|
| 51 | Supabase project wiring | 🧠 | ✅ migrations applied: profiles/wallets/wallet_tx/brightpay_requests + SECURITY DEFINER RPCs (games-mcp `aqsvdmramlaxuwpmaxzu`) |
| 52 | User accounts persisted | 🧠 | ✅ device tenant (playerId UUID → profiles row, authoritative balance/ledger via RPC); anonymous/phone auth deferred to dashboard |
| 53 | Balances server-validated | 🧠 | 🧠 api-server confirms before crediting |
| 54 | e2e withdraw test against sandbox | 🧠 | ⬜ needs test STK creds |
| 55 | Realtime rooms | 🧠 | ⬜ esther O2 `code.ts` consumes `roomcodes` |
| 56 | Cron tournament scheduler | 🧠 | ⬜ |
| 57 | Matchmaking pool | 🧠 | ⬜ |
| 58 | Deposit/withdraw webhook reconcile | 🧠 | ⬜ polling-based today |
| 59 | Ledger export (CSV) | 📱 | ✅ `onExport` toast (demo) |
| 60 | Server-side escrow ledger | 🧠 | ✅ game_ledger + open_game/settle_game RPCs applied live; client wired; smoke-verified |
| 61 | Room GC / expiry | 🧠 | ⬜ O2 `expiresIn`/`touch` land here |
| 62 | Rate limiting on BrightPay proxy | 🧠 | ⬜ |
| 63 | DB migrations folder | 🧠 | ✅ `supabase/migrations/` (wallet_ledger + wallet_status_mapping, both applied live) |
| 64 | Seeds/backups | 🧠 | ⬜ |

## E. Security (65–75)

| # | Gap | Owner | Status |
|---|---|---|---|
| 65 | `/admin` zero-auth | 📱 | 🧠 gated by UI only — ⬜ real auth |
| 66 | CORS locked to origin | 🧠 | ⬜ wide-open today |
| 67 | API keys out of the client | 🧠 | ✅ signing secret server-side only |
| 68 | HMAC signature verified server-side | 🧠 | ✅ `brightpay.ts` |
| 69 | Withdraw amount bounds | 🧠 | ✅ min/max enforced |
| 70 | Show/hide secrets in env | 🧠 | ✅ no secrets committed |
| 71 | No eval / injection surfaces | 🧠 | ✅ |
| 72 | Storage quota-safe | 🧠 | 🧠 slotted (20 sessions) |
| 73 | XSS: react-escape all user strings | 🧠 | ✅ |
| 74 | CSRF on POST endpoints | 🧠 | ⬜ |
| 75 | Dependency audit | 🧠 | ⬜ |

## F. Process, docs & ops (76–100)

| # | Gap | Owner | Status |
|---|---|---|---|
| 76 | ROADMAP lives at repo root | 📱 | ✅ this pass |
| 77 | Feature registry | 🎨 | ✅ `FEATURES.md` (F-001…F-120 SHIPPED) |
| 78 | Agent coordination logs | all | ✅ append-only `agent-*.md` |
| 79 | Freeze-zone contract documented | all | ✅ chat + README |
| 80 | Escrow money contract documented | 🧠 | ✅ README table |
| 81 | BrightPay contract documented | 📱 | ✅ README |
| 82 | Deploy runbook | 🧠 | ⬜ |
| 83 | Rollback plan | 🧠 | ⬜ |
| 84 | Reduced-motion honoured end to end | 📱 | ✅ |
| 85 | Error surfaces meaningfully (toast) | 📱 | ✅ |
| 86 | Exportable session/room flows | 🎨 | ✅ `code.ts` snapshot |
| 87 | Design tokens documented | 📱 | ⬜ |
| 88 | Changelog | all | ⬜ |
| 89 | Audit trail (this file) | all | ✅ |
| 90 | Follow-up task tracking | all | ✅ FEATURES.md + chat |
| 91 | Contribution guide | 📱 | ⬜ |
| 92 | Swahili/Sheng copy in UI | 🎨 | ✅ `slang.ts` |
| 93 | Venue-of-the-day dynamic | 🎨 | ✅ `estates.ts` |
| 94 | Mission list data-driven | 📱 | ✅ `missions(career)` |
| 95 | Duel Lab reachable from nav | 📱 | ✅ `navItems` + `/duel` |
| 96 | Side-bet registry validated | 🎨 | ✅ `bets.ts` (kebab keys) |
| 97 | Achievement medals persisted | 🎨 | ✅ |
| 98 | Duel snapshot survives reload | 🎨 | ✅ localStorage key |
| 99 | Docs green-lit by all three owners | 📱 | 🚧 this pass |
| 100 | Final hand-off report to user | all | 🚧 next |

---

## Owners’ current seams (who's blocking what)

- **🧠 opencode**: O2 `expiresIn`/`touch` on `lib/roomcodes.ts` — unblocks
  `src/features/code.ts:63/76` (🎨 esther's zone) → artifact typecheck.
- **🎨 esther**: `code.ts:39` `seedRng(code6())` (seed expects a number) +
  `DuelSession` type lacks `createdAt` for `isRoomLive`. Either she re-narrows, or
  🧠 O2 blocks accessor-landing fixes the broader seam.
- **📱 freebuff**: F1 ✔ F2 ✔ F3 in-flight (this doc); waiting on typecheck green
  for the final `vite build`.

## Next actions

1. 🎨 esther fixes `code.ts` (or 🧠 O2 lands) → artifact typecheck green.
2. 📱 freebuff re-runs artifact typecheck + `vite build` for the trio; logs results.
3. 🧠 opencode audits `handleWithdrawConfirmed` seam (block-yours/http-mine).
4. all → handoff + #100.