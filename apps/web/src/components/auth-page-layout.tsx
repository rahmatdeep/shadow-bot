"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Video } from "lucide-react";
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

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;
    let centerX = width / 2;
    let centerY = height / 2;

    // INTERACTION STATE
    // The ring is ALWAYS at center.
    // Mouse controls parameters only.
    const params = {
      thickness: 50, // Controlled by distance from center
      speed: 0.002, // Controlled by X (yaw) or distance
      tiltX: 0, // Controlled by Y
      tiltY: 0, // Controlled by X
      colorShift: 0, // 0 = Terracotta light, 1 = Terracotta dark
    };

    // Smooth Lerp Targets
    const targetParams = {
      thickness: 50,
      speed: 0.002,
      tiltX: 0,
      tiltY: 0,
      colorShift: 0,
    };

    const PARTICLE_COUNT = 4000;

    interface Particle {
      angle: number; // Orbit angle (0-2PI)
      radius: number; // Base radius offset (0-1)
      zOffset: number; // Vertical scatter
      speedOffset: number; // Individual speed variance
      size: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random(), // 0 to 1, used to distribute within thickness
        zOffset: (Math.random() - 0.5) * 2, // -1 to 1
        speedOffset: 0.5 + Math.random(), // Multiplier
        size: Math.random(),
      });
    }

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized distance from center (0 to 1 approx)
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.min(width, height) / 2;
      const normDist = Math.min(dist / maxDist, 1);

      // MAP MOUSE TO PARAMS

      // 1. Thickness: Closer = Thin/Focused. Further = Huge/Exploded.
      targetParams.thickness = 20 + normDist * 300;

      // 2. Speed: Further = Faster (Engine revving up)
      targetParams.speed = 0.002 + normDist * 0.02;

      // 3. Tilt: Based on mouse quadrant
      targetParams.tiltX = (dy / height) * 2; // -1 to 1
      targetParams.tiltY = (dx / width) * 2; // -1 to 1

      // 4. Color: Intensity
      targetParams.colorShift = normDist;
    };

    const draw = () => {
      // Smooth Parameter Interpolation (Lerp)
      const ease = 0.05;
      params.thickness += (targetParams.thickness - params.thickness) * ease;
      params.speed += (targetParams.speed - params.speed) * ease;
      params.tiltX += (targetParams.tiltX - params.tiltX) * ease;
      params.tiltY += (targetParams.tiltY - params.tiltY) * ease;
      params.colorShift += (targetParams.colorShift - params.colorShift) * ease;

      ctx.clearRect(0, 0, width, height);

      const baseRadius = Math.min(width, height) * 0.35; // HUGE: 35% of screen min dim

      // Color Interpolation - Updated to Terracotta
      // Terracotta light: 228, 122, 95 (#E47A5F)
      // Terracotta dark: 139, 58, 47 (#8B3A2F)
      const colorShift = Math.min(params.colorShift, 0.1);
      const r = 228 + (139 - 228) * colorShift;
      const g = 122 + (58 - 122) * colorShift;
      const b = 95 + (47 - 95) * colorShift;
      const rgb = `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;

      ctx.fillStyle = `rgba(${rgb}, 1)`;

      // Precalc rotation matrices
      const cosX = Math.cos(params.tiltX * 0.5); // Dampened tilt
      const sinX = Math.sin(params.tiltX * 0.5);
      const cosY = Math.cos(params.tiltY * 0.5);
      const sinY = Math.sin(params.tiltY * 0.5);

      particles.forEach((p) => {
        // Orbit
        p.angle += params.speed * p.speedOffset;

        // Form the Ring
        const spread =
          Math.pow(p.radius, 2) *
          params.thickness *
          (Math.random() > 0.5 ? 1 : -1);
        const r = baseRadius + spread;

        // Model Coordinates (Flat Ring)
        const x = r * Math.cos(p.angle);
        const y = r * Math.sin(p.angle);
        const z = p.zOffset * (params.thickness * 0.2); // Z-thickness scales with width too

        // Apply 3D Rotation (Tilt)
        // Rotate Y (Yaw)
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // Rotate X (Pitch)
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective
        const cameraZ = 800;
        const scale = cameraZ / (cameraZ + z2);

        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;

        // Draw
        const alpha = Math.max(0.1, scale * 0.8 * (1 - p.radius)); // Fade edges
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        const pSize = Math.max(0.5, p.size * 2 * scale);
        ctx.arc(screenX, screenY, pSize, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 text-brown-900 font-sans selection:bg-terra-500/30 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Static Gradient Fallback */}
      <div className="absolute inset-0 z-[-1] bg-radial-gradient from-terra-500/5 to-transparent pointer-events-none" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.2,
        }}
        className="w-full max-w-sm z-10 space-y-12 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-brown-900/10 shadow-2xl relative"
      >
        {/* Floating animation */}
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 -z-10 bg-linear-to-br from-terra-600/5 to-terra-800/5 rounded-3xl blur-xl"
        />

        <header className="text-center space-y-4 pt-4">
          <Link href="/" className="inline-block group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-14 h-14 rounded-2xl bg-linear-to-br from-terra-600 to-terra-800 mx-auto flex items-center justify-center shadow-2xl shadow-terra-800/20 group-hover:shadow-terra-800/40 transition-shadow duration-300"
            >
              <Video className="text-white w-7 h-7" />
            </motion.div>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-1"
          >
            <h1 className="text-3xl font-bold tracking-tight text-brown-900">
              {title}
            </h1>
            <p className="text-sm font-medium text-brown-600 tracking-tight">
              {subtitle}
            </p>
          </motion.div>
        </header>

        <main className="relative pb-4">{children}</main>
      </motion.div>
    </div>
  );
}
