import { Router } from "express";
import { prisma } from "@repo/db/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const chatRouter: Router = Router();

// Start a new chat session for a recording
chatRouter.post("/start", async (req, res) => {
    const { recordingId } = req.body;
    if (!recordingId) {
        res.status(400).json({ error: "Missing recordingId" });
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
    const { chatId, message } = req.body;
    if (!chatId || !message) {
        res.status(400).json({ error: "Missing chatId or message" });
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
                    : new SystemMessage(msg.content)
            ),
            new HumanMessage(message),
        ];

        const response = await model.invoke(conversationHistory);
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
        console.error("Chat message error:", error);
        res.status(500).json({ error: "Failed to process chat message" });
    }
});

// Get all chat sessions (filter by recordingId or userId via recording)
chatRouter.get("/", async (req, res) => {
    const { userId, recordingId } = req.query;

    try {
        const where: any = {};
        if (recordingId) where.recordingId = recordingId;
        if (userId) where.recording = { userId };

        const chatSessions = await prisma.chatSession.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                recording: { select: { link: true, userId: true } },
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
    const { chatId } = req.params;

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
