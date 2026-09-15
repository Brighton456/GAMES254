# Nairobi Checkers — 500-Feature Registry (`FEATURES.md`)

> Owned by **Agent esther** · registry updated live · every item has one owner
> and one status. `SHIPPED` = in code today. `ROADMAP` = tracked, unbuilt.
> Owners: `esther` (culture/gameplay pack), `freebuff` (UI shell/pages),
> `opencode` (engine/services/backend), `team` (needs >1 chair).
>
> Feature IDs are stable. Clone this file into `ROADMAP.md` (freebuff) to build
> from it — never edit it in place; ping esther for re-numbering.

**Legend — status:** `SHIPPED` · `READY` (module exists, wiring pending) · `ROADMAP`
**Legend — owner:** `esther` · `freebuff` · `opencode` · `team`

---

## Track V — Gameplay & Variants (60)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| V-0001 | Kenyan house-rule preset: `kawaida` (classic 8×8) | SHIPPED | esther |
| V-0002 | Kenyan house-rule preset: `sanza` (flying kings, speed clock) | SHIPPED | esther |
| V-0003 | Kenyan house-rule preset: `matatu` (10×10 flying kings) | SHIPPED | esther |
| V-0004 | Kenyan house-rule preset: `kibao` (6×6 blitz) | SHIPPED | esther |
| V-0005 | Kenyan house-rule preset: `goliath` (12×12 flying kings) | SHIPPED | esther |
| V-0006 | Kenyan house-rule preset: `kaskazini` (no promotion stop) | SHIPPED | esther |
| V-0007 | Variant preset catalog = exact `GameRules` contract + suggested clock | SHIPPED | esther |
| V-0008 | Variant-driven clock defaults (Sanza 60s+8s etc.) | SHIPPED | esther |
| V-0009 | Forced-capture rule engine-wide | SHIPPED | opencode |
| V-0010 | Multi-jump capture chains (any length) | SHIPPED | opencode |
| V-0011 | Promotion-stop rule for jump chains | SHIPPED | opencode |
| V-0012 | Flying-king vs classic-king vs sky-hop king modes | SHIPPED | opencode |
| V-0013 | Board sizes 6 / 8 / 10 / 12 | SHIPPED | opencode |
| V-0014 | 50-move no-capture draw rule | SHIPPED | opencode |
| V-0015 | Triple-repetition draw detection | SHIPPED | opencode |
| V-0016 | Win by no-moves / no-pieces outcome reporting | SHIPPED | opencode |
| V-0017 | Replay serialization (start board + step log) | SHIPPED | opencode |
| V-0018 | Replay theater playback UI | SHIPPED | freebuff |
| V-0019 | Move-suggestion "Coach read" panel (engine-driven tips) | SHIPPED | esther |
| V-0020 | Forced-capture warning tip | SHIPPED | esther |
| V-0021 | Longest-chain tip ("mnyororo mkubwa") | SHIPPED | esther |
| V-0022 | Threat-count tip (pieces hanging) | SHIPPED | esther |
| V-0023 | King-push proximity tip | SHIPPED | esther |
| V-0024 | Quiet-board guard/center tip | SHIPPED | esther |
| V-0025 | Material-swing metric per move | SHIPPED | esther |
| V-0026 | Pass-and-play (same device) support | ROADMAP | team |
| V-0027 | Hot-seat pass with hidden-screen privacy | ROADMAP | freebuff |
| V-0028 | Fog-of-war variant (hidden enemy pieces) | ROADMAP | team |
| V-0029 | Timer-extra variant ("Sanza Express") | ROADMAP | team |
| V-0030 | Random-terrain variant (blocked cells) | ROADMAP | team |
| V-0031 | Reverse-start variant (forest moves first) | ROADMAP | team |
| V-0032 | "No-fly" house rule (kings walk only) | ROADMAP | team |
| V-0033 | Take-all-win variant (capture everything, not corners) | ROADMAP | team |
| V-0034 | Sudden-death variant (first capture wins) | ROADMAP | team |
| V-0035 | Custom rule builder UI (size/king/jump/promotion) | ROADMAP | freebuff |
| V-0036 | Undo-one-move (per game, configurable) | ROADMAP | team |
| V-0037 | Show previous move highlight on board | ROADMAP | freebuff |
| V-0038 | Legal-move ghost hints (on select) | ROADMAP | freebuff |
| V-0039 | Capture-preview animation (slow-motion chain) | ROADMAP | freebuff |
| V-0040 | Move counter + last-capture-at display | ROADMAP | freebuff |
| V-0041 | Board tint skins per neighbourhood | SHIPPED | esther |
| V-0042 | Handshake line shown on match start | SHIPPED | esther |
| V-0043 | Venue-of-the-day display per estate | SHIPPED | esther |
| V-0044 | Move-flavor toasts ("a double helping — street justice") | SHIPPED | esther |
| V-0045 | Board orientation flip for gold/forest | ROADMAP | freebuff |
| V-0046 | 2nd-board spectating view | ROADMAP | team |
| V-0047 | Opening-book line suggestions | ROADMAP | opencode |
| V-0048 | Endgame table-base hints (kings-only) | ROADMAP | opencode |
| V-0049 | Blunder detector (eval swing alert) | ROADMAP | opencode |
| V-0050 | "Trade is even" analyzer after each ply | ROADMAP | opencode |
| V-0051 | Position replay from FEN-like string | ROADMAP | opencode |
| V-0052 | Copy position to clipboard (share) | ROADMAP | freebuff |
| V-0053 | Puzzle mode (solve a capture chain) | ROADMAP | esther |
| V-0054 | Daily "castle" position puzzle | ROADMAP | esther |
| V-0055 | Puzzle streak + rating | ROADMAP | esther |
| V-0056 | Solver "find win" mode | ROADMAP | opencode |
| V-0057 | Two-king vs one-king endgame drills | ROADMAP | opencode |
| V-0058 | Handicap mode (bot start with fewer pieces) | ROADMAP | team |
| V-0059 | Color-pick (play forest side) | ROADMAP | freebuff |
| V-0060 | Rule-context help modal per variant | ROADMAP | freebuff |

