"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiSparklingLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiFocus3Line,
  RiListUnordered,
  RiCheckboxLine,
  RiLightbulbLine,
} from "react-icons/ri";
import { meetingApi } from "@/lib/api/meeting";
import { getFeatureStatus } from "@/lib/status-utils";

interface SummaryModalProps {
  recordingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  session: any;
}

interface MeetingSummary {
  title: string;
  goal: string;
  keyPoints: string[];
  actionItems: string[];
}

interface SummaryData {
  status: "PENDING" | "COMPLETED" | "FAILED";
  summary: MeetingSummary | any | null;
}

export function SummaryModal({
  recordingId,
  isOpen,
  onClose,
  session,
}: SummaryModalProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          console.error("Failed to fetch summary:", err);
          setError("Failed to load summary data");
          setLoading(false);
        });
    } else if (!isOpen) {
      setData(null);
    }
  }, [isOpen, recordingId, session]);

  const renderContent = () => {
    const summary = data?.summary;

    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      let content = "No structured summary available.";
      if (typeof summary === "string") content = summary;
      if (Array.isArray(summary)) content = summary.join("\n");

      return (
        <div className="p-6 bg-secondary-200 rounded-2xl border border-text-200/50">
          <p className="text-text-600 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
          {(!summary ||
            (typeof summary === "object" && !Array.isArray(summary))) && (
            <p className="text-xs text-text-400 mt-4 italic">
              This summary does not match the expected structure.
            </p>
          )}
        </div>
      );
    }

    const { title, goal, keyPoints, actionItems } =
      summary as Partial<MeetingSummary>;

    return (
      <div className="space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h3
            className="text-2xl md:text-3xl text-text-900 tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          >
            {title || "Untitled Meeting Summary"}
          </h3>
          <div className="h-0.5 w-16 bg-accent-500/20 mx-auto rounded-full" />
        </div>

        {/* Goal Card */}
        <div className="bg-accent-50/50 rounded-2xl p-6 border border-accent-200/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <RiFocus3Line className="w-24 h-24 text-accent-600 -rotate-12" />
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-accent-600 shadow-sm border border-accent-200/30 shrink-0">
              <RiFocus3Line className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-accent-700 uppercase tracking-wider mb-1">
                Primary Goal
              </h4>
              <p className="text-base font-normal text-text-800 leading-relaxed">
                {goal || "No goal specified."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Key Points */}
          <div className="bg-secondary-200 rounded-2xl p-6 border border-text-200/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-accent-600 shrink-0 border border-text-200/40">
                <RiLightbulbLine className="w-4 h-4" />
              </div>
              <h4 className="text-lg font-bold text-text-900">Key Insights</h4>
            </div>
            <ul className="space-y-3">
              {keyPoints?.length ? (
                keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm text-text-600 leading-relaxed"
                  >
                    <span className="text-accent-500 mt-1.5">•</span>
                    <span>{point}</span>
                  </li>
                ))
              ) : (
                <li className="text-text-400 text-sm italic">
                  No key points listed.
                </li>
              )}
            </ul>
          </div>

          {/* Action Items */}
          <div className="bg-secondary-200 rounded-2xl p-6 border border-text-200/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-accent-600 shrink-0 border border-text-200/40">
                <RiCheckboxLine className="w-4 h-4" />
              </div>
              <h4 className="text-lg font-bold text-text-900">Action Items</h4>
            </div>
            <ul className="space-y-3">
              {actionItems?.length ? (
                actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex gap-3 text-sm text-text-600 leading-relaxed group"
                  >
                    <div className="mt-0.5 w-4 h-4 rounded border-2 border-text-300 bg-white flex items-center justify-center shrink-0 group-hover:border-accent-400 transition-colors">
                      {/* Checkbox visual only */}
                    </div>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-text-400 text-sm italic">
                  No action items detected.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const statusConfig = data ? getFeatureStatus(data.status) : null;

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
            className="fixed inset-0 m-auto w-full max-w-4xl h-[85vh] bg-white/95 backdrop-blur-2xl rounded-[32px] border border-text-200/50 shadow-2xl shadow-text-900/5 flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-text-200/40 bg-secondary-100/50">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-accent-50 flex items-center justify-center text-accent-600 border border-accent-200/30">
                  <RiSparklingLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-900 tracking-tight">
                    Meeting Intelligence
                  </h2>
                  <p className="text-xs font-medium text-text-400 uppercase tracking-widest">
                    AI Generated Summary
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
            <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <RiLoader4Line className="w-10 h-10 text-accent-500 animate-spin mb-4" />
                  <p className="text-text-400 font-medium animate-pulse">
                    Analyzing meeting...
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
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 bg-secondary-200 rounded-3xl flex items-center justify-center mb-6">
                    <RiErrorWarningLine className="w-10 h-10 text-text-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-900 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-text-500 max-w-md mx-auto">
                    We couldn't generate the summary for this meeting. This
                    might be due to sufficient context not being available.
                  </p>
                </div>
              ) : data.status === "PENDING" ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 bg-linear-to-tr from-accent-200 to-blue-200 rounded-full animate-spin blur-xl opacity-20" />
                    <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-lg border border-text-200/40">
                      <RiSparklingLine className="w-10 h-10 text-accent-500 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-text-900 mb-3">
                    AI is Thinking...
                  </h3>
                  <p className="text-text-500 max-w-sm mx-auto text-lg">
                    Distilling key insights and action items from your
                    conversation.
                  </p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">{renderContent()}</div>
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
