/**
 * Play hub — choose your table: house bot, local partner (pass & play), or the
 * cash ladder. Exposes the deep preference panel (board size, king flight,
 * forced captures) and the 5-second “Double or Nothing” re-entry window.
 */
import { useState } from 'react';
import {
  ArrowRight, Bot, Crown, Gamepad2, Landmark, LockKeyhole, Sparkles, Users, Zap,
} from 'lucide-react';
import { BOARD_SIZES, KING_MODES } from './game-engine';
import type { Settings } from './settings-store';
import { FEE_PRESETS } from './settings-store';

const STAKES = [50, 100, 250, 500];
const HIGH_STAKE = 500;

export type GameLaunch = { kind: 'bot' | 'partner' | 'cash'; stake: number };

type Props = {
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  mode: 'demo' | 'cash';
  hasAccount: boolean;
  onRequestAccount: () => void;
  onLaunch: (launch: GameLaunch) => void;
  doubleOffer: { stake: number; secondsLeft: number } | null;
  onAcceptDouble: () => void;
  onDismissDouble: () => void;
  cashBalance: number;
};

function StakeButton({ value, active, onClick }: { value: number; active: boolean; onClick: () => void }) {
  const plasma = value >= HIGH_STAKE;
  return (
    <button
      onClick={onClick}
      data-testid={`button-stake-${value}`}
      className={`relative rounded-xl border py-3 font-mono-custom text-sm transition ${active ? 'border-[#d6a944] bg-[#3b321e] text-[#f0d480]' : 'border-[#345346] bg-[#142e25] text-[#9ab0a1] hover:border-[#d6a944]/50'} ${plasma ? 'stake-plasma' : ''}`}
    >
      {value}
      {plasma && <span className="absolute -top-2 right-2 rounded-full bg-[#d6a944] px-1.5 text-[8px] font-bold text-[#132a22]">HIGH</span>}
    </button>
  );
}

