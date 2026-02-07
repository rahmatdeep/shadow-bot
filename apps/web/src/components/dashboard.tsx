"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Sparkles,
  ArrowRight,
  Bot,
  AlertCircle,
  History,
  Activity,
  ArrowUpRight,
  Text,
} from "lucide-react";
import Link from "next/link";

import { meetingApi } from "@/lib/api/meeting";
import { getMeetingStatus } from "@/lib/status-utils";
import { UserProfileBadge } from "./user-profile-badge";

export function Dashboard({ session }: { session: any }) {
  const [meetLink, setMeetLink] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [activeBotContainerId, setActiveBotContainerId] = useState<
    string | null
  >(null);
  const [activeRecording, setActiveRecording] = useState<any | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  const token = session?.accessToken;

  // Poll for meeting updates
  useEffect(() => {
    if (!token || !isPolling) return;
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchStatus = () => {
      // If we have an active recording, just poll its status
      if (activeRecording?.id) {
        meetingApi
          .getStatus(activeRecording.id, token)
          .then((statusData) => {
            if (!isMounted) return;

            // Update the recordings list with the new status
            setRecordings((prev) =>
              prev.map((r) =>
                r.id === activeRecording.id
                  ? {
                      ...r,
                      recordingStatus: statusData.recordingStatus,
                      transcriptionStatus: statusData.transcriptionStatus,
                      summaryStatus: statusData.summaryStatus,
                    }
                  : r,
              ),
            );

            // Only poll if there are active meetings
            const hasActive = ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(
              statusData.recordingStatus,
            );

            if (hasActive) {
              timeoutId = setTimeout(fetchStatus, 4000);
            } else {
              // Once finished, fetch the full list one last time to sync everything (like fileName)
              meetingApi.getMeetings(token).then((data) => {
                if (isMounted) {
                  setRecordings(data);
                  setIsPolling(false);
                }
              });
            }
          })
          .catch((err) => {
            console.error(err);
            if (isMounted) setIsPolling(false);
          });
      } else {
        // Fallback or initial fetch of full list
        meetingApi
          .getMeetings(token)
          .then((data) => {
            if (!isMounted) return;
            setRecordings(data);

            const hasActive = data.some((r: any) =>
              ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(
                r.recordingStatus,
              ),
            );

            if (hasActive) {
              timeoutId = setTimeout(fetchStatus, 4000);
            } else {
              setIsPolling(false);
            }
          })
          .catch((err) => {
            console.error(err);
            if (isMounted) setIsPolling(false);
          });
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [token, isPolling, activeRecording?.id]);

  // Derive active bot status
  useEffect(() => {
    const active = recordings.find((r) =>
      ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(r.recordingStatus),
    );
    setActiveRecording(active || null);
    setActiveBotContainerId(active ? active.id : null);
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
      /^(https?:\/\/)?meet\.google\.com\/[a-z0-9]{3}-?[a-z0-9]{4}-?[a-z0-9]{3}$/i;
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
      let validLink = meetLink.trim();
      if (!validLink.startsWith("http")) {
        validLink = `https://${validLink}`;
      }

      const result = await meetingApi.joinMeeting(validLink, token);
      if (result && result.recordingId) {
        showToast("Bot join request queued");
        setIsPolling(true);
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

  return (
    <div className="min-h-screen bg-secondary-100 text-text-900 font-sans selection:bg-primary-500/30 relative flex flex-col overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #3d2817 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary-100/30 rounded-full blur-[120px] mix-blend-multiply animate-pulse duration-10000" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-secondary-200/50 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen relative z-10">
        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 sm:top-12 left-6 sm:left-12 flex items-center gap-2 group cursor-default"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:rotate-6 transition-transform">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-black text-xl tracking-tighter text-text-900">
            Shadow Bot
          </span>
        </motion.div>

        {/* User Profile Badge */}
        <div className="absolute top-8 sm:top-12 right-6 sm:right-12">
          <UserProfileBadge user={session?.user} />
        </div>

        <div className="w-full max-w-4xl text-center space-y-12">
          {/* Hero Content */}
          <div className="space-y-4 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-100 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-text-500 uppercase tracking-widest">
                Public Beta
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-text-900 tracking-tighter leading-[0.95] relative z-20">
              Your AI meeting
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 via-primary-500 to-orange-500">
                companion.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-text-400 font-medium max-w-lg mx-auto leading-relaxed pt-1">
              Capture, transcribe, and chat with your meetings in real-time.
            </p>
          </div>

          {/* Input Area */}
          <div className="relative max-w-2xl mx-auto group z-20">
            {/* Glow Effect */}
            <div
              className={`absolute -inset-1 rounded-3xl bg-linear-to-r from-terra-500/30 via-orange-400/30 to-brown-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${isDeploying ? "opacity-70 animate-pulse" : ""}`}
            />

            <div className="relative bg-white shadow-[0_20px_40px_-12px_rgba(61,40,23,0.1)] rounded-2xl flex items-center p-2.5 border border-text-900/5 focus-within:ring-primary-100/50 focus-within:border-primary-300 transition-all duration-300">
              <div className="pl-5 pr-3 text-text-300 group-focus-within:text-primary-600 transition-colors">
                <Video className="w-6 h-6" />
              </div>

              <input
                value={meetLink}
                onChange={(e) => handleMeetLinkChange(e.target.value)}
                disabled={isDeploying}
                className="flex-1 h-14 bg-transparent outline-none text-lg md:text-xl font-bold text-text-900 placeholder:text-text-200 placeholder:font-bold tracking-tight"
                placeholder="meet.google.com/xxx-yyyy-zzz"
              />

              <AnimatePresence>
                {(meetLink.length > 5 || isDeploying) && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="overflow-hidden"
                  >
                    <button
                      onClick={handleInvite}
                      disabled={isDeploying || !!activeBotContainerId}
                      className="h-12 pl-6 pr-8 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-primary-600/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 whitespace-nowrap"
                    >
                      {isDeploying ? (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                      <span className="text-base tracking-tight">
                        {isDeploying ? "Launching..." : "Join Now"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute top-full left-0 w-full mt-6 flex justify-center">
              <AnimatePresence>
                {linkError ? (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm font-bold text-red-500 flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100 shadow-sm"
                  >
                    <AlertCircle className="w-4 h-4" /> {linkError}
                  </motion.p>
                ) : (
                  // Helper text when no error
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-6 text-text-300 text-xs font-bold uppercase tracking-widest bg-white/50 px-6 py-2 rounded-full border border-white/50"
                  >
                    <span className="flex items-center gap-2">
                      <Text className="w-3 h-3" /> Fast Transcription
                    </span>
                    <span className="flex items-center gap-2">
                      <Bot className="w-3 h-3" /> AI Summary
                    </span>
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> AI Chat
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer / Links */}
          <div className="pt-16 pb-8">
            <Link
              href="/library"
              className="group relative inline-flex items-center gap-4 px-8 py-4 bg-white rounded-full shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_40px_-10px_rgba(200,90,30,0.1)] border border-transparent hover:border-primary-100 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center text-text-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-300">
                <History className="w-5 h-5" />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-text-400 uppercase tracking-wider group-hover:text-primary-600/70 transition-colors">
                  Library
                </span>
                <span className="font-bold text-text-700 group-hover:text-text-900 text-sm transition-colors">
                  View Past Meetings
                </span>
              </div>

              <div className="pl-2">
                <div className="w-8 h-8 rounded-full border border-text-100 flex items-center justify-center group-hover:border-primary-200 group-hover:bg-primary-50 transition-all">
                  <ArrowRight className="w-4 h-4 text-text-300 group-hover:text-primary-600 group-hover:-rotate-45 transition-all duration-300" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeRecording && (
          <motion.div
            key={activeRecording.id}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-6 flex justify-center pointer-events-none"
          >
            <div
              onClick={() => (window.location.href = "/library")}
              className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-primary-200/40 shadow-2xl shadow-text-900/10 rounded-full px-6 py-3.5 flex items-center gap-6 cursor-pointer group hover:scale-[1.02] hover:bg-white transition-all duration-300 ring-1 ring-black/5"
            >
              {(() => {
                const statusConfig = getMeetingStatus(
                  activeRecording.recordingStatus,
                );
                const StatusIcon = statusConfig.icon;
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig.dotClass}`}
                      ></span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${statusConfig.textClass}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="h-4 w-px bg-text-200" />

                    <div className="flex items-center gap-2 text-text-600">
                      <span className="font-bold text-sm tracking-tight">
                        {activeRecording.link ||
                          `Meeting #${activeRecording.id.substring(0, 8)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 text-primary-600 font-black text-[10px] uppercase tracking-wider group-hover:underline decoration-2 underline-offset-4 decoration-primary-200">
                      <span>Open</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-8 right-8 z-100"
          >
            <div
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${
                toast.type === "error"
                  ? "bg-red-50/95 text-red-900 border-red-200 shadow-red-500/10"
                  : "bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-emerald-500/10"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
                }`}
              />
              <p className="text-sm font-bold tracking-tight">
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
