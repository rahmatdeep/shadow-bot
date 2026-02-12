"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSearchLine,
  RiVideoOnLine,
  RiTimeLine,
  RiChatSmile2Line,
  RiFileTextLine,
  RiSparklingLine,
  RiLoader4Line,
  RiAlertLine,
  RiErrorWarningLine,
  RiPlayCircleLine,
  RiArrowLeftLine,
  RiHashtag,
} from "react-icons/ri";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

import { useRouter } from "next/navigation";
import { meetingApi } from "@/lib/api/meeting";
import { getMeetingStatus } from "@/lib/status-utils";
import { TranscriptViewer } from "./transcript-viewer";
import { SummaryModal } from "./summary-modal";
import { UserProfileBadge } from "./user-profile-badge";
import { cleanupErrorMessage } from "@/lib/utils/error-utils";
import { ChatInterface } from "./chat-interface";
import { chatApi } from "@/lib/api/chat";

export function MeetingLibrary({ session }: { session: any }) {
  const router = useRouter();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll for recordings only if active
  useEffect(() => {
    if (!session?.accessToken) return;
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchStatus = () => {
      const activeMeeting = recordings.find((r: any) => {
        if (["FAILED", "TIMEOUT"].includes(r.recordingStatus)) return false;
        if (["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(r.recordingStatus))
          return true;
        if (r.recordingStatus === "COMPLETED") {
          return (
            ["PENDING", "IN_PROGRESS"].includes(r.transcriptionStatus) ||
            ["PENDING", "IN_PROGRESS"].includes(r.summaryStatus) ||
            ["PENDING", "IN_PROGRESS"].includes(r.tagsStatus)
          );
        }
        return false;
      });

      if (activeMeeting) {
        meetingApi
          .getStatus(activeMeeting.id, session.accessToken)
          .then((statusData) => {
            if (!isMounted) return;

            setRecordings((prev) =>
              prev.map((r) =>
                r.id === activeMeeting.id
                  ? {
                      ...r,
                      recordingStatus: statusData.recordingStatus,
                      transcriptionStatus: statusData.transcriptionStatus,
                      summaryStatus: statusData.summaryStatus,
                      tagsStatus: statusData.tagsStatus,
                      tags: statusData.tags,
                      recordingError: statusData.recordingError,
                      transcriptOrSummaryError:
                        statusData.transcriptOrSummaryError,
                    }
                  : r,
              ),
            );

            const isStillActive =
              ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(
                statusData.recordingStatus,
              ) ||
              (statusData.recordingStatus === "COMPLETED" &&
                (["PENDING", "IN_PROGRESS"].includes(
                  statusData.transcriptionStatus,
                ) ||
                  ["PENDING", "IN_PROGRESS"].includes(
                    statusData.summaryStatus,
                  ) ||
                  ["PENDING", "IN_PROGRESS"].includes(statusData.tagsStatus)));

            if (isStillActive) {
              timeoutId = setTimeout(fetchStatus, 5000);
            } else {
              meetingApi.getMeetings(session.accessToken).then((data) => {
                if (isMounted) setRecordings(data);
              });
            }
          })
          .catch(console.error);
      } else {
        meetingApi
          .getMeetings(session.accessToken)
          .then((data) => {
            if (!isMounted) return;
            setRecordings(data);
            setLoading(false);

            const hasActive = data.some((r: any) => {
              if (["FAILED", "TIMEOUT"].includes(r.recordingStatus))
                return false;
              if (
                ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(
                  r.recordingStatus,
                )
              )
                return true;
              return (
                r.recordingStatus === "COMPLETED" &&
                (["PENDING", "IN_PROGRESS"].includes(r.transcriptionStatus) ||
                  ["PENDING", "IN_PROGRESS"].includes(r.summaryStatus) ||
                  ["PENDING", "IN_PROGRESS"].includes(r.tagsStatus))
              );
            });

            if (hasActive) {
              timeoutId = setTimeout(fetchStatus, 4000);
            }
          })
          .catch((err) => {
            console.error(err);
            if (isMounted) setLoading(false);
          });
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    session,
    recordings.some((r) => {
      if (["FAILED", "TIMEOUT"].includes(r.recordingStatus)) return false;
      if (["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(r.recordingStatus))
        return true;
      return (
        r.recordingStatus === "COMPLETED" &&
        (["PENDING", "IN_PROGRESS"].includes(r.transcriptionStatus) ||
          ["PENDING", "IN_PROGRESS"].includes(r.summaryStatus) ||
          ["PENDING", "IN_PROGRESS"].includes(r.tagsStatus))
      );
    }),
  ]);

  const [activeTranscriptId, setActiveTranscriptId] = useState<string | null>(
    null,
  );
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);

  const handleChatOpen = async (recordingId: string) => {
    if (!session?.accessToken) return;
    setChatLoadingId(recordingId);

    try {
      const chats = await chatApi.getChats(session.accessToken, recordingId);

      if (chats && chats.length > 0) {
        setActiveChatId(chats[0].id);
      } else {
        const newChat = await chatApi.startChat(
          recordingId,
          session.accessToken,
        );
        setActiveChatId(newChat.chatId);
      }
    } catch (error) {
      console.error("Failed to open chat:", error);
    } finally {
      setChatLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-100 text-text-900 font-sans selection:bg-accent-500/20 relative flex flex-col">
      {/* Subtle dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, #111 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Ambient blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent-200/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-violet-200/8 rounded-full blur-[140px]" />
      </div>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 bg-secondary-100/80 backdrop-blur-2xl border-b border-text-200/30">
        <div className="max-w-6xl mx-auto w-full px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span
              className="text-xl tracking-tight text-text-900"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Shadow
            </span>
            <span className="text-xl font-semibold tracking-tight text-text-500">
              Bot
            </span>
          </button>

          <div className="flex items-center gap-3">
            {/* AI Chat Button */}
            <button
              onClick={() => router.push("/chat")}
              className="hidden md:block btn-animated-border group"
            >
              <div className="spin-gradient" />
              <span className="relative z-10 block px-4 py-2 rounded-full bg-secondary-100/90 backdrop-blur-xl">
                <span className="flex items-center gap-2 font-semibold text-sm text-text-600 group-hover:text-text-900 transition-colors duration-300">
                  <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                  AI Chat
                </span>
              </span>
            </button>

            {/* Join Meeting Button */}
            <button
              onClick={() => router.push("/")}
              className="group relative hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-text-900 hover:bg-text-800 transition-all overflow-hidden active:scale-[0.97] shadow-xl shadow-text-900/10"
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
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-linear-to-r from-transparent via-accent-400/60 to-transparent" />
              <span className="relative z-10 flex items-center gap-2">
                <RiVideoOnLine className="w-4 h-4" />
                Join Meeting
              </span>
            </button>

            <div className="h-5 w-px bg-text-200/40 mx-1" />
            <UserProfileBadge user={session?.user} />
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 lg:px-8 py-10 relative z-10">
        {/* Page Title + Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-1">
            <h1
              className="text-3xl md:text-4xl text-text-900 tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              Your Meetings
            </h1>
            <p className="text-text-500 font-normal text-base">
              Recordings, transcripts, and AI-generated summaries.
            </p>
          </div>

          <div className="relative group min-w-[280px]">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-300 group-focus-within:text-text-600 transition-colors z-10 pointer-events-none" />
            <input
              type="text"
              placeholder="Search meetings..."
              className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-md border border-text-200/50 rounded-xl outline-none focus:ring-4 focus:ring-accent-500/5 focus:border-accent-400/30 shadow-sm transition-all text-sm font-medium text-text-900 placeholder:text-text-300"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RiLoader4Line className="w-7 h-7 text-text-300 animate-spin" />
            <p className="text-sm font-medium text-text-400">
              Loading meetings…
            </p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-28 bg-white/40 backdrop-blur-xl rounded-3xl border border-text-200/30">
            <div className="w-16 h-16 bg-secondary-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <RiVideoOnLine className="w-8 h-8 text-text-300" />
            </div>
            <h3
              className="text-2xl text-text-900 tracking-tight"
              style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
            >
              No meetings yet
            </h3>
            <p className="text-text-500 mt-2 mb-8 max-w-sm mx-auto font-normal">
              Record your first meeting to start building your library.
            </p>
            <button
              onClick={() => router.push("/")}
              className="group relative overflow-hidden bg-text-900 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-xl shadow-text-900/10 active:scale-95 flex items-center gap-2.5 mx-auto text-sm"
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
                <RiSparklingLine className="w-4 h-4" />
                Record First Meeting
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((rec, index) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.04,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                key={rec.id}
                className="group"
              >
                <div className="bg-white/60 backdrop-blur-xl border border-text-200/30 rounded-2xl p-5 hover:bg-white/80 hover:border-text-200/50 hover:shadow-lg hover:shadow-text-900/3 transition-all duration-300">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {(() => {
                        const statusConfig = getMeetingStatus(
                          rec.recordingStatus,
                        );

                        return (
                          <>
                            {/* Status Icon */}
                            <div className="relative shrink-0">
                              {rec.recordingStatus === "COMPLETED" &&
                              rec.fileName ? (
                                <a
                                  href={`${process.env.NEXT_PUBLIC_API_URL}/recordings/${rec.fileName}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/icon block"
                                >
                                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-secondary-200/80 text-text-500 group-hover/icon:bg-accent-50 group-hover/icon:text-accent-600 transition-all duration-200">
                                    <RiPlayCircleLine className="w-5 h-5" />
                                  </div>
                                </a>
                              ) : (
                                <div
                                  className={`w-11 h-11 rounded-xl flex items-center justify-center border ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                                >
                                  <statusConfig.icon
                                    className={`w-5 h-5 ${statusConfig.animationClass || ""}`}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h3 className="text-[15px] font-semibold text-text-900 tracking-tight truncate">
                                  {rec.link ? (
                                    <span className="truncate max-w-[280px] block">
                                      {rec.link.replace("https://", "")}
                                    </span>
                                  ) : (
                                    `Direct Meeting`
                                  )}
                                </h3>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig.borderClass} ${statusConfig.bgClass} ${statusConfig.textClass}`}
                                >
                                  {statusConfig.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-400">
                                <div className="flex items-center gap-1.5">
                                  <RiTimeLine className="w-3 h-3 opacity-60" />
                                  <span>
                                    {new Date(rec.createdAt).toLocaleDateString(
                                      undefined,
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      },
                                    )}
                                    <span className="mx-1 opacity-30">·</span>
                                    {new Date(rec.createdAt).toLocaleTimeString(
                                      undefined,
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                </div>

                                {rec.id && (
                                  <span className="font-mono text-[10px] tracking-wider opacity-40">
                                    {rec.id.substring(0, 10)}
                                  </span>
                                )}
                              </div>

                              {/* Tags */}
                              {rec.tags && rec.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {rec.tags.map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary-200/60 text-text-500 hover:text-accent-600 hover:bg-accent-50 transition-colors cursor-default"
                                    >
                                      <RiHashtag className="w-2.5 h-2.5" />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Errors */}
                              {rec.recordingError && (
                                <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-medium bg-red-50/70 px-2.5 py-1 rounded-lg border border-red-200/40 w-fit">
                                  <RiAlertLine className="w-3 h-3 text-red-400" />
                                  <span>
                                    {cleanupErrorMessage(rec.recordingError)}
                                  </span>
                                </div>
                              )}
                              {rec.transcriptOrSummaryError && (
                                <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-medium bg-amber-50/70 px-2.5 py-1 rounded-lg border border-amber-200/40 w-fit">
                                  <RiErrorWarningLine className="w-3 h-3 text-amber-400" />
                                  <span>
                                    {cleanupErrorMessage(
                                      rec.transcriptOrSummaryError,
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Right: Actions — compact pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      {rec.recordingStatus === "COMPLETED" && (
                        <>
                          <button
                            disabled={
                              rec.transcriptionStatus !== "COMPLETED" ||
                              chatLoadingId === rec.id
                            }
                            onClick={() => handleChatOpen(rec.id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 border border-text-200/50 text-text-700 font-medium text-xs hover:border-accent-300 hover:text-accent-600 hover:shadow-sm transition-all active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-text-200/50 disabled:hover:text-text-700"
                          >
                            {chatLoadingId === rec.id ? (
                              <RiLoader4Line className="w-3.5 h-3.5 text-accent-500 animate-spin" />
                            ) : (
                              <RiChatSmile2Line className="w-3.5 h-3.5 text-accent-500" />
                            )}
                            <span>
                              {chatLoadingId === rec.id ? "Opening…" : "Ask AI"}
                            </span>
                          </button>

                          {/* Summary */}
                          {rec.summaryStatus === "COMPLETED" ? (
                            <button
                              onClick={() => setActiveSummaryId(rec.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 border border-text-200/50 text-text-700 font-medium text-xs hover:border-accent-300 hover:text-accent-600 hover:shadow-sm transition-all active:scale-[0.97]"
                            >
                              <RiSparklingLine className="w-3.5 h-3.5 text-accent-500" />
                              <span>Summary</span>
                            </button>
                          ) : rec.summaryStatus === "FAILED" ? (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50/50 border border-red-200/40 text-red-400 font-medium text-xs cursor-not-allowed"
                            >
                              <RiAlertLine className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary-200/50 border border-text-200/40 text-text-400 font-medium text-xs cursor-not-allowed"
                            >
                              <RiLoader4Line className="w-3 h-3 animate-spin" />
                              <span>Generating…</span>
                            </button>
                          )}

                          {/* Transcript */}
                          {rec.transcriptionStatus === "COMPLETED" ? (
                            <button
                              onClick={() => setActiveTranscriptId(rec.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 border border-text-200/50 text-text-700 font-medium text-xs hover:border-accent-300 hover:text-accent-600 hover:shadow-sm transition-all active:scale-[0.97]"
                            >
                              <RiFileTextLine className="w-3.5 h-3.5 text-accent-500" />
                              <span>Transcript</span>
                            </button>
                          ) : rec.transcriptionStatus === "FAILED" ? (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50/50 border border-red-200/40 text-red-400 font-medium text-xs cursor-not-allowed"
                            >
                              <RiAlertLine className="w-3.5 h-3.5" />
                              <span>Failed</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary-200/50 border border-text-200/40 text-text-400 font-medium text-xs cursor-not-allowed"
                            >
                              <RiLoader4Line className="w-3 h-3 animate-spin" />
                              <span>Transcribing…</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <TranscriptViewer
        recordingId={activeTranscriptId}
        isOpen={!!activeTranscriptId}
        onClose={() => setActiveTranscriptId(null)}
        session={session}
      />

      <SummaryModal
        recordingId={activeSummaryId}
        isOpen={!!activeSummaryId}
        onClose={() => setActiveSummaryId(null)}
        session={session}
      />

      <ChatInterface
        chatId={activeChatId}
        isOpen={!!activeChatId}
        onClose={() => setActiveChatId(null)}
        session={session}
        title={recordings.find((r) => r.id === activeChatId)?.title || "Ask AI"}
      />
    </div>
  );
}