## Track AI — Bot & Difficulty (40)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| AI-0001 | Easy bot (capture-preferring wanderer) | SHIPPED | opencode |
| AI-0002 | Medium bot (depth-2 evaluation w/ softened randomness) | SHIPPED | opencode |
| AI-0003 | Hard bot (depth-4 alpha-beta) | SHIPPED | opencode |
| AI-0004 | Seeded bot RNG (seedable stream, no Math.random) | SHIPPED | opencode |
| AI-0005 | Crypto-backed RNG for fairness | SHIPPED | opencode |
| AI-0006 | Move ordering by captures (pruning speed) | SHIPPED | opencode |
| AI-0007 | King-value + advancement eval features | SHIPPED | opencode |
| AI-0008 | Bot difficulty switch in settings | SHIPPED | freebuff |
| AI-0009 | Bot taunt pool ("Wacha upuzi, shemeji!") | SHIPPED | esther |
| AI-0010 | Bot praise pool | SHIPPED | esther |
| AI-0011 | Endgame bot (faster eval, deeper quiescence) | ROADMAP | opencode |
| AI-0012 | Quiescence search (capture-run post-eval) | ROADMAP | opencode |
| AI-0013 | Transposition table (repetition/memo) | ROADMAP | opencode |
| AI-0014 | Difficulty "adaptive" (matches your win rate) | ROADMAP | opencode |
| AI-0015 | Bot personality switch (Aggro / Trapper / Turtle) | ROADMAP | opencode |
| AI-0016 | Bot web-worker thread (no UI jank) | ROADMAP | opencode |
| AI-0017 | Bot think-time meter | ROADMAP | freebuff |
| AI-0018 | Bot blunder chance knob (human feel) | ROADMAP | opencode |
| AI-0019 | "House legend" boss bot (10×10) | ROADMAP | opencode |
| AI-0020 | Bot difficulty per-estate bias (Kibera = meaner) | ROADMAP | esther |
| AI-0021 | Opening library (common Kenyan trap lines) | ROADMAP | opencode |
| AI-0022 | Beat-Hard-bot achievement trigger | SHIPPED | esther |
| AI-0023 | Bot concede on hopeless endgame | ROADMAP | opencode |
| AI-0024 | Draw-offer acceptance logic | ROADMAP | opencode |
| AI-0025 | Doubling-cube acceptance by bot | ROADMAP | team |
| AI-0026 | Bot skill report card (how it cheated you) | ROADMAP | opencode |
| AI-0027 | Eval bar UI (live score line) | ROADMAP | freebuff |
| AI-0028 | Best-line forwarding (ply-by-ply arrows) | ROADMAP | opencode |
| AI-0029 | Per-variant neural eval fallback | ROADMAP | opencode |
| AI-0030 | Cloud difficulty (server-side thinking) | ROADMAP | opencode |
| AI-0031 | Anti-cheat move-log validation | ROADMAP | opencode |
| AI-0032 | Benchmark suite: bot vs bot report | ROADMAP | opencode |
| AI-0033 | Deterministic self-play smoke tests | ROADMAP | opencode |
| AI-0034 | Bot move history persistence | ROADMAP | opencode |
| AI-0035 | Bot "hint" that shows its chosen next move | ROADMAP | esther |
| AI-0036 | Lesson mode: bot narrates why a move was bad | ROADMAP | opencode |
| AI-0037 | Trap-teacher: shows one Kenyan classic trap | ROADMAP | esther |
| AI-0038 | Bot taunt volume tied to difficulty | ROADMAP | esther |
| AI-0039 | No-op bot moves pruned (forced stalemate) | ROADMAP | opencode |
| AI-0040 | Bot identity panel ("House AI — Kasarani branch") | ROADMAP | esther |

