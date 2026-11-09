import { connection } from "next/server";

/**
 * Safe wrapper around Next.js 16 connection() function.
 * In Next.js production build / server, it allows Next.js to interrupt prerendering
 * with a NEXT_ digest error to mark routes dynamic.
 * In unit testing environments (e.g. Bun test), calling connection() outside
 * a request scope throws an error without digest, which is gracefully ignored.
 */
export async function safeConnection(): Promise<void> {
  try {
    await connection();
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
  }
}
