"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, AlertCircle, Loader2, Copy, Check } from "lucide-react";
import { meetingApi } from "@/lib/api/meeting";

interface TranscriptViewerProps {
  recordingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  session: any;
}

interface TranscriptData {
  status: "PENDING" | "COMPLETED" | "FAILED";
  transcript: string | null;
}

export function TranscriptViewer({
  recordingId,
  isOpen,
  onClose,
  session,
}: TranscriptViewerProps) {
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && recordingId && session?.accessToken) {
      setLoading(true);
      setError(null);
      meetingApi
        .getTranscript(recordingId, session.accessToken)
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch transcript:", err);
          setError("Failed to load transcript data");
          setLoading(false);
        });
    } else if (!isOpen) {
      setData(null);
    }
  }, [isOpen, recordingId, session]);

  const handleCopy = () => {
    if (!data?.transcript) return;
    navigator.clipboard.writeText(data.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    // If transcript is empty or null, show message
    if (!data?.transcript) {
      return (
        <p className="text-text-400 italic">No transcript text available.</p>
      );
    }

    return (
      <div className="prose prose-sm max-w-none text-text-700 leading-8 font-medium">
        {(data.transcript || "").split(/\n\n+/).map((para, i) => (
          <p key={i} className="mb-6 last:mb-0">
            {para}
          </p>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-text-900/20 backdrop-blur-sm z-50 transition-all"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-3xl h-[85vh] bg-secondary-50/95 backdrop-blur-2xl rounded-[32px] border border-secondary-200/50 shadow-2xl flex flex-col overflow-hidden z-50 ring-1 ring-white/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-text-900/5 bg-secondary-100/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner ring-1 ring-primary-100/50">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-900 tracking-tight">
                    Transcript
                  </h2>
                  <p className="text-xs font-bold text-text-500 uppercase tracking-widest">
                    Recording ID: {recordingId?.substring(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-secondary-100 border border-text-900/5 flex items-center justify-center text-text-400 hover:text-primary-600 hover:border-primary-100 hover:bg-primary-50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative flex flex-col bg-secondary-50/30">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                  <p className="text-text-400 font-bold animate-pulse">
                    Fetching transcript...
                  </p>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mb-4 ring-1 ring-primary-100">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-black text-text-900 mb-2">
                    Unavailable
                  </h3>
                  <p className="text-text-500 max-w-sm">{error}</p>
                </div>
              ) : !data ? (
                <div className="absolute inset-0 flex items-center justify-center opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin text-text-300" />
                </div>
              ) : data.status === "FAILED" ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 bg-primary-50 rounded-4xl flex items-center justify-center mb-6 border border-primary-100 shadow-sm">
                    <AlertCircle className="w-10 h-10 text-primary-500" />
                  </div>
                  <h3 className="text-2xl font-black text-text-900 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-text-500 max-w-md mx-auto">
                    We couldn't generate the transcript for this meeting. This
                    might be due to audio quality issues.
                  </p>
                </div>
              ) : data.status === "PENDING" ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20" />
                    <div className="relative w-full h-full bg-secondary-50 rounded-full border-2 border-primary-100 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-text-900 mb-2">
                    Transcribing...
                  </h3>
                  <p className="text-text-500 max-w-sm mx-auto">
                    Our AI is currently listening and typing. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full h-full flex flex-col p-6 sm:p-8 min-h-0">
                  {/* Copy Button */}
                  <div className="flex justify-end mb-4 shrink-0 z-10">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-primary-600 bg-secondary-100/50 backdrop-blur-md border border-primary-200/50 rounded-lg hover:bg-primary-50 transition-colors shadow-sm"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copied ? "Copied!" : "Copy Text"}
                    </button>
                  </div>

                  <div className="flex-1 bg-secondary-100/40 rounded-2xl border border-text-900/5 shadow-sm overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 sm:p-10 scroll-smooth">
                      {renderContent()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-4 bg-secondary-100/40 flex items-center justify-end text-xs font-bold text-text-400">
              <span>Generated by Shadow AI</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
