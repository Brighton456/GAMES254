/**
 * Tournament page — the night-circuit bracket view with a live registration
 * countdown. Extracted from App.tsx with identical testids.
 */
import { useEffect, useState } from 'react';
import { LockKeyhole, RefreshCw } from 'lucide-react';
import { PageTitle, secureInt } from '@/components/shell';
import type { Settings } from '@/components/game/settings-store';

function StatBlock({ label, value }: { label: string; value: string }) { return <div className="glass-panel-soft rounded-xl p-4"><div className="text-[10px] uppercase tracking-wider text-[#819a8d]">{label}</div><div className="mt-2 font-display text-xl font-bold text-[#e8d18a]">{value}</div></div>; }

export function TournamentPage({ showToast, settings }: { showToast: (message: string) => void; settings: Settings }) {
  const rounds = [
    { label: 'Quarterfinals', players: [['Wanjiku', 'Otieno'], ['Amani', 'Kiptoo'], ['Milly', 'Barasa'], ['Muthoni', 'Achieng']] },
    { label: 'Semifinals', players: [['Wanjiku', 'Amani'], ['Milly', '—']] },
    { label: 'Final', players: [['TBD', 'TBD']] },
  ];
  const pool = 12500;
  const fee = Math.round(pool * (settings.houseFeePercent / 100));
  const [countdown, setCountdown] = useState(206); // 03:26
  const finale = countdown <= 10;
  useEffect(() => {
    const timer = window.setInterval(() => setCountdown((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const clock = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`;
  useEffect(() => {
    if (!finale) return;
    void import('@/components/game/audio-engine').then((mod) => mod.setHeartbeatMode(true));
    return () => { void import('@/components/game/audio-engine').then((mod) => mod.setHeartbeatMode(false)); };
  }, [finale]);
  return <div className="reveal">
    <PageTitle eyebrow="The night circuit" title="Kilimani Knockout." copy="Eight seats. One crown. Every round stays open until the last move is logged." action={<div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${finale ? 'border-[#ff8f7a]/60 bg-[#3a1f1a] text-[#ffb3a5]' : 'border-[#4e6c5d] bg-[#153429] text-[#b5c9b9]'}`}><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> Registration closes in {clock}</div>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatBlock label="Prize pool" value={`KSh ${(pool - fee).toLocaleString('en-KE')}`} /><StatBlock label="House fee" value={`${settings.houseFeePercent}% · KSh ${fee.toLocaleString('en-KE')}`} /><StatBlock label="Closes in" value={clock} /></div>
    <section className="glass-panel overflow-x-auto rounded-2xl p-5 sm:p-8">
      <div className="mb-8 flex min-w-[700px] items-center justify-between"><div><div className="text-[10px] uppercase tracking-[.2em] text-[#d6a944]">Live bracket</div><h2 className="mt-2 font-display text-xl font-bold">Road to the rooftop table</h2></div><button data-testid="button-refresh-bracket" onClick={() => showToast('Bracket refreshed — results sync when both players report.')} className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"><RefreshCw size={14} /> Refresh</button></div>
      <div className="flex min-w-[700px] gap-6">
        {rounds.map((round, roundIndex) => <div className="flex min-w-[190px] flex-1 flex-col" key={round.label}>
          <div className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#819a8d]">{round.label}</div>
          <div className="flex flex-1 flex-col justify-around gap-4">
            {round.players.map((players, index) => <div key={index} className="glass-panel-soft relative rounded-xl p-3">
              {players.map((player, pIndex) => <div key={player + pIndex} className={`flex items-center justify-between py-1.5 text-xs ${pIndex === 0 ? 'border-b border-[#315144]' : ''}`}><span className={player === 'Amani' || player === 'Wanjiku' ? 'font-bold text-[#f0d37c]' : 'text-[#c1d0c3]'}>{player}</span>{player !== 'TBD' && player !== '—' && <span className="font-mono-custom text-[10px] text-[#789385]">{secureInt(3) + 1}</span>}</div>)}
              {roundIndex < 2 && <span className="absolute -right-6 top-1/2 hidden h-px w-6 bg-[#496857] sm:block" />}
            </div>)}
          </div>
        </div>)}
      </div>
      <div className="mt-8 flex items-center gap-2 border-t border-[#345346] pt-5 text-xs text-[#819a8d]"><LockKeyhole size={14} className="text-[#d6a944]" /> Bracket updates when both players submit a result. Async play stays fair.</div>
    </section>
  </div>;
}