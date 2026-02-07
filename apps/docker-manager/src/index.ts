import { createClient } from "redis";
import type { JoinMeetingPayload, TranscriptionPayload } from "@repo/types";
import { DockerService } from "./dockerService";
import { prisma } from "@repo/db/client";
import crypto from "crypto";

const redisClient = createClient();
const redisListener = createClient();
const redisKillListener = createClient();
const dockerService = new DockerService();

(async () => {
  try {
    await Promise.all([
      redisClient.connect(),
      redisListener.connect(),
      redisKillListener.connect()
    ]);
  } catch (err) {
    console.error("Redis connection error:", err);
    process.exit(1);
  }
})();

const QUEUE = "join_meet_queue";
const TRANSCRIPTION_QUEUE = "transcription-queue";
const KILL_QUEUE = "kill_recorder_queue";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TERMINAL_STATES = ["COMPLETED", "FAILED", "TIMEOUT", "CANCELLED"];

async function safeUpdateStatus(recordingId: string, status: any, errorMetadata?: any, attemptNumber?: number) {
  try {
    const current = await prisma.recording.findUnique({
      where: { id: recordingId },
      select: { status: true, errorMetadata: true },
    });

    if (!current) return false;

    // Parse attempt from existing metadata
    let currentAttempt = 1;
    if (current.errorMetadata) {
      try {
        const parsed = typeof current.errorMetadata === 'string'
          ? JSON.parse(current.errorMetadata)
          : current.errorMetadata;
        currentAttempt = (parsed as any).attempt || 1;
      } catch {
        // Invalid JSON, use default
      }
    }

    // Don't allow updates from older attempts
    if (attemptNumber && attemptNumber < currentAttempt) {
      console.log(`Ignoring update from older attempt ${attemptNumber} (Current: ${currentAttempt}) for ${recordingId}`);
      return false;
    }

    // If we are currently in a terminal state, only allow progress updates if it's a NEWER attempt
    const isOverwritingTerminal = TERMINAL_STATES.includes(current.status as string);
    const isNewProgress = status === "ASKING_TO_JOIN" || status === "JOINED";

    // Allow CANCELLED to overwrite other terminal states (except COMPLETED) because it's an explicit user action
    const isCancelledOverride = status === "CANCELLED" && current.status !== "COMPLETED";

    // Protection: Don't allow ASKING_TO_JOIN/JOINED to overwrite COMPLETED unless it's a strictly newer attempt
    if (current.status === "COMPLETED" && isNewProgress && (!attemptNumber || attemptNumber <= currentAttempt)) {
      return false;
    }

    if (!isOverwritingTerminal || isNewProgress || isCancelledOverride || (attemptNumber && attemptNumber > currentAttempt)) {
      await prisma.recording.update({
        where: { id: recordingId },
        data: {
          status,
          errorMetadata: (errorMetadata || attemptNumber)
            ? JSON.stringify({
              ...(typeof current.errorMetadata === 'string'
                ? JSON.parse(current.errorMetadata)
                : (current.errorMetadata || {})),
              ...(errorMetadata || {}),
              attempt: attemptNumber || currentAttempt
            })
            : undefined
        },
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Failed to update status for ${recordingId}:`, err);
    return false;
  }
}

async function handleRecordingSession(payload: JoinMeetingPayload) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let cleanupLogStream = () => { };

    try {
      // 1. Concurrent Kill Check: Check if user cancelled before/between retries
      const currentRec = await prisma.recording.findUnique({
        where: { id: payload.recordingId },
        select: { status: true }
      });

      if ((currentRec?.status as string) === "CANCELLED") {
        console.log(`Recording ${payload.recordingId} was cancelled, aborting session.`);
        return;
      }

      console.log(`Attempt ${attempt}: Cleaning up and starting session for ${payload.recordingId}`);
      await dockerService.stopRecorder(payload.recordingId, payload.userId);

      const fileNameUuid = crypto.randomUUID();
      const fileName = `${fileNameUuid}.webm`;

      const container = await dockerService.startRecorder(payload, fileNameUuid);

      if (!container) {
        throw new Error("Failed to start recorder: No container returned.");
      }

      // 1b. Concurrent Kill Check 2: Check again after start in case kill came in during startup
      const recheckRec = await prisma.recording.findUnique({
        where: { id: payload.recordingId },
        select: { status: true }
      });

      if ((recheckRec?.status as string) === "CANCELLED") {
        console.log(`Recording ${payload.recordingId} cancelled during startup, stopping container.`);
        await dockerService.stopRecorder(payload.recordingId, payload.userId);
        return;
      }

      await prisma.recording.update({
        where: { id: payload.recordingId },
        data: { fileName },
      });

      const context = {
        isTimedOut: false,
        logStreamFinished: false,
      };

      const logStream = (await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
      })) as NodeJS.ReadableStream;

      cleanupLogStream = () => {
        try {
          logStream.removeAllListeners();
          if ("destroy" in logStream) {
            (logStream as any).destroy();
          }
          console.log(`Cleaned up log stream for recording ${payload.recordingId} (Attempt ${attempt})`);
        } catch (err) {
          console.error(`Error cleaning up log stream for ${payload.recordingId}:`, err);
        }
      };

      const logProcessingPromise = new Promise<void>((resolve) => {
        logStream.on("data", async (chunk: Buffer) => {
          try {
            const log = chunk.toString("utf8");
            let newStatus: string | null = null;

            if (
              log.includes("Bot is still in the 'Asking to join' state") ||
              (log.includes("Clicked join button") && log.includes("Ask to join"))
            ) {
              newStatus = "ASKING_TO_JOIN";
            } else if (log.includes("Bot has been admitted to the meeting.")) {
              newStatus = "JOINED";
            } else if (log.includes("Timed out waiting to join the meeting")) {
              context.isTimedOut = true;
            }

            if (newStatus) {
              await safeUpdateStatus(payload.recordingId, newStatus, undefined, attempt);
            }
          } catch (err) {
            console.error(`Error processing logs for ${payload.recordingId}:`, err);
          }
        });

        logStream.on("end", () => {
          context.logStreamFinished = true;
          resolve();
        });

        logStream.on("error", (err) => {
          console.error(`Log stream error for ${payload.recordingId}:`, err);
          context.logStreamFinished = true;
          resolve();
        });
      });

      const waitResult = await container.wait();
      await logProcessingPromise;

      const exitCode = waitResult.StatusCode;
      console.log(`Container for recording ${payload.recordingId} exited with code ${exitCode} (Attempt ${attempt})`);

      // Refined terminal status logic
      const finalStatus = context.isTimedOut ? "TIMEOUT" : (exitCode === 0 ? "COMPLETED" : "FAILED");

      const updated = await safeUpdateStatus(
        payload.recordingId,
        finalStatus,
        exitCode !== 0 ? { exitCode, isTimedOut: context.isTimedOut } : undefined,
        attempt
      );

      if (updated && finalStatus === "COMPLETED") {
        // Double check we are the first/only one to complete it to avoid duplicate jobs
        const freshRec = await prisma.recording.findUnique({
          where: { id: payload.recordingId },
          select: { status: true }
        });

        // If we just updated it to COMPLETED, updated is true. 
        // We push ONLY if the status IS completed (it is) and we are confident.
        // The safeUpdateStatus logic ensures we only write COMPLETED if it wasn't already COMPLETED (or we are newer).
        // So 'updated' being true should be enough protection, but explicit check doesn't hurt.
        const transcriptionPayload: TranscriptionPayload = {
          recordingId: payload.recordingId,
          fileName
        };
        await redisClient.rPush(TRANSCRIPTION_QUEUE, JSON.stringify(transcriptionPayload));
        console.log(`Pushed to ${TRANSCRIPTION_QUEUE} for recording ${payload.recordingId}`);
      }

      if (finalStatus === "COMPLETED" || finalStatus === "TIMEOUT") {
        break; // Success or Terminal Timeout
      } else {
        console.warn(`Attempt ${attempt} exited with code ${exitCode}. Retrying...`);
        if (attempt === MAX_RETRIES) {
          await safeUpdateStatus(payload.recordingId, "FAILED", { error: "Max retries reached", lastExitCode: exitCode }, attempt);
        } else {
          await sleep(2000);
        }
      }
    } catch (err: any) {
      // 2. Critical Cleanup on Failure: Ensure container is stopped if we hit an exception
      await dockerService.stopRecorder(payload.recordingId, payload.userId);

      const errorMessage = err?.message || String(err);
      console.error(`Attempt ${attempt} exception for recording ${payload.recordingId}:`, errorMessage);

      const isLimitError = errorMessage.includes("limit") || errorMessage.includes("already has an active recorder");

      if (attempt === MAX_RETRIES || isLimitError) {
        await safeUpdateStatus(payload.recordingId, "FAILED", { error: errorMessage, attempt }, attempt);
        break;
      } else {
        await sleep(2000);
      }
    } finally {
      cleanupLogStream();
    }
  }
}

/**
 * Continuously listens for items on the queue using BLPOP and logs them.
 * This assumes producers use RPUSH (FIFO).
 */
export async function listenQueue() {
  console.log(`Starting queue listeners for "${QUEUE}" and "${KILL_QUEUE}"`);

  // Kill queue listener
  (async () => {
    while (true) {
      try {
        const res = await redisKillListener.blPop(KILL_QUEUE, 0);
        if (!res) continue;

        let item: string;
        if (Array.isArray(res)) {
          item = res[1];
        } else if (typeof res === "object" && res && "element" in res) {
          item = (res as any).element;
        } else {
          item = String(res);
        }

        const payload = JSON.parse(item) as { recordingId: string; userId: string };
        console.log("Dequeued KillRecorderPayload:", payload);

        const success = await dockerService.stopRecorder(payload.recordingId, payload.userId);

        if (success) {
          await safeUpdateStatus(payload.recordingId, "CANCELLED");
          console.log(`Recording ${payload.recordingId} marked as CANCELLED`);
        }
      } catch (err) {
        console.error("Kill queue listener error:", err);
        await sleep(1000);
      }
    }
  })();

  while (true) {
    try {
      const res = await redisListener.blPop(QUEUE, 0);
      if (!res) continue;

      // redis v4 may return array [key, element] or object { key, element }
      let item: string;
      if (Array.isArray(res)) {
        item = res[1];
      } else if (typeof res === "object" && res && "element" in res) {
        item = (res as any).element;
      } else {
        item = String(res);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(item);
      } catch {
        parsed = item;
      }

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "userId" in parsed &&
        "link" in parsed &&
        "recordingId" in parsed
      ) {
        const payload = parsed as JoinMeetingPayload;
        console.log("Dequeued JoinMeetingPayload:", payload);

        // Start recording session asynchronously
        handleRecordingSession(payload).catch(err => {
          console.error(`Unhandled error in handleRecordingSession for ${payload.recordingId}:`, err);
        });
      } else {
        console.log("Dequeued item:", parsed);
      }
    } catch (err) {
      console.error("Queue listener error:", err);
      await sleep(1000);
    }
  }
}

// start listener when module is loaded
listenQueue().catch((err) => console.error("listenQueue failed:", err));