## Track M — Money, Wallet & BrightPay (60)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| M-0001 | Integer-cent money math (no float drift) | SHIPPED | opencode |
| M-0002 | `settle` pool/fee/prize contract | SHIPPED | opencode |
| M-0003 | KSh formatting (`fmtKsh`) | SHIPPED | opencode |
| M-0004 | Wallet ledger (typed transactions) | SHIPPED | opencode |
| M-0005 | Escrow stake-in / stake-out state machine | SHIPPED | opencode |
| M-0006 | Draw refund from escrow | SHIPPED | opencode |
| M-0007 | Loss burns stake to treasury | SHIPPED | opencode |
| M-0008 | BrightPay STK-push deposit proxy (`/pay`) | SHIPPED | opencode |
| M-0009 | BrightPay status polling (`/status`) | SHIPPED | opencode |
| M-0010 | BrightPay withdrawal proxy (`/withdraw`, HMAC-signed) | SHIPPED | opencode |
| M-0011 | Withdraws debit only after server 200 | SHIPPED | freebuff |
| M-0012 | Idempotency ref per deposit intent | SHIPPED | freebuff |
| M-0013 | Idempotency ref per withdraw intent | SHIPPED | freebuff |
| M-0014 | Deposit settled-guard against double-credit | SHIPPED | freebuff |
| M-0015 | Escrow-at-launch money fix (stake locked at launch) | SHIPPED | opencode |
| M-0016 | Win pays prize only (no free money) | SHIPPED | opencode |
| M-0017 | Loss/draw deduct stake consistently | SHIPPED | opencode |
| M-0018 | Double-or-nothing stakes deducted before relaunch | SHIPPED | opencode |
| M-0019 | Kenyan phone normalization (07x/01x/+254) | SHIPPED | opencode |
| M-0020 | Amount validation bounds (10..150,000 KSh) | SHIPPED | opencode |
| M-0021 | Fee presets 2.5% / 5% / 7.5% | SHIPPED | freebuff |
| M-0022 | Fee-split (winners/treasury) settings | SHIPPED | freebuff |
| M-0023 | Side-bet engine (integer cents) | SHIPPED | esther |
| M-0024 | Sweep wager (win the table) | SHIPPED | esther |
| M-0025 | "Tano kabisa" exact-moves wager | SHIPPED | esther |
| M-0026 | Kingmaker wager (first king) | SHIPPED | esther |
| M-0027 | Big-chain wager (n-jump chain) | SHIPPED | esther |
| M-0028 | Usidouble wager (win, never double) | SHIPPED | esther |
| M-0029 | Comeback wager (win from behind) | SHIPPED | esther |
| M-0030 | Odds table per wager (incl. target-based odds) | SHIPPED | esther |
| M-0031 | Deterministic side-bet resolution | SHIPPED | esther |
| M-0032 | Bet cap (5,000 KSh) + input validation | SHIPPED | esther |
| M-0033 | Wire side-bet ledger into wallet seam | ROADMAP | opencode |
| M-0034 | Total-wallet view (available + escrow) | ROADMAP | freebuff |
| M-0035 | Ledger export CSV | ROADMAP | freebuff |
| M-0036 | Deposit receipts stored with M-Pesa code | ROADMAP | opencode |
| M-0037 | Withdrawal history with statuses | ROADMAP | opencode |
| M-0038 | Owner console: pause withdrawals toggle | SHIPPED | freebuff |
| M-0039 | Owner console: maintenance mode | SHIPPED | freebuff |
| M-0039 | Owner console: house-fee override | SHIPPED | freebuff |
| M-0040 | Mini-statement on wallet home | ROADMAP | freebuff |
| M-0041 | Stake presets ($50/$100/$500 plasma chips) | SHIPPED | freebuff |
| M-0042 | Cash-mode gate (account required) | SHIPPED | freebuff |
| M-0043 | Windows-only payout legitimacy note | ROADMAP | team |
| M-0044 | Treasury balance ledger (house) | ROADMAP | opencode |
| M-0045 | Per-round financial reconciliation | ROADMAP | opencode |
| M-0046 | Deposit confirmation SMS copy (M-Pesa styled) | SHIPPED | freebuff |
| M-0047 | Refund notice SMS copy | ROADMAP | freebuff |
| M-0048 | Cash-game onboarding ("how cash play works") | ROADMAP | freebuff |
| M-0049 | Amount autosuggest (top-ups) | ROADMAP | freebuff |
| M-0050 | Quick-withdraw (reverse last deposit) | ROADMAP | freebuff |
| M-0051 | Float rounding guards in all call paths | SHIPPED | opencode |
| M-0052 | Net-cash + ROI career stats | SHIPPED | esther |
| M-0053 | Lifetime stake/prize tracking | SHIPPED | freebuff |
| M-0054 | Cash-ins / cash-outs career counters | SHIPPED | freebuff |
| M-0055 | Escrow refund on double-or-nothing decline | ROADMAP | opencode |
| M-0056 | Bank-vs-lounge fee transparency banner | ROADMAP | freebuff |
| M-0057 | BrightPay key rotation support | ROADMAP | opencode |
| M-0058 | Webhook (not polling) status updates | ROADMAP | opencode |
| M-0059 | Settlement idempotency ledger in Postgres | ROADMAP | opencode |

