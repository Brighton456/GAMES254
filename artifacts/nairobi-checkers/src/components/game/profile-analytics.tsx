/**
 * My Profile — complete player analytics: current title, XP progress bar,
 * lifetime career win/loss metrics, streaks, and cumulative M-Pesa cash-outs.
 */
import { Award, Download, Swords, Target, TrendingUp } from 'lucide-react';
import { titleFor, TITLES, winXp, lossXp, type Career, type MatchRecord } from './player-store';

const KIND_LABEL: Record<MatchRecord['kind'], string> = { bot: 'vs House AI', partner: 'Partner duel', cash: 'Cash ladder' };

export function ProfileAnalytics({ career, displayName, onExport, showToast }: { career: Career; displayName: string; onExport: () => void; showToast: (message: string) => void }) {
  const title = titleFor(career.xp);
  const span = Math.max(1, title.ceiling - title.floor);
  const progress = Math.min(100, Math.round(((career.xp - title.floor) / span) * 100));
  const totalGames = career.wins + career.losses;
  const winRate = totalGames ? Math.round((career.wins / totalGames) * 100) : 0;
  const netCash = career.cashIns - career.cashOuts;
  const recent = career.matches.slice(0, 6);

  return (
    <div className="reveal">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 font-mono-custom text-[10px] font-medium uppercase tracking-[.22em] text-[#d6a944]">The player behind the moves</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#f0e7cf] sm:text-4xl">Your career.</h1>
          <p className="mt-2 max-w-xl text-sm text-[#819a8d]">Every capture, crown and cash-out — logged locally on this device.</p>
        </div>
        <button onClick={onExport} data-testid="button-export-ledger" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"><Download size={14} /> Export ledger</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
        <section className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#d6a944] font-display text-xl font-bold text-[#153028]">
              {displayName.trim().slice(0, 2).toUpperCase() || 'G2'}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{displayName || 'Guest player'}</h2>
              <p className="text-xs text-[#819a8d]">Free-first · local profile</p>
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-[#d6a944]/30 bg-[#3b321e] p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#d2b75f]"><Award size={14} /> Current title</div>
            <div className="mt-2 font-display text-2xl font-bold text-[#f0d37c]" data-testid="text-player-title">Level {title.level} · {title.name}</div>
            <div className="mt-1 text-xs text-[#a9945b]">
              {title.next
                ? `${career.xp.toLocaleString('en-KE')} / ${title.next.at.toLocaleString('en-KE')} XP to ${title.next.name}`
                : `${career.xp.toLocaleString('en-KE')} XP — the summit. Nothing above the House.`}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#70582d]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#d6a944] to-[#f4d678] transition-all" style={{ width: `${title.next ? progress : 100}%` }} data-testid="bar-xp-progress" />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#345346] bg-[#142e25] p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[.18em] text-[#819a8d]">Title ladder</div>
            <div className="space-y-1.5">
              {TITLES.map((entry, index) => {
                const reached = career.xp >= entry.at;
                return (
                  <div key={entry.name} className="flex items-center gap-2 text-[11px]">
                    <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${reached ? 'bg-[#d6a944] text-[#153028]' : 'bg-[#24443a] text-[#6f8d7d]'}`}>{index + 1}</span>
                    <span className={reached ? 'font-semibold text-[#f0d37c]' : 'text-[#7f9789]'}>{entry.name}</span>
                    <span className="ml-auto font-mono-custom text-[10px] text-[#6f8d7d]">{entry.at.toLocaleString('en-KE')} XP</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric value={String(career.wins)} label="Wins" tone="green" />
            <Metric value={String(career.losses)} label="Losses" tone="red" />
            <Metric value={`${winRate}%`} label="Win rate" tone="gold" />
            <Metric value={String(career.bestStreak)} label="Best streak" tone="gold" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric value={String(career.totalCaptures)} label="Captures" />
            <Metric value={String(career.totalKings)} label="Kings crowned" />
            <Metric value={`${career.matches.length}`} label="Matches played" />
          </div>

          <div className="glass-panel-soft rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold"><TrendingUp size={17} className="text-[#d6a944]" /> M-Pesa flows (simulated)</h2>
              <span className="rounded-full bg-[#1c5e42] px-2 py-1 text-[10px] text-[#76daa0]">Local ledger</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[#345346] bg-[#142e25] p-3">
                <div className="font-mono-custom text-lg font-bold text-[#67d895]" data-testid="text-total-cash-ins">KSh {career.cashIns.toLocaleString('en-KE')}</div>
                <div className="mt-1 text-[10px] text-[#819a8d]">Prizes + deposits in</div>
              </div>
              <div className="rounded-xl border border-[#345346] bg-[#142e25] p-3">
                <div className="font-mono-custom text-lg font-bold text-[#e49b8c]" data-testid="text-total-cash-outs">KSh {career.cashOuts.toLocaleString('en-KE')}</div>
                <div className="mt-1 text-[10px] text-[#819a8d]">Withdrawn out</div>
              </div>
              <div className="rounded-xl border border-[#345346] bg-[#142e25] p-3">
                <div className={`font-mono-custom text-lg font-bold ${netCash >= 0 ? 'text-[#67d895]' : 'text-[#e49b8c]'}`}>KSh {netCash.toLocaleString('en-KE')}</div>
                <div className="mt-1 text-[10px] text-[#819a8d]">Net position</div>
              </div>
            </div>
          </div>

          <div className="glass-panel-soft rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2"><Swords size={17} className="text-[#d6a944]" /><h2 className="font-display text-xl font-bold">Recent matches</h2></div>
            {recent.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#416254] p-6 text-center text-xs text-[#7f9789]">No matches yet. The bot is warming up — go take a table.</div>
            ) : (
              <div className="space-y-1">
                {recent.map((match) => (
                  <div key={match.id} className="flex items-center gap-3 border-t border-[#345346] py-2.5 first:border-0">
                    <span className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-bold ${match.outcome === 'win' ? 'bg-[#23583f] text-[#69db9a]' : 'bg-[#49322d] text-[#e49a8b]'}`}>
                      {match.outcome === 'win' ? 'W' : 'L'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{KIND_LABEL[match.kind]} · {match.rules.size}×{match.rules.size}</div>
                      <div className="text-[10px] text-[#789385]">{new Date(match.at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })} · {match.moves} moves · {match.captureCount} captures</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-custom text-xs text-[#e3c16a]">+{match.xpDelta} XP</div>
                      {match.stake > 0 && <div className={`font-mono-custom text-[10px] ${match.cashDelta > 0 ? 'text-[#67d895]' : 'text-[#c7aaa0]'}`}>{match.cashDelta > 0 ? `+ KSh ${match.cashDelta.toLocaleString('en-KE')}` : `− KSh ${match.stake.toLocaleString('en-KE')}`}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#345346] bg-[#122c23] p-4 text-[11px] leading-relaxed text-[#7f9789]">
            <div className="mb-1 flex items-center gap-2 font-bold text-[#bdcdbf]"><Target size={14} className="text-[#d6a944]" /> Earning XP</div>
            Win a match: +{winXp(1)}–{winXp(5)} XP by level · Lose: +{lossXp(1)}–{lossXp(5)} XP for showing up. Captures and kings add flavor, not points — wins do the talking.
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ value, label, tone }: { value: string; label: string; tone?: 'gold' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-[#67d895]' : tone === 'red' ? 'text-[#e49787]' : 'text-[#e8d18a]';
  return (
    <div className="glass-panel-soft rounded-xl p-3">
      <div className={`font-display text-lg font-bold ${color}`} data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
      <div className="mt-1 text-[10px] text-[#819a8d]">{label}</div>
    </div>
  );
}

