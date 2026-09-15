# Nairobi Checkers — Games254

Open-source, free-first checkers for the Nairobi night. Neon glassmorphic shell,
three ways to play (house bot · pass & play · cash ladder), M-Pesa deposits and
withdrawals through the BrightPay gateway, and a Kenyan culture pack ("Duel Lab")
shipping in parallel.

Built by three AI agents in a shared working tree:

- **freebuff** — UI shell & pages (`src/pages/*`, `src/components/shell.tsx`,
  `App.tsx` orchestration, motion/a11y guards, `index.css`, docs).
- **opencode** — engine & services (`src/lib/*`, `game-engine.ts`, tests,
  api-server BrightPay wiring, money escrow).
- **esther** — Kenya culture + gameplay pack (`src/features/*`, `FEATURES.md`,
  the `/duel` Duel Lab route).

Coordination is file-mediated and append-only: `agent-chat.md` is the live room,
`agent-freebuff.md` / `agent-opencode.md` / `agent-esther.md` are per-agent step logs.

---

## Quick start

Requires **pnpm** (the repo refuses `npm`/`yarn` on install).

```bash
# 1. install
pnpm install

# 2. run the app (PORT + BASE_PATH are required by vite.config.ts)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/nairobi-checkers run dev

# 3. api-server (BrightPay proxy + deposits/withdrawals)
BRIGHTPAY_API_KEY=... pnpm --filter @workspace/api-server run dev
```

### Environment variables

| Variable | Required | Where | Purpose |
|---|---|---|---|
| `PORT` | yes (app dev/build) | artifact | Vite bind port, validated > 0 |
| `BASE_PATH` | yes (app dev/build) | artifact | Vite `base` path, e.g. `/` |
| `BRIGHTPAY_API_KEY` | api-server | api-server | `x-api-key` for BrightPay functions |
| `BRIGHTPAY_SIGNING_SECRET` | withdraws | api-server | HMAC-SHA256 secret for `/endpoint-withdraw` |
| `BRIGHTPAY_WITHDRAWALS_ENABLED` | no (default off) | api-server | Gate server-side withdrawals |
| `BRIGHTPAY_BASE_URL` | no | api-server | BrightPay function base URL (defaults to prod) |

### Scripts

| Command | What it does |
|---|---|
| `pnpm run typecheck` | `tsc --build` for shared libs, then recursive artifact/script typecheck |
| `pnpm run build` | typecheck + recursive production builds |
| `pnpm --filter @workspace/nairobi-checkers run build` | artifact `vite build` (needs `PORT` + `BASE_PATH`) |
| `pnpm --filter @workspace/nairobi-checkers run typecheck` | artifact `tsc --noEmit` |
| `pnpm --filter @workspace/api-server run typecheck` | api-server `tsc --noEmit` |
| `pnpm --filter @workspace/api-server run dev` | api-server with BrightPay proxy |

---

## BrightPay (M-Pesa) contract

Client talks only to the **api-server proxy** (http + HMAC never in the browser);
the api-server talks to BrightPay Supabase edge functions.

| Client → proxy | Proxy → BrightPay | Notes |
|---|---|---|
| `POST /api/brightpay/pay` | `POST /endpoint-pay` | body `{ amount, phone_number, external_reference }`; returns `checkout_id` |
| `GET /api/brightpay/status?checkout_id=` | `GET /endpoint-status?checkout_id=` | poll every 3 s, max ~2 min |
| `POST /api/brightpay/withdraw` | `POST /endpoint-withdraw` | HMAC-SHA256 signed proxy-side (`x-timestamp`, `x-signature`) |

Money rules enforced through the whole flow:

- All amounts are whole **KES** client-side and **integer cents** in the service layer.
- Deposits credit balance only after the server reports the STK push complete
  (`handleDepositConfirmed`); the client keeps a `settledRef` guard against double-credit.
- Withdrawals debit **only on server `200`** (`handleWithdrawConfirmed`), with a
  sticky `external_reference` per intent for idempotent retries.
- Match stakes are escrowed at launch: win `+prize`, loss nothing, draw refunds stake.

---

## Repository layout

```
artifacts/
  nairobi-checkers/   # React + Vite + Tailwind v4 app (the artifact)
    src/
      pages/          # home, wallet, tournament (+ admin/profile lazy)
      components/
        shell.tsx     # shared chrome (Shell, ModeSwitch, navItems, money, secureInt)
        game/         # board, engine, canvas FX, fortune wheel, stores
      lib/            # opencode's pure-TS service layer (money, random, wallet…)
      features/       # esther's Kenya culture + gameplay pack
  api-server/         # Express BrightPay proxy (routes/brightpay.ts)
agent-*.md            # live multi-agent coordination (append-only)
FEATURES.md           # esther's 500-feature registry (F-001…SHIPPED)
```

---

## Culture pack (esther)

The Nairobi flavour lives in `src/features/*` and the Duel Lab route `/duel`:
12 estate venues, Sheng/Swahili banter, cash side-bets, achievement medals, the
Sanza move clock, Kenyan house-rule presets, analytics, and engine-driven tips.
Every tracked capability is registered in **[FEATURES.md](FEATURES.md)** (IDs
F-001…F-120 marked **SHIPPED**; the rest is the tracked roadmap).

## Roadmap

Full 100-gap audit with owners and status lives in **[ROADMAP.md](ROADMAP.md)**.

## License

MIT.