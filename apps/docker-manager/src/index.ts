import { createClient } from "redis";
import type { JoinMeetingPayload, TranscriptionPayload } from "@repo/types";
import { DockerService } from "./dockerService";
import { prisma } from "@repo/db/client";
import crypto from "crypto";

const redisClient = createClient();
const redisListener = createClient();
const dockerService = new DockerService();

(async () => {
  try {
    await Promise.all([
      redisClient.connect(),
      redisListener.connect()
    ]);
  } catch (err) {
    console.error("Redis connection error:", err);
    process.exit(1);
  }
})();

const QUEUE = "join_meet_queue";
const TRANSCRIPTION_QUEUE = "transcription-queue";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Continuously listens for items on the queue using BLPOP and logs them.
 * This assumes producers use RPUSH (FIFO).
 */
export async function listenQueue() {
  console.log(`Starting queue listener for "${QUEUE}"`);
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

        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            const fileNameUuid = crypto.randomUUID();
            const fileName = `${fileNameUuid}.webm`;

            const container = await dockerService.startRecorder(payload, fileNameUuid);

            if (!container) {
              throw new Error("Failed to start recorder: No container returned.");
            }

            await prisma.recording.update({
              where: { id: payload.recordingId },
              data: {
                fileName,
              },
            });

            let isTimedOut = false;

            // Monitor logs for status changes
            const logStream = await container.logs({
              follow: true,
              stdout: true,
              stderr: true,
            });

            logStream.on("data", async (chunk: Buffer) => {
              const log = chunk.toString("utf8");
              if (
                log.includes("Bot is still in the 'Asking to join' state") ||
                (log.includes("Clicked join button") && log.includes("Ask to join"))
              ) {
                await prisma.recording.update({
                  where: { id: payload.recordingId },
                  data: { status: "ASKING_TO_JOIN" },
                });
              } else if (log.includes("Bot has been admitted to the meeting.")) {
                await prisma.recording.update({
                  where: { id: payload.recordingId },
                  data: { status: "JOINED" },
                });
              } else if (log.includes("Timed out waiting to join the meeting")) {
                isTimedOut = true;
              }
            });

            // Handle container exit
            container.wait().then(async (result: any) => {
              const exitCode = result.StatusCode;
              console.log(`Container for recording ${payload.recordingId} exited with code ${exitCode}`);

              await prisma.recording.update({
                where: { id: payload.recordingId },
                data: {
                  status: isTimedOut ? "TIMEOUT" : (exitCode === 0 ? "COMPLETED" : "FAILED"),
                  ...(exitCode !== 0 && { errorMetadata: JSON.stringify({ exitCode, isTimedOut }) })
                }
              });

              if (exitCode === 0 && !isTimedOut) {
                const transcriptionPayload: TranscriptionPayload = {
                  recordingId: payload.recordingId,
                  fileName
                };
                await redisClient.rPush(TRANSCRIPTION_QUEUE, JSON.stringify(transcriptionPayload));
                console.log(`Pushed to ${TRANSCRIPTION_QUEUE} for recording ${payload.recordingId}`);
              }
            }).catch(async (err: any) => {
              console.error(`Error waiting for container for recording ${payload.recordingId}:`, err);
              await prisma.recording.update({
                where: { id: payload.recordingId },
                data: {
                  status: "FAILED",
                  errorMetadata: JSON.stringify(err)
                }
              });
            });

            break; // Success, exit retry loop
          } catch (err: any) {
            const errorMessage = err?.message || String(err);
            console.error(`Attempt ${attempt} failed to start recorder for user ${payload.userId}:`, errorMessage);

            const isLimitError = errorMessage.includes("limit") || errorMessage.includes("already has an active recorder");

            if (attempt === MAX_RETRIES || isLimitError) {
              console.error(`${isLimitError ? "Limit reached," : "All attempts failed"} for payload:`, payload);
              await prisma.recording.update({
                where: { id: payload.recordingId },
                data: {
                  status: "FAILED",
                  errorMetadata: JSON.stringify({ error: errorMessage, attempt }),
                },
              });
              break; // Stop retrying
            } else {
              await sleep(2000);
            }
          }
        }
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
