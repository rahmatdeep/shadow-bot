"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";

import Link from "next/link";
import {
  RiGithubFill,
  RiArrowRightLine,
  RiMicLine,
  RiSearchEyeLine,
  RiFileTextLine,
  RiRobot2Line,
  RiPlayCircleLine,
  RiSparklingLine,
  RiTimeLine,
  RiShieldCheckLine,
  RiHeartFill,
} from "react-icons/ri";
import {
  HiOutlineLightBulb,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { TbBrandOpenSource } from "react-icons/tb";


function FlipWords({
  words,
  className = "",
}: {
  words: string[];
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className={`inline-block relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[currentIndex]}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)", rotateX: 45 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0 }}
          exit={{ opacity: 0, y: -20, filter: "blur(8px)", rotateX: -45 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block text-accent-600"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─────────────────────────────────────────────
   Spotlight Card (Aceternity-inspired)
   ───────────────────────────────────────────── */
function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(100,100,255,0.06), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Landing Page
   ───────────────────────────────────────────── */
export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const springConfig = { stiffness: 50, damping: 20, mass: 0.5 };
  const heroY = useSpring(
    useTransform(scrollYProgress, [0, 0.3], [0, -120]),
    springConfig,
  );
  const heroOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.25], [1, 0]),
    springConfig,
  );
  const heroScale = useSpring(
    useTransform(scrollYProgress, [0, 0.25], [1, 0.95]),
    springConfig,
  );

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setNavScrolled(latest > 0.02);
  });

  const bentoFeatures = [
    {
      icon: RiMicLine,
      title: "Auto-Record",
      description:
        "Shadow Bot silently joins your Google Meet, captures every word and visual. No plugins, no extensions — just paste your link.",
      className: "md:col-span-2",
      gradient: "from-blue-500/5 to-violet-500/5",
    },
    {
      icon: RiFileTextLine,
      title: "Instant Transcripts",
      description:
        "Accurate, time-stamped transcripts delivered seconds after your meeting ends.",
      className: "md:col-span-1",
      gradient: "from-emerald-500/5 to-teal-500/5",
    },
    {
      icon: RiSparklingLine,
      title: "AI Summaries",
      description:
        "Key insights, action items, and decisions distilled into structured briefs automatically.",
      className: "md:col-span-1",
      gradient: "from-amber-500/5 to-orange-500/5",
    },
    {
      icon: RiSearchEyeLine,
      title: "Ask Anything",
      description:
        "Natural language search across all your meetings. Ask a question, get an answer grounded in your actual conversations.",
      className: "md:col-span-2",
      gradient: "from-rose-500/5 to-pink-500/5",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="bg-secondary-100 text-text-900 font-sans selection:bg-accent-500/20 overflow-x-hidden"
    >
      {/* ─── Navbar ─── */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div
          className={`mx-auto max-w-6xl transition-all duration-500 ease-out ${
            navScrolled ? "mt-4 mx-4 sm:mx-6 lg:mx-auto" : "mt-0 mx-0"
          }`}
        >
          <div
            className={`flex items-center justify-between transition-all duration-500 ease-out ${
              navScrolled
                ? "bg-white/75 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] px-6 py-3"
                : "bg-transparent px-6 sm:px-12 lg:px-16 py-6"
            }`}
          >
            <Link href="/" className="flex items-center gap-1.5 group">
              <span
                className="text-[22px] tracking-tight text-text-900 group-hover:opacity-70 transition-opacity"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Shadow
              </span>
              <span className="text-[22px] font-semibold tracking-tight text-text-400">
                Bot
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {[
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#how-it-works" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2 text-[13px] font-medium text-text-500 hover:text-text-900 rounded-full hover:bg-text-100/60 transition-all duration-200"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://github.com/rahmatdeep/shadow-bot"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-[13px] font-medium text-text-500 hover:text-text-900 rounded-full hover:bg-text-100/60 transition-all duration-200 flex items-center gap-1.5"
              >
                <RiGithubFill className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-[13px] font-medium text-text-600 hover:text-text-900 transition-colors px-4 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="bg-text-900 text-white text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-text-800 active:scale-[0.97] transition-all shadow-sm hover:shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero Section with Flip Words ─── */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 relative">
        {/* Aurora Mesh Shader Background */}
        <div className="aurora-mesh">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          <div className="blob blob-4" />
          <div className="blob blob-5" />
        </div>

        {/* Fine Noise Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #111 0.8px, transparent 0.8px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-accent-400/30"
              style={{
                left: `${15 + i * 14}%`,
                bottom: `${-5 - i * 3}%`,
                animation: `float-particle ${12 + i * 3}s ease-in-out infinite`,
                animationDelay: `${i * 2.5}s`,
              }}
            />
          ))}
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="text-center max-w-5xl space-y-10 relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.2,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/70 backdrop-blur-md rounded-full border border-text-200/50 shadow-sm">
              <TbBrandOpenSource className="w-4 h-4 text-accent-600" />
              <span className="text-[13px] font-medium text-text-600">
                Open Source & Free Forever
              </span>
            </span>
          </motion.div>

          {/* Heading with Flip Words */}
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.4,
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-[clamp(2.5rem,6vw,4.8rem)] tracking-tight text-text-900 leading-[1.08]"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Your meetings,
            <br />
            <FlipWords
              words={["remembered", "transcribed", "summarized", "searchable"]}
            />{" "}
            perfectly
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.6,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-lg md:text-xl text-text-500 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            An AI companion that silently joins your meetings, records every
            moment, and turns conversations into actionable intelligence.
          </motion.p>

          {/* CTAs — The Crazy Ones */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.8,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-2"
          >
            {/* Primary CTA — Dark with shimmer sweep + glow */}
            <Link
              href="/login"
              className="group relative overflow-hidden bg-text-900 text-white px-9 py-4.5 rounded-full font-semibold text-base active:scale-[0.96] transition-all duration-300 flex items-center gap-2.5 shadow-[0_0_30px_-5px_rgba(102,102,255,0.4)] hover:shadow-[0_0_50px_-5px_rgba(102,102,255,0.6)]"
            >
              {/* Shimmer sweep overlay */}
              <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
                    animation: "shimmer-slide 3s ease-in-out infinite",
                  }}
                />
              </span>
              {/* Accent underline glow */}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-linear-to-r from-transparent via-accent-400/60 to-transparent" />
              <span className="relative z-10 flex items-center gap-2.5">
                Start Recording Free
                <RiArrowRightLine className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>
            </Link>

            {/* Secondary CTA — Rotating gradient border + glassmorphic inner */}
            <a
              href="https://github.com/rahmatdeep/shadow-bot"
              target="_blank"
              rel="noreferrer"
              className="btn-animated-border group"
            >
              {/* Spinning gradient disc for animated border */}
              <div className="spin-gradient" />
              {/* Glassmorphic inner fill */}
              <span className="relative z-10 block px-9 py-4 rounded-full bg-secondary-100/90 backdrop-blur-xl">
                <span className="flex items-center gap-2.5 font-semibold text-base text-text-700 group-hover:text-text-900 transition-colors duration-300">
                  <RiGithubFill className="w-5 h-5" />
                  View on GitHub
                </span>
              </span>
            </a>
          </motion.div>

          {/* Statistic Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 1.1,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-wrap items-center justify-center gap-3 pt-8"
          >
            {[
              {
                icon: RiShieldCheckLine,
                text: "100% Open Source",
              },
              {
                icon: RiTimeLine,
                text: "< 2s Transcript Speed",
              },
              {
                icon: HiOutlineLightBulb,
                text: "AI-Powered Insights",
              },
            ].map((pill) => (
              <div
                key={pill.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-text-200/40 text-text-500"
              >
                <pill.icon className="w-4 h-4 text-text-400" />
                <span className="text-xs font-medium">{pill.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <p className="text-sm font-semibold text-accent-600 uppercase tracking-widest mb-4">
              How it works
            </p>
            <h2
              className="text-4xl md:text-5xl text-text-900 tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Three steps to perfect recall
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-linear-to-r from-transparent via-text-200/60 to-transparent" />

            {[
              {
                step: "01",
                icon: RiPlayCircleLine,
                title: "Paste your meeting link",
                description:
                  "Drop your Google Meet link and hit join. Shadow Bot handles everything.",
                color: "text-blue-500",
                bg: "bg-blue-50",
                ring: "ring-blue-100",
              },
              {
                step: "02",
                icon: RiMicLine,
                title: "We record & transcribe",
                description:
                  "AI captures audio, generates transcripts, and creates summaries in real-time.",
                color: "text-violet-500",
                bg: "bg-violet-50",
                ring: "ring-violet-100",
              },
              {
                step: "03",
                icon: HiOutlineChatBubbleLeftRight,
                title: "Chat with your meetings",
                description:
                  "Ask questions, get action items, search across all your meetings naturally.",
                color: "text-amber-500",
                bg: "bg-amber-50",
                ring: "ring-amber-100",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="text-center space-y-5 relative"
              >
                <div
                  className={`w-20 h-20 rounded-3xl ${item.bg} ${item.color} flex items-center justify-center mx-auto shadow-sm ring-4 ${item.ring} relative z-10 bg-white`}
                >
                  <item.icon className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-text-300 uppercase tracking-[0.2em]">
                    Step {item.step}
                  </span>
                  <h3 className="text-xl font-bold text-text-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-500 leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Bento Grid ─── */}
      <section id="features" className="py-32 px-6 relative overflow-hidden">
        {/* Aurora Mesh for Features */}
        <div className="aurora-mesh">
          <div className="blob blob-2" />
          <div className="blob blob-4" />
        </div>{" "}
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <p className="text-sm font-semibold text-accent-600 uppercase tracking-widest mb-4">
              Features
            </p>
            <h2
              className="text-4xl md:text-5xl text-text-900 tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Everything you need to capture meetings
            </h2>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {bentoFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={feature.className}
              >
                <SpotlightCard className="h-full rounded-3xl border border-text-200/50 bg-white/80 backdrop-blur-sm hover:border-text-300/60 hover:shadow-xl hover:shadow-text-900/5 transition-all duration-300 group">
                  <div
                    className={`h-full p-8 bg-linear-to-br ${feature.gradient} rounded-3xl`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-text-200/40 flex items-center justify-center mb-5 text-text-500 group-hover:text-accent-600 group-hover:border-accent-200/50 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-sm">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-text-900 mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-text-500 leading-relaxed text-[15px]">
                      {feature.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-32 px-6 relative overflow-hidden">
        {/* Aurora Mesh for CTA */}
        <div className="aurora-mesh">
          <div className="blob blob-1" />
          <div className="blob blob-3" />
          <div className="blob blob-5" />
        </div>

        {/* Fine Noise Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #111 0.8px, transparent 0.8px)",
            backgroundSize: "20px 20px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <h2
            className="text-4xl md:text-5xl text-text-900 tracking-tight leading-tight mb-6"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            Ready to let your meetings work for you?
          </h2>
          <p className="text-lg text-text-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Join thousands of teams who never miss an action item, decision, or
            key insight.
          </p>
          <Link
            href="/login"
            className="group relative overflow-hidden inline-flex items-center gap-2.5 bg-text-900 text-white px-10 py-4.5 rounded-full font-semibold text-base active:scale-[0.96] transition-all duration-300 shadow-[0_0_30px_-5px_rgba(102,102,255,0.4)] hover:shadow-[0_0_50px_-5px_rgba(102,102,255,0.6)]"
          >
            {/* Shimmer sweep */}
            <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
                  animation: "shimmer-slide 3s ease-in-out infinite",
                }}
              />
            </span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-linear-to-r from-transparent via-accent-400/60 to-transparent" />
            <span className="relative z-10 flex items-center gap-2.5">
              Get Started — It&apos;s Free
              <RiArrowRightLine className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
            </span>
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-12 px-6 border-t border-text-200/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span
              className="text-lg tracking-tight text-text-800"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Shadow
            </span>
            <span className="text-lg font-semibold tracking-tight text-text-400">
              Bot
            </span>
          </div>
          <p className="text-sm text-text-400 flex items-center gap-1.5">
            Made with <RiHeartFill className="w-3.5 h-3.5 text-red-400" /> for
            better meetings
          </p>
          <a
            href="https://github.com/rahmatdeep"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-text-400 hover:text-text-700 transition-colors flex items-center gap-1.5"
          >
            <RiGithubFill className="w-4 h-4" />
            @rahmatdeep
          </a>
        </div>
      </footer>
    </div>
  );
}
