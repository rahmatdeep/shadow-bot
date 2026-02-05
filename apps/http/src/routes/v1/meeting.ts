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
        transcript: { select: { status: true, summary: true } },
      },
    });

    const meetings = recordings.map((rec) => ({
      id: rec.id,
      link: rec.link,
      status: rec.status,
      fileName: rec.fileName,
      hasTranscript: rec.transcript?.status === "COMPLETED",
      summary: rec.transcript?.summary?.substring(0, 200) || null,
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
      status: recording.status,
      fileName: recording.fileName,
      errorMetadata: recording.errorMetadata,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      transcript: recording.transcript
        ? {
            status: recording.transcript.status,
            transcript: recording.transcript.transcript,
            transcriptWithTimeStamps:
              recording.transcript.transcriptWithTimeStamps,
            summary: recording.transcript.summary,
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
        transcript: { select: { status: true } },
      },
    });

    if (!recording) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    res.json({
      id: recording.id,
      recordingStatus: recording.status,
      transcriptStatus: recording.transcript?.status || null,
    });
  } catch (error) {
    console.error("Error fetching status:", error);
    res.status(500).json({ error: "Failed to fetch status" });
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
