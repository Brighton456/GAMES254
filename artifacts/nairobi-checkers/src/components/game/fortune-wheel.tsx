/**
 * Daily Fortune Wheel — canvas wheel with realistic spin deceleration physics,
 * live segment ticks, confetti finale, and a once-per-session auto-open.
 */
import { useEffect, useRef, useState } from 'react';
import { Gift, Sparkles, X } from 'lucide-react';
import { playPop, playTick, playWin } from './audio-engine';
import { cryptoRng, randomInt } from '../../lib/random';

const SEGMENTS = [
  { label: '+40 XP', color: '#d6a944', kind: 'xp' as const, value: 40 },
  { label: 'KSh 25', color: '#1f8d5b', kind: 'bonus' as const, value: 25 },
  { label: '+15 XP', color: '#3f7d5c', kind: 'xp' as const, value: 15 },
  { label: 'KSh 10', color: '#8a6b25', kind: 'bonus' as const, value: 10 },
  { label: '2× shield', color: '#5c5424', kind: 'shield' as const, value: 2 },
  { label: '+25 XP', color: '#a3832f', kind: 'xp' as const, value: 25 },
  { label: 'KSh 50', color: '#2aa06a', kind: 'bonus' as const, value: 50 },
  { label: 'Good omen', color: '#6b5a2a', kind: 'omen' as const, value: 0 },
];

type Prize = (typeof SEGMENTS)[number];

export function FortuneWheel({ onClose, onPrize }: { onClose: () => void; onPrize: (prize: Prize) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const angleRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 260;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const segAngle = (Math.PI * 2) / SEGMENTS.length;

    const draw = () => {
      const angle = angleRef.current;
      ctx.clearRect(0, 0, size, size);
      for (let i = 0; i < SEGMENTS.length; i++) {
        const start = angle + i * segAngle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, start + segAngle);
        ctx.closePath();
        ctx.fillStyle = SEGMENTS[i].color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 20, 14, .8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + segAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff7dd';
        ctx.font = 'bold 11px "DM Mono", monospace';
        ctx.fillText(SEGMENTS[i].label, radius - 12, 4);
        ctx.restore();
      }
      // Hub
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#0d241d';
      ctx.fill();
      ctx.strokeStyle = '#d6a944';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#d6a944';
      ctx.font = 'bold 13px "Syne", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('254', cx, cy);
      // Pointer (top)
      ctx.beginPath();
      ctx.moveTo(cx - 9, 4);
      ctx.lineTo(cx + 9, 4);
      ctx.lineTo(cx, 20);
      ctx.closePath();
      ctx.fillStyle = '#f4d678';
      ctx.fill();
    };
    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const spin = () => {
    if (spinning || result) return;
    setSpinning(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const size = 260;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const segAngle = (Math.PI * 2) / SEGMENTS.length;
    const prizeIndex = randomInt(cryptoRng(), SEGMENTS.length);
    // Target rotation so the winning segment sits under the top pointer.
    const target = Math.PI * 2 * 6 + (Math.PI * 1.5 - (prizeIndex * segAngle + segAngle / 2));
    const startAngle = angleRef.current;
    const delta = target - startAngle;
    const duration = 4600;
    const t0 = performance.now();
    let lastSeg = -1;

    const drawFrame = (angle: number) => {
      ctx.clearRect(0, 0, size, size);
      for (let i = 0; i < SEGMENTS.length; i++) {
        const start = angle + i * segAngle;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, start + segAngle);
        ctx.closePath();
        ctx.fillStyle = SEGMENTS[i].color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 20, 14, .8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + segAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff7dd';
        ctx.font = 'bold 11px "DM Mono", monospace';
        ctx.fillText(SEGMENTS[i].label, radius - 12, 4);
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#0d241d';
      ctx.fill();
      ctx.strokeStyle = '#d6a944';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#d6a944';
      ctx.font = 'bold 13px "Syne", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('254', cx, cy);
      ctx.beginPath();
      ctx.moveTo(cx - 9, 4);
      ctx.lineTo(cx + 9, 4);
      ctx.lineTo(cx, 20);
      ctx.closePath();
      ctx.fillStyle = '#f4d678';
      ctx.fill();
    };

    const ease = (t: number) => 1 - Math.pow(1 - t, 3.1); // deceleration physics

    const animate = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const angle = startAngle + delta * ease(t);
      angleRef.current = angle;
      drawFrame(angle);
      const seg = Math.floor(((-angle - Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) / segAngle);
      if (seg !== lastSeg) {
        lastSeg = seg;
        if (t < 0.92) playTick();
      }
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        const prize = SEGMENTS[prizeIndex];
        setResult(prize);
        setSpinning(false);
        playWin();
        onPrize(prize);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-[#040d09]/88 p-4 backdrop-blur-xl" role="dialog" aria-label="Daily fortune wheel">
      <ConfettiMini fire={result ? 1 : 0} />
      <div className="glass-panel relative w-full max-w-sm rounded-[1.8rem] p-6 text-center">
        <button onClick={onClose} aria-label="Close fortune wheel" className="btn-quiet absolute right-4 top-4 rounded-lg p-2"><X size={16} /></button>
        <div className="mb-1 flex items-center justify-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.22em] text-gold"><Gift size={13} /> Daily ritual</div>
        <h2 className="font-display text-2xl font-bold text-[#f2e9d1]">Tonight’s fortune</h2>
        <p className="mt-1 text-xs text-[#8fa89b]">One free spin every session. Demo rewards only — no cash attached.</p>
        <div className="relative mx-auto mt-4 h-[260px] w-[260px]">
          <canvas ref={canvasRef} style={{ width: 260, height: 260 }} className="mx-auto" />
        </div>
        <div className="mt-2 min-h-6 font-display text-sm font-bold text-[#f0d37c]" aria-live="polite">
          {result ? `You won: ${result.label}` : spinning ? 'The wheel decides…' : 'Spin for tonight’s signal'}
        </div>
        <button onClick={spin} disabled={spinning || Boolean(result)} className="btn-primary mt-3 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50">
          {spinning ? 'Spinning…' : result ? 'Claimed — see you tomorrow' : 'Spin the wheel'}
        </button>
        {!spinning && result && <button onClick={onClose} className="btn-quiet mt-2 w-full rounded-xl py-2.5 text-xs font-bold">Back to the lounge <Sparkles className="ml-1 inline" size={12} /></button>}
      </div>
    </div>
  );
}

/** Lightweight inline confetti burst for the prize moment. */
function ConfettiMini({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const fired = useRef(0);
  useEffect(() => {
    if (!fire || fire === fired.current) return;
    fired.current = fire;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#d6a944', '#f4d678', '#4fd28a', '#5ec8f2'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2, y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 11 - 2,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
      w: 4 + Math.random() * 5, h: 7 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)], life: 1,
    }));
    let raf = 0;
    let alive = true;
    const render = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let any = false;
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.rot += p.vr; p.life -= 0.007;
        if (p.life <= 0 || p.y > canvas.height + 20) continue;
        any = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life * 1.7);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (any) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    const stop = window.setTimeout(() => { alive = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 6000);
    return () => { alive = false; cancelAnimationFrame(raf); window.clearTimeout(stop); };
  }, [fire]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[76]" style={{ width: '100vw', height: '100vh' }} />;
}
