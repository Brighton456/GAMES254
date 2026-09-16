/**
 * Games254 Supabase client — plain fetch() against PostgREST (no npm deps).
 *
 * Identity (v1): a per-device `playerId` UUID kept in localStorage, sent to the
 * api-server as an `x-player-id` header. The api-server's BrightPay routes are
 * the ONLY writers (via SECURITY DEFINER RPC functions); the client only reads
 * the authoritative balance/ledger and falls back to localStorage when the DB
 * is unreachable or unconfigured.
 *
 * When anonymous/phone auth is enabled in the Supabase dashboard, swap the
 * owner identity (getPlayerId -> auth.uid()) with zero schema change.
 */

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isDbConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/** Stable per-device tenant id (uuid v4). */
export function getPlayerId(): string {
  const key = "games254-player-id";
  const existing = window.localStorage.getItem(key);
  if (existing && /^[0-9a-f]{8}-/.test(existing)) return existing;
  const fresh = (crypto as unknown as { randomUUID: () => string }).randomUUID();
  window.localStorage.setItem(key, fresh);
  return fresh;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(args),
    });
    if (!response.ok) return null;
    const text = await response.text();
    return text === "" ? null : (JSON.parse(text) as T);
  } catch {
    return null;
  }
}

export type DbBalance = { available_cents: number; escrow_cents: number };

export type DbLedgerRow = {
  id: number;
  kind: string;
  cents: number;
  balance_after: number;
  note: string | null;
  created_at: string;
};

/** Registers the device profile (idempotent). Returns the playerId. */
export async function ensureDbProfile(displayName = "Guest 254"): Promise<string> {
  const id = getPlayerId();
  await rpc("ensure_profile", { p_id: id, p_name: displayName });
  return id;
}

/** Authoritative available balance in KSh, or null when unavailable. */
export async function fetchDbBalanceKsh(): Promise<number | null> {
  const rows = await rpc<DbBalance[]>("balance_for", { p_owner: getPlayerId() });
  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0].available_cents / 100;
  }
  return null;
}

export async function fetchDbLedger(): Promise<DbLedgerRow[]> {
  const rows = await rpc<DbLedgerRow[]>("ledger_for", { p_owner: getPlayerId() });
  return Array.isArray(rows) ? rows : [];
}