import { Router } from "express";
import { prisma } from "@repo/db/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatStartSchema, ChatMessageSchema } from "@repo/types";
import { verifyChatOwnership, verifyRecordingOwnership } from "../../utils/ownership";
import { classifyLLMError, withLLMRetry } from "@repo/common";

const chatRouter: Router = Router();

// Start a new chat session for a recording
chatRouter.post("/start", async (req, res) => {
    const parsed = ChatStartSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.format() });
        return;
    }

    const userId = (req as any).userId;
    const { recordingId } = parsed.data;

    // Verify user owns this recording
    if (!(await verifyRecordingOwnership(recordingId, userId))) {
        res.status(403).json({ error: "Access denied" });
        return;
    }

    try {
        const chatSession = await prisma.chatSession.create({
            data: { recordingId },
        });

        res.json({ chatId: chatSession.id, messages: [] });
    } catch (error) {
        console.error("Error creating chat session:", error);
        res.status(500).json({ error: "Failed to create chat session" });
    }
});

// Send a message and get AI response with full history context
chatRouter.post("/message", async (req, res) => {
    const parsed = ChatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.format() });
        return;
    }

    const userId = (req as any).userId;
    const { chatId, message } = parsed.data;

    // Verify user owns this chat
    if (!(await verifyChatOwnership(chatId, userId))) {
        res.status(403).json({ error: "Access denied" });
        return;
    }

    try {
        // Get chat session with all messages and recording transcript
        const chatSession = await prisma.chatSession.findUnique({
            where: { id: chatId },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
                recording: { include: { transcript: true } },
            },
        });

        if (!chatSession) {
            res.status(404).json({ error: "Chat session not found" });
            return;
        }

        const transcript = chatSession.recording.transcript?.transcript;
        if (!transcript) {
            res.status(404).json({ error: "Transcript not found for this recording" });
            return;
        }

        // Save user message
        const userMessage = await prisma.chatMessage.create({
            data: {
                chatSessionId: chatId,
                role: "USER",
                content: message,
            },
        });

        // Build conversation history for context
        const model = new ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            apiKey: process.env.GEMINI_API_KEY,
        });

        const conversationHistory = [
            new SystemMessage(
                `You are a helpful assistant answering questions about a meeting transcript. Use the following transcript as context:\n\n${transcript}`
            ),
            ...chatSession.messages.map((msg) =>
                msg.role === "USER"
                    ? new HumanMessage(msg.content)
                    : new AIMessage(msg.content)
            ),
            new HumanMessage(message),
        ];

        const response = await withLLMRetry(() => model.invoke(conversationHistory));
        const assistantContent = typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

        // Save assistant response
        const assistantMessage = await prisma.chatMessage.create({
            data: {
                chatSessionId: chatId,
                role: "ASSISTANT",
                content: assistantContent,
            },
        });

        // Update chat title if first message
        if (chatSession.messages.length === 0) {
            await prisma.chatSession.update({
                where: { id: chatId },
                data: { title: message.substring(0, 100) },
            });
        }

        res.json({
            response: assistantContent,
            userMessageId: userMessage.id,
            assistantMessageId: assistantMessage.id,
        });
    } catch (error) {
        const classified = classifyLLMError(error);
        console.error(`Chat message error [${classified.type}]:`, error);
        res.status(classified.status).json({ error: classified.message });
    }
});

// Get all chat sessions for current user
chatRouter.get("/", async (req, res) => {
    const userId = (req as any).userId;
    const { recordingId } = req.query;

    try {
        const where: any = { recording: { userId } };
        // Validating recordingId if provided in query
        if (recordingId && typeof recordingId === "string") {
            where.recordingId = recordingId;
        }

        const chatSessions = await prisma.chatSession.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                recording: { select: { link: true } },
            },
        });

        const chats = chatSessions.map((session) => ({
            id: session.id,
            recordingId: session.recordingId,
            recordingLink: session.recording.link,
            title: session.title || "Untitled Chat",
            lastMessage: session.messages[0]?.content || null,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        }));

        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: "Failed to fetch chats" });
    }
});

// Get a specific chat with all messages
chatRouter.get("/:chatId", async (req, res) => {
    const userId = (req as any).userId;
    const { chatId } = req.params;

    // Verify user owns this chat
    if (!(await verifyChatOwnership(chatId, userId))) {
        res.status(403).json({ error: "Access denied" });
        return;
    }

    try {
        const chatSession = await prisma.chatSession.findUnique({
            where: { id: chatId },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
                recording: { select: { id: true, link: true } },
            },
        });

        if (!chatSession) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }

        res.json({
            id: chatSession.id,
            recordingId: chatSession.recordingId,
            recordingLink: chatSession.recording.link,
            title: chatSession.title || "Untitled Chat",
            createdAt: chatSession.createdAt,
            updatedAt: chatSession.updatedAt,
            messages: chatSession.messages.map((msg) => ({
                id: msg.id,
                role: msg.role.toLowerCase(),
                content: msg.content,
                createdAt: msg.createdAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

export { chatRouter };
