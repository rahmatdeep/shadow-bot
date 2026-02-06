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

import { meetingApi } from "@/lib/api/meeting";

export function Dashboard({ session }: { session: any }) {
  const [meetLink, setMeetLink] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [activeBotContainerId, setActiveBotContainerId] = useState<
    string | null
  >(null);
  const token = session?.accessToken;

  // Poll for meeting updates every 5 seconds
  // Initial fetch on mount
  useEffect(() => {
    if (token) {
      meetingApi.getMeetings(token).then(setRecordings).catch(console.error);
    }
  }, [token]);

  // Poll for meeting updates ONLY if active bot exists
  useEffect(() => {
    if (!token || !activeBotContainerId) return;

    const fetchMeetings = () => {
      meetingApi.getMeetings(token).then(setRecordings).catch(console.error);
    };

    const intervalId = setInterval(fetchMeetings, 5000);
    return () => clearInterval(intervalId);
  }, [token, activeBotContainerId]);

  // Derive active bot status from recordings
  useEffect(() => {
    const activeRecording = recordings.find((r) =>
      ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(r.status),
    );
    setActiveBotContainerId(activeRecording ? activeRecording.id : null);
  }, [recordings]);

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
    if (activeBotContainerId) {
      showToast("Only one active bot allowed at a time", "error");
      return;
    }

    if (!validateMeetLink(meetLink)) {
      setLinkError("Please enter a valid Google Meet link");
      return;
    }

    if (!token) {
      showToast("Authentication required", "error");
      return;
    }

    setIsDeploying(true);
    try {
      const result = await meetingApi.joinMeeting(meetLink, token);
      if (result && result.recordingId) {
        showToast("Bot join request queued");
        // Immediate refresh
        meetingApi.getMeetings(token).then(setRecordings);
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
    // Stop bot functionality not currently supported by backend meeting routes
    showToast("Stop bot not implemented in backend", "error");
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "FAILED":
      case "TIMEOUT":
        return "bg-red-100 text-red-700";
      case "JOINED":
        return "bg-blue-100 text-blue-700";
      case "ASKING_TO_JOIN":
        return "bg-yellow-100 text-yellow-700";
      default: // PENDING and others
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-brown-900 font-sans selection:bg-terra-500/30 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-terra-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-cream-200/40 rounded-full blur-[100px]" />
      </div>

      {/* Top Right User Pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-6 right-6 z-50 flex items-center gap-3"
      >
        <div className="bg-white/80 backdrop-blur-md border border-brown-900/5 shadow-sm rounded-full pl-4 pr-1 py-1 flex items-center gap-3">
          <span className="text-xs font-semibold text-brown-600">
            {session.user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-brown-600 hover:bg-terra-100 hover:text-terra-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-24 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-4"
          >
            <h1 className="text-6xl md:text-7xl font-black text-brown-900 tracking-tighter leading-[1.1]">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-terra-600 to-terra-500">
                join?
              </span>
            </h1>
            <p className="text-xl text-brown-500 font-medium max-w-lg mx-auto leading-relaxed">
              Paste your meeting link below and let Shadow Bot determine the
              rest.
            </p>
          </motion.div>

          {/* Main Input Component */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-2xl mx-auto group"
          >
            <div
              className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-terra-500/20 to-brown-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isDeploying ? "opacity-50" : ""}`}
            />

            <div className="relative bg-white shadow-2xl shadow-brown-900/5 rounded-2xl flex items-center p-2 border border-brown-900/5 focus-within:ring-4 focus-within:ring-terra-500/10 focus-within:border-terra-500/50 transition-all duration-300">
              <div className="pl-4 pr-3 text-brown-400">
                <Video className="w-6 h-6" />
              </div>

              <input
                value={meetLink}
                onChange={(e) => handleMeetLinkChange(e.target.value)}
                disabled={isDeploying} // Only disable if deploying, to match logic but allow edits otherwise
                className="flex-1 h-14 bg-transparent outline-none text-lg font-medium text-brown-900 placeholder:text-brown-300"
                placeholder="meet.google.com/xxx-yyyy-zzz"
              />

              <AnimatePresence>
                {(meetLink.length > 5 || isDeploying) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    onClick={handleInvite}
                    disabled={isDeploying || !!activeBotContainerId}
                    className="h-12 px-8 rounded-xl bg-terra-600 text-white font-bold shadow-lg shadow-terra-600/20 hover:bg-terra-700 hover:shadow-terra-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-2"
                  >
                    {isDeploying ? (
                      <Sparkles className="w-5 h-5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5" />
                    )}
                    <span>{isDeploying ? "Launching" : "Join"}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute top-full left-0 w-full mt-3 flex justify-center">
              <AnimatePresence>
                {linkError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm font-semibold text-red-500 flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full border border-red-100"
                  >
                    <AlertCircle className="w-4 h-4" /> {linkError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <div className="bg-white/60 backdrop-blur-sm border border-brown-900/5 px-5 py-2 rounded-full shadow-sm text-sm font-medium text-brown-600 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${activeBotContainerId ? "bg-green-500" : "bg-gray-300"}`}
              />
              {activeBotContainerId ? "Bot Busy" : "Bot Idle"}
            </div>
            <div className="bg-white/60 backdrop-blur-sm border border-brown-900/5 px-5 py-2 rounded-full shadow-sm text-sm font-medium text-brown-600 flex items-center gap-2">
              <Video className="w-4 h-4 text-brown-400" />
              {recordings.length} Recordings Saved
            </div>
          </motion.div>
        </div>

        {/* Recordings Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-brown-900/10 flex-1" />
            <h2 className="text-brown-400 font-bold uppercase tracking-widest text-xs">
              Recent History
            </h2>
            <div className="h-px bg-brown-900/10 flex-1" />
          </div>

          {recordings.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <p className="text-brown-500">No recordings yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recordings.map((rec: any, index: number) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="bg-white rounded-2xl border border-brown-900/5 p-6 shadow-sm hover:shadow-xl hover:shadow-brown-900/5 transition-all duration-300 group"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-cream-50 flex items-center justify-center text-brown-600 group-hover:bg-terra-50 group-hover:text-terra-600 transition-colors">
                          <Video className="w-6 h-6" />
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            rec.status === "COMPLETED"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : rec.status === "FAILED"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-6">
                        <h3 className="text-xl font-bold text-brown-900 truncate">
                          Meeting #{rec.id.substring(0, 6)}
                        </h3>
                        <p className="text-xs font-semibold text-brown-400 uppercase tracking-wide">
                          {new Date(rec.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                        <p className="text-sm text-brown-500 truncate pt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          {rec.link}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-brown-900/5 flex gap-3">
                      {rec.status !== "COMPLETED" ? (
                        <button
                          disabled
                          className="flex-1 py-3 rounded-xl bg-gray-50 text-gray-400 text-sm font-bold cursor-not-allowed"
                        >
                          Watch
                        </button>
                      ) : (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}/recordings/${rec.fileName}`}
                          target="_blank"
                          className="flex-1 py-3 rounded-xl bg-terra-600 text-white text-sm font-bold shadow-lg shadow-brown-900/10 hover:shadow-terra-600/20 hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5" /> Watch
                        </a>
                      )}
                      <button
                        disabled={!rec.hasTranscript}
                        className="w-12 flex items-center justify-center rounded-xl bg-cream-50 text-brown-600 hover:bg-cream-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                      <button
                        disabled={!rec.summary}
                        className="w-12 flex items-center justify-center rounded-xl bg-cream-50 text-brown-600 hover:bg-cream-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-5 h-5" />
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
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${
                toast.type === "error"
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-brown-900 text-white border-brown-800"
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <p className="text-sm font-bold tracking-wide">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
