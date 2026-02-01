import { createClient } from "redis";
import type { JoinMeetingPayload } from "@repo/types";
import { DockerService } from "./dockerService";
import { prisma } from "@repo/db/client";

const redisClient = createClient();
const dockerService = new DockerService();

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Redis connection error:", err);
    process.exit(1);
  }
})();

const QUEUE = "join_meet_queue";

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
      const res = await redisClient.blPop(QUEUE, 0);
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
            const meetingId = payload.link.split("/").pop()?.split("?")[0] || "unknown";
            const container = await dockerService.startRecorder(payload);

            if (container) {
              await prisma.recording.update({
                where: { id: payload.recordingId },
                data: {
                  fileName: `${meetingId}.webm`,
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
            }
            break; // Success, exit retry loop
          } catch (err) {
            console.error(`Attempt ${attempt} failed to start recorder for user ${payload.userId}:`, err);
            if (attempt === MAX_RETRIES) {
              console.error(`All ${MAX_RETRIES} attempts failed for payload:`, payload);
              await prisma.recording.update({
                where: { id: payload.recordingId },
                data: {
                  status: "FAILED",
                  errorMetadata: JSON.stringify(err),
                },
              });
            } else {
              await sleep(1000);
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
