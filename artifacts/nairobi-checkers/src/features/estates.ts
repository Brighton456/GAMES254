/**
 * esther · ESTATES — Nairobi is the venue. Every match happens *somewhere*,
 * and this module gives each table a neighbourhood: venue-of-the-day, a
 * handshake line, a tempo, and a board-tint palette. Pure data + seeded picks.
 *
 * read-only consumer of `lib/random`.
 */

import { pick, randomIntBetween, seedRng, type Rng } from '../lib/random';

export type BoardTint = {
  /** Tailwind-ish token names for the light/dark squares, used by UI. */
  dark: string;
  light: string;
  rim: string;
  glow: string;
};

export type Estate = {
  id: string;
  name: string;
  nickname: string;
  zone: 'CBD ring' | 'Westlands' | 'Eastlands' | 'South side' | 'North' | 'Karen/Upper';
  vibe: string;
  tempo: 'slow' | 'steady' | 'fast';
  venues: string[];
  handshake: string;
  tint: BoardTint;
};

export const ESTATES: readonly Estate[] = [
  {
    id: 'kilimani', name: 'Kilimani', nickname: 'The Upmarket Yard', zone: 'CBD ring',
    vibe: 'For the hustlers with the clean sneakers and the sharp sheng.',
    tempo: 'steady', handshake: 'Wassup, Kilimani! Smooth moves only.',
    venues: ['The Nest Lounge', 'Kilimani Open Court', 'Sunrise Cars Park'],
    tint: { dark: '#3b2921', light: '#d6a944', rim: '#f0d37c', glow: '#d6a944' },
  },
  {
    id: 'westlands', name: 'Westlands', nickname: 'Money Playground', zone: 'Westlands',
    vibe: 'Skyline views, cold rides, even colder stares across the board.',
    tempo: 'fast', handshake: 'Westlands tables move fast — keep up!',
    venues: ['Sarit Arcade', 'Delta Junction', 'Westlands Mall Roof'],
    tint: { dark: '#1f3a5f', light: '#c7d6ee', rim: '#8fb3e8', glow: '#4d7fd8' },
  },
  {
    id: 'eastleigh', name: 'Eastleigh', nickname: 'The Capital of Deals', zone: 'Eastlands',
    vibe: 'Trade runs 24/7; so does the checkers here. Everyone plays to win.',
    tempo: 'fast', handshake: 'Eastleigh is open! Price ni gamble, move ni bosi.',
    venues: ['Rainbow Plaza', 'Equipment Booth 14', 'Jua Kali Corner'],
    tint: { dark: '#4a2f6b', light: '#e6d8f2', rim: '#b28ae0', glow: '#8a4fd8' },
  },
  {
    id: 'kasarani', name: 'Kasarani', nickname: 'Home of Champions', zone: 'North',
    vibe: 'Stadium energy — every capture feels like a goal, every win a medal.',
    tempo: 'steady', handshake: 'Kasarani! Champion vibes only, no mweshimi!',
    venues: ['Stadium Side Duka', 'Kasarani Youth Park', 'MQ Stadium Lane'],
    tint: { dark: '#2a5b3d', light: '#d9e8d3', rim: '#6ed292', glow: '#3fae6b' },
  },
  {
    id: 'karen', name: 'Karen', nickname: 'The Quiet Green', zone: 'Karen/Upper',
    vibe: 'Long gardens, quiet roads, and a house table with serious chips.',
    tempo: 'slow', handshake: 'Karen welcomes you — tea is ready, stakes are set.',
    venues: ['Horse Shoe Court', 'Karen Country Veranda', 'The Bluestone Lounge'],
    tint: { dark: '#355c4a', light: '#e2dcc6', rim: '#c9b16b', glow: '#a6903f' },
  },
  {
    id: 'kibera', name: 'Kibera', nickname: 'The Pulse', zone: 'South side',
    vibe: 'Loud, proud, and alive. Street tables where legends are made, not spoken.',
    tempo: 'fast', handshake: 'Kibera haiko ngumu — pole pole, but sharp!',
    venues: ['Silanga Pit', 'Lindi Play Zone', 'Makina Stage'],
    tint: { dark: '#5a3a1e', light: '#e8c98a', rim: '#e0a94a', glow: '#d68a1e' },
  },
  {
    id: 'dandora', name: 'Dandora', nickname: 'The Champion Block', zone: 'Eastlands',
    vibe: 'Eastern grit. Wins here are earned the long way — no shortcuts.',
    tempo: 'steady', handshake: 'Dandora is home — play smart, win clean.',
    venues: ['Dandora Kikou Cluster', 'Mlimani Stage', 'Phase Two Court'],
    tint: { dark: '#3f3b28', light: '#e3d9b0', rim: '#c9a96b', glow: '#a67c2e' },
  },
  {
    id: 'south-b', name: 'South B', nickname: 'The Mixing Bowl', zone: 'South side',
    vibe: 'Half the estate is shawarma, the other half is checkers. You pick.',
    tempo: 'steady', handshake: 'South B, pole pole — rush na watu wawili.',
    venues: ['Madonna Corner', 'South B Arcade', 'Bellevue Grounds'],
    tint: { dark: '#2e4a4a', light: '#d9e6e2', rim: '#6ec9c0', glow: '#3fa5a0' },
  },
  {
    id: 'langata', name: "Lang'ata", nickname: 'The Wild Reserve', zone: 'South side',
    vibe: 'Close to the park, close to the money. Bold games run long here.',
    tempo: 'slow', handshake: "Lang'ata is chilled — long games, big reads.",
    venues: ['Uhuru Gardens Side', 'Langata Market Stage', 'Oloolua View House'],
    tint: { dark: '#3d4a2e', light: '#e2e6c8', rim: '#a9c26e', glow: '#7a9a3f' },
  },
  {
    id: 'umoja', name: 'Umoja', nickname: 'Unity Block', zone: 'Eastlands',
    vibe: 'Neighborly tables — everyone knows everyone, and everyone counts.',
    tempo: 'steady', handshake: 'Umoja! Unity is strength — kweli mpaka checkers.',
    venues: ['Umoja One Grounds', 'Stadium Parking', 'Unity Youth Corner'],
    tint: { dark: '#4a2f2f', light: '#e6d2d0', rim: '#cf8a8a', glow: '#c95b5b' },
  },
  {
    id: 'ngong-road', name: 'Ngong Road', nickname: 'The Corridor', zone: 'CBD ring',
    vibe: 'One long road from the CBD to the green — tables all along it.',
    tempo: 'steady', handshake: 'Ngong Road ni corridor ya champions!',
    venues: ['Adams Arcade Veranda', 'Ngong Road View', 'The Junction Nook'],
    tint: { dark: '#33526b', light: '#cfe0ea', rim: '#7fb3d9', glow: '#4a8fc4' },
  },
  {
    id: 'roysambu', name: 'Roysambu', nickname: 'The New Money', zone: 'North',
    vibe: 'Student-friendly, wall-to-wall. Fast tables, quick wits, quick pockets.',
    tempo: 'fast', handshake: 'Roysambu! Usijalie — board iko hot.',
    venues: ['Roysambu Level One', 'Thome Corner', 'USIU Gate Stage'],
    tint: { dark: '#2a4a3d', light: '#d8e8df', rim: '#6ec9a0', glow: '#3fa57a' },
  },
];

