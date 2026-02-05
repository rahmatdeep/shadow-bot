import { apiClient } from "./client";

export const authApi = {
  login: (credentials: any) => apiClient.post("/auth/login", credentials),

  signup: (data: any) => apiClient.post("/auth/signup", data),

  googleAuth: (data: {
    email: string | null | undefined;
    name: string | null | undefined;
    providerId: string | undefined;
  }) => apiClient.post("/auth/google-auth", data),
};
