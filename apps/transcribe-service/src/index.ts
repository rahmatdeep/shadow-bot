import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import { createReadStream, statSync } from "fs";
import { summarizeMeeting } from "./summarize";
import { createClient } from "redis";
import path from "path";
import { prisma } from "@repo/db/client";
import type { TranscriptionPayload } from "@repo/types";

const elevenlabs = new ElevenLabsClient();
const redisClient = createClient();
const QUEUE = "transcription-queue";

const RECORDINGS_DIR = process.env.RECORDINGS_DIR || path.join(__dirname, "../../../recordings");

async function getTranscription(filePath: string): Promise<any> {
    console.log(`Calling ElevenLabs API for ${filePath}...`);

    // Check if file exists and is not empty
    try {
        const stats = statSync(filePath);
        if (stats.size === 0) {
            console.error(`Error: File ${filePath} is empty.`);
            return null;
        }
    } catch (err) {
        console.error(`Error checking file ${filePath}:`, err);
        return null;
    }

    return await elevenlabs.speechToText.convert({
        file: createReadStream(filePath),
        modelId: "scribe_v2",
        tagAudioEvents: true,
        languageCode: "eng",
        diarize: true,
    });
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function processTranscription(payload: TranscriptionPayload) {
    const { recordingId, fileName } = payload;
    const fullPath = path.isAbsolute(fileName) ? fileName : path.join(RECORDINGS_DIR, fileName);

    try {
        // Create initial PENDING record
        await prisma.transcript.upsert({
            where: { recordingId },
            update: { status: "PENDING" },
            create: {
                recordingId,
                status: "PENDING"
            }
        });

        const transcription = await getTranscription(fullPath);

        if (!transcription) {
            const reason = `No transcription generated for ${recordingId} (possibly empty file or file not found).`;
            console.warn(reason);
            await prisma.transcript.update({
                where: { recordingId },
                data: {
                    status: "FAILED",
                    failureReason: reason
                }
            });
            return;
        }

        // Format the transcript with timestamps for Gemini
        const transcriptWithTimestamps = transcription.words
            .map((word: any) => {
                const time = formatTime(word.start);
                return `[${time}] ${word.text}`;
            })
            .join("");

        // Plain text transcript
        const plainTranscript = transcription.words
            .map((word: any) => word.text)
            .join("");

        console.log(`\n--- Processing Transcription for ${recordingId} ---\n`);

        console.log("\n--- Meeting Summary ---\n");
        const summary = await summarizeMeeting(plainTranscript);
        console.log(JSON.stringify(summary, null, 2));

        // Update with results
        await prisma.transcript.update({
            where: { recordingId },
            data: {
                transcript: plainTranscript,
                transcriptWithTimeStamps: transcriptWithTimestamps,
                summary: summary as any, // Cast to any to satisfy Json type if needed
                status: "COMPLETED"
            }
        });

        console.log(`Successfully processed and saved transcription for ${recordingId}`);

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing transcription for ${recordingId}:`, errorMessage);
        await prisma.transcript.update({
            where: { recordingId },
            data: {
                status: "FAILED",
                failureReason: errorMessage
            }
        }).catch((err: any) => console.error("Failed to update status to FAILED:", err));
    }
}

async function listenQueue() {
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

            console.log(`Received transcription task: ${item}`);
            let payload: TranscriptionPayload;
            try {
                payload = JSON.parse(item);
            } catch {
                // Fallback for simple filename item (legacy support)
                payload = { recordingId: "unknown", fileName: item };
            }

            await processTranscription(payload);
        } catch (err) {
            console.error("Queue listener error:", err);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function main() {
    try {
        await redisClient.connect();
        await listenQueue();
    } catch (error) {
        console.error("Failed to start service:", error);
    }
}

main();