## Track R — Rooms & Multiplayer (40)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| R-0001 | Deterministic 6-char room code | SHIPPED | opencode |
| R-0002 | Collision-checked code generation | SHIPPED | opencode |
| R-0003 | Human-friendly alphabet (no I/O/0/1) | SHIPPED | opencode |
| R-0004 | Room liveness window (30 min) | SHIPPED | opencode |
| R-0005 | `expiresIn` + `touch` room helpers | SHIPPED | opencode |
| R-0006 | Local duel session (pass-and-play) | SHIPPED | esther |
| R-0007 | Join-by-code normalization | SHIPPED | esther |
| R-0008 | Session seed = replayable banter/odds | SHIPPED | esther |
| R-0009 | Host-vs-guest seed distinction | SHIPPED | esther |
| R-0010 | Session snapshot (estate+variant+bets+clock) | SHIPPED | esther |
| R-0011 | Duel Lab room panel UI | SHIPPED | esther |
| R-0012 | Copy-code to clipboard | SHIPPED | esther |
| R-0013 | Rooms over Supabase Realtime | ROADMAP | opencode |
| R-0014 | Public rooms lobby | ROADMAP | freebuff |
| R-0015 | Private room (password) | ROADMAP | opencode |
| R-0016 | Invite via WhatsApp share text | ROADMAP | freebuff |
| R-0017 | Room chat (Sheng shorthand) | ROADMAP | team |
| R-0018 | Rematch from a room | ROADMAP | team |
| R-0019 | Spectator join (watch-only) | ROADMAP | team |
| R-0020 | Disconnect-resume in room | ROADMAP | opencode |
| R-0021 | Room clock sync | ROADMAP | opencode |
| R-0022 | Joining enforces stake parity | ROADMAP | opencode |
| R-0023 | Random-matchmaking (find a rival) | ROADMAP | opencode |
| R-0024 | Matchmaking by estate | ROADMAP | esther |
| R-0025 | Skill-based matchmaking window | ROADMAP | opencode |
| R-0026 | Room footer: "mtaa radio" presence | SHIPPED | esther |
| R-0027 | Seat selection (gold/forest) | ROADMAP | freebuff |
| R-0028 | Raid invite (challenge a streak) | ROADMAP | esther |
| R-0029 | Ghost-replay of an opponent move | ROADMAP | opencode |
| R-0030 | Silent-banter option | ROADMAP | freebuff |
| R-0031 | Room QR code | ROADMAP | freebuff |
| R-0032 | Room code dictation (voice join) | ROADMAP | freebuff |
| R-0033 | Recent room memory | ROADMAP | freebuff |
| R-0034 | Room expiry countdown chip | SHIPPED | esther |
| R-0035 | "Pass the phone" prompt animation | ROADMAP | freebuff |
| R-0036 | Guest handshake at join | SHIPPED | esther |
| R-0037 | Anti-duplicate join guard | SHIPPED | esther |
| R-0038 | Room log (audit of joins/moves) | ROADMAP | opencode |
| R-0039 | Bot fill-in when rival disconnects | ROADMAP | opencode |
| R-0040 | Cross-device rematch persistence | ROADMAP | opencode |

## Track T — Tournaments, Ladders & Quests (50)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| T-0001 | Async tournament config (window, fee, pool) | SHIPPED | opencode |
| T-0002 | Submission window guard + duplicates rejected | SHIPPED | opencode |
| T-0003 | Score/moves/time tiebreaks | SHIPPED | opencode |
| T-0004 | Live re-rank on each landing result | SHIPPED | opencode |
| T-0005 | Qualification cutoffs | SHIPPED | opencode |
| T-0006 | Bracket builder + final labeling | SHIPPED | opencode |
| T-0007 | Prize-tier splitter (whole cents) | SHIPPED | opencode |
| T-0008 | Anti-cheat move-log on entries | SHIPPED | opencode |
| T-0009 | Tournament page UI | SHIPPED | freebuff |
| T-0010 | Tournament route lazy-loaded | SHIPPED | freebuff |
| T-0011 | Tonight's missions (data-driven) | SHIPPED | esther |
| T-0012 | King-win mission | SHIPPED | esther |
| T-0013 | Capture-chain mission | SHIPPED | esther |
| T-0014 | Beat-Hard mission | SHIPPED | esther |
| T-0015 | Daily ladder ("Wellington Ladder" flavor) | ROADMAP | esther |
| T-0016 | Weekly knockout pool (real bracket) | ROADMAP | opencode |
| T-0017 | Estates Cup (play in N estates) | ROADMAP | esther |
| T-0018 | Streak leagues (Monday = streaks) | ROADMAP | esther |
| T-0019 | Tournament entry via M-Pesa | ROADMAP | opencode |
| T-0010 | Winner payout via BrightPay | ROADMAP | opencode |
| T-0020 | Tournament leaderboard UI | ROADMAP | freebuff |
| T-0021 | My standing card | ROADMAP | freebuff |
| T-0022 | Tournament reminders | ROADMAP | freebuff |
| T-0023 | Qualifier replay review | ROADMAP | freebuff |
| T-0024 | Bracket bracket-tree animation | ROADMAP | freebuff |
| T-0025 | Prize pool countdown | ROADMAP | freebuff |
| T-0026 | Entry-count meter | ROADMAP | freebuff |
| T-0027 | Personal best in tournament window | ROADMAP | opencode |
| T-0028 | Sandbagging detection (rating gap) | ROADMAP | opencode |
| T-0029 | Leaderboard tiebreak explanation tooltip | ROADMAP | freebuff |
| T-0030 | Quest calendar (weekly rotations) | ROADMAP | esther |
| T-0031 | Quest rewards auto-grant | ROADMAP | esther |
| T-0032 | XP/medal quest integration | ROADMAP | esther |
| T-0033 | Okoa mission (catch-up quest) | ROADMAP | esther |
| T-0034 | Estate loyalty quest | ROADMAP | esther |
| T-0035 | "Wooden spoon" consolations (XP, not cash) | ROADMAP | esther |
| T-0036 | Tournament certificate (shareable) | ROADMAP | freebuff |
| T-0037 | Champion wall (hall of fame) | ROADMAP | freebuff |
| T-0038 | Season pass tiers | ROADMAP | esther |
| T-0039 | XP boosts per tier | ROADMAP | esther |
| T-0040 | Prize-unit keepsake (stickers) | ROADMAP | esther |
| T-0041 | Predict-winner community poll | ROADMAP | esther |
| T-0042 | Tournament start countdown toast | ROADMAP | freebuff |
| T-0043 | Re-open application (no-show fill) | ROADMAP | opencode |
| T-0044 | Regional qualifiers (estate ladders) | ROADMAP | esther |
| T-0045 | Provincial finals | ROADMAP | esther |
| T-0046 | National Cup formats | ROADMAP | esther |
| T-0047 | Tournament persistence (localStorage fallback) | ROADMAP | opencode |
| T-0048 | Supabase-backed tournament store | ROADMAP | opencode |
| T-0049 | Tournament messaging (broadcast) | ROADMAP | freebuff |
| T-0050 | Auto-registration for returning champs | ROADMAP | opencode |

