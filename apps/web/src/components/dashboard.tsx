"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiVideoOnLine,
  RiSparklingLine,
  RiArrowRightLine,
  RiRobot2Line,
  RiErrorWarningLine,
  RiHistoryLine,
  RiPulseLine,
  RiArrowRightUpLine,
  RiTextBlock,
} from "react-icons/ri";

import Link from "next/link";

import { meetingApi } from "@/lib/api/meeting";
import { getMeetingStatus } from "@/lib/status-utils";
import { UserProfileBadge } from "./user-profile-badge";
import { cleanupErrorMessage } from "@/lib/utils/error-utils";
import { useModal } from "@/context/modal-context";

export function Dashboard({ session }: { session: any }) {
  const { openModal } = useModal();
  const [meetLink, setMeetLink] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [activeBotContainerId, setActiveBotContainerId] = useState<
    string | null
  >(null);
  const [activeRecording, setActiveRecording] = useState<any | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const token = session?.accessToken;

  // Poll for meeting updates
  useEffect(() => {
    if (!token || !isPolling) return;
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchStatus = () => {
      if (activeRecording?.id) {
        meetingApi
          .getStatus(activeRecording.id, token)
          .then((statusData) => {
            if (!isMounted) return;

            setRecordings((prev) =>
              prev.map((r) =>
                r.id === activeRecording.id
                  ? {
                      ...r,
                      recordingStatus: statusData.recordingStatus,
                      transcriptionStatus: statusData.transcriptionStatus,
                      summaryStatus: statusData.summaryStatus,
                      recordingError: statusData.recordingError,
                    }
                  : r,
              ),
            );

            if (
              statusData.recordingStatus === "FAILED" &&
              statusData.recordingError &&
              activeRecording?.recordingStatus !== "FAILED"
            ) {
              const displayError = cleanupErrorMessage(
                statusData.recordingError,
              );
              showToast(displayError || "Unknown recording error", "error");
            }

            const hasActive = ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(
              statusData.recordingStatus,
            );

            if (hasActive) {
              timeoutId = setTimeout(fetchStatus, 4000);
            } else {
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
    <div className="min-h-screen bg-secondary-100 text-text-900 font-sans selection:bg-accent-500/20 relative flex flex-col overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent-200/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-violet-200/10 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-orange-200/8 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen relative z-10">
        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 sm:top-10 left-0 right-0 px-6 sm:px-12 flex justify-between items-center z-50 pointer-events-none"
        >
          {/* Brand */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span
              className="text-xl tracking-tight text-text-900"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Shadow
            </span>
            <span className="text-xl font-semibold tracking-tight text-text-500">
              Bot
            </span>
          </div>

          {/* User Profile */}
          <div className="pointer-events-auto">
            <UserProfileBadge user={session?.user} />
          </div>
        </motion.div>

        <div className="w-full max-w-4xl text-center space-y-12">
          {/* Hero Content */}
          <div className="space-y-4 relative">
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-text-200/60 shadow-sm mb-4 hover:bg-white transition-colors cursor-pointer active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-text-500 uppercase tracking-widest">
                Public Beta
              </span>
            </button>

            <h1
              className="text-4xl md:text-6xl lg:text-7xl text-text-900 tracking-tight leading-[0.95] relative z-20"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Your AI meeting
              <br />
              <span className="text-accent-600">companion.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-500 font-normal max-w-lg mx-auto leading-relaxed pt-1">
              Capture, transcribe, and chat with your meetings in real-time.
            </p>
          </div>

          {/* Input Area */}
          <div className="relative max-w-2xl mx-auto group z-20">
            {/* Subtle Focus Glow */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 0.5,
                    scale: [1, 1.03, 1],
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    opacity: { duration: 0.4 },
                    scale: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  className="absolute -inset-8 rounded-[3rem] bg-linear-to-r from-accent-300/15 via-blue-300/10 to-violet-300/15 blur-[50px] pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Main Input Container */}
            <motion.div
              animate={{
                scale: isFocused ? 1.01 : 1,
                boxShadow: isFocused
                  ? "0 20px 60px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(51,51,204,0.1)"
                  : "0 8px 30px -12px rgba(0,0,0,0.06)",
              }}
              className={`relative bg-white/90 backdrop-blur-xl rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center p-2 sm:p-2.5 border transition-all duration-500 ${
                isFocused
                  ? "border-accent-400/30 ring-4 ring-accent-500/5"
                  : "border-text-200/60"
              }`}
            >
              <div className="flex items-center flex-1">
                <div
                  className={`pl-5 pr-3 transition-colors duration-500 ${isFocused ? "text-text-700" : "text-text-300"}`}
                >
                  <RiVideoOnLine className="w-5 h-5" />
                </div>

                <input
                  ref={inputRef}
                  value={meetLink}
                  onChange={(e) => handleMeetLinkChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleInvite();
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isDeploying}
                  className="flex-1 h-14 bg-transparent outline-none text-lg font-medium text-text-900 placeholder:text-text-300 tracking-tight min-w-0"
                  placeholder="meet.google.com/xxx-yyyy"
                />
              </div>

              <AnimatePresence>
                {(meetLink.length > 5 || isDeploying) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="sm:hidden overflow-hidden"
                  >
                    <button
                      onClick={handleInvite}
                      disabled={isDeploying || !!activeBotContainerId}
                      className="w-full h-14 rounded-xl bg-text-900 text-white font-semibold shadow-md shadow-text-900/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                      {isDeploying ? (
                        <RiSparklingLine className="w-4 h-4 animate-spin" />
                      ) : (
                        <RiArrowRightLine className="w-5 h-5" />
                      )}
                      <span className="text-lg tracking-tight">
                        {isDeploying ? "Launching..." : "Join Now"}
                      </span>
                    </button>
                  </motion.div>
                )}

                {(meetLink.length > 5 || isDeploying) && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="hidden sm:block overflow-hidden"
                  >
                    <button
                      onClick={handleInvite}
                      disabled={isDeploying || !!activeBotContainerId}
                      className="h-12 pl-6 pr-8 rounded-xl bg-text-900 text-white font-semibold shadow-md shadow-text-900/10 hover:bg-text-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5 whitespace-nowrap"
                    >
                      {isDeploying ? (
                        <RiSparklingLine className="w-4 h-4 animate-spin" />
                      ) : (
                        <RiArrowRightLine className="w-5 h-5" />
                      )}
                      <span className="text-base tracking-tight">
                        {isDeploying ? "Launching..." : "Join Now"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="absolute top-full left-0 w-full mt-6 flex justify-center">
              <AnimatePresence>
                {linkError ? (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm font-medium text-red-500 flex items-center gap-2 bg-red-50/80 backdrop-blur-md px-6 py-2.5 rounded-full border border-red-200/50 shadow-sm"
                  >
                    <RiErrorWarningLine className="w-4 h-4 text-red-400" />{" "}
                    {linkError}
                  </motion.p>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-6 text-text-400 text-xs font-medium uppercase tracking-widest bg-white/60 backdrop-blur-md px-6 py-2 rounded-full border border-text-200/50"
                  >
                    <span className="flex items-center gap-2">
                      <RiTextBlock className="w-3 h-3" /> Transcription
                    </span>
                    <span className="flex items-center gap-2">
                      <RiRobot2Line className="w-3 h-3" /> Summary
                    </span>
                    <span className="flex items-center gap-2">
                      <RiSparklingLine className="w-3 h-3" /> AI Chat
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer / Links */}
          <div className="pt-16 pb-8 flex flex-col sm:flex-row gap-4 justify-center px-4 sm:px-0 w-full max-w-lg sm:max-w-none mx-auto">
            <Link
              href="/chat"
              className="group relative inline-flex items-center gap-4 px-6 sm:px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full shadow-sm hover:shadow-lg hover:shadow-text-900/5 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center text-text-500 group-hover:bg-accent-50 group-hover:text-accent-600 transition-colors duration-300">
                <RiSparklingLine className="w-5 h-5" />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-text-400 uppercase tracking-wider group-hover:text-accent-600 transition-colors">
                  AI Chat
                </span>
                <span className="font-semibold text-text-800 group-hover:text-text-900 text-sm transition-colors">
                  Ask Across Meetings
                </span>
              </div>

              <div className="pl-2">
                <div className="w-8 h-8 rounded-full border border-text-200 flex items-center justify-center group-hover:border-accent-300 group-hover:bg-accent-50 transition-all">
                  <RiArrowRightLine className="w-4 h-4 text-text-400 group-hover:text-accent-600 group-hover:-rotate-45 transition-all duration-300" />
                </div>
              </div>
            </Link>

            <Link
              href="/library"
              className="group relative inline-flex items-center gap-4 px-6 sm:px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full shadow-sm hover:shadow-lg hover:shadow-text-900/5 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center text-text-500 group-hover:bg-accent-50 group-hover:text-accent-600 transition-colors duration-300">
                <RiHistoryLine className="w-5 h-5" />
              </div>

              <div className="flex flex-col text-left">
                <span className="text-xs font-medium text-text-400 uppercase tracking-wider group-hover:text-accent-600 transition-colors">
                  Library
                </span>
                <span className="font-semibold text-text-800 group-hover:text-text-900 text-sm transition-colors">
                  View Past Meetings
                </span>
              </div>

              <div className="pl-2">
                <div className="w-8 h-8 rounded-full border border-text-200 flex items-center justify-center group-hover:border-accent-300 group-hover:bg-accent-50 transition-all">
                  <RiArrowRightLine className="w-4 h-4 text-text-400 group-hover:text-accent-600 group-hover:-rotate-45 transition-all duration-300" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Recording Banner */}
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
              className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-text-200/60 shadow-xl shadow-text-900/5 rounded-full px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center gap-3 sm:gap-6 cursor-pointer group hover:scale-[1.02] hover:bg-white transition-all duration-300 ring-1 ring-black/5 max-w-[95vw] sm:max-w-none"
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
                        className={`text-[10px] font-bold uppercase tracking-widest ${statusConfig.textClass}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="h-4 w-px bg-text-200 shrink-0" />

                    <div className="flex items-center gap-2 text-text-600 min-w-0">
                      <span className="font-semibold text-xs sm:text-sm tracking-tight truncate max-w-[120px] sm:max-w-xs">
                        {activeRecording.link ||
                          `Meeting #${activeRecording.id.substring(0, 8)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 text-accent-600 font-bold text-[10px] uppercase tracking-wider group-hover:underline decoration-2 underline-offset-4 decoration-accent-200 shrink-0">
                      <span>Open</span>
                      <RiArrowRightUpLine className="w-3.5 h-3.5" />
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
                  ? "bg-red-50/95 text-red-800 border-red-200/60 shadow-red-500/5"
                  : "bg-emerald-50/95 text-emerald-800 border-emerald-200/60 shadow-emerald-500/5"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  toast.type === "error" ? "bg-red-400" : "bg-emerald-400"
                }`}
              />
              <p className="text-sm font-semibold tracking-tight">
                {toast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
