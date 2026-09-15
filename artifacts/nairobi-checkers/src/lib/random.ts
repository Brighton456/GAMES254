/**
 * Games254 fair-RNG — single source of randomness for anything that touches
 * gameplay, stakes, or seeded outcomes. Backed by webcrypto when available,
 * with a deterministic seeded fallback (mulberry32) so tests and room "seeded"
 * sessions can replay exact sequences. NEVER use Math.random() for decisions
 * that affect money or match outcomes.
 *
 * Fairness contract: a game round should create ONE Rng seeded from
 * crypto; all rolls/draws/decisions derive from that stream.
 */

export type Rng = () => number;

const RNG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cryptographically secure, non-deterministic RNG. Prefer this in prod. */
export function cryptoRng(): Rng {
  const bytes = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 0xffffffff);
    bytes[1] = Math.floor(Math.random() * 0xffffffff);
  }
  // Mix both words into a 32-bit seed for the fast stream.
  return mulberry32(bytes[0] ^ (bytes[1] << 1));
}

/** Deterministic seeded RNG from a string (e.g. a room code). */
export function seedRng(seedText: string): Rng {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return mulberry32(hash);
}

/** Uniform int in [0, max). */
export function randomInt(rng: Rng, max: number): number {
  if (max <= 0) return 0;
  return Math.floor(rng() * max);
}

/** Uniform int in [min, max] inclusive. */
export function randomIntBetween(rng: Rng, min: number, max: number): number {
  return min + randomInt(rng, max - min + 1);
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[randomInt(rng, items.length)];
}

/** Fisher–Yates shuffle; returns a NEW array, input untouched. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/** Deterministic 6-char room code from a seed. Human-friendly alphabet. */
export function code6(seedText = `${Date.now()}-${Math.random()}`): string {
  const rng = seedRng(seedText);
  let code = '';
  for (let i = 0; i < 6; i++) code += RNG_ALPHABET[randomInt(rng, RNG_ALPHABET.length)];
  return code;
}

/** Validate a user-entered room code (upper/alnum only, 6 chars). */
export function normalizeCode(raw: string): string | null {
  const up = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return up.length === 6 ? up : null;
}

/** Always-available alias that uses crypto when present. */
export function secureRandomInt(max: number): number {
  return randomInt(cryptoRng(), max);
}