"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Send,
  Sparkles,
  Loader2,
  Bot,
  Plus,
  MessageSquare,
  Clock,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-focus input on mount and when starting chat
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (!isSidebarOpen || !isMobile) {
      inputRef.current?.focus();
    }
  }, [hasStarted, isSidebarOpen]);

  // Fetch session list on mount
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

    // Optimistically add user message
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

      // Update session ID if this was the first message
      if (!querySessionId && response.querySessionId) {
        setQuerySessionId(response.querySessionId);
        fetchSessions(); // Refresh list to show new session
      }

      // Add AI response
      const aiMessage: QueryMessage = {
        id: response.assistantMessageId,
        role: "assistant",
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        // Replace temp message with real one
        const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...withoutTemp,
          { ...tempUserMessage, id: response.userMessageId },
          aiMessage,
        ];
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send message");
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-cream-50 via-white to-terra-50/30 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-200/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar - Restored original structure */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed md:relative z-40 w-[280px] h-full bg-white/60 backdrop-blur-2xl border-r border-text-900/5 flex flex-col"
          >
            {/* Sidebar Branding - Restored */}
            <div className="p-8 pb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="font-black text-xl tracking-tighter text-text-900">
                Shadow Bot
              </span>
            </div>

            {/* New Chat Button */}
            <div className="px-4 py-4">
              <button
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-primary-200 text-primary-700 rounded-2xl font-bold hover:bg-primary-50 transition-all active:scale-95 shadow-sm group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                New Chat
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-400">
                Recent Chats
              </p>
              {sessions.length === 0 ? (
                <div className="px-4 py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-text-50 flex items-center justify-center mx-auto">
                    <Clock className="w-5 h-5 text-text-300" />
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
                        ? "bg-primary-50 text-primary-900 shadow-sm"
                        : "hover:bg-text-50 text-text-600 hover:text-text-900"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare
                        className={`w-4 h-4 mt-1 shrink-0 ${querySessionId === s.id ? "text-primary-600" : "text-text-300"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate leading-tight mb-0.5">
                          {s.title || "Untitled Chat"}
                        </p>
                        <p className="text-[11px] font-medium opacity-60 truncate">
                          {s.lastMessage || "No messages"}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-3 h-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${querySessionId === s.id ? "text-primary-400" : "text-text-300"}`}
                      />
                    </div>
                    {querySessionId === s.id && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-r-full"
                      />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Sidebar Bottom - Restored Profile */}
            <div className="p-4 border-t border-text-900/5">
              <UserProfileBadge user={session?.user} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-20 min-w-0 h-full">
        {/* Header Toggle - Visible only when sidebar closed or mobile */}
        <AnimatePresence>
          {(!isSidebarOpen ||
            (typeof window !== "undefined" && window.innerWidth < 768)) && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-8 left-6 right-6 flex items-center justify-between z-30 pointer-events-none"
            >
              <div className="flex items-center gap-2 pointer-events-auto">
                {!isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 bg-white/80 backdrop-blur-md rounded-xl border border-text-900/5 shadow-sm text-text-600 hover:text-text-900 transition-colors"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                )}
                {hasStarted && (
                  <div className="flex items-center gap-3 ml-2">
                    <div className="p-1.5 bg-primary-100 rounded-lg">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                    </div>
                    <h2 className="text-lg font-bold text-text-900 truncate max-w-[150px] md:max-w-md">
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

        {/* Dynamic Content Container */}
        <main className="flex-1 relative flex flex-col min-h-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!hasStarted ? (
              /* Initial Centered View */
              <motion.div
                key="greeting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 pb-20"
              >
                <div className="max-w-2xl w-full text-center space-y-12">
                  <div className="space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-text-900 tracking-tight">
                      Hey, {session?.user?.name?.split(" ")[0] || "there"}
                    </h1>
                    <p className="text-xl md:text-2xl text-text-500 font-medium">
                      What would you like to know about your meetings?
                    </p>
                  </div>
                  <div className="w-full max-w-xl mx-auto h-[72px]" />{" "}
                  {/* Space for morphing input */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "Summarize my action items",
                      "What were the main topics last week?",
                      "What decisions were made?",
                    ].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(example)}
                        className="px-4 py-2 bg-white/60 backdrop-blur-md hover:bg-white/80 rounded-full border border-primary-100 text-sm text-text-700 transition-all hover:scale-105"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Active Chat View */
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Header padding for chat view when sidebar closed */}
                {!isSidebarOpen && <div className="h-28 shrink-0" />}

                <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 space-y-8 scroll-smooth custom-scrollbar">
                  <div className="max-w-4xl mx-auto w-full space-y-8">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-6 py-4 shadow-sm ${
                            msg.role === "user"
                              ? "bg-primary-600 text-white font-medium"
                              : "bg-white border border-text-100 text-text-800"
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
                        <div className="bg-white border border-text-100 rounded-3xl px-6 py-4 flex items-center gap-3 shadow-sm">
                          <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                          <span className="text-sm font-bold text-text-600 tracking-tight">
                            Thinking...
                          </span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>
                {/* Bottom padding for messages so they don't get hidden behind input */}
                <div className="h-32 shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Morphing Input Section */}
        <div
          className={`absolute left-0 right-0 z-50 pointer-events-none px-6 md:px-12 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            !hasStarted
              ? "bottom-0 h-full flex items-center justify-center pb-20"
              : "bottom-0 h-32 flex items-start justify-center pb-8"
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
                    layoutId="input-spotlight"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 0.4,
                      scale: [1, 1.05, 1],
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      scale: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                    className="absolute -inset-10 rounded-[3rem] bg-linear-to-r from-primary-500/15 via-orange-500/15 to-violet-500/15 blur-[60px] pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <motion.form
                layout
                onSubmit={handleSend}
                className={`relative bg-white/90 backdrop-blur-xl rounded-full flex items-center px-6 py-4 border transition-all duration-300 ${
                  isFocused
                    ? "border-primary-400/40 ring-4 ring-primary-500/5 shadow-2xl shadow-primary-500/10"
                    : "border-text-900/10 shadow-lg shadow-text-900/5"
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
                      ? "Ask a follow-up..."
                      : "Ask anything about your meetings..."
                  }
                  className="flex-1 bg-transparent outline-none text-lg font-medium text-text-900 placeholder:text-text-300"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="ml-4 w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-700 disabled:bg-text-200 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary-600/20"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </motion.form>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-4 text-xs font-bold text-red-600 text-center bg-red-50 py-2 rounded-full border border-red-100"
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
