"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiFileTextLine,
  RiErrorWarningLine,
  RiLoader4Line,
  RiFileCopyLine,
  RiCheckLine,
} from "react-icons/ri";
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
    if (!data?.transcript) {
      return (
        <p className="text-text-400 italic">No transcript text available.</p>
      );
    }

    return (
      <div className="prose prose-sm max-w-none text-text-700 leading-8 font-normal">
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
            className="fixed inset-0 bg-text-900/15 backdrop-blur-sm z-50 transition-all"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-3xl h-[85vh] bg-white/95 backdrop-blur-2xl rounded-[32px] border border-text-200/50 shadow-2xl shadow-text-900/5 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-text-200/40 bg-secondary-100/50">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-accent-50 flex items-center justify-center text-accent-600 border border-accent-200/30">
                  <RiFileTextLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-900 tracking-tight">
                    Transcript
                  </h2>
                  <p className="text-xs font-medium text-text-400 uppercase tracking-widest">
                    Recording ID: {recordingId?.substring(0, 8)}...
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-secondary-200 border border-text-200/40 flex items-center justify-center text-text-400 hover:text-text-700 hover:bg-secondary-300 transition-all"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <RiLoader4Line className="w-10 h-10 text-accent-500 animate-spin mb-4" />
                  <p className="text-text-400 font-medium animate-pulse">
                    Fetching transcript...
                  </p>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-secondary-200 text-text-500 rounded-3xl flex items-center justify-center mb-4">
                    <RiErrorWarningLine className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-text-900 mb-2">
                    Unavailable
                  </h3>
                  <p className="text-text-500 max-w-sm">{error}</p>
                </div>
              ) : !data ? (
                <div className="absolute inset-0 flex items-center justify-center opacity-50">
                  <RiLoader4Line className="w-8 h-8 animate-spin text-text-300" />
                </div>
              ) : data.status === "FAILED" ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 bg-secondary-200 rounded-3xl flex items-center justify-center mb-6">
                    <RiErrorWarningLine className="w-10 h-10 text-text-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-900 mb-2">
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
                    <div className="absolute inset-0 bg-accent-200 rounded-full animate-ping opacity-10" />
                    <div className="relative w-full h-full bg-white rounded-full border-2 border-accent-200/50 flex items-center justify-center">
                      <RiLoader4Line className="w-8 h-8 text-accent-500 animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-text-900 mb-2">
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
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-accent-600 bg-accent-50/50 border border-accent-200/40 rounded-lg hover:bg-accent-50 transition-colors shadow-sm"
                    >
                      {copied ? (
                        <RiCheckLine className="w-3.5 h-3.5" />
                      ) : (
                        <RiFileCopyLine className="w-3.5 h-3.5" />
                      )}
                      {copied ? "Copied!" : "Copy Text"}
                    </button>
                  </div>

                  <div className="flex-1 bg-secondary-200 rounded-2xl border border-text-200/40 shadow-sm overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 sm:p-10 scroll-smooth">
                      {renderContent()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-4 bg-secondary-100/50 flex items-center justify-end text-xs font-medium text-text-400">
              <span>Generated by Shadow AI</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
