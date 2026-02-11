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
  title: z.string().optional(),
});

// Chat
export const ChatStartSchema = z.object({
  recordingId: z.string().uuid(),
});

export const QuerySchema = z.object({
  querySessionId: z.string().uuid().nullable(),
  message: z.string().min(1),
});

export const QuerySessionIdSchema = z.object({
  querySessionId: z.string().uuid(),
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
  title?: string;
}

export interface TranscriptionPayload {
  recordingId: string;
  fileName: string;
}

// Meeting Summary
export const MeetingSummarySchema = z.object({
  title: z.string().describe("Catchy and concise title of the meeting"),
  goal: z.string().describe("Main objective or primary goal discussed"),
  keyPoints: z
    .array(z.string())
    .describe("A list of the most important points covered"),
  actionItems: z
    .array(z.string())
    .describe(
      "List of clear tasks or follow-up items with owners if mentioned",
    ),
});

// Tags
export const TagsSchema = z
  .array(z.string())
  .describe("A list of 3-7 tags that capture the essence of the meeting");

// Inferred Types
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type JoinMeetingInput = z.infer<typeof JoinMeetingSchema>;
export type ChatStartInput = z.infer<typeof ChatStartSchema>;
export type QueryInput = z.infer<typeof QuerySchema>;
export type QuerySessionId = z.infer<typeof QuerySessionIdSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type MeetingSummary = z.infer<typeof MeetingSummarySchema>;
export type Tags = z.infer<typeof TagsSchema>;
