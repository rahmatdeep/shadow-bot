import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TagsSchema } from "@repo/types";
import { withLLMRetry, classifyLLMError } from "@repo/common";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env");
}

const model = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: apiKey,
});

export async function generateTags(transcript: string, summary: any) {
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are analyzing a meeting transcript to extract relevant tags for organization and search.

INSTRUCTIONS:
1. Generate 3-7 tags that capture the essence of this meeting
2. Include:
   - People mentioned (first names or full names if clear)
   - Main topics/themes discussed
   - Project names or product names
   - Key action areas (e.g., "planning", "review", "brainstorm")
3. Use lowercase with hyphens for multi-word tags (e.g., "product-roadmap")
4. Be specific, not generic (avoid "meeting", "discussion", "important")
5. Return ONLY a JSON array of strings, nothing else`],
        ["user", `TRANSCRIPT:
{transcript}

SUMMARY:
{summary}

Return format: ["tag1", "tag2", "tag3"]`]
    ]);

    const structuredModel = model.withStructuredOutput(TagsSchema);
    const chain = prompt.pipe(structuredModel);

    try {
        const response = await withLLMRetry(() => chain.invoke({
            transcript: transcript,
            summary: JSON.stringify(summary),
        }));
        return response;
    } catch (error) {
        const classified = classifyLLMError(error);
        console.error(`Error generating tags [${classified.type}]:`, error);
        return [];
    }
}
