export interface JoinMeetingPayload {
  userId: string;
  link: string;
  recordingId: string;
  timestamp?: string;
  maxDurationMins?: number;
}
