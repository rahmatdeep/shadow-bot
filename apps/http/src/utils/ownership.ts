import { prisma } from "@repo/db/client";

/**
 * Verify if a recording belongs to a user
 */
export async function verifyRecordingOwnership(
    recordingId: string,
    userId: string,
): Promise<boolean> {
    const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
        select: { userId: true },
    });
    return recording?.userId === userId;
}

/**
 * Verify if a chat session belongs to a user (via its recording)
 */
export async function verifyChatOwnership(
    chatId: string,
    userId: string,
): Promise<boolean> {
    const chatSession = await prisma.chatSession.findUnique({
        where: { id: chatId },
        include: { recording: { select: { userId: true } } },
    });
    return chatSession?.recording.userId === userId;
}

/**
 * Verify if a query session belongs to a user
 */
export async function verifyQueryOwnership(
    querySessionId: string,
    userId: string,
): Promise<boolean> {
    const session = await prisma.querySession.findUnique({
        where: { id: querySessionId },
        select: { userId: true },
    });
    return session?.userId === userId;
}
