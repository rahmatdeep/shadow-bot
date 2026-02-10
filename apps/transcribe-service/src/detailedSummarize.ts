import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
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

export async function detailedSummarizeMeeting(transcript: string) {
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are creating a comprehensive, detailed summary of a meeting transcript.

GOAL: Condense the transcript while preserving ALL information, including:
- Main discussion points
- Side conversations and interruptions
- Background context and tangential remarks
- Specific names, dates, numbers, and commitments
- Tone and sentiment where relevant

RULES:
1. Write in chronological order
2. Use clear, concise language (remove filler words like "um", "uh")
3. Preserve the substance of every statement
4. Include details that might seem minor (e.g., "Someone asked to close the window")
5. Format as readable paragraphs, not bullet points
6. Do NOT editorialize or add your own interpretation`],
        ["user", "TRANSCRIPT:\n{transcript}\n\nWrite the detailed summary:"]
    ]);

    const chain = prompt.pipe(model);

    try {
        const response = await withLLMRetry(() => chain.invoke({
            transcript: transcript,
        }));
        return response.content as string;
    } catch (error) {
        const classified = classifyLLMError(error);
        console.error(`Error generating detailed summary [${classified.type}]:`, error);
        return "Failed to generate detailed summary.";
    }
}
