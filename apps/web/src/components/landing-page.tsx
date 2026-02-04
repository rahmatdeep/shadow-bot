"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Video, FileText, Sparkles, ArrowRight, Bot } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

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
      className="bg-cream-50 text-brown-900 font-sans selection:bg-terra-500/30 overflow-x-hidden"
    >
      {/* Subtle Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] -z-10"
        style={{
          backgroundImage: "radial-gradient(#C45A4A 0.5px, transparent 0.5px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 w-full z-50 h-20 border-b border-brown-900/10 bg-cream-50/80 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-terra-600 to-terra-800 flex items-center justify-center shadow-lg">
              <Bot className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-brown-900">
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
              className="text-sm font-semibold text-brown-600 hover:text-brown-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 bg-linear-to-r from-terra-600 to-terra-700 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg"
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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terra-500/10 border border-terra-500/20 text-xs font-bold text-terra-800"
          >
            <Sparkles className="w-3 h-3" /> AI-Powered Meeting Assistant
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-brown-900 leading-[1.1]"
          >
            Never miss a{" "}
            <span className="bg-linear-to-r from-terra-600 to-terra-700 bg-clip-text text-transparent">
              meeting detail
            </span>{" "}
            again
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-xl md:text-2xl text-brown-700 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Shadow Bot joins your meetings, records everything, and delivers
            transcripts and AI summaries—so you can focus on the conversation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <Link
              href="/signup"
              className="px-8 py-4 bg-linear-to-r from-terra-600 to-terra-700 text-white rounded-xl text-base font-bold hover:opacity-90 transition-all shadow-xl inline-flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="px-8 py-4 bg-cream-200 border border-brown-900/10 text-brown-900 rounded-xl text-base font-bold hover:bg-cream-300 transition-all">
              Watch Demo
            </button>
          </motion.div>

          {/* Hero Visual with Scroll Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="bg-white border border-brown-900/10 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
              <div className="aspect-video bg-cream-100 rounded-xl flex items-center justify-center relative overflow-hidden border border-brown-900/5">
                <div className="absolute inset-0 bg-linear-to-br from-terra-500/10 to-terra-700/5" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-bold text-brown-700 uppercase tracking-wider">
                    Recording in Progress
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section with Stagger */}
      <section className="py-32 px-6 bg-cream-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-brown-900 mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-brown-700 max-w-2xl mx-auto">
              From recording to insights, Shadow Bot handles it all
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "Auto Recording",
                desc: "Bot joins your Google Meet, Zoom, or Teams calls automatically and captures everything in high quality.",
                active: true,
                delay: 0.1,
              },
              {
                icon: FileText,
                title: "AI Transcription",
                desc: "Searchable, speaker-labeled transcripts with timestamps. Find any moment instantly.",
                active: false,
                delay: 0.2,
              },
              {
                icon: Sparkles,
                title: "Smart Summaries",
                desc: "AI extracts key points, action items, and decisions. Skip the replay, get straight to what matters.",
                active: false,
                delay: 0.3,
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
                className="bg-white border border-brown-900/10 rounded-xl p-6 space-y-4 hover:border-terra-600 hover:shadow-lg transition-all relative"
              >
                {!feature.active && (
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-terra-500/10 border border-terra-500/20 text-xs font-bold text-terra-800 uppercase">
                    Coming Soon
                  </div>
                )}
                <div
                  className={`w-14 h-14 rounded-xl ${feature.active ? "bg-linear-to-br from-terra-600 to-terra-800" : "bg-cream-200 border border-brown-900/10"} flex items-center justify-center shadow-md`}
                >
                  <feature.icon
                    className={`w-7 h-7 ${feature.active ? "text-white" : "text-brown-600"}`}
                  />
                </div>
                <h3 className="text-2xl font-bold text-brown-900">
                  {feature.title}
                </h3>
                <p className="text-brown-700 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Scrollytelling */}
      <section className="py-32 px-6 bg-cream-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-brown-900 mb-4">
              Simple as 1, 2, 3
            </h2>
            <p className="text-xl text-brown-700">
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
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-terra-600 to-terra-700 text-white font-extrabold text-xl shadow-lg">
                  1
                </div>
                <h3 className="text-3xl font-bold text-brown-900">
                  Paste your meeting link
                </h3>
                <p className="text-lg text-brown-700 leading-relaxed">
                  Copy your Google Meet or Zoom URL and paste it into Shadow
                  Bot. That's it.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 bg-white border border-brown-900/10 rounded-xl p-6 h-48 flex items-center justify-center shadow-md"
              >
                <div className="w-full h-12 bg-cream-100 rounded-lg flex items-center px-4 gap-3 border border-brown-900/5">
                  <Video className="w-5 h-5 text-brown-600" />
                  <div className="h-2 flex-1 bg-cream-200 rounded-full" />
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
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-terra-600 to-terra-700 text-white font-extrabold text-xl shadow-lg">
                  2
                </div>
                <h3 className="text-3xl font-bold text-brown-900">
                  Bot joins and records
                </h3>
                <p className="text-lg text-brown-700 leading-relaxed">
                  Shadow Bot enters the call, introduces itself, and starts
                  capturing everything silently.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 bg-white border border-brown-900/10 rounded-xl p-6 h-48 flex items-center justify-center shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-terra-600 to-terra-800 flex items-center justify-center shadow-md">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-32 bg-cream-200 rounded-full" />
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
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-r from-terra-600 to-terra-700 text-white font-extrabold text-xl shadow-lg">
                  3
                </div>
                <h3 className="text-3xl font-bold text-brown-900">
                  Get your insights
                </h3>
                <p className="text-lg text-brown-700 leading-relaxed">
                  Access the video, transcript, and AI summary in your
                  dashboard. Share with your team instantly.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex-1 bg-white border border-brown-900/10 rounded-xl p-6 h-48 flex flex-col justify-center gap-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-terra-600" />
                  <div className="h-2 flex-1 bg-terra-600/20 rounded-full" />
                </div>
                <div className="space-y-2 pl-8">
                  <div className="h-2 w-full bg-cream-200 rounded-full" />
                  <div className="h-2 w-3/4 bg-cream-200 rounded-full" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA with Scale */}
      <section className="py-32 px-6 bg-linear-to-b from-cream-100 to-terra-500/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <h2 className="text-5xl md:text-6xl font-extrabold text-brown-900 leading-tight">
            Ready to transform your meetings?
          </h2>
          <p className="text-2xl text-brown-700">
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
              className="px-8 py-4 bg-linear-to-r from-terra-600 to-terra-700 text-white rounded-xl text-base font-bold hover:opacity-90 transition-all shadow-xl inline-flex items-center justify-center gap-2"
            >
              Start Recording Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-cream-200 border border-brown-900/10 text-brown-900 rounded-xl text-base font-bold hover:bg-cream-300 transition-all"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-brown-900/10 bg-cream-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-terra-600 to-terra-800 flex items-center justify-center shadow-md">
                <Bot className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-extrabold text-brown-900">
                Shadow Bot
              </span>
            </div>
            <p className="text-sm text-brown-600 leading-relaxed max-w-xs">
              AI-powered meeting assistant for teams who value clarity and
              productivity.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brown-900 uppercase tracking-wider">
              Platform
            </h4>
            <ul className="text-sm space-y-2 text-brown-700">
              <li>
                <Link
                  href="/"
                  className="hover:text-brown-900 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-brown-900 transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="hover:text-brown-900 transition-colors"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3 md:text-right">
            <h4 className="text-xs font-bold text-brown-900 uppercase tracking-wider">
              Contact
            </h4>
            <p className="text-sm text-brown-700">support@shadowbot.ai</p>
            <p className="text-xs text-brown-500 pt-8">
              © 2026 Shadow Bot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
