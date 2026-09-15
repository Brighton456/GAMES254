/**
 * esther · COACH PANEL — the engine's house read on the current side to move.
 * Uses opencode's engine (read-only) + my tactics bridge.
 */
import { BrainCircuit, type LucideIcon } from 'lucide-react';
import { GraduationCap } from 'lucide-react';
import { makeBoard, type GameRules } from '../../components/game/game-engine';
import { suggestions, type TipKind } from '../tactics';

export const TIP_ICONS: Record<TipKind, LucideIcon> = {
  forced: GraduationCap,
  chain: GraduationCap,
  threat: GraduationCap,
  king: GraduationCap,
  guard: GraduationCap,
  center: GraduationCap,
};

/** Demo position: standard 8×8, gold to move, with a few live threats. */
export function demoBoard() {
  const board = makeBoard(8);
  // Gold men near the center, forest men ready to bite — makes tips non-trivial.
  board[2]![3] = { color: 'gold', king: false };
  board[3]![4] = { color: 'gold', king: false };
  board[4]![5] = { color: 'gold', king: false };
  board[5]![2] = { color: 'forest', king: false };
  board[5]![4] = { color: 'forest', king: false };
  board[6]![3] = { color: 'forest', king: false };
  return board;
}

const demoRules: GameRules = { size: 8, kingMode: 'fly-far', forcedCapture: true, promotionStop: true };

export function CoachPanel() {
  const tips = suggestions(demoBoard(), 'gold', demoRules);
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <BrainCircuit size={17} className="text-[#d6a944]" />
        <h3 className="font-display font-bold">Coach read</h3>
        <span className="ml-auto rounded-full bg-[#153429] px-2 py-0.5 text-[10px] text-[#62d694]">engine v1 · demo table</span>
      </div>
      {tips.length === 0 && <p className="text-xs text-[#819a8d]">The board is quiet — come back when pieces bite.</p>}
      <ul className="space-y-2">
        {tips.map((tip) => {
          const Icon = TIP_ICONS[tip.kind] ?? GraduationCap;
          return (
            <li key={tip.id} className="flex items-start gap-2.5 rounded-xl border border-[#345346] bg-[#102821] px-3 py-2.5">
              <Icon size={15} className="mt-0.5 shrink-0 text-[#d6a944]" />
              <div className="min-w-0">
                <div className="text-xs leading-snug text-[#f0e2b8]">{tip.copy}</div>
                <div className="font-mono-custom text-[9px] uppercase tracking-[.18em] text-[#62d694]">{tip.sw}</div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[10px] text-[#5c7567]">Live coaching hooks straight into <span className="font-mono-custom">game-engine</span> — same legal-move truth the bot uses.</p>
    </div>
  );
}