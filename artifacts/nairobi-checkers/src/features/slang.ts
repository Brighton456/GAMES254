/**
 * esther · SLANG — the voice of the tables. Seeded Sheng/Swahili lines for the
 * bot, the crowd, and your own crowing. Everything is pickable off ONE Rng so a
 * room seed can replay the exact same banter (fairness + tests).
 *
 * read-only consumer of `lib/random`.
 */

import { pick, type Rng } from '../lib/random';

export type LineKind =
  | 'taunt'        // bot trash-talk
  | 'praise'       // you did something pretty
  | 'win'          // you won
  | 'loss'         // you lost
  | 'draw'         // everybody shakes hands
  | 'ambient'      // crowd / radio noise
  | 'matatu';      // matatu-style door slogan

export const LINES: Record<LineKind, readonly string[]> = {
  taunt: [
    'Wacha upuzi, shemeji!',
    'Hii board haijui kuhurumia.',
    'Unaweza kulala juu ya hii?',
    'Ndio ujue Beatles sita.',
    'Mchezo wangu ni mchezo wa bosi.',
    'Huyo mfalme wako amekwama ndani.',
    'Checkers ni kazi, usipige siasa.',
    'Angalia harambee yako, si yangu.',
    'Vitu hivi vinakula mwana wako?',
    'Makikufa! Angalia hoja yako.',
  ],
  praise: [
    'Kumbe umepewa wings!',
    'Hiyo capture ilikuwa kachemu.',
    'Una spirit ya mtaa, respec.',
    'Mfalme wako sio mchoyo, anatembea!',
    'Umechanga vizuri — asante bwana.',
    'Sharp! Siku hii umeamka na bado.',
    'Kipande kimeenda toka Nairobi to Mombasa.',
    'Leo una bidii, niweke pembeni!',
  ],
  win: [
    'Nyuki mbili! Umenikausha.',
    'Imebidi tuinama. Hongera bwana.',
    'Umelowa! Kesho tutakula upya.',
    'Board hii imesema — wewe ni bosi.',
    'Hapo ndio Nairobi Legends zinatoka.',
    'Sawa, umenishinda. Lakini sio kila siku!',
    'Ziki! Umenipa kozi ya kutosha.',
  ],
  loss: [
    'Mama, hii ni ziara ya mwenzio.',
    'Usifunguke. Kote ni shule.',
    'Mpira ulikuwa mzito leo.',
    'Shukran kwa stima, tutaamka kesho.',
    'Ni wale ngoma, ama unataka revenge?',
    'Dokotori hii hooka — usijali.',
    'Kumbe mwenzako ndiye bwana wa hii meza.',
  ],
  draw: [
    'Sawa, imefanana — tutakavyogusana kesho.',
    'Bora leo imekula nondo, hakuna hasara.',
    'Ni ngoma ya kuchekesha, tumeelewana. Ngoma tena!',
    'Usawa ni usawa — hapmap kwa tao.',
    'Tunaitwa twice. Mchezo gwengi!',
  ],
  ambient: [
    'Matatu inatuambia — board yenyewe ni point.',
    'Machaa ya Nairobi yamejuu leo hullo?',
    'Radio inasema: tabia ni maisha.',
    'Mama mboga nje kasema: mchezaji mwema hana uharibifu.',
    'Nairobi haiji! Iko tu hii meza.',
  ],
  matatu: [
    '“Miamba” haipendi watu waoga.',
    '“42 Dreams” — ndoto zinaanzia apa.',
    '“Ipo Sana” — hiyo ndio siri ya board.',
    '“Crown Express” — mfalme ndiye dereva.',
    '“Legend Zinduka” — amka na ushinde.',
  ],
};

/** Draw one line of a kind from a caller-provided Rng (seeded for replay). */
export function line(kind: LineKind, rng: Rng): string {
  return pick(rng, LINES[kind]);
}

/** Keep a "voice" for a match: n lines drawn without repeating. */
export function voice(kind: LineKind, rng: Rng, count: number): string[] {
  const pool = [...LINES[kind]];
  const out: string[] = [];
  while (out.length < count && pool.length) {
    const index = Math.floor(rng() * pool.length);
    out.push(pool.splice(index, 1)[0]!);
  }
  return out;
}

const SWAHILI_ONES: readonly string[] = [
  'sifuri', 'moja', 'mbili', 'tatu', 'nne', 'tano', 'sita', 'saba', 'nane',
  'tisa', 'kumi', 'kumi na moja', 'kumi na mbili',
];

/** Swahili word for 0..12, with an English fallback beyond. */
export function swahiliCount(n: number): string {
  if (!Number.isInteger(n) || n < 0) return '';
  return n <= 12 ? (SWAHILI_ONES[n] ?? '') : String(n);
}

/** Short Sheng number phrase, e.g. "hoja gani inaenda kwenye hoja tano?" */
export function countPhrase(n: number): string {
  return swahiliCount(n) || `${n}-kipande`;
}

/** A full banter "play-by-play" line: which ply, which state. */
export function playByPlay(rng: Rng, ply: number, dc: number): string {
  const act = line(ply % 3 === 0 ? 'ambient' : 'taunt', rng);
  return `Ply ${swahiliCount(ply)} · ${dc ? `${swahiliCount(dc)}-bar ya vibao` : 'board imepoa'} · ${act}`;
}