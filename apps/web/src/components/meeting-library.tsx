"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bot,
  Video,
  History,
  MessageSquare,
  FileText,
  Sparkles,
  Play,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { meetingApi } from "@/lib/api/meeting";
import { getMeetingStatus } from "@/lib/status-utils";
import { Clock, AlertTriangle } from "lucide-react";
import { TranscriptViewer } from "./transcript-viewer";
import { SummaryModal } from "./summary-modal";
import { UserProfileBadge } from "./user-profile-badge";

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
      // Find the active meeting
      const activeMeeting = recordings.find(
        (r: any) =>
          ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(r.recordingStatus) ||
          ["PENDING", "IN_PROGRESS"].includes(r.transcriptionStatus) ||
          ["PENDING", "IN_PROGRESS"].includes(r.summaryStatus),
      );

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
                    }
                  : r,
              ),
            );

            const hasActive =
              ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(
                statusData.recordingStatus,
              ) ||
              ["PENDING", "IN_PROGRESS"].includes(
                statusData.transcriptionStatus,
              ) ||
              ["PENDING", "IN_PROGRESS"].includes(statusData.summaryStatus);

            if (hasActive) {
              timeoutId = setTimeout(fetchStatus, 5000);
            } else {
              // Refresh full list once finished
              meetingApi.getMeetings(session.accessToken).then((data) => {
                if (isMounted) setRecordings(data);
              });
            }
          })
          .catch(console.error);
      } else {
        // Fallback or initial fetch
        meetingApi
          .getMeetings(session.accessToken)
          .then((data) => {
            if (!isMounted) return;
            setRecordings(data);
            setLoading(false);

            const hasActive = data.some(
              (r: any) =>
                ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(
                  r.recordingStatus,
                ) ||
                ["PENDING", "IN_PROGRESS"].includes(r.transcriptionStatus) ||
                ["PENDING", "IN_PROGRESS"].includes(r.summaryStatus),
            );

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
    recordings.some(
      (r) =>
        ["PENDING", "ASKING_TO_JOIN", "JOINED"].includes(r.recordingStatus) ||
        ["PENDING", "IN_PROGRESS"].includes(r.transcriptionStatus) ||
        ["PENDING", "IN_PROGRESS"].includes(r.summaryStatus),
    ),
  ]);

  const [activeTranscriptId, setActiveTranscriptId] = useState<string | null>(
    null,
  );
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-secondary-100 text-text-900 font-sans selection:bg-primary-500/30 relative flex flex-col">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary-200/20 rounded-full blur-[140px] animate-pulse duration-15000" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[50%] h-[50%] bg-secondary-300/30 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-primary-100/10 rounded-full blur-[100px]" />
      </div>

      {/* Library Header */}
      <header className="h-24 px-6 lg:px-12 flex items-center justify-between sticky top-0 bg-secondary-100/80 backdrop-blur-md z-30 border-b border-text-900/5">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => router.push("/")}
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-text-900/10 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <Bot className="text-primary-600 w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-text-900 leading-none group-hover:text-primary-700 transition-colors">
                Shadow Bot
              </span>
              <span className="text-[10px] font-bold text-text-400 uppercase tracking-widest mt-1">
                Library
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/")}
              className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-primary-700 bg-white border border-primary-200 hover:bg-primary-50 hover:border-primary-300 transition-all active:scale-95 shadow-sm"
            >
              <Video className="w-4 h-4" />
              Join New Meeting
            </button>

            <div className="h-8 w-px bg-text-900/10 mx-2" />

            <UserProfileBadge user={session?.user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-text-400 mb-2">
              <History className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Recordings
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-text-900 tracking-tight">
              Meeting Library
            </h1>
            <p className="text-text-500 font-medium max-w-lg text-lg">
              Search your recordings, replay key moments, and turn hours of
              conversation into instant answers.
            </p>
          </div>

          <div className="relative group min-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-300 group-focus-within:text-primary-600 transition-colors z-10 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID or date..."
              className="w-full pl-10 pr-4 py-4 bg-white/50 backdrop-blur-md border border-text-900/10 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 shadow-sm transition-all text-sm font-bold text-text-900 placeholder:text-text-300/70"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm font-bold text-text-400">
              Loading library...
            </p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-32 bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/40 shadow-2xl shadow-text-900/5">
            <div className="w-20 h-20 bg-secondary-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/50">
              <Video className="w-10 h-10 text-primary-300" />
            </div>
            <h3 className="text-2xl font-black text-text-900 tracking-tight">
              Quiet in the archives
            </h3>
            <p className="text-text-500 mt-3 mb-10 max-w-sm mx-auto font-medium text-lg leading-relaxed">
              You haven't recorded any meetings yet. Start a session to see your
              history appear here.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95 flex items-center gap-3 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              <span>Record First Meeting</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {recordings.map((rec) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={rec.id}
                className="group relative"
              >
                {/* Glow Background on Hover */}
                <div className="absolute -inset-0.5 bg-linear-to-r from-primary-500/20 via-secondary-400/20 to-primary-500/20 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[24px] p-8 shadow-[0_8px_32px_-12px_rgba(61,40,23,0.08)] transition-all duration-300">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    {/* Left: Recording Status & Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1">
                      {(() => {
                        const statusConfig = getMeetingStatus(
                          rec.recordingStatus,
                        );

                        return (
                          <>
                            {/* Play Button / Status Indicator */}
                            <div className="relative shrink-0">
                              {rec.recordingStatus === "COMPLETED" &&
                              rec.fileName ? (
                                <a
                                  href={`${process.env.NEXT_PUBLIC_API_URL}/recordings/${rec.fileName}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/icon block relative"
                                >
                                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary-50 text-primary-600 border border-primary-200 shadow-inner group-hover/icon:scale-105 group-hover/icon:shadow-lg group-hover/icon:shadow-primary-500/20 group-hover/icon:border-primary-300 transition-all duration-300 cursor-pointer">
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-primary-400 rounded-full opacity-0 group-hover/icon:opacity-20 animate-ping" />
                                      <Play className="w-8 h-8 fill-current relative z-10 ml-1" />
                                    </div>
                                  </div>
                                </a>
                              ) : (
                                <div
                                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${statusConfig.bgClass} ${statusConfig.textClass} ${statusConfig.borderClass}`}
                                >
                                  <statusConfig.icon
                                    className={`w-8 h-8 ${statusConfig.animationClass || ""}`}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-4">
                                <h3 className="text-xl font-black text-text-900 tracking-tight">
                                  {rec.link ? (
                                    <span className="truncate max-w-[300px] block">
                                      {rec.link.replace("https://", "")}
                                    </span>
                                  ) : (
                                    `Direct Meeting Session`
                                  )}
                                </h3>
                                <span
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusConfig.borderClass} ${statusConfig.bgClass} ${statusConfig.textClass} shadow-sm`}
                                >
                                  {statusConfig.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-text-400">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 opacity-60" />
                                  <span>
                                    {new Date(rec.createdAt).toLocaleDateString(
                                      undefined,
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      },
                                    )}
                                    <span className="mx-1.5 opacity-30">·</span>
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
                                  <div className="flex items-center gap-2 opacity-60">
                                    <div className="h-4 w-px bg-text-200" />
                                    <span className="font-mono text-[10px] tracking-wider uppercase">
                                      UID: {rec.id.substring(0, 12)}...
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Right: Actions Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      {rec.recordingStatus === "COMPLETED" && (
                        <>
                          <button
                            disabled={rec.transcriptionStatus !== "COMPLETED"}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-text-100 text-text-900 font-bold text-sm hover:border-primary-300 hover:text-primary-700 hover:shadow-lg hover:shadow-primary-600/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-text-100 disabled:hover:text-text-900 disabled:hover:shadow-none"
                          >
                            <MessageSquare className="w-4 h-4 text-primary-500" />
                            <span>Analyst</span>
                          </button>

                          {/* Summary Button */}
                          {rec.summaryStatus === "COMPLETED" ? (
                            <button
                              onClick={() => setActiveSummaryId(rec.id)}
                              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-text-100 text-text-900 font-bold text-sm hover:border-primary-300 hover:text-primary-700 hover:shadow-lg hover:shadow-primary-600/5 transition-all active:scale-95"
                            >
                              <Sparkles className="w-4 h-4 text-primary-500" />
                              <span>Summary</span>
                            </button>
                          ) : rec.summaryStatus === "FAILED" ? (
                            <button
                              disabled
                              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 border border-red-100 text-red-400 font-bold text-sm cursor-not-allowed opacity-80"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>Summary Failed</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary-50 border border-secondary-200 text-text-400 font-bold text-sm cursor-not-allowed"
                            >
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Generating Summary...</span>
                            </button>
                          )}

                          {/* Transcript Button */}
                          {rec.transcriptionStatus === "COMPLETED" ? (
                            <button
                              onClick={() => setActiveTranscriptId(rec.id)}
                              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-text-100 text-text-900 font-bold text-sm hover:border-primary-300 hover:text-primary-700 hover:shadow-lg hover:shadow-primary-600/5 transition-all active:scale-95"
                            >
                              <FileText className="w-4 h-4 text-primary-500" />
                              <span>Transcript</span>
                            </button>
                          ) : rec.transcriptionStatus === "FAILED" ? (
                            <button
                              disabled
                              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 border border-red-100 text-red-400 font-bold text-sm cursor-not-allowed opacity-80"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              <span>Transcript Failed</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary-50 border border-secondary-200 text-text-400 font-bold text-sm cursor-not-allowed"
                            >
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Transcribing...</span>
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
    </div>
  );
}
