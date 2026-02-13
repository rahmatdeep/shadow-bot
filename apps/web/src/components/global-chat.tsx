"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSendPlaneFill,
  RiSparklingLine,
  RiLoader4Line,
  RiAddLine,
  RiChat3Line,
  RiTimeLine,
  RiMenuLine,
  RiArrowRightSLine,
} from "react-icons/ri";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

import Link from "next/link";
import { queryApi, QueryMessage, QuerySessionListItem } from "@/lib/api/query";
import ReactMarkdown from "react-markdown";
import { UserProfileBadge } from "./user-profile-badge";

export function GlobalChat({ session }: { session: any }) {
  const [querySessionId, setQuerySessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<QueryMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<QuerySessionListItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const hasStarted = messages.length > 0 || isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (!isSidebarOpen || !isMobile) {
      inputRef.current?.focus();
    }
  }, [hasStarted, isSidebarOpen]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchSessions();
    }
  }, [session?.accessToken]);

  const fetchSessions = async () => {
    try {
      const data = await queryApi.getQuerySessions(session.accessToken);
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    setQuerySessionId(sessionId);
    try {
      const data = await queryApi.getQuerySession(
        sessionId,
        session.accessToken,
      );
      setMessages(data.messages);
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      setError("Failed to load session history");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setQuerySessionId(null);
    setMessages([]);
    setInput("");
    setError(null);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) {
      setIsSidebarOpen(false);
    }
    inputRef.current?.focus();
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !session?.accessToken) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    const tempUserMessage: QueryMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      const response = await queryApi.sendQuery(
        querySessionId,
        userMessage,
        session?.accessToken || "",
      );

      if (!querySessionId && response.querySessionId) {
        setQuerySessionId(response.querySessionId);
        fetchSessions();
      }

      const aiMessage: QueryMessage = {
        id: response.assistantMessageId,
        role: "assistant",
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...withoutTemp,
          { ...tempUserMessage, id: response.userMessageId },
          aiMessage,
        ];
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-secondary-100 overflow-hidden relative">
      {/* Aurora Mesh Shader Background */}
      <div className="aurora-mesh opacity-40">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="blob blob-5" />
      </div>

      {/* Fine Noise Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #111 0.8px, transparent 0.8px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent-400/30"
            style={{
              left: `${15 + i * 14}%`,
              bottom: `${-5 - i * 3}%`,
              animation: `float-particle ${12 + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 2.5}s`,
            }}
          />
        ))}
      </div>

      {/* ─── Sidebar ─── */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed md:relative z-40 w-[280px] h-full bg-white/60 backdrop-blur-2xl border-r border-text-200/30 flex flex-col"
          >
            {/* Brand */}
            <Link
              href="/"
              className="px-5 pt-5 pb-3 flex items-center gap-1.5 hover:opacity-70 transition-opacity"
            >
              <span
                className="text-lg tracking-tight text-text-900"
                style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
              >
                Shadow
              </span>
              <span className="text-lg font-semibold tracking-tight text-text-400">
                Bot
              </span>
            </Link>

            {/* New Chat */}
            <div className="px-4 py-3">
              <button
                onClick={startNewChat}
                className="w-full h-11 relative overflow-hidden bg-text-900 text-white rounded-xl font-semibold text-sm shadow-md hover:bg-text-800 active:scale-[0.97] transition-all flex items-center justify-center gap-2.5 group"
              >
                {/* Shimmer sweep overlay */}
                <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
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

                <span className="relative z-10 flex items-center gap-2">
                  <RiAddLine className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  New Chat
                </span>
              </button>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-3 space-y-0.5 custom-scrollbar">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-300">
                Recent
              </p>
              {sessions.length === 0 ? (
                <div className="px-4 py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary-200 flex items-center justify-center mx-auto">
                    <RiTimeLine className="w-5 h-5 text-text-300" />
                  </div>
                  <p className="text-xs font-medium text-text-400">
                    No chats yet
                  </p>
                </div>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all group relative ${
                      querySessionId === s.id
                        ? "bg-accent-50/80 text-text-900"
                        : "hover:bg-secondary-200/60 text-text-600 hover:text-text-900"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <RiChat3Line
                        className={`w-4 h-4 mt-0.5 shrink-0 ${querySessionId === s.id ? "text-accent-600" : "text-text-300"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-tight mb-0.5">
                          {s.title || "Untitled Chat"}
                        </p>
                        <p className="text-[11px] font-normal opacity-40 truncate">
                          {s.lastMessage || "No messages"}
                        </p>
                      </div>
                      <RiArrowRightSLine
                        className={`w-3 h-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${querySessionId === s.id ? "text-accent-500" : "text-text-300"}`}
                      />
                    </div>
                    {querySessionId === s.id && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-600 rounded-r-full"
                      />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Bottom */}
            <div className="p-4 border-t border-text-200/30">
              <UserProfileBadge user={session?.user} position="top" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col relative z-20 min-w-0 h-full">
        {/* Header (when sidebar closed) */}
        <AnimatePresence>
          {(!isSidebarOpen ||
            (typeof window !== "undefined" && window.innerWidth < 768)) && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 sm:top-8 left-0 right-0 px-6 sm:px-10 flex items-center justify-between z-30 pointer-events-none"
            >
              <div className="flex items-center gap-2 pointer-events-auto">
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-white/70 backdrop-blur-md rounded-xl border border-text-200/40 shadow-sm text-text-500 hover:text-text-900 transition-colors"
                  >
                    <RiMenuLine className="w-5 h-5" />
                  </button>
                )}
                {hasStarted && (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="p-1.5 bg-accent-50 rounded-lg">
                      <RiSparklingLine className="w-4 h-4 text-accent-600" />
                    </div>
                    <h2 className="text-base font-semibold text-text-900 truncate max-w-[150px] md:max-w-md">
                      {sessions.find((s) => s.id === querySessionId)?.title ||
                        "Active Chat"}
                    </h2>
                  </div>
                )}
              </div>
              {!isSidebarOpen && (
                <div className="pointer-events-auto">
                  <UserProfileBadge user={session?.user} />
                </div>
              )}
            </motion.header>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <main className="flex-1 relative flex flex-col min-h-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!hasStarted ? (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 pb-20"
              >
                <div className="max-w-2xl w-full text-center space-y-10">
                  <div className="space-y-3">
                    <h1
                      className="text-5xl md:text-6xl text-text-900 tracking-tight"
                      style={{
                        fontFamily: "var(--font-heading), Georgia, serif",
                      }}
                    >
                      Hey, {session?.user?.name?.split(" ")[0] || "there"}
                    </h1>
                    <p className="text-lg md:text-xl text-text-400 font-normal">
                      What would you like to know about your meetings?
                    </p>
                  </div>
                  <div className="w-full max-w-xl mx-auto h-[72px]" />
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Summarize my action items",
                      "What were the main topics?",
                      "What decisions were made?",
                    ].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(example)}
                        className="px-4 py-2 bg-white/70 backdrop-blur-md hover:bg-white rounded-xl border border-text-200/50 text-sm text-text-500 font-medium transition-all hover:scale-[1.02] hover:border-text-300 hover:shadow-sm hover:text-text-700 active:scale-95 cursor-pointer"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                {!isSidebarOpen && <div className="h-24 shrink-0" />}

                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-5 scroll-smooth custom-scrollbar">
                  <div className="max-w-3xl mx-auto w-full space-y-5">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm transition-all ${
                            msg.role === "user"
                              ? "bg-text-900 text-white font-medium shadow-md"
                              : "bg-white/80 backdrop-blur-sm border border-text-200/40 text-text-800"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-text-900 prose-pre:text-white">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-[15px] leading-relaxed">
                              {msg.content}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white/80 border border-text-200/40 rounded-2xl px-5 py-3.5 flex items-center gap-2.5 shadow-sm">
                          <RiLoader4Line className="w-4 h-4 animate-spin text-accent-600" />
                          <span className="text-sm font-medium text-text-400 tracking-tight">
                            Thinking…
                          </span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>
                <div className="h-28 shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ─── Input Section ─── */}
        <div
          className={`absolute left-0 right-0 z-50 pointer-events-none px-6 md:px-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            !hasStarted
              ? "bottom-0 h-full flex items-center justify-center pb-20"
              : "bottom-0 h-28 flex items-start justify-center pb-6"
          }`}
        >
          <motion.div
            layout
            className="w-full max-w-3xl pointer-events-auto"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="relative group">
              <AnimatePresence>
                {isFocused && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 0.5,
                      scale: [1, 1.05, 1],
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
                    className="absolute -inset-10 rounded-[3rem] bg-linear-to-r from-accent-400/20 via-blue-400/10 to-violet-400/20 blur-[60px] pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <motion.form
                layout
                onSubmit={handleSend}
                className={`relative bg-white/95 backdrop-blur-xl rounded-2xl flex items-center px-5 py-3.5 border transition-all duration-500 ${
                  isFocused
                    ? "border-accent-400/50 ring-8 ring-accent-500/5"
                    : "border-text-200/60 shadow-lg shadow-text-900/4"
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isLoading}
                  placeholder={
                    hasStarted
                      ? "Ask a follow-up…"
                      : "Ask anything about your meetings…"
                  }
                  className="flex-1 bg-transparent outline-none text-lg font-medium text-text-900 placeholder:text-text-300 tracking-tight"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="ml-3 w-11 h-11 rounded-xl bg-text-900 hover:bg-text-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-md relative overflow-hidden group/send"
                >
                  {/* Shimmer for button */}
                  <span className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none opacity-0 group-hover/send:opacity-100 transition-opacity">
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)",
                        animation: "shimmer-slide 3s ease-in-out infinite",
                      }}
                    />
                  </span>
                  <RiSendPlaneFill
                    className={`w-5 h-5 text-white relative z-10 transition-transform ${input.trim() && !isLoading ? "group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5" : ""}`}
                  />
                </button>
              </motion.form>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-3 text-xs font-medium text-red-500 text-center bg-red-50/80 py-2 rounded-xl border border-red-200/40"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
