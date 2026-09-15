/**
 * esther · CLOCK PANEL — a live Sanza move-clock demo. Start/pause/after-move
 * against the pure `clock` machine; ticks via its own interval.
 */
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, TimerReset, Zap } from 'lucide-react';
import { createClock, formatClock, isExpired, isLow, remainingMs, startClock, pauseClock, afterMove, resetClock, type MoveClock } from '../clock';
import type { Variant } from '../variants';

type Props = {
  variant: Variant;
};

export function ClockPanel({ variant }: Props) {
  const clockRef = useRef<MoveClock>(createClock(variant.clock?.initialSec ?? 60, variant.clock?.incrementSec ?? 5));
  const [now, setNow] = useState(Date.now());
  const runningRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const clock = clockRef.current;
  const ms = remainingMs(clock, now);
  const expired = isExpired(clock, now);
  const low = !expired && isLow(clock, 10, now);

  const toggle = () => {
    runningRef.current = !runningRef.current;
    clockRef.current = runningRef.current ? startClock(clockRef.current, Date.now()) : pauseClock(clockRef.current);
    setNow(Date.now());
  };
  const move = () => {
    clockRef.current = afterMove(clockRef.current, Date.now());
    runningRef.current = clockRef.current.running;
    setNow(Date.now());
  };
  const reset = () => {
    runningRef.current = false;
    clockRef.current = resetClock(clockRef.current);
    setNow(Date.now());
  };

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <TimerReset size={17} className="text-[#d6a944]" />
        <h3 className="font-display font-bold">Sanza clock</h3>
        <span className="ml-auto rounded-full bg-[#153429] px-2 py-0.5 text-[10px] text-[#62d694]">{variant.name}</span>
      </div>

      <div className={`rounded-xl border px-4 py-5 text-center ${expired ? 'border-[#c7aaa0] bg-[#3a1f1c]/60' : low ? 'border-[#e0b957]/70 bg-[#3a2f1c]/60' : 'border-[#345346] bg-[#102821]'}`}>
        <div className={`font-mono-custom text-5xl font-bold tabular-nums ${expired ? 'text-[#e09d8f]' : low ? 'text-[#f0d37c]' : 'text-[#d8ffea]'}`}>
          {formatClock(ms)}
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-[.2em] text-[#5c7567]">{expired ? 'sand faded' : low ? 'low — chipuko chake' : clock.incrementSec ? `+${clock.incrementSec}s per move` : 'no increment'}</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button data-testid="esther-clock-toggle" onClick={toggle} className="btn-quiet flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold">
          {runningRef.current ? <Pause size={13} /> : <Play size={13} />} {runningRef.current ? 'Pause' : 'Start'}
        </button>
        <button data-testid="esther-clock-move" onClick={move} className="btn-quiet flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold">
          <Zap size={13} /> Move
        </button>
        <button onClick={reset} className="btn-quiet rounded-lg py-2 text-[11px] font-bold">Reset</button>
      </div>
      <p className="mt-3 text-[10px] text-[#5c7567]">Ply {clock.ply} · budget {formatClock(clock.budgetMs)} + increments. Pure machine, wall-clock injected in tests.</p>
    </div>
  );
}