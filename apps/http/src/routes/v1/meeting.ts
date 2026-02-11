import { Router } from "express";
import { createClient } from "redis";
import { JoinMeetingPayload, JoinMeetingSchema } from "@repo/types";
import { prisma } from "@repo/db/client";
import { verifyRecordingOwnership } from "../../utils/ownership";

const redisClient = createClient();

(async () => {
  await redisClient.connect();
})();

const meetingRouter: Router = Router();

// List user's meetings/recordings
meetingRouter.get("/", async (req, res) => {
  const userId = (req as any).userId;

  try {
    const recordings = await prisma.recording.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        transcript: {
          select: {
            transcriptionStatus: true,
            summaryStatus: true,
            tagsStatus: true,
            tags: true,
            failureReason: true,
          },
        },
      },
    });

    const meetings = recordings.map((rec) => ({
      id: rec.id,
      link: rec.link,
      title: rec.title,
      recordingStatus: rec.status || "PENDING",
      recordingError: rec.errorMetadata || null,
      fileName: rec.fileName,
      transcriptionStatus: rec.transcript?.transcriptionStatus,
      summaryStatus: rec.transcript?.summaryStatus,
      tagsStatus: rec.transcript?.tagsStatus,
      tags: rec.transcript?.tags || [],
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
      transcriptOrSummaryError: rec.transcript?.failureReason || null,
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
      title: recording.title,
      recordingStatus: recording.status || "PENDING",
      fileName: recording.fileName,
      recordingError: recording.errorMetadata,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      transcript: recording.transcript
        ? {
          transcriptionStatus: recording.transcript.transcriptionStatus,
          summaryStatus: recording.transcript.summaryStatus,
          transcript: recording.transcript.transcript,
          transcriptWithTimeStamps:
            recording.transcript.transcriptWithTimeStamps,
          summary: recording.transcript.summary,
          tagsStatus: recording.transcript.tagsStatus,
          tags: recording.transcript.tags,
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
          select: {
            transcriptionStatus: true,
            summaryStatus: true,
            tagsStatus: true,
            failureReason: true,
          },
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
      transcriptionStatus: recording.transcript?.transcriptionStatus,
      summaryStatus: recording.transcript?.summaryStatus,
      tagsStatus: recording.transcript?.tagsStatus,
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
      tagsStatus: transcript.tagsStatus || "PENDING",
      transcript: transcript.transcript,
      transcriptWithTimeStamps: transcript.transcriptWithTimeStamps,
      summary: transcript.summary,
      tags: transcript.tags,
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const recording = await prisma.recording.create({
      data: {
        userId,
        link,
        title: parsed.data.title || link,
      },
    });

    const payload: JoinMeetingPayload = {
      userId,
      userName: user.name,
      link,
      recordingId: recording.id,
      title: parsed.data.title || link,
    };

    await redisClient.rPush("join_meet_queue", JSON.stringify(payload));
    res.json({ status: "queued", recordingId: recording.id });
  } catch (error) {
    console.error("Join meeting error:", error);
    res.status(500).json({ error: "Failed to join meeting" });
  }
});

export { meetingRouter };
