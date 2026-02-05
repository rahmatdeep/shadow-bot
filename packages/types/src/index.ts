import { z } from "zod";

// Auth
export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const GoogleAuthSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  providerId: z.string(),
});

// Meeting
export const JoinMeetingSchema = z.object({
  link: z.string().url(),
});

// Chat
export const ChatStartSchema = z.object({
  recordingId: z.string().uuid(),
});

export const ChatMessageSchema = z.object({
  chatId: z.string().uuid(),
  message: z.string().min(1),
});

// Internal Payloads
export interface JoinMeetingPayload {
  userId: string;
  link: string;
  recordingId: string;
  timestamp?: string;
  maxDurationMins?: number;
}

export interface TranscriptionPayload {
  recordingId: string;
  fileName: string;
}

// Inferred Types
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type JoinMeetingInput = z.infer<typeof JoinMeetingSchema>;
export type ChatStartInput = z.infer<typeof ChatStartSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
