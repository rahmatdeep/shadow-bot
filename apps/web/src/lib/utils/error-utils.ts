/**
 * Cleans up error messages from backend services and third-party SDKs.
 * Handles pure JSON, prefixed JSON (like ElevenLabs), and nested error objects.
 */
export function cleanupErrorMessage(
  errorStr: string | null | undefined,
): string | null {
  if (!errorStr) return null;

  // Try to find a JSON object in the string (including multiline)
  const jsonMatch = errorStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    console.log("jsonMatch", jsonMatch);
    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Recursive function to search for a message string in the object
      const findMessage = (obj: any): string | null => {
        if (!obj || typeof obj !== "object") return null;

        // Priority fields for messages
        const messageSlots = [
          "message",
          "detail",
          "error",
          "msg",
          "description",
          "status", // Fallback for things like "invalid_api_key"
        ];

        for (const slot of messageSlots) {
          const val = obj[slot];
          if (typeof val === "string") return val;
          if (typeof val === "object" && val !== null) {
            const nested = findMessage(val);
            if (nested) return nested;
          }
        }

        return null;
      };

      const extractedMessage = findMessage(parsed);
      if (extractedMessage) return extractedMessage;

      // If no string found, but it's an object, stringify it
      if (typeof parsed === "object" && parsed !== null) {
        return JSON.stringify(parsed);
      }
    } catch (e) {
      // If parsing fails, fall back to raw string
    }
  }

  // Manual cleanup for common prefixes if JSON extraction failed
  return errorStr.replace(/^Status code: \d+ Body: /i, "").trim();
}