export function PlayEnhanced(props: Props) {
  const { settings, onSettingsChange, mode, hasAccount, onRequestAccount, onLaunch, doubleOffer, onAcceptDouble, onDismissDouble, cashBalance } = props;
  const [tab, setTab] = useState<'bot' | 'partner' | 'cash'>('bot');
  const [stake, setStake] = useState(100);

  const update = (patch: Partial<Settings>) => onSettingsChange({ ...settings, ...patch });

  return (
    <div className="reveal">
      {doubleOffer && (
        <div className="double-banner mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6a944]/60 bg-[#2f2a15] px-5 py-4 shadow-[0_0_36px_rgba(214,169,68,.25)]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d6a944] text-[#132a22]"><Zap size={18} /></span>
            <div>
              <div className="font-display text-sm font-bold text-[#f0d37c]">Double or nothing?</div>
              <div className="text-[11px] text-[#c9b878]">Re-enter the queue at KSh {doubleOffer.stake * 2} before the window closes.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono-custom text-2xl font-bold text-[#f0d37c]" data-testid="text-double-countdown">{doubleOffer.secondsLeft}s</span>
            <button onClick={onAcceptDouble} data-testid="button-accept-double" className="btn-primary rounded-lg px-4 py-2 text-xs font-bold">Run it back ×2</button>
            <button onClick={onDismissDouble} data-testid="button-dismiss-double" className="btn-quiet rounded-lg px-3 py-2 text-xs font-bold">Bank the win</button>
          </div>
        </div>
      )}

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 font-mono-custom text-[10px] font-medium uppercase tracking-[.22em] text-[#d6a944]">The playground</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#f0e7cf] sm:text-4xl">Choose your table.</h1>
          <p className="mt-2 max-w-xl text-sm text-[#819a8d]">Play the house bot, pass &amp; play with a partner on one screen, or climb the cash ladder. The rules are yours to shape.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#29483a] bg-[#102a21] p-1 mobile-scroll">
        {([
          { id: 'bot', label: 'Play the computer', icon: Bot, test: 'tab-bot' },
          { id: 'partner', label: 'Partner (same screen)', icon: Users, test: 'tab-partner' },
          { id: 'cash', label: 'Cash ladder', icon: Landmark, test: 'tab-cash' },
        ] as const).map(({ id, label, icon: Icon, test }) => (
          <button key={id} data-testid={test} onClick={() => setTab(id)} className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold ${tab === id ? 'bg-[#d6a944] text-[#173229]' : 'text-[#91aa9c]'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8">
          <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full border border-[#d6a944]/15" />
          {tab === 'bot' && (
            <>
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.22em] text-[#829a8d]"><Gamepad2 size={13} className="text-[#d6a944]" /> Free · no account needed</div>
              <h2 className="font-display text-2xl font-bold">Play the house.</h2>
              <p className="mt-2 max-w-sm text-sm text-[#819a8d]">The Games254 bot thinks in trees, not vibes. Pick its temperament and board shape below.</p>
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold text-[#b9c9bd]">Bot temperament</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <button key={level} data-testid={`button-difficulty-${level.toLowerCase()}`} onClick={() => update({ difficulty: level })} className={`rounded-xl border px-3 py-3 text-left ${settings.difficulty === level ? 'border-[#d6a944] bg-[#3a321e]' : 'border-[#355447] bg-[#142e25]'}`}>
                      <div className="text-sm font-bold">{level}</div>
                      <div className="text-[10px] text-[#819a8d]">{level === 'Easy' ? 'Learns with you' : level === 'Medium' ? 'Reads the room' : 'No mercy tonight'}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => onLaunch({ kind: 'bot', stake: 0 })} data-testid="link-start-ai-game" className="btn-primary mt-7 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold">
                Start {settings.difficulty} game <ArrowRight size={17} />
              </button>
            </>
          )}
          {tab === 'partner' && (
            <>
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.22em] text-[#829a8d]"><Users size={13} className="text-[#d6a944]" /> Pass &amp; play · one device</div>
              <h2 className="font-display text-2xl font-bold">Two minds, one board.</h2>
              <p className="mt-2 max-w-sm text-sm text-[#819a8d]">Hand the phone across the table after every move. No clocks pressure, no stakes — pure rivalry.</p>
              <ul className="mt-6 space-y-2 text-xs text-[#a7bcab]">
                <li className="flex gap-2"><Crown size={14} className="mt-0.5 shrink-0 text-[#d6a944]" /> Gold moves first, forest answers.</li>
                <li className="flex gap-2"><Sparkles size={14} className="mt-0.5 shrink-0 text-[#d6a944]" /> Kings glow — crowning one still explodes in particles.</li>
                <li className="flex gap-2"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-[#d6a944]" /> No account, no stake, no tracking. It is your table.</li>
              </ul>
              <button onClick={() => onLaunch({ kind: 'partner', stake: 0 })} data-testid="link-start-partner-game" className="btn-primary mt-7 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold">
                Start partner match <ArrowRight size={17} />
              </button>
            </>
          )}
          {tab === 'cash' && (
            <>
              <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.22em] text-[#829a8d]"><Landmark size={13} className="text-[#d6a944]" /> {mode === 'cash' ? 'Simulated cash' : 'Demo chips'}</div>
              <h2 className="font-display text-2xl font-bold">The cash ladder.</h2>
              <p className="mt-2 max-w-sm text-sm text-[#819a8d]">
                {mode === 'cash'
                  ? `Winner takes the pool minus the ${settings.houseFeePercent}% house fee, shown before entry. Balance: KSh ${cashBalance.toLocaleString('en-KE')}.`
                  : 'Free demo chips — flip to Real Cash (account required) when you are ready for the real ladder.'}
              </p>
              <div className="mt-6">
                <div className="mb-2 text-xs font-bold text-[#b9c9bd]">Stake (KSh)</div>
                <div className="grid grid-cols-4 gap-2">
                  {STAKES.map((value) => <StakeButton key={value} value={value} active={stake === value} onClick={() => setStake(value)} />)}
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[#345346] bg-[#142e25] p-3 text-[11px] text-[#8fa89b]">
                Entry KSh {stake} × 2 players = KSh {stake * 2} pool · house fee {settings.houseFeePercent}% (KSh {Math.round(stake * 2 * settings.houseFeePercent) / 100}) · winner takes KSh {stake * 2 - Math.round(stake * 2 * settings.houseFeePercent) / 100}
              </div>
              {mode === 'cash' && !hasAccount ? (
                <button onClick={onRequestAccount} data-testid="button-cash-needs-account" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d6a944]/40 bg-[#3b321e] py-3.5 text-xs font-bold text-[#f0d37c]">
                  Create an account to enter cash tables <ArrowRight size={15} />
                </button>
              ) : (
                <button onClick={() => onLaunch({ kind: 'cash', stake })} data-testid="link-start-cash-game" className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold">
                  Enter the ladder · KSh {stake} <ArrowRight size={17} />
                </button>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4">
          <section className="glass-panel-soft rounded-2xl p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Sparkles size={16} className="text-[#d6a944]" /> Board preferences</h2>
            <div className="mb-4">
              <div className="mb-2 text-xs font-bold text-[#b9c9bd]">Board size (rows &amp; columns)</div>
              <div className="grid grid-cols-4 gap-2">
                {BOARD_SIZES.map((size) => (
                  <button key={size} data-testid={`button-size-${size}`} onClick={() => update({ rules: { ...settings.rules, size } })} className={`rounded-lg border py-2.5 font-mono-custom text-xs ${settings.rules.size === size ? 'border-[#d6a944] bg-[#3b321e] text-[#f0d480]' : 'border-[#345346] bg-[#142e25] text-[#9ab0a1]'}`}>
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="mb-2 text-xs font-bold text-[#b9c9bd]">How kings fly</div>
              <div className="space-y-2">
                {KING_MODES.map((kingMode) => (
                  <button key={kingMode.value} data-testid={`button-king-${kingMode.value}`} onClick={() => update({ rules: { ...settings.rules, kingMode: kingMode.value } })} className={`w-full rounded-xl border p-3 text-left ${settings.rules.kingMode === kingMode.value ? 'border-[#d6a944] bg-[#3a321e]' : 'border-[#355447] bg-[#142e25]'}`}>
                    <div className="flex items-center gap-2 text-sm font-bold"><Crown size={13} className="text-[#d6a944]" /> {kingMode.label}</div>
                    <div className="text-[10px] text-[#819a8d]">{kingMode.hint}</div>
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#345346] bg-[#142e25] p-3 text-xs font-semibold">
              <span>Forced captures (house rule)</span>
              <input type="checkbox" checked={settings.rules.forcedCapture} onChange={(event) => update({ rules: { ...settings.rules, forcedCapture: event.target.checked } })} className="h-4 w-4 accent-[#d6a944]" />
            </label>
            <label className="mt-2 flex cursor-pointer items-center justify-between rounded-xl border border-[#345346] bg-[#142e25] p-3 text-xs font-semibold">
              <span>Show move hints</span>
              <input type="checkbox" checked={settings.showHints} onChange={(event) => update({ showHints: event.target.checked })} className="h-4 w-4 accent-[#d6a944]" />
            </label>
          </section>

          <section className="glass-panel-soft rounded-2xl p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Fee transparency</h2>
            <div className="grid grid-cols-3 gap-2">
              {FEE_PRESETS.map((value) => (
                <div key={value} className={`rounded-lg border py-2 text-center text-xs font-bold ${settings.houseFeePercent === value ? 'border-[#d6a944] bg-[#3b321e] text-[#f0d37c]' : 'border-[#345346] bg-[#142e25] text-[#9ab0a1]'}`}>{value}%</div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#7f9789]">The house fee is deducted from every cash prize pool — winners always see the split before entry. Free tables never carry a fee.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
