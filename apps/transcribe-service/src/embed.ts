import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Document } from "@langchain/core/documents";
import "dotenv/config";

const COLLECTION_NAME = "transcript_chunks";
const QDRANT_URL = "http://localhost:6333";

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Split text into overlapping word-based chunks.
 */
export function chunkTranscript(
    text: string,
    chunkSize: number = 500,
    overlap: number = 50
): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    if (words.length <= chunkSize) {
        return [text];
    }

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
        const chunk = words.slice(i, i + chunkSize).join(" ");
        chunks.push(chunk);
        if (i + chunkSize >= words.length) break;
    }

    return chunks;
}

/**
 * Get or create the LangChain QdrantVectorStore instance.
 */
async function getVectorStore(): Promise<QdrantVectorStore> {
    return QdrantVectorStore.fromExistingCollection(embeddings, {
        url: QDRANT_URL,
        collectionName: COLLECTION_NAME,
    });
}

/**
 * Chunk a transcript, embed it, and store in Qdrant via LangChain.
 * Each document stores: recordingId, chunkIndex as metadata.
 */
export async function embedAndStore(
    recordingId: string,
    transcript: string
): Promise<number> {
    const chunks = chunkTranscript(transcript);
    if (chunks.length === 0) return 0;

    const documents = chunks.map((content, index) =>
        new Document({
            pageContent: content,
            metadata: {
                recordingId,
                chunkIndex: index,
            },
        })
    );

    const vectorStore = await QdrantVectorStore.fromDocuments(documents, embeddings, {
        url: QDRANT_URL,
        collectionName: COLLECTION_NAME,
    });

    console.log(`Stored ${chunks.length} chunks for recording ${recordingId}`);
    return chunks.length;
}
