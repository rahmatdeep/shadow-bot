/**
 * Normalizes a single tag:
 * 1. Converts to lowercase
 * 2. Replaces spaces with hyphens
 * 3. Removes special characters (keep only a-z, 0-9, hyphens)
 * 4. Collapses multiple hyphens into one
 * 5. Trims leading/trailing hyphens
 */
export function normalizeTag(tag: string): string {
    return tag
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes an array of tags:
 * 1. Normalizes each tag
 * 2. Removes empty strings
 * 3. Removes duplicates
 */
export function normalizeTags(tags: string[]): string[] {
    const normalized = tags.map(normalizeTag).filter(tag => tag.length > 0);
    return Array.from(new Set(normalized));
}

export { classifyLLMError, withLLMRetry } from "./llmErrors";
export type { LLMErrorType, ClassifiedLLMError } from "./llmErrors";
