import { apiClient } from "./client";

export const meetingApi = {
  joinMeeting: (link: string, token: string) =>
    apiClient
      .post("/meeting/join", { link }, { token } as any)
      .then((res) => res.data),

  getMeetings: (token: string) =>
    apiClient.get("/meeting", { token } as any).then((res) => res.data),
};
