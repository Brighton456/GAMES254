/**
 * Games254 money math — ALL amounts are integer cents internally to avoid
 * float drift. Settle, fee and prize math must never round a running total.
 * The UI formats via `fmtKsh`.
 */

export type Cents = number;

/** Convert a whole-KSh user input (number or string) to cents, or null. */
export function toCents(amount: number | string): Cents | null {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Integer KSh for display = cents / 100. */
export function centsToKsh(cents: Cents): number {
  return cents / 100;
}

/** Locale-friendly "KSh 1,250.00" style string. */
export function fmtKsh(cents: Cents): string {
  return `KSh ${(cents / 100).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Stake settlement for a 2-player table.
 * pool = 2 × stake · fee = pool × feePercent (rounded to whole cent) · prize = pool − fee.
 * Mirrors the prior UI contract (winner takes prize, fee is transparent).
 */
export function settle(centsStake: Cents, feePercent: number): { pool: Cents; fee: Cents; prize: Cents } {
  const pool = centsStake * 2;
  const fee = Math.round((pool * feePercent) / 100);
  return { pool, fee, prize: pool - fee };
}

export function add(a: Cents, b: Cents): Cents {
  return a + b;
}

export function isNonNegative(v: Cents): boolean {
  return Number.isInteger(v) && v >= 0;
}