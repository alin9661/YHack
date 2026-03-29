"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OracleSymbol } from "./OracleSymbol";

/* ═══════════════════════════════════════════════════
   Particle Canvas
   ═══════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  const initParticles = useCallback((w: number, h: number) => {
    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      life: Math.random() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      if (particlesRef.current.length === 0) {
        initParticles(window.innerWidth, window.innerHeight);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.01;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const flicker = Math.sin(p.life) * 0.3 + 0.7;
        const a = p.alpha * flicker;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 75, ${a})`;
        ctx.fill();
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212, 168, 75, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   Landing Page
   ═══════════════════════════════════════════════════ */

const capabilities = [
  {
    numeral: "I",
    title: "Market Intelligence",
    desc: "Search and analyze prediction markets in real-time. Surface the opportunities others miss with deep Polymarket integration and live data feeds.",
  },
  {
    numeral: "II",
    title: "Signal Generation",
    desc: "AI-powered trading signals with confidence scores, reasoning, and factor analysis. Every signal is backed by data, not speculation.",
  },
  {
    numeral: "III",
    title: "Persistent Analysis",
    desc: "Every analysis is stored and queryable. Build a knowledge base of market intelligence that compounds over time.",
  },
];

export default function LandingPage() {
  const router = useRouter();

  const enter = () => router.push("/chat");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleCanvas />

      {/* Ambient Orbs */}
      <div
        className="fixed pointer-events-none animate-orb-1"
        style={{
          width: 600,
          height: 600,
          top: "10%",
          left: "-5%",
          background:
            "radial-gradient(circle, rgba(212,168,75,0.06) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none animate-orb-2"
        style={{
          width: 500,
          height: 500,
          top: "50%",
          right: "-10%",
          background:
            "radial-gradient(circle, rgba(196,149,106,0.05) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none animate-orb-3"
        style={{
          width: 550,
          height: 550,
          bottom: "5%",
          left: "30%",
          background:
            "radial-gradient(circle, rgba(212,168,75,0.04) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 px-8 py-5 flex items-center justify-between bg-gradient-to-b from-oracle-void/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <OracleSymbol size={28} className="text-oracle-gold" />
          <span className="font-display text-lg tracking-widest text-oracle-text-dim">
            POLYLAVA
          </span>
        </div>
        <div className="flex items-center gap-8">
          <a
            href="#philosophy"
            className="font-mono text-xs tracking-wider text-oracle-text-dim hover:text-oracle-text transition-colors duration-300"
          >
            Philosophy
          </a>
          <a
            href="#capabilities"
            className="font-mono text-xs tracking-wider text-oracle-text-dim hover:text-oracle-text transition-colors duration-300"
          >
            Capabilities
          </a>
          <button
            onClick={enter}
            className="font-mono text-xs tracking-widest border border-oracle-gold-dim/40 px-5 py-2 text-oracle-gold hover:border-oracle-gold hover:shadow-[0_0_20px_rgba(212,168,75,0.15)] transition-all duration-500"
          >
            Enter
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        <div className="animate-float mb-8">
          <OracleSymbol size={128} className="text-oracle-gold opacity-80" />
        </div>

        <h1
          className="font-display font-light text-7xl md:text-8xl text-oracle-gold tracking-wide opacity-0 animate-fade-up"
          style={{
            textShadow: "0 0 60px rgba(212,168,75,0.25)",
          }}
        >
          PolyLava
        </h1>

        <p className="font-display italic text-xl md:text-2xl text-oracle-amber mt-4 opacity-0 animate-fade-up delay-1">
          Intelligence that illuminates markets
        </p>

        <p className="max-w-lg text-center text-oracle-text-dim text-sm leading-relaxed mt-8 opacity-0 animate-fade-up delay-2">
          AI-powered prediction market analysis. Search markets, generate signals,
          and build persistent intelligence — all through natural conversation.
        </p>

        <button
          onClick={enter}
          className="mt-12 font-mono text-xs tracking-[0.3em] text-oracle-gold border border-oracle-gold-dim/30 px-10 py-3.5 hover:tracking-[0.5em] hover:border-oracle-gold/60 hover:shadow-[0_0_30px_rgba(212,168,75,0.1)] transition-all duration-700 opacity-0 animate-fade-up delay-3"
        >
          BEGIN SESSION
        </button>

        <div className="mt-16 text-oracle-gold-dim/40 text-2xl opacity-0 animate-fade-up delay-4">
          ◇
        </div>
      </section>

      {/* Philosophy */}
      <section
        id="philosophy"
        className="relative z-10 max-w-5xl mx-auto px-8 py-32"
      >
        <p className="font-mono text-xs tracking-[0.25em] text-oracle-text-dim mb-12 opacity-0 animate-fade-up">
          001 — PHILOSOPHY
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="opacity-0 animate-fade-up delay-1">
            <h2 className="font-display text-4xl font-light text-oracle-text mb-6 leading-tight">
              Markets deserve
              <br />
              <span className="text-oracle-gold">a worthy oracle</span>
            </h2>
            <p className="text-oracle-text-dim text-sm leading-relaxed mb-4">
              Most tools rush you. They optimize for speed, for throughput, for
              the illusion of insight. PolyLava takes a different path.
            </p>
            <p className="text-oracle-text-dim text-sm leading-relaxed">
              Here, intelligence is not noise — it is signal refined through
              depth. Every analysis is earned. Every prediction, weighted. This
              is not a dashboard. This is a conversation with the market itself.
            </p>
          </div>
          <div className="relative opacity-0 animate-fade-up delay-2">
            <div className="absolute -inset-3 bg-gradient-to-br from-oracle-surface to-oracle-deep border border-oracle-gold-dim/10 -rotate-2" />
            <div className="relative bg-gradient-to-br from-oracle-surface to-oracle-deep border border-oracle-gold-dim/20 p-12 flex items-center justify-center">
              <OracleSymbol size={120} className="text-oracle-gold opacity-40" />
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section
        id="capabilities"
        className="relative z-10 max-w-5xl mx-auto px-8 py-32"
      >
        <p className="font-mono text-xs tracking-[0.25em] text-oracle-text-dim mb-12 opacity-0 animate-fade-up">
          002 — CAPABILITIES
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {capabilities.map((cap, i) => (
            <div
              key={cap.title}
              className={`group border border-oracle-surface-light/60 bg-oracle-deep/40 p-8 hover:bg-oracle-surface/50 hover:border-oracle-gold-dim/30 transition-all duration-500 opacity-0 animate-fade-up delay-${i + 1}`}
            >
              <span className="font-display text-5xl font-light text-oracle-gold/10 block mb-4">
                {cap.numeral}
              </span>
              <h3 className="font-display text-xl text-oracle-text mb-3">
                {cap.title}
              </h3>
              <p className="text-oracle-text-dim text-sm leading-relaxed">
                {cap.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-32 flex flex-col items-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(212,168,75,0.04) 0%, transparent 60%)",
          }}
        />
        <p className="font-display italic text-lg text-oracle-amber mb-10 opacity-0 animate-fade-up">
          &ldquo;The market is a device for transferring money from the impatient to the patient.&rdquo;
        </p>
        <button
          onClick={enter}
          className="font-mono text-xs tracking-[0.3em] text-oracle-gold border border-oracle-gold-dim/30 px-10 py-3.5 hover:tracking-[0.5em] hover:border-oracle-gold/60 hover:shadow-[0_0_30px_rgba(212,168,75,0.1)] transition-all duration-700 opacity-0 animate-fade-up delay-1"
        >
          BEGIN
        </button>
      </section>

      {/* Footer Bar */}
      <footer className="relative z-10 border-t border-oracle-surface-light/30 py-6 text-center">
        <p className="font-mono text-[10px] tracking-[0.3em] text-oracle-text-dim/30">
          POLYLAVA · PREDICTION MARKET INTELLIGENCE · MMXXVI
        </p>
      </footer>
    </div>
  );
}