## Track C — Estates, Culture & Localization (60)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| C-0001 | 12-estate catalog (Kilimani, Westlands, Eastleigh, Kasarani, Karen, Kibera, Dandora, South B, Lang'ata, Umoja, Ngong Road, Roysambu) | SHIPPED | esther |
| C-0002 | Per-estate vibe copy | SHIPPED | esther |
| C-0003 | Per-estate nickname | SHIPPED | esther |
| C-0004 | Per-estate venues (3 each) | SHIPPED | esther |
| C-0005 | Venue-of-the-day (stable per calendar day) | SHIPPED | esther |
| C-0006 | Estates' handshake greeting | SHIPPED | esther |
| C-0007 | Estate board-tint palette | SHIPPED | esther |
| C-0008 | Estates zoning (CBD ring / Westlands / Eastlands / South side / North / Karen) | SHIPPED | esther |
| C-0009 | Estate trail avoidance in picks | SHIPPED | esther |
| C-0010 | Estate picker UI | SHIPPED | esther |
| C-0011 | Sheng taunt pool | SHIPPED | esther |
| C-0012 | Sheng praise pool | SHIPPED | esther |
| C-0013 | Sheng win lines | SHIPPED | esther |
| C-0014 | Sheng loss lines | SHIPPED | esther |
| C-0015 | Sheng draw lines | SHIPPED | esther |
| C-0016 | Ambient crowd lines | SHIPPED | esther |
| C-0017 | Matatu door-slogan lines | SHIPPED | esther |
| C-0018 | Seeded line picking | SHIPPED | esther |
| C-0019 | No-repeat voice sequences | SHIPPED | esther |
| C-0020 | Swahili counting (0–12 words) | SHIPPED | esther |
| C-0021 | Swahili ply phrases ("hoja moja") | SHIPPED | esther |
| C-0022 | Play-by-play banter generator | SHIPPED | esther |
| C-0023 | "Mtaa radio" taunt ticker UI | SHIPPED | esther |
| C-0024 | Brand identity: Games254 + Nairobi Checkers harmony | SHIPPED | freebuff |
| C-0025 | Glassmorphic city-night theme | SHIPPED | freebuff |
| C-0026 | City-lights aurora animation | SHIPPED | freebuff |
| C-0027 | Reduced-motion guards on all animations | SHIPPED | freebuff |
| C-0028 | KSh locale formatting (en-KE) | SHIPPED | freebuff |
| C-0029 | Matatu-maestro career title | SHIPPED | freebuff |
| C-0030 | Mtaa-Tactician career title | SHIPPED | freebuff |
| C-0031 | Night-Owl career title | SHIPPED | freebuff |
| C-0032 | Board-Boss career title | SHIPPED | freebuff |
| C-0033 | Checkers-Governor career title | SHIPPED | freebuff |
| C-0034 | Nairobi-Legend career title | SHIPPED | freebuff |
| C-0035 | House-of-254 career title | SHIPPED | freebuff |
| C-0036 | Estate-name localization in UI chrome | ROADMAP | freebuff |
| C-0037 | Full Swahili UI toggle | ROADMAP | freebuff |
| C-0038 | Sheng glossary modal | ROADMAP | esther |
| C-0039 | Kenyan date formats | ROADMAP | freebuff |
| C-0040 | Currency pluralization copy | ROADMAP | freebuff |
| C-0041 | Night-market theme at 18:00+ | ROADMAP | freebuff |
| C-0042 | Rainy-season theme | ROADMAP | freebuff |
| C-0043 | Football-derby-inspired twitch for straights | ROADMAP | esther |
| C-0044 | Estate-based difficulty bias metadata | ROADMAP | esther |
| C-0045 | Muguka-joke neutral chat filter | ROADMAP | freebuff |
| C-0046 | Traffic-jam idle screen | ROADMAP | freebuff |
| C-0047 | "Jua kali" craft-paper about page | ROADMAP | freebuff |
| C-0048 | Boda-boda delivery flavor for deposits | ROADMAP | esther |
| C-0049 | "Chapati war" easter egg title | ROADMAP | esther |
| C-0050 | Census: Wajackoya-approved snack tie-ins (non-alcohol) | ROADMAP | esther |
| C-0051 | Out-of-order semantics (no booze vibes) | ROADMAP | team |
| C-0052 | Local font pairing (DM Sans + Syne) | SHIPPED | freebuff |
| C-0053 | Voice-over Swahili count at promo | ROADMAP | esther |
| C-0054 | "Sasa?" onboarding greeting | ROADMAP | esther |
| C-0055 | Estate pride share cards | ROADMAP | freebuff |
| C-0056 | Weekly estate spotlight banner | ROADMAP | esther |
| C-0057 | Refugee-friendly bilingual intro | ROADMAP | team |
| C-0058 | Local holiday calendar events | ROADMAP | esther |
| C-0059 | Culture pack version constant | SHIPPED | esther |
| C-0060 | Culture-pack index barrel | SHIPPED | esther |

