import { Router } from "express";
import { prisma } from "@repo/db/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { QuerySchema, QuerySessionIdSchema } from "@repo/types";
import { AuthRequest } from "../../middleware/auth";
import { verifyQueryOwnership } from "../../utils/ownership";
import { searchSimilarChunks } from "../../utils/vectorSearch";
import { parseTimeFilter, buildPrismaDateFilter } from "../../utils/parseTimeFilter";
import { classifyLLMError, withLLMRetry } from "@repo/common";

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
        const timing: Record<string, number> = {};
        const time = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
            const start = performance.now();
            const result = await fn();
            timing[label] = Math.round(performance.now() - start);
            return result;
        };

        const { session: querySession, resolvedSessionId } = await time("session_setup", async () => {
            if (querySessionId) {
                // Continuation of existing query session
                if (!(await verifyQueryOwnership(querySessionId, userId))) {
                    return { session: null, resolvedSessionId: querySessionId };
                }
                const session = await prisma.querySession.findUnique({
                    where: { id: querySessionId },
                    include: { messages: { orderBy: { createdAt: "asc" } } },
                });
                return { session, resolvedSessionId: querySessionId };
            } else {
                // Start new query session automatically
                const session = await prisma.querySession.create({
                    data: {
                        userId,
                        title: message.substring(0, 50),
                    },
                    include: { messages: true }
                });
                return { session, resolvedSessionId: session.id };
            }
        });

        if (!querySession) {
            res.status(404).json({ error: "Query session not found" });
            return;
        }

        // 2. Parse time filter from user query
        const timeFilter = await time("time_filter", () => parseTimeFilter(message));
        const prismaDateFilter = buildPrismaDateFilter(timeFilter);

        // 3. Find user's recordings (scoped by time) and search via Qdrant
        const context = await time("vector_search", async () => {
            const recordings = await prisma.recording.findMany({
                where: {
                    userId,
                    ...(prismaDateFilter.dateWhere && { createdAt: prismaDateFilter.dateWhere }),
                },
                select: { id: true },
                ...(prismaDateFilter.orderBy && { orderBy: prismaDateFilter.orderBy }),
                ...(prismaDateFilter.take && { take: prismaDateFilter.take }),
            });
            const recordingIds = recordings.map(r => r.id);

            if (recordingIds.length === 0) {
                return "No meeting recordings found for this user in the specified time range.";
            }

            // Semantic search in Qdrant, scoped to filtered recordings
            const chunks = await searchSimilarChunks(message, recordingIds, 10);

            if (chunks.length === 0) {
                return "No relevant meeting transcripts were found for this query.";
            }

            return `Use the following relevant meeting transcript excerpts as context to answer the user's query:\n\n${chunks.map((c, i) => `[Chunk ${i + 1} | Recording: ${c.recordingId} | Relevance: ${(c.score * 100).toFixed(1)}%]\n${c.content}`).join("\n\n---\n\n")}`;
        });

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-flash-latest",
            apiKey: process.env.GEMINI_API_KEY,
        });

        // 3. Generate final answer with query history
        const conversationHistory = [
            new SystemMessage(`You are a helpful assistant answering questions across multiple meeting transcripts. ${context}`),
            ...(querySession.messages || []).map(msg =>
                msg.role === "USER" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
            ),
            new HumanMessage(message)
        ];

        // Save user message to DB
        const userMessage = await time("save_user_message", () =>
            prisma.queryMessage.create({
                data: {
                    querySessionId: resolvedSessionId,
                    role: "USER",
                    content: message,
                },
            })
        );

        const assistantContent = await time("generate_response", async () => {
            const response = await withLLMRetry(() => model.invoke(conversationHistory));
            return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
        });

        // Save assistant response to DB
        const assistantMessage = await time("save_assistant_message", () =>
            prisma.queryMessage.create({
                data: {
                    querySessionId: resolvedSessionId,
                    role: "ASSISTANT",
                    content: assistantContent,
                },
            })
        );

        const totalMs = Object.values(timing).reduce((sum, ms) => sum + ms, 0);
        console.log(`[Query Timing] total=${totalMs}ms |`, Object.entries(timing).map(([k, v]) => `${k}=${v}ms`).join(" | "));

        res.json({
            response: assistantContent,
            querySessionId: resolvedSessionId,
            userMessageId: userMessage.id,
            assistantMessageId: assistantMessage.id,
            timing,
        });

    } catch (error) {
        const classified = classifyLLMError(error);
        console.error(`Query processing error [${classified.type}]:`, error);
        res.status(classified.status).json({ error: classified.message });
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