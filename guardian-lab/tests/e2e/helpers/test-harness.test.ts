import { describe, expect, it } from "bun:test";
import { executeRoute } from "./test-harness";

describe("Strict route dispatcher", () => {
  it("fails when the route handler is missing", async () => {
    await expect(executeRoute("/api/non-existent-route", "POST", {})).rejects.toThrow(
      "Route handler not found",
    );
  });
  it("fails when the requested method is not implemented", async () => {
    await expect(executeRoute("/api/analyze-url", "GET")).rejects.toThrow("is not implemented");
  });
  it("returns responses from a real handler for guest rejection", async () => {
    const result = await executeRoute(
      "/api/analyze-url",
      "POST",
      { url: "https://example.invalid" },
      {},
    );
    expect(result.source).toBe("LIVE_ROUTE");
    expect(result.status).toBe(401);
  });
});
