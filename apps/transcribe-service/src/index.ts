import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import "dotenv/config";
import { createReadStream, statSync } from "fs";
import { summarizeMeeting } from "./summarize";
import { detailedSummarizeMeeting } from "./detailedSummarize";
import { generateTags } from "./tags";
import { embedAndStore } from "./embed";
import { normalizeTags } from "@repo/common";

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
            update: {
                transcriptionStatus: "IN_PROGRESS",
                summaryStatus: "PENDING",
                detailedSummaryStatus: "PENDING",
                tagsStatus: "PENDING",
                failureReason: null
            },
            create: {
                recordingId,
                transcriptionStatus: "IN_PROGRESS",
                summaryStatus: "PENDING",
                detailedSummaryStatus: "PENDING",
                tagsStatus: "PENDING"
            }
        });

        const transcription = await getTranscription(fullPath);

        if (!transcription) {
            const reason = `No transcription generated for ${recordingId} (possibly empty file or file not found).`;
            console.warn(reason);
            await prisma.transcript.update({
                where: { recordingId },
                data: {
                    transcriptionStatus: "FAILED",
                    failureReason: reason
                }
            });
            return;
        }

        // ... (formatting logic same)
        const transcriptWithTimestamps = transcription.words
            .map((word: any) => {
                const time = formatTime(word.start);
                return `[${time}] ${word.text}`;
            })
            .join("");

        const plainTranscript = transcription.words
            .map((word: any) => word.text)
            .join("");

        // Update transcription to COMPLETED and summary to IN_PROGRESS
        await prisma.transcript.update({
            where: { recordingId },
            data: {
                transcript: plainTranscript,
                transcriptWithTimeStamps: transcriptWithTimestamps,
                transcriptionStatus: "COMPLETED",
                summaryStatus: "IN_PROGRESS",
                detailedSummaryStatus: "IN_PROGRESS"
            }
        });

        console.log(`\n--- Processing Transcription for ${recordingId} ---\n`);

        console.log("\n--- Meeting Summary ---\n");
        const summary = await summarizeMeeting(plainTranscript);
        console.log(JSON.stringify(summary, null, 2));

        // Update summary status to COMPLETED
        await prisma.transcript.update({
            where: { recordingId },
            data: {
                summary: summary as any,
                summaryStatus: "COMPLETED"
            }
        });

        console.log("\n--- Detailed Meeting Summary ---\n");
        const detailedSummary = await detailedSummarizeMeeting(plainTranscript);
        console.log(detailedSummary);

        // Update detailed summary status to COMPLETED
        await prisma.transcript.update({
            where: { recordingId },
            data: {
                detailedSummary: detailedSummary,
                detailedSummaryStatus: "COMPLETED"
            }
        });

        console.log("\n--- AI Tags ---\n");
        await prisma.transcript.update({
            where: { recordingId },
            data: {
                tagsStatus: "IN_PROGRESS"
            }
        });

        const rawTags = await generateTags(plainTranscript, summary);
        const normalizedTags = normalizeTags(rawTags);
        console.log(JSON.stringify(normalizedTags));

        // Update tags
        await prisma.transcript.update({
            where: { recordingId },
            data: {
                tags: normalizedTags,
                tagsStatus: "COMPLETED"
            }
        });

        // 5. Chunk, embed, and store in Qdrant
        console.log("\n--- Embedding Transcript ---\n");
        await prisma.transcript.update({
            where: { recordingId },
            data: { embeddingStatus: "IN_PROGRESS" }
        });

        try {
            const chunkCount = await embedAndStore(recordingId, plainTranscript);
            await prisma.transcript.update({
                where: { recordingId },
                data: { embeddingStatus: "COMPLETED" }
            });
            console.log(`Embedded ${chunkCount} chunks for ${recordingId}`);
        } catch (embedError) {
            console.error("Embedding failed:", embedError);
            await prisma.transcript.update({
                where: { recordingId },
                data: { embeddingStatus: "FAILED" }
            });
        }

        console.log(`Successfully processed and saved transcription and summary for ${recordingId}`);

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing task for ${recordingId}:`, errorMessage);

        // Find current status to know what failed
        const currentTranscript = await prisma.transcript.findUnique({ where: { recordingId } });

        await prisma.transcript.update({
            where: { recordingId },
            data: {
                transcriptionStatus: currentTranscript?.transcriptionStatus === "IN_PROGRESS" ? "FAILED" : currentTranscript?.transcriptionStatus,
                summaryStatus: currentTranscript?.summaryStatus === "IN_PROGRESS" ? "FAILED" : currentTranscript?.summaryStatus,
                detailedSummaryStatus: currentTranscript?.detailedSummaryStatus === "IN_PROGRESS" ? "FAILED" : currentTranscript?.detailedSummaryStatus,
                tagsStatus: currentTranscript?.tagsStatus === "IN_PROGRESS" ? "FAILED" : currentTranscript?.tagsStatus,
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