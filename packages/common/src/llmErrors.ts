export type LLMErrorType = "RATE_LIMIT" | "AUTH" | "SERVER" | "UNKNOWN";

export interface ClassifiedLLMError {
    type: LLMErrorType;
    status: number;
    retryable: boolean;
    message: string;
    retryAfterMs?: number;
}

/**
 * Classify a Google Generative AI / LangChain error into a known category.
 */
export function classifyLLMError(error: unknown): ClassifiedLLMError {
    const err = error as any;
    const status = err?.status ?? err?.statusCode ?? err?.code ?? 0;
    const message = err?.message ?? String(error);

    // 429 Too Many Requests
    if (status === 429 || message.includes("429") || message.toLowerCase().includes("too many requests") || message.toLowerCase().includes("resource exhausted")) {
        // Parse retry delay from Google's errorDetails or headers
        let retryAfterMs = 5000;
        const retryInfo = err?.errorDetails?.find?.((d: any) => d?.retryDelay);
        if (retryInfo?.retryDelay) {
            const seconds = parseInt(retryInfo.retryDelay);
            if (!isNaN(seconds)) retryAfterMs = seconds * 1000;
        } else if (err?.headers?.["retry-after"]) {
            retryAfterMs = parseInt(err.headers["retry-after"]) * 1000;
        } else {
            // Try to parse "retry in XXs" from message
            const match = message.match(/retry\s+in\s+([\d.]+)/i);
            if (match) retryAfterMs = Math.ceil(parseFloat(match[1]) * 1000);
        }
        // Cap at 60s to avoid blocking user-facing requests too long
        retryAfterMs = Math.min(retryAfterMs, 60000);

        return {
            type: "RATE_LIMIT",
            status: 429,
            retryable: true,
            message: `LLM rate limit exceeded. Please retry in ${Math.ceil(retryAfterMs / 1000)}s.`,
            retryAfterMs,
        };
    }

    // 401 / 403 Auth errors
    if (status === 401 || status === 403 || message.includes("API_KEY_INVALID") || message.includes("PERMISSION_DENIED")) {
        return {
            type: "AUTH",
            status: 403,
            retryable: false,
            message: "LLM authentication failed. Check your API key.",
        };
    }

    // 5xx Server errors
    if ((typeof status === "number" && status >= 500) || message.includes("500") || message.includes("503") || message.toLowerCase().includes("internal")) {
        return {
            type: "SERVER",
            status: 503,
            retryable: true,
            message: "LLM service is temporarily unavailable.",
            retryAfterMs: 2000,
        };
    }

    return {
        type: "UNKNOWN",
        status: 500,
        retryable: false,
        message: `LLM error: ${message.substring(0, 200)}`,
    };
}

/**
 * Wrap an async LLM call with retry + exponential backoff for transient errors.
 * Non-retryable errors throw immediately.
 */
export async function withLLMRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const classified = classifyLLMError(error);

            if (!classified.retryable || attempt === maxRetries) {
                throw error;
            }

            const delay = classified.retryAfterMs ?? (1000 * Math.pow(2, attempt));
            console.warn(`[LLM Retry] ${classified.type} error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
