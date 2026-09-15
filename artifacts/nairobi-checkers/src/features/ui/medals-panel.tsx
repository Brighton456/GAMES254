/**
 * esther · MEDALS PANEL — the medal wall. Read-only over the shared career
 * store (player-store) + my achievement module.
 */
import { Award, Lock } from 'lucide-react';
import { unlockedMedals, lockedMedals, type MedalTier } from '../achievements';
import { titleFor } from '../../components/game/player-store';
import type { Career } from '../../components/game/player-store';

type Props = {
  career: Career;
  unlocked: ReadonlySet<string>;
};

const TIER_CLASS: Record<MedalTier, string> = {
  bronze: 'text-[#d39d74] border-[#a06a43]/60',
  silver: 'text-[#c9d6e8] border-[#8fa7c9]/60',
  gold: 'text-[#f0d37c] border-[#d6a944]/70',
  platinum: 'text-[#9fd8d2] border-[#5fb8ae]/70',
};

function MedalCard({ name, sw, tier, locked }: { name: string; sw: string; tier: MedalTier; locked: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${TIER_CLASS[tier]} ${locked ? 'opacity-45' : ''}`}>
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${TIER_CLASS[tier]} bg-[#102821]`}>
        {locked ? <Lock size={14} className="text-[#5c7567]" /> : <Award size={15} />}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-bold">{name}</div>
        <div className="truncate text-[10px] text-[#7f9789]">{sw}{locked ? ' · locked' : ''}</div>
      </div>
    </div>
  );
}

export function MedalsPanel({ career, unlocked }: Props) {
  const have = unlockedMedals(unlocked);
  const rest = lockedMedals(unlocked);
  const level = titleFor(career.xp).level;
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <Award size={17} className="text-[#d6a944]" />
        <h3 className="font-display font-bold">Medal wall</h3>
        <span className="ml-auto rounded-full bg-[#153429] px-2 py-0.5 font-mono-custom text-[10px] text-[#62d694]">{have.length}/{have.length + rest.length} · LVL {level}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {[...have, ...rest].map((medal) => (
          <MedalCard key={medal.id} name={medal.name} sw={medal.sw} tier={medal.tier} locked={!unlocked.has(medal.id)} />
        ))}
      </div>
    </div>
  );
}