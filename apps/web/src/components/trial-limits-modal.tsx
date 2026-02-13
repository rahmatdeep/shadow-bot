"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  RiTimeLine,
  RiDatabase2Line,
  RiHardDriveLine,
  RiShieldCheckLine,
  RiCloseLine,
  RiFlashlightLine,
} from "react-icons/ri";

interface TrialLimitsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrialLimitsModal({ isOpen, onClose }: TrialLimitsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-text-900/20 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container to handle scroll on small heights */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md max-h-[90vh] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-text-900/10 flex flex-col overflow-hidden ring-1 ring-text-200/50 z-10"
          >
            {/* Decorative Header Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-accent-50/50 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-text-400 hover:text-text-700 hover:bg-secondary-200/50 rounded-full transition-all z-20 active:scale-95"
            >
              <RiCloseLine className="w-5 h-5" />
            </button>

            {/* Scrollable Content */}
            <div className="relative flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 pt-10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-white text-accent-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-accent-100 ring-4 ring-accent-50/30 transition-transform hover:scale-105 duration-500">
                  <RiShieldCheckLine className="w-8 h-8" />
                </div>
                <h2
                  className="text-2xl sm:text-3xl text-text-900 tracking-tight mb-2"
                  style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
                >
                  Public Beta Active
                </h2>
                <p className="text-text-500 text-sm font-normal leading-relaxed max-w-[280px] mx-auto">
                  Experience the future of AI meetings. Please note the current
                  beta guidelines:
                </p>
              </div>

              {/* Limitations List */}
              <div className="space-y-3 mb-4">
                {[
                  {
                    icon: RiTimeLine,
                    title: "15-Minute Limit",
                    desc: "Auto-disconnects after 15 minutes of recording.",
                    color: "text-orange-500",
                    bg: "bg-orange-50/50",
                  },
                  {
                    icon: RiFlashlightLine,
                    title: "Single Concurrent Bot",
                    desc: "One active bot per account at any given time.",
                    color: "text-blue-500",
                    bg: "bg-blue-50/50",
                  },
                  {
                    icon: RiHardDriveLine,
                    title: "24-Hour Retention",
                    desc: "Transcripts & recordings auto-delete after 24 hours.",
                    color: "text-rose-500",
                    bg: "bg-rose-50/50",
                  },
                  {
                    icon: RiDatabase2Line,
                    title: "Simulation Limits",
                    desc: "Limited number of total recordings per beta cycle.",
                    color: "text-violet-500",
                    bg: "bg-violet-50/50",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 border border-text-100/50 hover:border-accent-200/40 hover:bg-white/60 transition-all group"
                  >
                    <div
                      className={`mt-0.5 w-9 h-9 rounded-xl ${item.bg} border border-text-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-900 text-sm tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-xs text-text-400 font-medium mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed Footer Action */}
            <div className="p-6 pt-2 border-t border-text-100/30 bg-white/50 backdrop-blur-md">
              <button
                onClick={onClose}
                className="group relative w-full py-4 bg-text-900 text-white font-semibold rounded-full shadow-xl shadow-text-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden"
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
                <span className="relative z-10">I Understand</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </AnimatePresence>
  );
}