export const ESTATE_IDS: readonly string[] = ESTATES.map((e) => e.id);

export function estateById(id: string): Estate | null {
  return ESTATES.find((e) => e.id === id) ?? null;
}

/** Weighted pick — Eastlands/South side tables are the "harder" venues. */
export function pickEstate(rng: Rng, trail: readonly string[] = []): Estate {
  const fresh = ESTATES.filter((e) => !trail.includes(e.id));
  const pool = fresh.length >= 3 ? fresh : ESTATES;
  return pick(rng, pool);
}

/** Deterministic venue-of-the-day for an estate, stable for a calendar day. */
export function venueOfDay(estateId: string, daySeed = new Date().toDateString()): string | null {
  const e = estateById(estateId);
  if (!e) return null;
  return e.venues[randomIntBetween(seedRng(`${estateId}:${daySeed}`), 0, e.venues.length - 1)] ?? null;
}

/** First capture at an estate tastes like home. Pure flavor. */
export function handshake(estateId: string): string {
  return estateById(estateId)?.handshake ?? 'Karibu — the board is set.';
}

/** A fresh neighbourhood for a fresh session. */
export function freshVenue(rng: Rng): { estate: Estate; venue: string } {
  const estate = pickEstate(rng);
  return { estate, venue: estate.venues[0] ?? estate.name };
}