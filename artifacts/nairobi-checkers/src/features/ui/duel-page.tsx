/**
 * esther · DUEL PAGE — the /duel "Mtaa Duel Lab": pass-and-play session studio.
 * Zero cash-balance mutation (ledger stays with the wallet seam) — this is the
 * culture + matchmaking + odds surface.
 */
import { useMemo, useState } from 'react';
import { Flame, ShieldCheck, Swords } from 'lucide-react';
import {
  PageTitle, money, useToastMessage, Toast,
} from '../../components/shell';
import { loadCareer } from '../../components/game/player-store';
import {
  createDuelSession, joinDuel, sessionRng, toSeed, type DuelSession,
} from '../code';
import { loadUnlocked } from '../achievements';
import { variantById, VARIANTS } from '../variants';
import type { SideBet } from '../bets';
import { RoomPanel } from './room-panel';
import { BetsPanel } from './bets-panel';
import { EstatePicker } from './estate-picker';
import { TauntStrip } from './taunt-strip';
import { ClockPanel } from './clock-panel';
import { MedalsPanel } from './medals-panel';
import { CoachPanel } from './coach-panel';

const MODE_LABEL: Record<'demo' | 'cash', string> = { demo: 'Demo', cash: 'Real cash' };

export function DuelPage() {
  const { toast, showToast } = useToastMessage();
  const [session, setSession] = useState<DuelSession | null>(null);
  const [variantId, setVariantId] = useState('sanza');
  const [cash, setCash] = useState<'demo' | 'cash'>('demo');
  const [stake, setStake] = useState('100');
  const [bets, setBets] = useState<SideBet[]>([]);
  const [estateId, setEstateId] = useState('kilimani');

  const career = useMemo(() => loadCareer(), []);
  const unlocked = useMemo(() => loadUnlocked(), []);

  const seed = session ? toSeed({ code: session.code, estateId: session.estateId, variantId: session.variantId, joined: session.joined }) : 'duel-seed';
  const sessionRngForSeed = session ? sessionRng(session) : null;

  const create = () => {
    const made = createDuelSession({
      estateId,
      variantId,
      cash: cash === 'cash',
      stakeKsh: Number(stake) || 0,
      bets,
    });
    if (made) {
      setSession(made);
      showToast(`Table ${made.code} is live — pass the code.`);
    }
  };

  const join = (code: string) => {
    const joined = joinDuel(code);
    if (joined) {
      setSession(joined);
      setEstateId(joined.estateId);
      setVariantId(joined.variantId);
      showToast(`You're in at ${joined.code}. Pole pole.`);
    } else {
      showToast(`No live table ${code} — host one first.`);
    }
  };

  const copy = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text).then(() => showToast(label)).catch(() => showToast(label));
  };

  const variant = variantById(variantId) ?? variantById('sanza')!;

  return (
    <div className="reveal">
      <PageTitle
        eyebrow="Agent esther · culture pack"
        title="Duel Lab."
        copy="Your neighbourhood, a house-rule variant, side wagers, and a Sanza clock — one seedable local table. Cash settlement rides the wallet seam, not this board."
        action={<div className="flex items-center gap-2 rounded-full border border-[#27875b]/50 bg-[#153429] px-3 py-2 text-xs text-[#74dca0]"><ShieldCheck size={14} /> Pass &amp; play</div>}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <RoomPanel session={session} onCreate={create} onJoin={join} onCopy={copy} />

          <div className="glass-panel rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <Swords size={17} className="text-[#d6a944]" />
              <h3 className="font-display font-bold">Table setup</h3>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  data-testid={`esther-variant-${v.id}`}
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${v.id === variantId ? 'border-[#d6a944] bg-[#d6a944]/15' : 'border-[#345346] bg-[#102821] opacity-80'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{v.name}</span>
                    <span className="font-mono-custom text-[9px] uppercase tracking-wider text-[#d6a944]">{v.hus}</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-snug text-[#819a8d]">{v.hint}</div>
                  <div className="mt-1.5 font-mono-custom text-[9px] text-[#5c7567]">{v.rules.size}×{v.rules.size} · {v.rules.kingMode} · {v.clock ? `${Math.round(v.clock.initialSec / 60)}m` : 'no clock'}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#456253] bg-[#102821] p-1">
                <button onClick={() => setCash('demo')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${cash === 'demo' ? 'bg-[#d6a944] text-[#132a22]' : 'text-[#8fa99b]'}`}>Demo</button>
                <button onClick={() => setCash('cash')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${cash === 'cash' ? 'bg-[#1f8d5b] text-[#e4f3e5]' : 'text-[#8fa99b]'}`}>Cash</button>
              </div>
              {cash === 'cash' && (
                <label className="flex items-center gap-2 rounded-lg border border-[#456253] bg-[#102821] px-3 py-2 text-xs text-[#819a8d]">
                  Stake
                  <input
                    data-testid="esther-input-stake"
                    value={stake}
                    onChange={(event) => setStake(event.target.value.replace(/[^\d]/g, ''))}
                    inputMode="numeric"
                    className="w-20 bg-transparent font-mono-custom text-sm text-[#f0d37c] focus:outline-none"
                  />
                </label>
              )}
              <div className="ml-auto flex items-center gap-1.5 text-xs text-[#b9c9bd]">
                <Flame size={14} className="text-[#e0b957]" />
                <span>{session ? `Live as ${MODE_LABEL[session.cash ? 'cash' : 'demo']}` : 'No active table'}</span>
              </div>
            </div>
          </div>

          <BetsPanel bets={bets} onAdd={(bet) => setBets((list) => [...list, bet])} onRemove={(id) => setBets((list) => list.filter((b) => b.id !== id))} />
          <TauntStrip seed={seed} />
          <CoachPanel />
        </div>

        <div className="space-y-5">
          <EstatePicker estateId={estateId} onChange={setEstateId} />
          <ClockPanel variant={variant} />
          <MedalsPanel career={career} unlocked={unlocked} />
          <div className="glass-panel-soft rounded-2xl p-5">
            <div className="mb-2 text-[10px] uppercase tracking-[.2em] text-[#789385]">Session seed</div>
            <p className="break-all font-mono-custom text-[11px] leading-relaxed text-[#62d694]">{seed}</p>
            <p className="mt-2 text-[10px] leading-relaxed text-[#5c7567]">
              Same code + same seed replays the same banter and odds stream — that is the fairness contract.
              {sessionRngForSeed && ' Mid-table: earnings suggestions are wired but the wallet ledger stays with the owner seam.'}
            </p>
            {session && <p className="mt-2 text-xs text-[#819a8d]">Stake visible at the table: {money(cash === 'cash' ? Number(stake) || 0 : 0)}</p>}
          </div>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}