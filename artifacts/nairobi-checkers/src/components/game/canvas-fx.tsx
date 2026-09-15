/**
 * Games254 canvas FX — particle systems drawn on overlay canvases.
 * ParticleDustField: soft neon dust drifting behind game canvases.
 * KingBurstCanvas: explosive crowning burst with neon trail lines.
 * ConfettiCanvas: celebratory confetti for wins and the fortune wheel.
 * All systems auto-pause when hidden and clean up after themselves.
 */
import { useEffect, useRef } from 'react';

type Dust = { x: number; y: number; r: number; speed: number; drift: number; hue: number; alpha: number; twinkle: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; hue: number; size: number; trail: boolean };
type Confetti = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; color: string; life: number };

const CONFETTI_COLORS = ['#d6a944', '#f4d678', '#4fd28a', '#5ec8f2', '#e57ad1', '#f2e9d1'];

/** Drifting neon dust — mount behind game canvases. Purely decorative. */
export function ParticleDustField({ density = 34, className }: { density?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return; // respect OS motion preference — no dust
    let frame = 0;
    let running = true;
    let animating = true; // false while the tab is hidden

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * (window.devicePixelRatio || 1)));
      canvas.height = Math.max(1, Math.floor(rect.height * (window.devicePixelRatio || 1)));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const particles: Dust[] = Array.from({ length: density }, () => ({
      x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8,
      speed: 0.008 + Math.random() * 0.03, drift: (Math.random() - 0.5) * 0.02,
      hue: Math.random() > 0.72 ? 160 : 43, alpha: 0.12 + Math.random() * 0.5, twinkle: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      if (!running || !animating) return;
      frame = requestAnimationFrame(render);
      const w = canvas.width, h = canvas.height;
      context.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.speed * 0.016;
        p.x += p.drift * 0.016;
        p.twinkle += 0.03;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;
        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle));
        context.beginPath();
        context.arc(p.x * w, p.y * h, p.r * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        context.fillStyle = p.hue === 43 ? `rgba(230, 195, 110, ${alpha})` : `rgba(110, 220, 170, ${alpha})`;
        context.fill();
      }
    };

    const pause = () => {
      animating = false;
      cancelAnimationFrame(frame);
    };
    const resume = () => {
      if (running && !animating && document.visibilityState === 'visible' && !reduceMotion.matches) {
        animating = true;
        frame = requestAnimationFrame(render);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pause();
      else resume();
    };
    const onReduceChange = (event: MediaQueryListEvent) => {
      if (event.matches) pause();
      else resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion.addEventListener('change', onReduceChange);

    frame = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      reduceMotion.removeEventListener('change', onReduceChange);
      observer.disconnect();
    };
  }, [density]);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ''}`} />;
}

/** Explosive king-crowning burst on a target cell, with neon trail lines. */
export function KingBurstCanvas({ burst }: { burst: { at: { row: number; col: number }; boardPx: DOMRect | null; key: number } | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!burst?.boardPx || !burst.at) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / (canvas.getBoundingClientRect().width || 1);
    const scaleY = canvas.height / (canvas.getBoundingClientRect().height || 1);
    void scaleX; void scaleY;

    const cellW = burst.boardPx.width / 8;
    const cellH = burst.boardPx.height / 8;
    const cx = burst.boardPx.left + (burst.at.col + 0.5) * cellW;
    const cy = burst.boardPx.top + (burst.at.row + 0.5) * cellH;
    void dpr;

    const sparks: Spark[] = [];
    for (let i = 0; i < 46; i++) {
      const angle = (Math.PI * 2 * i) / 46 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 6;
      sparks.push({
        x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5,
        life: 1, maxLife: 1, hue: Math.random() > 0.4 ? 45 : 160, size: 1.5 + Math.random() * 2.5, trail: true,
      });
    }
    let frame = 0;
    let alive = true;
    const render = () => {
      if (!alive) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      let anyAlive = false;
      for (const s of sparks) {
        s.x += s.vx; s.y += s.vy; s.vy += 0.12; s.vx *= 0.985; s.vy *= 0.985;
        s.life -= 0.014;
        if (s.life <= 0) continue;
        anyAlive = true;
        // Neon trail line from previous position.
        context.beginPath();
        context.moveTo(s.x - s.vx * 3, s.y - s.vy * 3);
        context.lineTo(s.x, s.y);
        context.strokeStyle = s.hue === 45 ? `rgba(244, 214, 120, ${s.life})` : `rgba(110, 230, 180, ${s.life})`;
        context.lineWidth = s.size;
        context.stroke();
        context.beginPath();
        context.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        context.fillStyle = s.hue === 45 ? `rgba(255, 232, 160, ${s.life})` : `rgba(160, 255, 210, ${s.life})`;
        context.fill();
      }
      if (anyAlive) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [burst]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[60]" style={{ width: '100vw', height: '100vh' }} />;
}

/** Full-screen confetti celebration. Fires once per `fireKey` change. */
export function ConfettiCanvas({ fireKey, originX = 0.5, originY = 0.35, count = 160 }: { fireKey: number; originX?: number; originY?: number; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFired = useRef(0);

  useEffect(() => {
    if (!fireKey || fireKey === lastFired.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    lastFired.current = fireKey;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces: Confetti[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 9;
      return {
        x: canvas.width * originX, y: canvas.height * originY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 1,
      };
    });
    let frame = 0;
    let alive = true;
    const render = () => {
      if (!alive) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      let anyAlive = false;
      for (const c of pieces) {
        c.x += c.vx; c.y += c.vy; c.vy += 0.18; c.vx *= 0.99; c.rot += c.vr;
        c.life -= 0.006;
        if (c.life <= 0 || c.y > canvas.height + 20) continue;
        anyAlive = true;
        context.save();
        context.translate(c.x, c.y);
        context.rotate(c.rot);
        context.globalAlpha = Math.min(1, c.life * 1.6);
        context.fillStyle = c.color;
        context.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * Math.abs(Math.sin(c.rot * 2)) + 2);
        context.restore();
      }
      if (anyAlive) frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const cleanupTimer = window.setTimeout(() => { alive = false; cancelAnimationFrame(frame); context.clearRect(0, 0, canvas.width, canvas.height); }, 6000);
    return () => { alive = false; cancelAnimationFrame(frame); window.clearTimeout(cleanupTimer); };
  }, [fireKey, originX, originY, count]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[70]" style={{ width: '100vw', height: '100vh' }} />;
}