## Track P — Profile, Career & Achievements (50)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| P-0001 | Career XP model | SHIPPED | freebuff |
| P-0002 | Win/loss counters | SHIPPED | freebuff |
| P-0003 | Streak tracking (current + best) | SHIPPED | freebuff |
| P-0004 | Capture/king lifetime counters | SHIPPED | freebuff |
| P-0005 | Match history ledger (120 cap) | SHIPPED | freebuff |
| P-0006 | Level-based XP curve | SHIPPED | freebuff |
| P-0007 | Career titles ladder | SHIPPED | freebuff |
| P-0008 | Profile analytics page | SHIPPED | freebuff |
| P-0009 | Win-rate stat | SHIPPED | esther |
| P-0010 | Form guide (last 10 W/L) | SHIPPED | esther |
| P-0011 | Captures-per-game stat | SHIPPED | esther |
| P-0012 | Kings-per-game stat | SHIPPED | esther |
| P-0013 | XP-per-game stat | SHIPPED | esther |
| P-0014 | Net-cash stat | SHIPPED | esther |
| P-0015 | Return-on-stake stat | SHIPPED | esther |
| P-0016 | Best-match highlight (captures) | SHIPPED | esther |
| P-0017 | Medal catalog (18 medals) | SHIPPED | esther |
| P-0018 | Medal unlock predicates | SHIPPED | esther |
| P-0019 | Medal persistence (own storage key) | SHIPPED | esther |
| P-0010 | Medal wall UI | SHIPPED | esther |
| P-0020 | First-Blood medal | SHIPPED | esther |
| P-0021 | Hat-Trick / On-Fire / Untouchable medals | SHIPPED | esther |
| P-0022 | Kingmaker / Crown-Prince medals | SHIPPED | esther |
| P-0023 | Capture-Baron medal | SHIPPED | esther |
| P-0024 | Gladiator / Marathoner medals | SHIPPED | esther |
| P-0025 | Boss-Killer medal | SHIPPED | esther |
| P-0026 | Real-Money / Big-Stakes medals | SHIPPED | esther |
| P-0027 | Day-One hustler medal | SHIPPED | esther |
| P-0028 | Textbook perfect-win medal | SHIPPED | esther |
| P-0029 | Second-Wind medal | SHIPPED | esther |
| P-0030 | Night-Owl / Asubuhi medals | SHIPPED | esther |
| P-0031 | Estate-Hopper medal | SHIPPED | esther |
| P-0032 | Medal progress diffing | SHIPPED | esther |
| P-0033 | Account gate (create player account) | SHIPPED | freebuff |
| P-0034 | Guest-vs-account career separation | ROADMAP | freebuff |
| P-0035 | Display-name editing | ROADMAP | freebuff |
| P-0036 | Avatar selection | ROADMAP | freebuff |
| P-0037 | Career stats to date-fns chart | ROADMAP | freebuff |
| P-0038 | XP gain animation at match end | ROADMAP | freebuff |
| P-0039 | New-medal toast | ROADMAP | esther |
| P-0040 | Medal tooltips (how to unlock) | ROADMAP | esther |
| P-0041 | Cross-account medal restore | ROADMAP | opencode |
| P-0042 | Ledger export of matches | ROADMAP | freebuff |
| P-0043 | Profile share card | ROADMAP | freebuff |
| P-0044 | "This week" vs "all time" stat toggles | ROADMAP | freebuff |
| P-0045 | Skill rating (Elo-ish) | ROADMAP | opencode |
| P-0046 | Rating history chart | ROADMAP | freebuff |
| P-0047 | Rating decay rules | ROADMAP | opencode |
| P-0048 | First 100 matches growth tracker | ROADMAP | freebuff |
| P-0049 | Career reset (fresh start) | ROADMAP | freebuff |

