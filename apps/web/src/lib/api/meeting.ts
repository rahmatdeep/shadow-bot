import { apiClient } from "./client";

export interface Meeting {
  id: string;
  link: string;
  recordingStatus:
    | "PENDING"
    | "ASKING_TO_JOIN"
    | "JOINED"
    | "COMPLETED"
    | "FAILED"
    | "TIMEOUT";
  fileName: string | null;
  transcriptionStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  summaryStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export const meetingApi = {
  joinMeeting: (link: string, token: string) =>
    apiClient
      .post("/meeting/join", { link }, { token } as any)
      .then((res) => res.data),

  getMeetings: (token: string) =>
    apiClient.get("/meeting", { token } as any).then((res) => res.data),

  getTranscript: (id: string, token: string) =>
    apiClient
      .get(`/meeting/${id}/transcript`, { token } as any)
      .then((res) => res.data),

  getStatus: (id: string, token: string) =>
    apiClient
      .get(`/meeting/${id}/status`, { token } as any)
      .then((res) => res.data),
};
