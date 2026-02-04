"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  FileText,
  Sparkles,
  ArrowRight,
  Bot,
  LogOut,
  Play,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { signOut } from "next-auth/react";

export function Dashboard({ session }: { session: any }) {
  const [meetLink, setMeetLink] = useState("");
  const [botName, setBotName] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      import("../lib/api")
        .then((mod) => mod.getRecordings(session.user.email))
        .then(setRecordings);
    }
  }, [session]);

  const [activeBotContainerId, setActiveBotContainerId] = useState<
    string | null
  >(null);
  const [isJoining, setIsJoining] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validateMeetLink = (link: string): boolean => {
    const meetRegex =
      /^https:\/\/meet\.google\.com\/[a-z0-9]{3}-?[a-z0-9]{4}-?[a-z0-9]{3}$/i;
    return meetRegex.test(link.trim());
  };

  const handleMeetLinkChange = (value: string) => {
    setMeetLink(value);
    setLinkError(null);
  };

  async function handleInvite() {
    if (!validateMeetLink(meetLink)) {
      setLinkError("Please enter a valid Google Meet link");
      return;
    }

    setIsDeploying(true);
    try {
      const result = await import("../lib/api").then((mod) =>
        mod.startBot(
          meetLink,
          botName || "Shadow NoteTaker",
          session.user.email,
        ),
      );
      if (result && result.containerId) {
        setActiveBotContainerId(result.containerId);
        setIsJoining(true);
        setTimeout(() => {
          setIsJoining(false);
          showToast("Bot joined the meeting");
        }, 6000);
      }
      setMeetLink("");
      setLinkError(null);
    } catch (e) {
      console.error(e);
      showToast("Failed to start bot", "error");
    } finally {
      setIsDeploying(false);
    }
  }

  async function handleStopBot() {
    if (!activeBotContainerId) return;
    try {
      await import("../lib/api").then((mod) =>
        mod.stopBot(activeBotContainerId),
      );
      setActiveBotContainerId(null);
      showToast("Bot left the meeting");
    } catch (e) {
      console.error(e);
      showToast("Failed to stop bot", "error");
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 text-brown-900 font-sans selection:bg-terra-500/30">
      {/* Top Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 w-full z-50 border-b border-brown-900/10 bg-cream-50/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-terra-600 to-terra-800 flex items-center justify-center shadow-lg">
              <Bot className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-brown-900">
              Shadow Bot
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs text-brown-600 font-medium">
                Logged in as
              </span>
              <span className="text-sm font-semibold text-brown-900">
                {session.user?.email}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-semibold text-brown-700 hover:text-brown-900 transition-colors inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Dashboard Main */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - New Recording */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            <header className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl font-extrabold tracking-tight text-brown-900"
              >
                New Recording
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-brown-700"
              >
                Invite Shadow Bot to your next meeting
              </motion.p>
            </header>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white border border-brown-900/10 rounded-xl p-6 space-y-6 shadow-md"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-brown-900">
                    Meeting Link
                  </label>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-600" />
                    <input
                      value={meetLink}
                      onChange={(e) => handleMeetLinkChange(e.target.value)}
                      className={`w-full h-14 bg-cream-100 border rounded-xl px-5 pl-12 outline-none transition-all placeholder:text-brown-500 font-medium text-brown-900 ${
                        linkError
                          ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20"
                          : "border-brown-900/10 focus:border-terra-600 focus:ring-2 focus:ring-terra-600/20"
                      }`}
                      placeholder="https://meet.google.com/abc-defg-hij"
                    />
                  </div>
                  <AnimatePresence>
                    {linkError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-red-600 font-medium flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {linkError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-brown-900">
                    Bot Name (Optional)
                  </label>
                  <div className="relative">
                    <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-600" />
                    <input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="w-full h-14 bg-cream-100 border border-brown-900/10 rounded-xl px-5 pl-12 focus:border-terra-600 outline-none transition-all placeholder:text-brown-500 font-medium text-brown-900"
                      placeholder="Shadow NoteTaker"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={
                    activeBotContainerId && !isJoining
                      ? handleStopBot
                      : handleInvite
                  }
                  disabled={
                    (!meetLink && !activeBotContainerId) ||
                    isDeploying ||
                    isJoining
                  }
                  className={`w-full h-14 rounded-xl text-base font-bold transition-all shadow-lg inline-flex items-center justify-center gap-2 ${
                    activeBotContainerId && !isJoining
                      ? "bg-linear-to-r from-terra-800 to-terra-900 text-white hover:opacity-90"
                      : "bg-linear-to-r from-terra-600 to-terra-700 text-white hover:opacity-90"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isDeploying ? (
                    "Launching..."
                  ) : isJoining ? (
                    "Joining Meeting..."
                  ) : activeBotContainerId ? (
                    "Leave Meeting"
                  ) : (
                    <>
                      Join Meeting <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Stats & Recent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="space-y-6"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white border border-brown-900/10 rounded-xl p-6 space-y-4 shadow-md"
            >
              <h3 className="text-sm font-bold text-brown-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-terra-600" /> Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-brown-900/10">
                  <span className="text-sm text-brown-700">
                    Active Recordings
                  </span>
                  <span className="text-sm font-bold text-brown-900">
                    {activeBotContainerId ? 1 : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-brown-700">Total Saved</span>
                  <span className="text-sm font-bold text-brown-900">
                    {recordings.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Recordings List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 space-y-6"
        >
          <div className="flex items-center justify-between">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="text-2xl font-extrabold text-brown-900"
            >
              Your Recordings
            </motion.h2>
          </div>

          {recordings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-white border border-brown-900/10 rounded-xl p-12 text-center shadow-md"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto">
                  <Video className="w-8 h-8 text-brown-600" />
                </div>
                <p className="text-sm font-medium text-brown-700">
                  No recordings yet. Start your first meeting!
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordings.map((rec: any, index: number) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white border border-brown-900/10 rounded-xl p-6 space-y-4 hover:border-terra-600 hover:shadow-lg transition-all"
                >
                  {/* Recording Thumbnail */}
                  <div className="aspect-video bg-cream-100 rounded-lg flex items-center justify-center relative overflow-hidden group border border-brown-900/5">
                    <div className="absolute inset-0 bg-linear-to-br from-terra-500/10 to-terra-700/5" />
                    {!rec.deletedAt && (
                      <motion.a
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        href={`${process.env.NEXT_PUBLIC_API_URL}/recordings/${rec.filePath}`}
                        target="_blank"
                        className="relative z-10 w-12 h-12 rounded-full bg-terra-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Play className="w-6 h-6 text-white ml-1" />
                      </motion.a>
                    )}
                    {rec.deletedAt && (
                      <div className="relative z-10 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-600 uppercase">
                        Expired
                      </div>
                    )}
                  </div>

                  {/* Recording Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-brown-900 truncate">
                        {rec.botName}
                      </h3>
                      <p className="text-xs text-brown-600">
                        {new Date(rec.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <p
                      className={`text-sm truncate ${rec.deletedAt ? "text-brown-500 line-through" : "text-brown-700"}`}
                    >
                      {rec.meetUrl}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {rec.deletedAt ? (
                        <button
                          disabled
                          className="flex-1 px-3 py-2 bg-cream-100 border border-brown-900/10 text-brown-500 rounded-lg text-xs font-semibold cursor-not-allowed"
                        >
                          <Video className="w-4 h-4 inline mr-1" /> Watch
                        </button>
                      ) : (
                        <motion.a
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          href={`${process.env.NEXT_PUBLIC_API_URL}/recordings/${rec.filePath}`}
                          target="_blank"
                          className="flex-1 px-3 py-2 bg-cream-100 border border-brown-900/10 text-brown-900 rounded-lg text-xs font-semibold hover:bg-cream-200 transition-all inline-flex items-center justify-center gap-1"
                        >
                          <Video className="w-4 h-4" /> Watch
                        </motion.a>
                      )}
                      <button
                        disabled
                        className="flex-1 px-3 py-2 bg-transparent text-brown-500 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        <FileText className="w-4 h-4" /> Transcript
                      </button>
                      <button
                        disabled
                        className="flex-1 px-3 py-2 bg-transparent text-brown-500 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4" /> Summary
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-6 right-6 z-50"
          >
            <div
              className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-sm ${
                toast.type === "error"
                  ? "bg-red-50/95 border-red-200 text-red-800"
                  : "bg-green-50/95 border-green-200 text-green-800"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
