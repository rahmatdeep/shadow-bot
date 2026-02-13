"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

import Link from "next/link";

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthPageLayout({
  children,
  title,
  subtitle,
}: AuthPageLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: number;
    }[] = [];
    const particleCount = 60;
    let mouseX = 0;
    let mouseY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();

    // Blue / violet / lavender tones for particles
    const colors = [
      [100, 100, 240], // soft blue-violet
      [140, 130, 255], // lavender
      [80, 80, 200], // deeper blue
      [160, 140, 220], // muted lilac
      [120, 120, 180], // grey-blue
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.3 + 0.05,
        color: Math.floor(Math.random() * colors.length),
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle radial gradient background wash
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.6,
      );
      gradient.addColorStop(0, "rgba(120, 120, 240, 0.04)");
      gradient.addColorStop(0.5, "rgba(160, 140, 220, 0.02)");
      gradient.addColorStop(1, "rgba(250, 250, 250, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Subtle mouse attraction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          p.x += dx * 0.001;
          p.y += dy * 0.001;
        }

        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const rgb = colors[p.color];
        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw subtle connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(140, 130, 220, ${0.03 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-secondary-100 text-text-900 font-sans selection:bg-accent-500/20 flex items-center justify-center p-6 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Static Gradient Fallback */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-linear-to-br from-accent-200/15 via-blue-200/10 to-violet-200/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.2,
        }}
        className="w-full max-w-sm z-10 space-y-12 bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-text-200/50 shadow-2xl shadow-text-900/4 relative"
      >
        {/* Brand */}
        <div className="text-center space-y-6">
          {/* <Link
            href="/"
            className="inline-flex items-center gap-1.5 group mx-auto"
          >
            <span
              className="text-2xl text-text-900 tracking-tight group-hover:opacity-70 transition-opacity"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Shadow
            </span>
            <span className="text-2xl font-semibold tracking-tight text-text-400 group-hover:opacity-70 transition-opacity">
              Bot
            </span>
          </Link> */}
          <div className="space-y-2 min-h-22 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={title}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-2"
              >
                <h1
                  className="text-3xl text-text-900 tracking-tight"
                  style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                >
                  {title}
                </h1>
                <p className="text-sm text-text-500 font-normal">{subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {children}
      </motion.div>
    </div>
  );
}
