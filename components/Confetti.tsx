"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number;
}

const COLORS = ["#f26522", "#0e2a4d", "#148a4a", "#ffc845", "#ffffff", "#ff8b53"];

/**
 * Lightweight canvas confetti with no dependencies. Fires a burst every time
 * the `fireSignal` counter increments (0 = never fired).
 */
export default function Confetti({
  fireSignal,
  intensity = 140,
}: {
  fireSignal: number;
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number>(0);
  const running = useRef(false);

  useEffect(() => {
    if (fireSignal === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width / 2;
    for (let i = 0; i < intensity; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 9;
      particles.current.push({
        x: cx + (Math.random() - 0.5) * canvas.width * 0.5,
        y: canvas.height * (0.25 + Math.random() * 0.2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        life: 90 + Math.random() * 70,
      });
    }

    if (!running.current) {
      running.current = true;
      const step = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.current = particles.current.filter((p) => p.life > 0);
        particles.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12;
          p.vx *= 0.99;
          p.rotation += p.spin;
          p.life -= 1;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = Math.min(1, p.life / 40);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        });
        if (particles.current.length > 0) {
          raf.current = requestAnimationFrame(step);
        } else {
          running.current = false;
        }
      };
      raf.current = requestAnimationFrame(step);
    }
  }, [fireSignal, intensity]);

  // Track viewport changes (window resize, entering/leaving fullscreen) so
  // a burst mid-resize still covers the whole visible area.
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (canvas && running.current) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onResize);
    };
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[70]"
      aria-hidden="true"
    />
  );
}
