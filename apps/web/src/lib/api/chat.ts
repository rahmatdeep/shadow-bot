import { apiClient } from "./client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  recordingId: string;
  recordingLink: string;
  title: string;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatDetails extends ChatSession {
  messages: ChatMessage[];
}

export const chatApi = {
  startChat: (recordingId: string, token: string) =>
    apiClient
      .post(
        "/chat/start",
        { recordingId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => res.data),

  sendMessage: (chatId: string, message: string, token: string) =>
    apiClient
      .post(
        "/chat/message",
        { chatId, message },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => res.data),

  getChats: (token: string, recordingId?: string) => {
    const params = recordingId ? { recordingId } : {};
    return apiClient
      .get("/chat", { params, headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data);
  },

  getChat: (chatId: string, token: string) =>
    apiClient
      .get(`/chat/${chatId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data),
};
