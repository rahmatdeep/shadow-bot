import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const COLLECTION_NAME = "transcript_chunks";
const QDRANT_URL = "http://localhost:6333";

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Search Qdrant for transcript chunks similar to the query.
 * Filtered by a list of recordingIds (for user ownership).
 */
export async function searchSimilarChunks(
    queryText: string,
    recordingIds: string[],
    topK: number = 10
): Promise<{ recordingId: string; content: string; score: number }[]> {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: QDRANT_URL,
        collectionName: COLLECTION_NAME,
    });

    const results = await vectorStore.similaritySearchWithScore(queryText, topK, {
        must: [
            {
                key: "metadata.recordingId",
                match: { any: recordingIds },
            },
        ],
    });

    return results.map(([doc, score]) => ({
        recordingId: doc.metadata.recordingId as string,
        content: doc.pageContent,
        score,
    }));
}
