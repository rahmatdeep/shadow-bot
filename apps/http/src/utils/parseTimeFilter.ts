import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { withLLMRetry } from "@repo/common";

const TimeFilterSchema = z.object({
    afterDaysAgo: z.number().nullable().describe("Number of days ago to start from. e.g. 7 means 'in the last 7 days'. null if no lower bound."),
    beforeDaysAgo: z.number().nullable().describe("Number of days ago to end at. e.g. 0 means 'up to now'. null if no upper bound."),
    limit: z.number().nullable().describe("Max number of most recent recordings to consider. e.g. 1 for 'last meeting'. null if no limit."),
});

export type TimeFilter = z.infer<typeof TimeFilterSchema>;

/**
 * Uses a lightweight LLM call to extract time filter intent from a user query.
 * Returns relative day offsets and optional limit for Prisma filtering.
 *
 * Examples:
 *   "check my last meeting"           → { limit: 1 }
 *   "last week's meetings"            → { afterDaysAgo: 7 }
 *   "meetings from 2 days ago"        → { afterDaysAgo: 2, beforeDaysAgo: 2 }
 *   "what is React?"                  → {} (all nulls, no time filter)
 */
export async function parseTimeFilter(query: string): Promise<TimeFilter> {
    const model = new ChatGoogleGenerativeAI({
        model: "gemini-flash-latest",
        apiKey: process.env.GEMINI_API_KEY,
        temperature: 0,
    });

    const structured = model.withStructuredOutput(TimeFilterSchema);

    try {
        const result = await withLLMRetry(() => structured.invoke([
            {
                role: "system",
                content: `You extract time filters from user queries about their meetings.
Today's date is ${new Date().toISOString().split("T")[0]}.
Return relative day offsets. If the query has no time reference, return all nulls.
Examples:
- "last meeting" → afterDaysAgo: null, beforeDaysAgo: null, limit: 1
- "last week" → afterDaysAgo: 7, beforeDaysAgo: null, limit: null
- "yesterday's meeting" → afterDaysAgo: 1, beforeDaysAgo: 0, limit: null
- "meetings this month" → afterDaysAgo: ${new Date().getDate()}, beforeDaysAgo: null, limit: null
- "what is machine learning?" → afterDaysAgo: null, beforeDaysAgo: null, limit: null`,
            },
            { role: "user", content: query },
        ]));
        return result;
    } catch (error) {
        console.warn("[parseTimeFilter] LLM failed, falling back to unfiltered search:", (error as Error).message);
        return { afterDaysAgo: null, beforeDaysAgo: null, limit: null };
    }
}

/**
 * Convert a TimeFilter into a Prisma-compatible `where.createdAt` clause
 * and optional query modifiers (orderBy + take).
 */
export function buildPrismaDateFilter(filter: TimeFilter): {
    dateWhere?: { gte?: Date; lte?: Date };
    orderBy?: { createdAt: "desc" };
    take?: number;
} {
    const result: ReturnType<typeof buildPrismaDateFilter> = {};

    if (filter.afterDaysAgo != null) {
        const d = new Date();
        d.setDate(d.getDate() - filter.afterDaysAgo);
        d.setHours(0, 0, 0, 0);
        result.dateWhere = { ...result.dateWhere, gte: d };
    }

    if (filter.beforeDaysAgo != null) {
        const d = new Date();
        d.setDate(d.getDate() - filter.beforeDaysAgo);
        d.setHours(23, 59, 59, 999);
        result.dateWhere = { ...result.dateWhere, lte: d };
    }

    if (filter.limit != null) {
        result.orderBy = { createdAt: "desc" };
        result.take = filter.limit;
    }

    return result;
}
