import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MeetingSummarySchema } from "@repo/types";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env");
}

const model = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: apiKey,
});

export async function summarizeMeeting(transcript: string) {
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are an expert meeting assistant. Analyze the transcript and extract structured information."],
        ["user", "Analyze the following meeting transcript and extract the title, goal, key points, and action items.\n\nTranscript:\n{transcript}"]
    ]);

    const structuredModel = model.withStructuredOutput(MeetingSummarySchema);
    const chain = prompt.pipe(structuredModel);

    try {
        const response = await chain.invoke({
            transcript: transcript,
        });
        return response;
    } catch (error) {
        console.error("Error summarizing meeting:", error);
        return {
            title: "Meeting Summary",
            goal: "Failed to summarize meeting.",
            keyPoints: [],
            actionItems: [],
        };
    }
}