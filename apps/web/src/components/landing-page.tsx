"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Video, FileText, Sparkles, ArrowRight } from "lucide-react";
import { RiGhostSmileLine, RiGithubFill, RiSearchLine } from "react-icons/ri";

import Link from "next/link";
import { useRef } from "react";
import { GoHeartFill } from "react-icons/go";

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Smooth spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallax transforms
  const heroY = useTransform(smoothProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 0.95]);

  return (
    <div
      ref={containerRef}
      className="bg-secondary-50 text-text-900 font-sans selection:bg-primary-500/30 overflow-x-hidden"
    >
      {/* Subtle Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] -z-10"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-primary-700) 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 w-full z-50 h-20 border-b border-text-900/10 bg-secondary-50/80 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <RiGhostSmileLine className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-text-900">
              Shadow Bot
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-6"
          >
            <Link
              href="/login"
              className="text-sm font-semibold text-text-600 hover:text-text-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg"
            >
              Start Free
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section with Parallax */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 relative">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="text-center max-w-5xl space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-200/10 border border-primary-500/20 text-xs font-bold text-primary-600"
          >
            <Sparkles className="w-3 h-3" /> AI-Powered Meeting Assistant
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-text-900 leading-[1.1]"
          >
            Never miss a{" "}
            <span className="bg-linear-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              meeting detail
            </span>{" "}
            again
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xl md:text-2xl text-text-700 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Shadow Bot silently joins your meetings, records it, and delivers
            instant transcripts, AI summaries, and semantic search, powered by
            Gemini and ElevenLabs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <Link
              href="/signup"
              className="px-8 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-xl text-base font-bold hover:opacity-90 transition-all shadow-xl inline-flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://github.com/rahmatdeep/shadow-bot"
              target="_blank"
              className="px-8 py-4 bg-white border border-text-900/10 text-primary-600 rounded-xl text-base font-bold hover:bg-primary-50 transition-all inline-flex items-center justify-center gap-2 group"
            >
              <RiGithubFill className="w-5 h-5 text-primary-600 group-hover:text-primary-800 transition-colors" />
              View on GitHub
            </Link>
          </motion.div>

          {/* Hero Visual with Scroll Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="bg-white border border-text-900/10 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
              <div className="aspect-video bg-secondary-100 rounded-xl flex items-center justify-center relative overflow-hidden border border-text-900/5">
                <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-primary-700/5" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-text-700 uppercase tracking-wider">
                    Recording in Progress
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section with Stagger */}
      <section className="py-32 px-6 bg-secondary-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-900 mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-text-700 max-w-2xl mx-auto">
              From recording to insights, Shadow Bot handles it all
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Video,
                title: "Auto Recording",
                desc: "Bot joins your Google Meet automatically and captures everything in high quality.",
                active: true,
                delay: 0.1,
              },
              {
                icon: FileText,
                title: "AI Transcription",
                desc: "ElevenLabs Scribe v2 delivers high-fidelity transcripts with near-perfect accuracy.",
                active: true,
                delay: 0.2,
              },
              {
                icon: Sparkles,
                title: "Smart Summaries",
                desc: "Multi-stage Gemini Flash pipeline extracts structured action items, decisions, and detailed prose summaries.",
                active: true,
                delay: 0.3,
              },
              {
                icon: RiSearchLine,
                title: "Semantic Search",
                desc: "Find what you need with vector search. Ask 'What was the budget?' and get answers from all your meetings.",
                active: true,
                delay: 0.4,
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  delay: feature.delay,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white border border-text-900/10 rounded-xl p-6 space-y-4 hover:border-primary-600 hover:shadow-lg transition-all relative"
              >
                {!feature.active && (
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-bold text-primary-800 uppercase">
                    Coming Soon
                  </div>
                )}
                <div
                  className={`w-14 h-14 rounded-xl ${feature.active ? "bg-linear-to-br from-primary-600 to-primary-700" : "bg-secondary-200 border border-text-900/10"} flex items-center justify-center shadow-md`}
                >
                  {feature.icon === RiSearchLine ? (
                    <RiSearchLine
                      className={`w-7 h-7 ${feature.active ? "text-white" : "text-text-600"}`}
                    />
                  ) : (
                    <feature.icon
                      className={`w-7 h-7 ${feature.active ? "text-white" : "text-text-600"}`}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-700 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Scrollytelling */}
      <section className="py-32 px-6 bg-secondary-100">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-text-900 mb-4">
              Simple as 1, 2, 3
            </h2>
            <p className="text-xl text-text-700">
              Get started in under a minute
            </p>
          </motion.div>

          <div className="space-y-32">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col md:flex-row items-center gap-12"
            >
              <motion.div
                whileInView={{ scale: [1, 1.05, 1] }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex-1 space-y-4"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-primary-600 to-primary-700 text-white font-extrabold text-xl shadow-lg">
                  1
                </div>
                <h3 className="text-3xl font-bold text-text-900">
                  Paste your meeting link   
                </h3>
                <p className="text-lg text-text-700 leading-relaxed">
                  Copy your Google Meet and paste it into Shadow Bot. That's it.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 bg-white border border-text-900/10 rounded-xl p-6 h-48 flex items-center justify-center shadow-md"
              >
                <div className="w-full h-12 bg-secondary-100 rounded-lg flex items-center px-4 gap-3 border border-text-900/5">
                  <Video className="w-5 h-5 text-primary-600" />
                  <div className="h-2 flex-1 bg-secondary-200 rounded-full" />
                </div>
              </motion.div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col md:flex-row-reverse items-center gap-12"
            >
              <motion.div
                whileInView={{ scale: [1, 1.05, 1] }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex-1 space-y-4"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-primary-600 to-primary-700 text-white font-extrabold text-xl shadow-lg">
                  2
                </div>
                <h3 className="text-3xl font-bold text-text-900">
                  Bot joins and records
                </h3>
                <p className="text-lg text-text-700 leading-relaxed">
                  Shadow Bot enters the call and starts capturing everything
                  silently.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 bg-white border border-text-900/10 rounded-xl p-6 h-48 flex items-center justify-center shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md">
                    <RiGhostSmileLine className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-32 bg-secondary-200 rounded-full" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <div className="h-2 w-20 bg-red-500/20 rounded-full" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col md:flex-row items-center gap-12"
            >
              <motion.div
                whileInView={{ scale: [1, 1.05, 1] }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex-1 space-y-4"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-primary-600 to-primary-700 text-white font-extrabold text-xl shadow-lg">
                  3
                </div>
                <h3 className="text-3xl font-bold text-text-900">
                  Get your insights
                </h3>
                <p className="text-lg text-text-700 leading-relaxed">
                  Receive structured summaries, tags, and valid JSON outputs.
                  Share with your team instantly.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 bg-white border border-text-900/10 rounded-xl p-6 h-48 flex flex-col justify-center gap-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <div className="h-2 flex-1 bg-primary-600/20 rounded-full" />
                </div>
                <div className="space-y-2 pl-8">
                  <div className="h-2 w-full bg-secondary-200 rounded-full" />
                  <div className="h-2 w-3/4 bg-secondary-200 rounded-full" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA with Scale */}
      <section className="py-32 px-6 bg-linear-to-b from-secondary-100 to-primary-500/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="text-5xl md:text-6xl font-extrabold text-text-900 leading-tight">
            Ready to leverage your meetings?
          </h2>
          <p className="text-2xl text-text-700">
            Join teams who never miss a detail
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <Link
              href="/signup"
              className="px-8 py-4 bg-linear-to-r from-primary-600 to-primary-700 text-white rounded-xl text-base font-bold hover:opacity-90 transition-all shadow-xl inline-flex items-center justify-center gap-2"
            >
              Start Recording Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-secondary-200 border border-text-900/10 text-text-900 rounded-xl text-base font-bold hover:bg-secondary-300 transition-all"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-primary-500/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-center">
          <div className="flex items-center gap-2 text-sm text-text-500">
            <span>Made with</span>
            <span className="text-primary-600">
              <GoHeartFill />
            </span>
            <span>by</span>
            <Link
              href="https://github.com/rahmatdeep"
              className="text-primary-600 font-bold hover:underline"
              target="_blank"
            >
              @rahmatdeep
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
