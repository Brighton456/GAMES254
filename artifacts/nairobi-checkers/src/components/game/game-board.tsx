/**
 * GameBoard — the live table. Glass rails, neon dust, particle king bursts,
 * procedural audio, per-player clocks with heartbeat finale, undo (demo only),
 * and a post-game replay theater. Works vs the house bot or a local partner.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bot, Crown, Flag, Handshake, Lightbulb, Timer, Undo2, Users, Zap,
} from 'lucide-react';
import {
  advanceFlags,
  applyMove,
  boardKey,
  chooseBotMove,
  initialFlags,
  isDrawByMoves,
  isDrawByRepetition,
  legalMoves,
  makeBoard,
  outcomeFor,
  type Board,
  type Difficulty,
  type GameFlags,
  type GameRules,
  type Move,
  type PieceColor,
  type ReplayMove,
  type Square,
} from './game-engine';
import {
  playClick, playJump, playKing, playLose, playRewind, playWin, playZap,
  setAudioEnabled, startAmbient, stopAmbient,
} from './audio-engine';
import { KingBurstCanvas, ParticleDustField } from './canvas-fx';
import { ReplayTheater, type ReplayPayload } from './replay-theater';
import { winXp, lossXp, type MatchKind } from './player-store';
import { settleStake, type Settings } from './settings-store';

const OPPONENT_LABEL: Record<MatchKind, string> = { bot: 'House AI', partner: 'Partner', cash: 'Cash rival' };

export type GameResult = {
  winner: PieceColor | null;
  reason: string;
  moves: number;
  captures: number;
  kings: number;
  xpDelta: number;
  prize: number;
  fee: number;
};

type Phase = 'live' | 'done';

type Props = {
  kind: MatchKind;
  stake: number;
  mode: 'demo' | 'cash';
  settings: Settings;
  feePercent: number;
  onExit: () => void;
  onFinish: (result: GameResult) => void;
  showToast: (message: string) => void;
};

function fmtClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameBoard({ kind, stake, mode, settings, feePercent, onExit, onFinish, showToast }: Props) {
  const rules: GameRules = settings.rules;
  const [board, setBoard] = useState<Board>(() => makeBoard(rules.size));
  const [turn, setTurn] = useState<PieceColor>('gold');
  const [selected, setSelected] = useState<Square | null>(null);
  const [phase, setPhase] = useState<Phase>('live');
  const [history, setHistory] = useState<{ board: Board; turn: PieceColor; steps: ReplayMove['steps'] }[]>([]);
  const [replayMoves, setReplayMoves] = useState<ReplayMove[]>([]);
  const [clocks, setClocks] = useState({ gold: 300, forest: 300 });
  const [burst, setBurst] = useState<{ at: Square; boardPx: DOMRect | null; key: number } | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [resigned, setResigned] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [replayOpen, setReplayOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(settings.ambientSound);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const botTimer = useRef(0);
  const captureTally = useRef({ captures: 0, kings: 0 });
  const flagsRef = useRef<GameFlags>(initialFlags());
  const keyPoolRef = useRef<string[]>([]);
  const finishRef = useRef<(winner: PieceColor | null, reason: string, finalBoard: Board) => void>(() => undefined);
  const boardStateRef = useRef<Board>(board);
  boardStateRef.current = board;
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  const allMoves = useMemo(() => legalMoves(board, turn, rules), [board, turn, rules]);
  const captures = useMemo(() => allMoves.filter((m) => m.captures.length > 0), [allMoves]);
  const legal = rules.forcedCapture && captures.length ? captures : allMoves;
  const moveTargets = useMemo(
    () => (selected ? legal.filter((m) => m.from.row === selected.row && m.from.col === selected.col) : []),
    [legal, selected],
  );
  const moveDest = (m: Move) => m.path[m.path.length - 1];
  const settle = useMemo(() => settleStake(stake, feePercent), [stake, feePercent]);

  // Reset cleanly if the board size changes mid-session.
  useEffect(() => {
    setBoard((current) => (current.length === rules.size ? current : makeBoard(rules.size)));
  }, [rules.size]);

  useEffect(() => {
    setAudioEnabled(soundOn);
    if (soundOn) startAmbient();
    else stopAmbient();
    return () => stopAmbient();
  }, [soundOn]);

  useEffect(() => () => { window.clearTimeout(botTimer.current); }, []);

  // Per-player clocks + heartbeat finale in the last 10 seconds.
  useEffect(() => {
    if (phase !== 'live' || kind === 'partner') return;
    const interval = window.setInterval(() => {
      setClocks((prev) => {
        const next = { ...prev };
        next[turn] = Math.max(0, prev[turn] - 1);
        if (next[turn] === 0 && prev[turn] > 0 && phaseRef.current === 'live') {
          // Flag has dropped: the player on the clock loses on time.
          const winner: PieceColor = turn === 'gold' ? 'forest' : 'gold';
          finishRef.current(winner, 'timeout', boardStateRef.current);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase, turn, kind]);

  const heartbeat = kind !== 'partner' && phase === 'live' && (turn === 'gold' ? clocks.gold : clocks.forest) <= 10;
  useEffect(() => {
    if (!heartbeat) return;
    let cancelled = false;
    void (async () => {
      const mod = await import('./audio-engine');
      if (!cancelled) mod.setHeartbeatMode(true);
    })();
    return () => {
      cancelled = true;
      void import('./audio-engine').then((mod) => mod.setHeartbeatMode(false));
    };
  }, [heartbeat]);

  // Bot brain.
  useEffect(() => {
    if (kind !== 'bot' || phase !== 'live' || turn !== 'forest') return;
    botTimer.current = window.setTimeout(() => {
      const move = chooseBotMove(board, 'forest', rules, settings.difficulty as Difficulty);
      if (move) commit(move, 'forest');
    }, 620 + Math.random() * 700);
    return () => window.clearTimeout(botTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, phase, turn, board, rules, settings.difficulty]);

  const finish = useCallback(
    (winner: PieceColor | null, reason: string, finalBoard: Board) => {
      const playerWon = winner === 'gold';
      const xpDelta = playerWon ? winXp(titleLevel()) : lossXp(titleLevel());
      const prize = winner && kind !== 'partner' ? (playerWon ? settle.prize : 0) : 0;
      const fee = winner && kind !== 'partner' ? settle.fee : 0;
      const outcome: GameResult = {
        winner,
        reason,
        moves: replayMoves.length,
        captures: captureTally.current.captures,
        kings: captureTally.current.kings,
        xpDelta,
        prize,
        fee,
      };
      if (winner) {
        if (playerWon) playWin();
        else playLose();
      }
      setResult(outcome);
      setPhase('done');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, settle, replayMoves.length],
  );

  finishRef.current = finish;

  const commit = useCallback(
    (move: Move, color: PieceColor) => {
      const { board: nextBoard, steps } = applyMove(board, move, rules);
      const last = steps[steps.length - 1];
      const isKingMove = steps.length > 0 && last !== undefined && last.promoted === true;
      setHistory((prev) => [...prev, { board, turn: color, steps }]);
      setReplayMoves((prev) => [...prev, {
        steps,
        boardAfter: nextBoard,
        turnAfter: color === 'gold' ? 'forest' : 'gold',
        color,
        captureCount: move.captures.length,
      }]);
      if (move.captures.length) {
        captureTally.current.captures += move.captures.length;
        playJump(move.captures.length);
      } else {
        playClick();
      }
      if (isKingMove && last) {
        captureTally.current.kings += 1;
        playKing();
        const rect = boardRef.current?.getBoundingClientRect() ?? null;
        setBurst({ at: last.to, boardPx: rect, key: Date.now() });
      }
      setBoard(nextBoard);
      setSelected(null);
      setHint(null);
      const nextTurn: PieceColor = color === 'gold' ? 'forest' : 'gold';
      setTurn(nextTurn);
      // Draw-rule bookkeeping: 50-move counter + triple-repetition pool.
      const nowKey = boardKey(nextBoard);
      flagsRef.current = advanceFlags(flagsRef.current, move);
      keyPoolRef.current.push(nowKey);
      if (isDrawByMoves(flagsRef.current) || keyPoolRef.current.filter((k) => k === nowKey).length >= 3) {
        finish(null, 'draw-rule', nextBoard);
        return;
      }
      const over = outcomeFor(nextBoard, nextTurn, rules);
      if (over) finish(over.winner, over.reason, nextBoard);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [board, rules],
  );

  function titleLevel(): number {
    // Cheap read of the stored XP level for XP calc; avoids a store dependency loop.
    try {
      const raw = window.localStorage.getItem('games254-career-v1');
      const career = raw ? (JSON.parse(raw) as { xp?: number }) : null;
      const xp = career?.xp ?? 0;
      const thresholds = [0, 300, 800, 1500, 2500, 4000, 6000, 9000];
      return Math.max(1, thresholds.filter((t) => xp >= t).length);
    } catch {
      return 1;
    }
  }

  const undo = () => {
    if (mode !== 'demo' || history.length === 0) return;
    playRewind();
    // Step back past the bot reply to the player's previous decision point.
    let target = history.length - 1;
    if (history[target].turn === 'forest' && history.length >= 2) target -= 1;
    const snap = history[target];
    setBoard(snap.board);
    setTurn(snap.turn);
    setHistory((prev) => prev.slice(0, target));
    setReplayMoves((prev) => prev.slice(0, target));
    setPhase('live');
    setResult(null);
    showToast('Move rewound — the tape never lies.');
  };

  const showHint = () => {
    if (!settings.showHints || !legal.length) return;
    const move = chooseBotMove(board, 'gold', rules, 'Medium');
    setHint(move);
    if (!move) showToast('No suggestion available — you are out of moves.');
  };

  const selectSquare = (row: number, col: number) => {
    if (phase !== 'live') return;
    if (kind === 'bot' && turn !== 'gold') return;
    const piece = board[row][col];
    if (selected) {
      const move = moveTargets.find((m) => { const dest = moveDest(m); return dest.row === row && dest.col === col; });
      if (move) return commit(move, turn);
    }
    if (piece && piece.color === turn && legal.some((m) => m.from.row === row && m.from.col === col)) {
      setSelected({ row, col });
      playClick();
    } else if (piece && piece.color === turn) {
      playZap();
    }
  };

  const resign = () => {
    if (phase !== 'live') return;
    setResigned(true);
    finish('forest', 'resign', board);
  };

  const agreeDraw = () => {
    if (phase !== 'live') return;
    setDrawOffered(true);
    window.setTimeout(() => finish(null, 'draw-agreed', board), 900);
  };

  const openReplay = () => {
    const payload: ReplayPayload = {
      label: `${OPPONENT_LABEL[kind]} · ${stake > 0 ? `KSh ${stake} stake` : 'Friendly'}`,
      start: makeBoard(rules.size),
      moves: replayMoves,
      winner: result?.winner ?? null,
      playedAt: Date.now(),
      rules,
    };
    setReplayOpen(true);
  };

  const time = turn === 'gold' ? clocks.gold : clocks.forest;

  return (
    <div className="reveal relative">
      <KingBurstCanvas burst={burst} />
      {replayOpen && result && (
        <ReplayTheater
          replay={{
            label: `${OPPONENT_LABEL[kind]} · ${stake > 0 ? `KSh ${stake} stake` : 'Friendly'}`,
            start: makeBoard(rules.size),
            moves: replayMoves,
            winner: result.winner,
            playedAt: Date.now(),
            rules,
          }}
          onClose={() => setReplayOpen(false)}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button onClick={onExit} data-testid="button-exit-game" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold">
          <ArrowLeft size={14} /> Leave table
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundOn((v) => !v)} data-testid="button-toggle-sound" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold">
            <Timer size={14} /> {soundOn ? 'Sound on' : 'Muted'}
          </button>
          {mode === 'demo' && (
            <button onClick={undo} disabled={!history.length} data-testid="button-undo" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40">
              <Undo2 size={14} /> Undo
            </button>
          )}
          {settings.showHints && phase === 'live' && (
            <button onClick={showHint} data-testid="button-hint" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold">
              <Lightbulb size={14} /> Hint
            </button>
          )}
          {phase === 'live' && (
            <>
              <button onClick={agreeDraw} data-testid="button-draw" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold">
                <Handshake size={14} /> Draw
              </button>
              <button onClick={resign} data-testid="button-resign" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#d99b8e]">
                <Flag size={14} /> Resign
              </button>
            </>
          )}
        </div>
      </div>

      {phase === 'done' && result ? (
        <div className="glass-panel relative mx-auto max-w-lg overflow-hidden rounded-[1.6rem] p-8 text-center">
          <ParticleDustField density={22} />
          <div className="relative z-10">
            <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full ${result.winner === 'gold' ? 'bg-[#d6a944] text-[#153028]' : result.winner === null ? 'bg-[#315144] text-[#cfe0d2]' : 'bg-[#49322d] text-[#e49a8b]'}`}>
              {result.winner === 'gold' ? <Crown size={26} /> : result.winner === null ? <Handshake size={26} /> : <Flag size={26} />}
            </div>
            <h2 className="font-display text-2xl font-bold">
              {result.winner === 'gold' ? 'You take the table!' : result.winner === null ? 'Honorable draw.' : 'The house held this time.'}
            </h2>
            <p className="mt-2 text-sm text-[#8fa89b]">
              {result.winner === 'gold' && kind !== 'partner'
                ? `Prize KSh ${result.prize.toLocaleString('en-KE')} after the ${feePercent}% house fee (KSh ${result.fee.toLocaleString('en-KE')}).`
                : result.moves + ' moves logged · ' + result.captures + ' captures · ' + result.kings + ' kings'}
            </p>
            <div className="mt-3 font-mono-custom text-xs text-[#e3c16a]">+{result.xpDelta} XP earned</div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button onClick={openReplay} data-testid="button-review-match" className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
                <Zap size={15} /> Review match
              </button>
              <button onClick={onExit} data-testid="button-back-to-play" className="btn-quiet flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
                <Users size={15} /> Find another table
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(340px,640px)_1fr]">
          <section>
            <div className="glass-rail mb-3 flex items-center justify-between gap-3 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${turn === 'gold' ? 'bg-[#d6a944] text-[#153028]' : 'bg-[#23613f] text-[#c3e0c5]'}`}>Y</span>
                You <span className="text-[#708a7c]">vs</span> {OPPONENT_LABEL[kind]}
              </div>
              <div className={`flex items-center gap-2 font-mono-custom text-sm ${heartbeat ? 'animate-pulse text-[#ff8f7a]' : 'text-[#d6a944]'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> {fmtClock(time)}
              </div>
            </div>

            <div ref={boardRef} className="board-frame relative rounded-2xl border-[8px] border-[#5a3827] bg-[#87603a] p-2 shadow-[0_20px_60px_rgba(0,0,0,.45)] sm:border-[12px] sm:p-3">
              <ParticleDustField density={26} />
              <div className="relative grid overflow-hidden rounded-sm" style={{ gridTemplateColumns: `repeat(${rules.size}, 1fr)` }}>
                {board.map((row, r) =>
                  row.map((piece, c) => {
                    const dark = (r + c) % 2 === 1;
                    const isSelected = selected?.row === r && selected?.col === c;
                    const canLand = moveTargets.some((m) => { const dest = moveDest(m); return dest.row === r && dest.col === c; });
                    const isCapture = moveTargets.some((m) => { const dest = moveDest(m); return dest.row === r && dest.col === c && m.captures.length > 0; });
                    const isHintFrom = hint && hint.from.row === r && hint.from.col === c;
                    const isHintTo = hint && hint.path.some((p) => p.row === r && p.col === c);
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => selectSquare(r, c)}
                        data-testid={`cell-${r}-${c}`}
                        className={`relative grid aspect-square place-items-center ${dark ? 'bg-[#53392c]' : 'bg-[#c39560]'} ${isSelected ? 'ring-4 ring-inset ring-[#f4d678]' : ''} ${isHintFrom ? 'outline outline-2 outline-[#5ec8f2]' : ''} ${isHintTo ? 'outline-dashed outline-2 outline-[#5ec8f2]/70' : ''}`}
                      >
                        {canLand && (
                          <span className={`absolute h-3 w-3 rounded-full sm:h-4 sm:w-4 ${isCapture ? 'bg-[#ff7a59] shadow-[0_0_0_4px_rgba(255,122,89,.25)]' : 'bg-[#d6a944] shadow-[0_0_0_4px_rgba(214,169,68,.2)]'}`} />
                        )}
                        {piece && (
                          <span
                            className={`relative z-10 grid h-[70%] w-[70%] place-items-center rounded-full border-2 shadow-[0_5px_0_rgba(0,0,0,.28)] transition-transform ${piece.color === 'gold' ? 'border-[#f4d678] bg-[#d6a944] text-[#62451b]' : 'border-[#5b9d75] bg-[#23613f] text-[#c3e0c5]'} ${isSelected ? '-translate-y-1 scale-110' : ''} ${piece.king ? 'king-glow' : ''}`}
                          >
                            {piece.king && <Crown size={14} />}
                          </span>
                        )}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[.14em] text-[#718d7e]">
              <span>{rules.forcedCapture ? 'Mandatory captures on' : 'Free captures'} · {rules.size}×{rules.size}</span>
              <span className="text-[#d6a944]">{turn === 'gold' ? 'Your move' : kind === 'bot' ? 'House AI is thinking' : 'Partner’s move'}</span>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="glass-panel rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display font-bold">Stake the moment</h2>
                <span className="rounded-full bg-[#d6a944]/15 px-2 py-1 text-[10px] text-[#e3c16a]">{mode === 'cash' ? 'SIMULATED CASH' : 'DEMO'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg border border-[#345346] bg-[#142e25] p-2"><div className="text-[#8fa89b]">Entry</div><div className="font-mono-custom font-bold text-[#f0d37c]">KSh {stake.toLocaleString('en-KE')}</div></div>
                <div className="rounded-lg border border-[#345346] bg-[#142e25] p-2"><div className="text-[#8fa89b]">Winner takes</div><div className="font-mono-custom font-bold text-[#67d895]">KSh {settle.prize.toLocaleString('en-KE')}</div></div>
                <div className="rounded-lg border border-[#345346] bg-[#142e25] p-2"><div className="text-[#8fa89b]">House fee</div><div className="font-mono-custom font-bold text-[#e0b957]">{feePercent}%</div></div>
              </div>
              {mode === 'demo' && (
                <p className="mt-3 text-[10px] leading-relaxed text-[#7f9789]">Demo stakes are play-money. Undo is available in demo only — cash tables are final.</p>
              )}
            </section>

            <section className="glass-panel-soft rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display font-bold">Move log</h2>
                <span className="font-mono-custom text-[10px] text-[#8fa89b]">{history.length} moves</span>
              </div>
              <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#416254] p-4 text-center text-xs text-[#7f9789]">Make the first move. Captures {rules.forcedCapture ? 'are' : 'are not'} mandatory.</div>
                ) : (
                  history.map((entry, index) => (
                    <div key={index} className="flex items-center gap-3 text-xs">
                      <span className="font-mono-custom text-[#d6a944]">{String(index + 1).padStart(2, '0')}</span>
                      <span className={entry.turn === 'gold' ? 'text-[#f0d37c]' : 'text-[#9fc3a8]'}>
                        {entry.turn === 'gold' ? 'You' : OPPONENT_LABEL[kind]}{' '}
                        {entry.steps.map((s) => `${String.fromCharCode(65 + s.from.col)}${rules.size - s.from.row}→${String.fromCharCode(65 + s.to.col)}${rules.size - s.to.row}${s.captured ? '×' : ''}`).join(' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-[#345346] bg-[#122c23] p-4 text-xs leading-relaxed text-[#8fa89b]">
              <div className="mb-1 flex items-center gap-2 font-bold text-[#bdcdbf]"><Bot size={14} className="text-[#d6a944]" /> House rules</div>
              Diagonal moves, jumps capture. Reach the far edge to crown a{' '}
              {rules.kingMode === 'fly-far' ? 'flying king' : rules.kingMode === 'hop' ? 'sky-hop king' : 'classic king'}. Forced captures: {rules.forcedCapture ? 'on' : 'off'}.
            </section>
          </aside>
        </div>
      )}
      {drawOffered && phase === 'live' && <div className="mt-3 text-center text-xs text-[#e3c16a]">Draw agreed — settling the table…</div>}
      {resigned && phase === 'live' && <div className="mt-3 text-center text-xs text-[#d99b8e]">Resigning…</div>}
    </div>
  );
}

