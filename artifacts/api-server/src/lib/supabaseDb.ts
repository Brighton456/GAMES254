/**
 * Thin PostgREST adapter over the Games254 Supabase wallet ledger.
 *
 * All writes go through the SECURITY DEFINER RPC functions in
 * supabase/migrations/*.sql; the anon key alone cannot touch the tables
 * (RLS on, no policies). If Supabase is not configured, every call degrades
 * to a no-op returning null and the BrightPay proxy keeps working exactly as
 * before — the ledger just isn't recorded.
 */

import { logger } from "./logger";

const SUPABASE_URL = process.env["SUPABASE_URL"];
const SUPABASE_KEY =
  process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];

let unreachableLogged = false;

export function isDbConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function rpc(
  functionName: string,
  args: Record<string, unknown>,
): Promise<unknown | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(args),
    });
    if (!response.ok) {
      const text = await response.text();
      logger.warn(
        { functionName, status: response.status, body: text.slice(0, 300) },
        "supabase rpc failed",
      );
      return null;
    }
    const text = await response.text();
    return text === "" ? [] : JSON.parse(text);
  } catch (error) {
    if (!unreachableLogged) {
      unreachableLogged = true;
      logger.error({ err: error }, "supabase unreachable; ledger writes disabled");
    }
    return null;
  }
}

export type WalletBalance = {
  availableCents: number;
  escrowCents: number;
};

/** Validates the x-player-id tenant header. */
export function parsePlayerId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trimmed,
    )
  ) {
    return null;
  }
  return trimmed;
}

export async function ensureProfile(ownerId: string, displayName = "Games254 Player") {
  return rpc("ensure_profile", { p_id: ownerId, p_name: displayName });
}

export async function recordPending(
  ownerId: string,
  kind: "deposit" | "withdraw",
  ref: string,
  amountCents: number,
  checkoutId?: string,
) {
  return rpc("record_pending", {
    p_ref: ref,
    p_owner: ownerId,
    p_kind: kind,
    p_amount_cents: amountCents,
    p_checkout_id: checkoutId ?? null,
  });
}

export async function recordCompletedByCheckout(
  checkoutId: string,
  receipt?: string,
): Promise<number | null> {
  const value = await rpc("record_completed_by_checkout", {
    p_checkout: checkoutId,
    p_receipt: receipt ?? null,
  });
  return typeof value === "number" ? value : null;
}

export async function recordWithdraw(
  ownerId: string,
  ref: string,
  amountCents: number,
): Promise<number | null> {
  const value = await rpc("record_withdraw", {
    p_ref: ref,
    p_owner: ownerId,
    p_amount_cents: amountCents,
  });
  return typeof value === "number" ? value : null;
}

export async function balanceFor(ownerId: string): Promise<WalletBalance | null> {
  const rows = await rpc("balance_for", { p_owner: ownerId });
  if (Array.isArray(rows) && rows.length > 0) {
    const row = rows[0] as {
      available_cents?: number | null;
      escrow_cents?: number | null;
    };
    return {
      availableCents: row.available_cents ?? 0,
      escrowCents: row.escrow_cents ?? 0,
    };
  }
  return null;
}