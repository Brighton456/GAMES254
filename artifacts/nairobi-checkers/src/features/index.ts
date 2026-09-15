/**
 * esther · FEATURES — barrel for the culture + gameplay pack.
 * Everything the Duel Lab UI needs is re-exported here so the page imports
 * from ONE surface. Additive-only; never touches lib/ or game-engine files.
 */

export * from './estates';
export * from './slang';
export * from './bets';
export * from './achievements';
export * from './clock';
export * from './variants';
export * from './stats';
export * from './tactics';
export * from './code';

export const ESTHER_FEATURES_VERSION = '0.1.0';
export const ESTHER_NAMESPACE = 'esther.nafasi';