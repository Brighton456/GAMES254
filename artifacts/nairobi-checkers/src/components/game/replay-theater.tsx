/**
 * Replay theater — step through every move of a finished match.
 * Mini board, timeline slider, and forward/backward controls.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Crown, Pause, Play, X } from 'lucide-react';
import { cloneBoard, type Board, type GameRules, type PieceColor, type ReplayMove } from './game-engine';

type ReplayPayload = {
  label: string;
  start: Board;
  moves: ReplayMove[];
  winner: PieceColor | null;
  playedAt: number;
  rules: GameRules;
};

export type { ReplayPayload };

export function ReplayTheater({ replay, onClose }: { replay: ReplayPayload; onClose: () => void }) {
  const [frame, setFrame] = useState(replay.moves.length); // start at the final position
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = window.setInterval(() => {
      setFrame((v) => {
        if (v >= replay.moves.length) {
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, 700);
    return () => window.clearInterval(timerRef.current);
  }, [playing, replay.moves.length]);

  const board = useMemo(() => {
    let work = cloneBoard(replay.start);
    for (let i = 0; i < frame; i++) work = replay.moves[i].boardAfter;
    return work;
  }, [replay, frame]);

  const lastMove = frame > 0 ? replay.moves[frame - 1] : null;
  const total = replay.moves.length;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[#040d09]/92 p-4 backdrop-blur-xl" role="dialog" aria-label="Match replay">
      <div className="glass-panel w-full max-w-xl rounded-[1.6rem] p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono-custom text-[10px] uppercase tracking-[.22em] text-gold">Match replay</div>
            <h2 className="font-display text-xl font-bold text-[#f2e9d1]">{replay.label}</h2>
            <p className="mt-1 text-[11px] text-[#8fa89b]">
              {new Date(replay.playedAt).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
              {replay.moves.length} moves · {replay.rules.size}×{replay.rules.size} ·{' '}
              {replay.winner ? `${replay.winner === 'gold' ? 'Gold' : 'Forest'} won` : 'Draw'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close replay" className="btn-quiet rounded-lg p-2"><X size={16} /></button>
        </div>

        <div className="relative mx-auto max-w-[340px]">
          <div className="rounded-xl border-4 border-[#5a3827] bg-[#87603a] p-1.5 shadow-2xl">
            <div className="grid overflow-hidden rounded-sm" style={{ gridTemplateColumns: `repeat(${replay.rules.size}, 1fr)` }}>
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const dark = (r + c) % 2 === 1;
                  const involved = lastMove && lastMove.steps.some((s) =>
                    (s.to.row === r && s.to.col === c) || (s.captured && s.captured.row === r && s.captured.col === c),
                  );
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`relative aspect-square ${dark ? 'bg-[#53392c]' : 'bg-[#c39560]'} ${involved ? 'ring-2 ring-inset ring-[#f4d678]' : ''}`}
                      style={{ gridRow: r + 1, gridColumn: c + 1 }}
                    >
                      {piece && (
                        <span className={`absolute inset-[14%] rounded-full border-2 ${piece.color === 'gold' ? 'border-[#f4d678] bg-[#d6a944]' : 'border-[#5b9d75] bg-[#23613f]'}`}>
                          {piece.king && <Crown size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#fff7dd]" />}
                        </span>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={() => setFrame(0)} disabled={frame === 0} className="btn-quiet rounded-lg px-2.5 py-2 text-xs font-bold disabled:opacity-40" aria-label="Jump to start">⏮</button>
          <button onClick={() => setFrame((v) => Math.max(0, v - 1))} disabled={frame === 0} className="btn-quiet rounded-lg p-2 disabled:opacity-40" aria-label="Previous move"><ChevronLeft size={16} /></button>
          <button
            onClick={() => {
              if (frame >= total) {
                setFrame(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            className="btn-quiet rounded-lg p-2"
            aria-label={playing ? 'Pause replay' : 'Play replay'}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={() => setFrame(total)} disabled={frame >= total} className="btn-quiet rounded-lg p-2 disabled:opacity-40" aria-label="Jump to end">⏭</button>
          <input
            type="range"
            min={0}
            max={total}
            value={frame}
            onChange={(event) => { setPlaying(false); setFrame(Number(event.target.value)); }}
            className="replay-slider h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#2c4a3c]"
            aria-label="Timeline"
          />
          <span className="font-mono-custom text-xs text-[#c8b06a]">{frame}/{total}</span>
        </div>
        {lastMove && (
          <div className="mt-3 rounded-lg border border-[#3a5a4b] bg-[#0e251d] px-3 py-2 text-[11px] text-[#a7bcab]">
            <span className="font-mono-custom text-gold">{String(frame).padStart(2, '0')}</span>{' '}
            {lastMove.color === 'gold' ? 'Gold' : 'Forest'} ·{' '}
            {lastMove.steps.map((s, i) => (
              <span key={i}>
                {String.fromCharCode(65 + s.from.col)}{replay.rules.size - s.from.row}
                {' → '}
                {String.fromCharCode(65 + s.to.col)}{replay.rules.size - s.to.row}
                {s.captured ? ' ×' : ''}
                {i < lastMove.steps.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

