"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatApi, ChatMessage } from "@/lib/api/chat";

interface ChatInterfaceProps {
  chatId: string | null;
  isOpen: boolean;
  onClose: () => void;
  session: any;
  title?: string;
}

export function ChatInterface({
  chatId,
  isOpen,
  onClose,
  session,
  title = "Chat with Analyst",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && chatId && session?.accessToken) {
      setLoading(true);
      setError(null);
      chatApi
        .getChat(chatId, session.accessToken)
        .then((data) => {
          // Normalize messsage roles to lowercase for consistency
          const normalizedMessages = data.messages.map((msg: any) => ({
            ...msg,
            role: msg.role.toLowerCase(),
          }));
          setMessages(normalizedMessages);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load chat:", err);
          setError("Failed to load conversation history.");
          setLoading(false);
        });
    } else if (!isOpen) {
      setMessages([]);
      setInput("");
      setError(null);
    }
  }, [isOpen, chatId, session]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatId || !session?.accessToken || sending) return;

    const userMsg = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    // Optimistic update
    const tempId = Date.now().toString();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      role: "user",
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const response = await chatApi.sendMessage(
        chatId,
        userMsg,
        session.accessToken,
      );

      // Remove optimistic message and add real ones (or just update state from response)
      // The API returns the AI response text, userMessageId, assistantMessageId
      // We can reconstruct the messages or fetch fresh.
      // For smoothness, let's append the assistant response.

      const assistantMsg: ChatMessage = {
        id: response.assistantMessageId,
        role: "assistant",
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) =>
        prev
          .map((msg) =>
            msg.id === tempId ? { ...msg, id: response.userMessageId } : msg,
          )
          .concat(assistantMsg),
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message. Please try again.");
      // Rollback optimistic update if needed, or show error state on message
    } finally {
      setSending(false);
    }
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
            className="fixed inset-0 m-auto w-full max-w-2xl h-[80vh] bg-secondary-50/95 backdrop-blur-2xl rounded-[32px] border border-secondary-200/50 shadow-2xl flex flex-col overflow-hidden z-50 ring-1 ring-white/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-text-900/5 bg-secondary-100/40 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner ring-1 ring-primary-100/50">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-text-900 tracking-tight">
                    {title}
                  </h2>
                  <p className="text-[10px] font-bold text-text-400 uppercase tracking-widest">
                    AI Analyst
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-secondary-100 border border-text-900/5 flex items-center justify-center text-text-400 hover:text-primary-600 hover:border-primary-100 hover:bg-primary-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary-50/30 scroll-smooth">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                  <p className="text-text-400 text-sm font-bold">
                    Loading conversation...
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
                  <MessageSquare className="w-12 h-12 text-text-300 mb-4" />
                  <p className="text-text-500 font-medium">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id}
                    className={`flex gap-4 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="shrink-0 mt-1">
                      {msg.role === "user" ? (
                        <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center text-text-600 border border-white">
                          <User className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 border border-white">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary-600 text-white rounded-tr-none"
                          : "bg-white border border-secondary-200 text-text-700 rounded-tl-none"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-secondary-100 prose-pre:text-text-800">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}

              {sending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 border border-white">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="bg-white border border-secondary-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-6 py-3 bg-white/40 backdrop-blur-md border-t border-red-500/10 flex items-center gap-2 text-red-700/70 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-red-500/60" />
                {error}
              </div>
            )}

            {/* Input Area */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white border-t border-text-900/5 shrink-0"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask something about the meeting..."
                  className="w-full pl-5 pr-14 py-4 bg-secondary-50 border border-secondary-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all text-sm font-medium placeholder:text-text-300 text-text-800"
                  disabled={loading || sending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || sending}
                  className="absolute right-2 p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-all active:scale-95 shadow-lg shadow-primary-600/20"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
