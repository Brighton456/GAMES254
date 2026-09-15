/**
 * Games254 wallet service — pure ledger logic in integer cents.
 *
 * DESIGN: every mutation is a pure function returning { state, event, error }.
 * The UI layer calls these; later a real backend can expose the same contract
 * over HTTP (the "swappable" seam requested). All money is Cents (integer).
 *
 * WALLET STATE MACHINE
 *   stake in  -> hold (escrow)            on 2-player match start
 *   contest   -> win  : payout prize      lose : burn stake into treasury
 *                draw : refund stake
 *   deposit/withdraw hit the available balance only.
 */

import { settle, toCents, type Cents } from './money';

export type TxKind =
  | 'deposit'
  | 'withdraw'
  | 'stake-in'
  | 'payout'
  | 'refund'
  | 'fee'
  | 'bonus';

export type Tx = {
  id: string;
  at: number;
  kind: TxKind;
  cents: Cents; // signed
  balanceAfter: Cents;
  note: string;
};

export type Wallet = {
  available: Cents;
  escrow: Cents;
  txs: Tx[];
};

export type WalletEvent =
  | { type: 'debited'; cents: Cents }
  | { type: 'credited'; cents: Cents }
  | { type: 'escrowed'; cents: Cents }
  | { type: 'released'; cents: Cents }
  | { type: 'fee'; cents: Cents };

export type WalletResult = {
  ok: boolean;
  state?: Wallet;
  event?: WalletEvent;
  error?: string;
};

export function emptyWallet(initialKsh = 0): Wallet {
  const cents = toCents(initialKsh) ?? 0;
  return { available: cents, escrow: 0, txs: [] };
}

let txSeq = 0;
function txId(): string {
  txSeq += 1;
  return `tx-${Date.now().toString(36)}-${txSeq.toString(36)}`;
}

/** Atomic move of cents between available balance and escrow (hold). */
export function escrowStake(wallet: Wallet, cents: Cents, note: string): WalletResult {
  if (cents <= 0) return { ok: false, error: 'Stake must be positive.' };
  if (wallet.available < cents) return { ok: false, error: 'Insufficient balance for stake.' };
  const next: Wallet = {
    available: wallet.available - cents,
    escrow: wallet.escrow + cents,
    txs: [...wallet.txs, { id: txId(), at: Date.now(), kind: 'stake-in', cents: -cents, balanceAfter: wallet.available - cents, note }],
  };
  return { ok: true, state: next, event: { type: 'escrowed', cents } };
}

/**
 * Settle a finished 2-player match: winner collects prize-cents from the pool
 * minus fee; loser burns stake to treasury; draw refunds both escrows.
 * `hostWon` refers to the caller's perspective (true = they're the winner).
 */
export function settleMatch(
  wallet: Wallet,
  feePercent: number,
  hostWon: boolean | null, // null = draw
  note: string,
): WalletResult {
  const escrowed = wallet.escrow;
  if (escrowed <= 0) return { ok: false, error: 'Nothing in escrow to settle.' };
  const { fee, prize } = settle(escrowed, feePercent);

  const payout =
    hostWon === null ? escrowed /* refund */ : hostWon ? prize : 0;
  const feePaid = hostWon === null ? 0 : fee;

  const credited = payout > 0 ? payout : 0;
  const txKind: TxKind =
    hostWon === null ? 'refund' : hostWon ? 'payout' : 'fee';

  const next: Wallet = {
    available: wallet.available + credited,
    escrow: 0,
    txs: [
      ...wallet.txs,
      ...(credited > 0
        ? [{ id: txId(), at: Date.now(), kind: txKind, cents: credited, balanceAfter: wallet.available + credited, note }]
        : []),
      { id: txId(), at: Date.now(), kind: 'fee', cents: -feePaid, balanceAfter: wallet.available + credited, note: `${note} · house fee` },
    ].filter(Boolean) as Tx[],
  };

  const event: WalletEvent = hostWon === null
    ? { type: 'released', cents: escrowed }
    : hostWon
      ? { type: 'credited', cents: prize }
      : { type: 'fee', cents: fee };

  return { ok: true, state: next, event };
}

export function deposit(wallet: Wallet, cents: Cents, note: string): WalletResult {
  if (cents <= 0) return { ok: false, error: 'Deposit must be positive.' };
  const available = wallet.available + cents;
  return {
    ok: true,
    state: { ...wallet, available, txs: [...wallet.txs, { id: txId(), at: Date.now(), kind: 'deposit', cents, balanceAfter: available, note }] },
    event: { type: 'credited', cents },
  };
}

export function withdraw(wallet: Wallet, cents: Cents, note: string): WalletResult {
  if (cents <= 0) return { ok: false, error: 'Withdrawal must be positive.' };
  if (wallet.available < cents) return { ok: false, error: 'Withdrawal exceeds available balance.' };
  const available = wallet.available - cents;
  return {
    ok: true,
    state: { ...wallet, available, txs: [...wallet.txs, { id: txId(), at: Date.now(), kind: 'withdraw', cents: -cents, balanceAfter: available, note }] },
    event: { type: 'debited', cents },
  };
}

export function grantBonus(wallet: Wallet, cents: Cents, note: string): WalletResult {
  return deposit(wallet, cents, note === '' ? 'Bonus' : note);
}

/** Register an incoming SPK-confirmed deposit via the M-Pesa proxy. */
export function confirmDeposit(wallet: Wallet, ksh: number, mpesaCode: string): WalletResult {
  const cents = toCents(ksh);
  if (cents === null) return { ok: false, error: 'Invalid deposit amount.' };
  return deposit(wallet, cents, `BrightPay ${mpesaCode} confirm`);
}