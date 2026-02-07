import { Router } from "express";
import { createClient } from "redis";
import { JoinMeetingPayload, JoinMeetingSchema } from "@repo/types";
import { prisma } from "@repo/db/client";

const redisClient = createClient();

(async () => {
  await redisClient.connect();
})();

const meetingRouter: Router = Router();

// Helper to verify recording ownership
async function verifyRecordingOwnership(
  recordingId: string,
  userId: string,
): Promise<boolean> {
  const recording = await prisma.recording.findUnique({
    where: { id: recordingId },
    select: { userId: true },
  });
  return recording?.userId === userId;
}

// List user's meetings/recordings
meetingRouter.get("/", async (req, res) => {
  const userId = (req as any).userId;

  try {
    const recordings = await prisma.recording.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        transcript: { select: { transcriptionStatus: true, summaryStatus: true } },
      },
    });

    const meetings = recordings.map((rec) => ({
      id: rec.id,
      link: rec.link,
      recordingStatus: rec.status || "PENDING",
      fileName: rec.fileName,
      transcriptionStatus: rec.transcript?.transcriptionStatus || "PENDING",
      summaryStatus: rec.transcript?.summaryStatus || "PENDING",
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }));

    res.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

// Get specific recording details
meetingRouter.get("/:id", async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  // Verify user owns this recording
  if (!(await verifyRecordingOwnership(id, userId))) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  try {
    const recording = await prisma.recording.findUnique({
      where: { id },
      include: {
        transcript: true,
        chatSessions: {
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: { id: true, title: true, updatedAt: true },
        },
      },
    });

    if (!recording) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    res.json({
      id: recording.id,
      link: recording.link,
      recordingStatus: recording.status || "PENDING",
      fileName: recording.fileName,
      recordingError: recording.errorMetadata,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      transcript: recording.transcript
        ? {
          transcriptionStatus: recording.transcript.transcriptionStatus || "PENDING",
          summaryStatus: recording.transcript.summaryStatus || "PENDING",
          transcript: recording.transcript.transcript,
          transcriptWithTimeStamps:
            recording.transcript.transcriptWithTimeStamps,
          summary: recording.transcript.summary,
          transcriptOrSummaryError: recording.transcript.failureReason,
        }
        : null,
      recentChats: recording.chatSessions,
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ error: "Failed to fetch meeting" });
  }
});

// Get recording status
meetingRouter.get("/:id/status", async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  // Verify user owns this recording
  if (!(await verifyRecordingOwnership(id, userId))) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  try {
    const recording = await prisma.recording.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        errorMetadata: true,
        transcript: {
          select: { transcriptionStatus: true, summaryStatus: true, failureReason: true },
        },
      },
    });

    if (!recording) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    res.json({
      id: recording.id,
      recordingStatus: recording.status || "PENDING",
      transcriptionStatus: recording.transcript?.transcriptionStatus || "PENDING",
      summaryStatus: recording.transcript?.summaryStatus || "PENDING",
      recordingError: recording.errorMetadata || null,
      transcriptOrSummaryError: recording.transcript?.failureReason || null,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// Get meeting transcript and summary
meetingRouter.get("/:id/transcript", async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  // Verify user owns this recording
  if (!(await verifyRecordingOwnership(id, userId))) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  try {
    const transcript = await prisma.transcript.findUnique({
      where: { recordingId: id },
    });

    if (!transcript) {
      res.status(404).json({ error: "Transcript not found" });
      return;
    }

    res.json({
      recordingId: transcript.recordingId,
      transcriptionStatus: transcript.transcriptionStatus || "PENDING",
      summaryStatus: transcript.summaryStatus || "PENDING",
      transcript: transcript.transcript,
      transcriptWithTimeStamps: transcript.transcriptWithTimeStamps,
      summary: transcript.summary,
      transcriptOrSummaryError: transcript.failureReason || null,
      updatedAt: transcript.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching transcript:", error);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
});

// Join a meeting
meetingRouter.post("/join", async (req, res) => {
  const parsed = JoinMeetingSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: "Invalid input",
        details: parsed.error.flatten().fieldErrors,
      });
    return;
  }

  const userId = (req as any).userId;
  const { link } = parsed.data;

  try {
    const recording = await prisma.recording.create({
      data: {
        userId,
        link,
      },
    });

    const payload: JoinMeetingPayload = {
      userId,
      link,
      recordingId: recording.id,
    };

    await redisClient.rPush("join_meet_queue", JSON.stringify(payload));
    res.json({ status: "queued", recordingId: recording.id });
  } catch (error) {
    console.error("Join meeting error:", error);
    res.status(500).json({ error: "Failed to join meeting" });
  }
});

export { meetingRouter };
