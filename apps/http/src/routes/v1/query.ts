import { Router } from "express";
import { prisma } from "@repo/db/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { QuerySchema, QuerySessionIdSchema } from "@repo/types";
import { AuthRequest } from "../../middleware/auth";
import { verifyQueryOwnership } from "../../utils/ownership";

const router: Router = Router();

// Single endpoint for querying across meetings with query history support
router.post("/", async (req: AuthRequest, res) => {
    const parsed = QuerySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.format() });
        return;
    }

    const userId = req.userId!;
    let { querySessionId, message } = parsed.data;

    try {
        let querySession;

        if (querySessionId) {
            // Continuation of existing query session
            if (!(await verifyQueryOwnership(querySessionId, userId))) {
                res.status(403).json({ error: "Access denied" });
                return;
            }
            querySession = await prisma.querySession.findUnique({
                where: { id: querySessionId },
                include: { messages: { orderBy: { createdAt: "asc" } } },
            });
        } else {
            // Start new query session automatically
            querySession = await prisma.querySession.create({
                data: {
                    userId,
                    title: message.substring(0, 50),
                },
                include: { messages: true }
            });
            querySessionId = querySession.id;
        }

        if (!querySession) {
            res.status(404).json({ error: "Query session not found" });
            return;
        }

        // 2. Fetch all transcripts with summaries and tags for relevance check
        const transcriptsData = await prisma.transcript.findMany({
            where: {
                recording: { userId },
                detailedSummaryStatus: "COMPLETED",
            },
            select: {
                recordingId: true,
                detailedSummary: true,
                tags: true,
                recording: { select: { title: true } }
            }
        });

        let context = "No relevant meeting transcripts were found for this query.";

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            apiKey: process.env.GEMINI_API_KEY,
        });

        if (transcriptsData.length > 0) {
            // 3. Identify relevant transcripts using LLM
            const relevancePrompt = `You are an assistant that identifies relevant meeting transcripts based on a user's query.
User Query: "${message}"

Below are summaries and tags of several meetings. Identify the IDs of the meetings that are highly relevant to answering the query.
Meetings:
${transcriptsData.map(t => `ID: ${t.recordingId}\nTitle: ${t.recording?.title}\nSummary: ${t.detailedSummary}\nTags: ${t.tags.join(", ")}\n---`).join("\n")}

Respond with ONLY a comma-separated list of relevant meeting IDs. If none are relevant, respond with "NONE".`;

            const relevanceResponse = await model.invoke([new HumanMessage(relevancePrompt)]);
            const relevantIdsStr = (relevanceResponse.content as string).trim();

            if (relevantIdsStr !== "NONE" && relevantIdsStr !== "") {
                const relevantIds = relevantIdsStr.split(",").map(id => id.trim());
                const fullTranscripts = await prisma.transcript.findMany({
                    where: {
                        recordingId: { in: relevantIds },
                        recording: { userId }
                    },
                    select: { transcript: true }
                });
                const relevantTranscripts = fullTranscripts.map(t => t.transcript).filter(Boolean) as string[];
                if (relevantTranscripts.length > 0) {
                    context = `Use the following relevant meeting transcripts as context to answer the user's query:\n\n${relevantTranscripts.join("\n\n---\n\n")}`;
                }
            }
        }

        // 4. Generate final answer with query history
        const conversationHistory = [
            new SystemMessage(`You are a helpful assistant answering questions across multiple meeting transcripts. ${context}`),
            ...(querySession.messages || []).map(msg =>
                msg.role === "USER" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
            ),
            new HumanMessage(message)
        ];

        // Save user message to DB
        const userMessage = await prisma.queryMessage.create({
            data: {
                querySessionId: querySessionId,
                role: "USER",
                content: message,
            },
        });

        const response = await model.invoke(conversationHistory);
        const assistantContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

        // Save assistant response to DB
        const assistantMessage = await prisma.queryMessage.create({
            data: {
                querySessionId: querySessionId,
                role: "ASSISTANT",
                content: assistantContent,
            },
        });

        res.json({
            response: assistantContent,
            querySessionId: querySessionId,
            userMessageId: userMessage.id,
            assistantMessageId: assistantMessage.id
        });

    } catch (error) {
        console.error("Query processing error:", error);
        res.status(500).json({ error: "Failed to process query" });
    }
});

// Get all global query sessions for current user
router.get("/", async (req: AuthRequest, res) => {
    const userId = req.userId!;

    try {
        const querySessions = await prisma.querySession.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        const chats = querySessions.map((session) => ({
            id: session.id,
            title: session.title || "Untitled Query",
            lastMessage: session.messages[0]?.content || null,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
        }));

        res.json(chats);
    } catch (error) {
        console.error("Error fetching query sessions:", error);
        res.status(500).json({ error: "Failed to fetch query sessions" });
    }
});

// Get a specific query session with history
router.get("/:querySessionId", async (req: AuthRequest, res) => {
    const userId = req.userId!;

    const parsed = QuerySessionIdSchema.safeParse(req.params);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid query session ID" });
        return;
    }

    const { querySessionId } = parsed.data;

    if (!(await verifyQueryOwnership(querySessionId, userId))) {
        res.status(403).json({ error: "Access denied" });
        return;
    }

    try {
        const querySession = await prisma.querySession.findUnique({
            where: { id: querySessionId },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!querySession) {
            res.status(404).json({ error: "Query session not found" });
            return;
        }

        res.json({
            id: querySession.id,
            title: querySession.title || "Untitled Query",
            createdAt: querySession.createdAt,
            updatedAt: querySession.updatedAt,
            messages: querySession.messages.map((msg) => ({
                id: msg.id,
                role: msg.role.toLowerCase(),
                content: msg.content,
                createdAt: msg.createdAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching query session:", error);
        res.status(500).json({ error: "Failed to fetch query session" });
    }
});

export { router as queryRouter };