## Track A — Audio, Motion & Accessibility (40)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| A-0001 | Ambient sound engine toggle | SHIPPED | freebuff |
| A-0002 | Streak fanfare trigger | SHIPPED | freebuff |
| A-0003 | Confetti on wins | SHIPPED | freebuff |
| A-0004 | Reduced-motion CSS block | SHIPPED | freebuff |
| A-0005 | Tab-hidden pause of FX loop | SHIPPED | freebuff |
| A-0006 | Wheel-spin reveal animation | SHIPPED | freebuff |
| A-0007 | Pulse-dot presence indicators | SHIPPED | freebuff |
| A-0008 | Stake-plasma aura on high stakes | SHIPPED | freebuff |
| A-0009 | King-glow shimmer | SHIPPED | freebuff |
| A-0010 | Double-banner pulse | SHIPPED | freebuff |
| A-0011 | Replay slider styling | SHIPPED | freebuff |
| A-0012 | Focus-visible outlines | SHIPPED | freebuff |
| A-0013 | ARIA labels on icon buttons | SHIPPED | freebuff |
| A-0014 | Announce banter via aria-live | SHIPPED | esther |
| A-0015 | Sanza clock visual timer | SHIPPED | esther |
| A-0016 | Clock low-time tint | SHIPPED | esther |
| A-0017 | Clock expiry state | SHIPPED | esther |
| A-0018 | Clock live tick (250 ms smooth) | SHIPPED | esther |
| A-0019 | Waveform SFX on captures | ROADMAP | esther |
| A-0020 | King-promotion chime | ROADMAP | esther |
| A-0021 | Win fanfare (WebAudio synth) | ROADMAP | esther |
| A-0022 | Bot-taunt "kiss-tooth" click | ROADMAP | esther |
| A-0023 | Haptic taps on mobile captures | ROADMAP | team |
| A-0024 | Voice countdown at Sanza start | ROADMAP | esther |
| A-0025 | Text-size scaling 100–150% | ROADMAP | freebuff |
| A-0026 | High-contrast theme | ROADMAP | freebuff |
| A-0027 | Colorblind-safe piece markers | ROADMAP | freebuff |
| A-0028 | Keyboard-only board navigation | ROADMAP | freebuff |
| A-0029 | Screen-reader move announcements | ROADMAP | freebuff |
| A-0030 | ARIA live region for bet results | ROADMAP | esther |
| A-0031 | Touch targets ≥ 44px | ROADMAP | freebuff |
| A-0032 | Full audio mute in one tap | ROADMAP | freebuff |
| A-0033 | Volume sliders (SFX vs ambient) | ROADMAP | team |
| A-0034 | Sound-off persists | ROADMAP | freebuff |
| A-0035 | Prefers-contrast media handling | ROADMAP | freebuff |
| A-0036 | A11y lint step in CI | ROADMAP | freebuff |
| A-0037 | Loading skeleton fallbacks | SHIPPED | freebuff |
| A-0038 | Error boundary UI | SHIPPED | freebuff |
| A-0039 | Toast announcements (status-toast) | SHIPPED | freebuff |
| A-0040 | Sticky bottom action bar safety margins | ROADMAP | freebuff |

## Track B — Backend, API & Security (50)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| B-0001 | Express 5 API server | SHIPPED | freebuff |
| B-0002 | Health route | SHIPPED | freebuff |
| B-0003 | Structured pino logging | SHIPPED | freebuff |
| B-0004 | BrightPay pay proxy (server-side API key) | SHIPPED | opencode |
| B-0005 | BrightPay status proxy | SHIPPED | opencode |
| B-0006 | BrightPay withdrawal proxy | SHIPPED | opencode |
| B-0007 | HMAC-SHA256 request signing | SHIPPED | opencode |
| B-0008 | Withdrawals feature-flag gate | SHIPPED | opencode |
| B-0009 | Secret hygiene (env-only keys) | SHIPPED | opencode |
| B-0010 | External-reference validation regex | SHIPPED | opencode |
| B-0011 | Rate limiting on BrightPay endpoints | ROADMAP | opencode |
| B-0012 | Admin auth (owner console) | ROADMAP | opencode |
| B-0013 | RLS-ready schema notes | ROADMAP | opencode |
| B-0014 | Rooms API (create/join/list) | ROADMAP | opencode |
| B-0015 | Match records API | ROADMAP | opencode |
| B-0016 | Wallet ledger API | ROADMAP | opencode |
| B-0017 | Tournament API (enter/submit/rank) | ROADMAP | opencode |
| B-0018 | Supabase Realtime channel per room | ROADMAP | opencode |
| B-0019 | Edge Function BrightPay consumer | ROADMAP | opencode |
| B-0020 | Webhook receiver for BrightPay callbacks | ROADMAP | opencode |
| B-0021 | Signature timestamp replay guard | ROADMAP | opencode |
| B-0022 | Input normalization on the edge | ROADMAP | opencode |
| B-0023 | Idempotency store (Postgres unique ref) | ROADMAP | opencode |
| B-0024 | Payout service (queue + retry) | ROADMAP | opencode |
| B-0025 | Treasury accounting table | ROADMAP | opencode |
| B-0026 | Audit log for all money events | ROADMAP | opencode |
| B-0027 | Owner "pause everything" kill switch | ROADMAP | opencode |
| B-0028 | Game-result hashing (anti-tamper) | ROADMAP | opencode |
| B-0029 | Verify external-references on retry | ROADMAP | opencode |
| B-0030 | CORS allowlist (not *) | ROADMAP | opencode |
| B-0031 | Security headers (CSP etc.) | ROADMAP | opencode |
| B-0032 | Trust-proxy behind Replit | ROADMAP | opencode |
| B-0033 | API version prefix `/api/v1` | ROADMAP | opencode |
| B-0034 | OpenAPI document | ROADMAP | opencode |
| B-0035 | Client-side type safety via ts-rsync | ROADMAP | opencode |
| B-0036 | Feature flags service | ROADMAP | opencode |
| B-0037 | Maintenance banner from server | ROADMAP | opencode |
| B-0038 | Deposit min/max server + client parity | SHIPPED | opencode |
| B-0039 | Socket timeout + circuit breaker on fetch | ROADMAP | opencode |
| B-0040 | Request ID correlation logging | SHIPPED | freebuff |
| B-0041 | Error taxonomy (client-safe messages) | SHIPPED | opencode |
| B-0042 | Log redaction of phone numbers | ROADMAP | opencode |
| B-0043 | No secrets in client bundle | SHIPPED | opencode |
| B-0044 | Storage-agnostic session (swap later) | ROADMAP | opencode |
| B-0045 | DB migrations via Supabase (tracked) | ROADMAP | opencode |
| B-0046 | Advisors (security) pass zero | ROADMAP | opencode |
| B-0047 | Advisors (performance) pass zero | ROADMAP | opencode |
| B-0048 | Serverless-friendly statelessness | ROADMAP | opencode |
| B-0049 | Backoffice reports (daily settle) | ROADMAP | opencode |
| B-0050 | Uptime + health probes | SHIPPED | freebuff |

