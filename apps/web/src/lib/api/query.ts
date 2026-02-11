import { apiClient } from "./client";

export interface QueryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface QuerySession {
  id: string;
  title: string;
  messages: QueryMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface QuerySessionListItem {
  id: string;
  title: string;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const queryApi = {
  // Send a query (creates session if querySessionId is null)
  sendQuery: (querySessionId: string | null, message: string, token: string) =>
    apiClient
      .post(
        "/query",
        { querySessionId, message },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => res.data),

  // Get all query sessions
  getQuerySessions: (token: string) =>
    apiClient
      .get("/query", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.data as QuerySessionListItem[]),

  // Get specific query session with full history
  getQuerySession: (querySessionId: string, token: string) =>
    apiClient
      .get(`/query/${querySessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data as QuerySession),
};
