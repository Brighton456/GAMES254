/**
 * esther · TAUNT STRIP — seeded banter ticker. One Rng per session means the
 * same room code replays the same vibes.
 */
import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { LINES, line, type LineKind } from '../slang';
import { seedRng } from '../../lib/random';

type Props = {
  seed?: string;
  kind?: LineKind;
  intervalMs?: number;
};

export function TauntStrip({ seed = 'duel', kind = 'taunt', intervalMs = 4200 }: Props) {
  const [text, setText] = useState(() => line(kind, seedRng(`${seed}:0`)));
  const [count, setCount] = useState(0);
  const tickRef = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      tickRef.current += 1;
      setCount(tickRef.current);
      setText(line(kind, seedRng(`${seed}:${tickRef.current}`)));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, kind, seed]);
  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-[#345346] bg-[#102821]/80 px-4 py-2.5" data-testid="esther-taunt-strip" data-count={count}>
      <Volume2 size={14} className="shrink-0 animate-pulse text-[#62d694]" />
      <p className="truncate text-xs italic text-[#d8c896]" aria-live="polite">{text}</p>
      <span className="ml-auto shrink-0 font-mono-custom text-[9px] uppercase tracking-[.2em] text-[#5c7567]">mtaa radio</span>
    </div>
  );
}

/** Pool length helper for tests / UI badges. */
export function poolSize(kind: LineKind): number {
  return LINES[kind].length;
}