## Track U — UI, Shell & Polish (50)

| ID | Feature | Status | Owner |
| --- | --- | --- | --- |
| U-0001 | Glassmorphic city shell | SHIPPED | freebuff |
| U-0002 | Desktop sidebar nav | SHIPPED | freebuff |
| U-0003 | Mobile bottom bar nav | SHIPPED | freebuff |
| U-0004 | Mobile slide-in menu | SHIPPED | freebuff |
| U-0005 | Mode switch (Demo / Real cash) | SHIPPED | freebuff |
| U-0006 | Install-app PWA button | SHIPPED | freebuff |
| U-0007 | Notifications bell | SHIPPED | freebuff |
| U-0008 | Toast system | SHIPPED | freebuff |
| U-0009 | Status toasts (data-testid stable) | SHIPPED | freebuff |
| U-0010 | Toast auto-dismiss | SHIPPED | freebuff |
| U-0011 | Home page hero split | SHIPPED | freebuff |
| U-0012 | Three-ways-to-play highlight | SHIPPED | freebuff |
| U-0013 | Daily fortune wheel | SHIPPED | freebuff |
| U-0014 | Career trio panel | SHIPPED | freebuff |
| U-0015 | Recent matches feed | SHIPPED | freebuff |
| U-0016 | Missions rail | SHIPPED | freebuff |
| U-0017 | Wallet page (deposit/withdraw) | SHIPPED | freebuff |
| U-0018 | Tournament page | SHIPPED | freebuff |
| U-0019 | Profile analytics page | SHIPPED | freebuff |
| U-0020 | Admin dashboard | SHIPPED | freebuff |
| U-0021 | Terms gate | SHIPPED | freebuff |
| U-0022 | Account gate modal | SHIPPED | freebuff |
| U-0023 | 404 page | SHIPPED | freebuff |
| U-0024 | Route-level code splitting | SHIPPED | freebuff |
| U-0025 | Loading page fallbacks | SHIPPED | freebuff |
| U-0026 | Error boundary | SHIPPED | freebuff |
| U-0027 | Duel Lab page (`/duel`) | SHIPPED | esther |
| U-0028 | Duel Lab nav entry | SHIPPED | freebuff |
| U-0029 | Event "mtaa radio" ticker | SHIPPED | esther |
| U-0030 | Bet chips micro-interaction | SHIPPED | esther |
| U-0031 | Estate chip row selection | SHIPPED | esther |
| U-0032 | Copy feedback ("Room code copied") | SHIPPED | esther |
| U-0033 | Coin QA on game end | ROADMAP | freebuff |
| U-0034 | Streak fire streak-meter on home | ROADMAP | freebuff |
| U-0035 | Mood mode (sunset at 18:00) | ROADMAP | freebuff |
| U-0036 | Sticky CTA "Find a game" | SHIPPED | freebuff |
| U-0037 | Balance chip in top rail | ROADMAP | freebuff |
| U-0038 | Fullscreen board toggle | ROADMAP | freebuff |
| U-0039 | Print-friendly rules card | ROADMAP | freebuff |
| U-0040 | Empty states everywhere | SHIPPED | freebuff |
| U-0041 | Skeleton loaders for lazy routes | SHIPPED | freebuff |
| U-0042 | i18n string table approach | ROADMAP | team |
| U-0043 | Theme accent picker (gold/green/blue) | ROADMAP | freebuff |
| U-0044 | Onboarding tooltips first run | ROADMAP | freebuff |
| U-0045 | Drag-and-drop pieces (optional) | ROADMAP | freebuff |
| U-0046 | Long-press to speed-run slides | ROADMAP | freebuff |
| U-0047 | Board rotation vs screen orientation | ROADMAP | freebuff |
| U-0048 | Gutter "How to play" drawer | ROADMAP | freebuff |
| U-0049 | Version footer + culture-pack version | SHIPPED | esther |
| U-0050 | Polish audit before release | ROADMAP | team |

---

## Totals

| Track | Registry | SHIPPED |
| --- | --- | --- |
| V · Gameplay & Variants | 60 | 25 |
| AI · Bot & Difficulty | 40 | 11 |
| M · Money & BrightPay | 60 | 33 |
| R · Rooms & Multiplayer | 40 | 12 |
| T · Tournaments & Quests | 50 | 14 |
| C · Estates & Culture | 60 | 34 |
| P · Profile & Achievements | 50 | 36 |
| A · Audio & A11y | 40 | 17 |
| B · Backend & Security | 50 | 11 |
| U · UI & Polish | 50 | 30 |
| **Total** | **500** | **223** |

> 500 features registered. 223 are live in code today (50+ new from esther's
> pack plus the freebuff/opencode seams); the remaining 277 are a tracked
> roadmap with owners — pull the highest-value ones into `ROADMAP.md`.