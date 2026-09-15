/**
 * Games254 room codes — deterministic local 6-character codes built on the
 * seeded RNG. `generate` avoids collisions against the active set; `parse`
 * validates user input. Codes are pseudo-random but reproducible from their
 * seed, which future Realtime/supabase integration can reuse for fairness.
 */

import { code6, normalizeCode } from './random';

export type Room = {
  code: string;
  hostId: string;
  kind: 'cash' | 'demo';
  stakeKsh: number;
  rulesVersion: string;
  createdAt: number;
};

export type CreateRoomInput = {
  hostId: string;
  kind: 'cash' | 'demo';
  stakeKsh: number;
  rulesVersion: string;
};

const ALIVE_MS = 30 * 60 * 1000; // rooms are recycled after 30 minutes

export function generateRoomCode(activeCodes: ReadonlySet<string>, seed?: string): string {
  let code = code6(seed);
  let guard = 0;
  while (activeCodes.has(code) && guard < 50) {
    code = code6(`${seed ?? 'room'}-${guard}-${Date.now()}`);
    guard++;
  }
  return code;
}

export function createRoom(input: CreateRoomInput, activeCodes: ReadonlySet<string>): Room {
  return {
    code: generateRoomCode(activeCodes, input.hostId),
    hostId: input.hostId,
    kind: input.kind,
    stakeKsh: input.stakeKsh,
    rulesVersion: input.rulesVersion,
    createdAt: Date.now(),
  };
}

/** True when a room is still joinable (not expired). */
export function isRoomLive(room: Pick<Room, 'createdAt'>, now = Date.now()): boolean {
  return now - room.createdAt < ALIVE_MS;
}

export { normalizeCode as parseRoomCode };

/** Human hint for the room (avoids I/O/0/1 ambiguity). */
export const ROOM_HINT = '6 characters · no I, O, 0 or 1 · case-insensitive';