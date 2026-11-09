import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { rejectCrossOrigin } from "@/lib/auth/access";

describe("Mutation origin with Next.js loopback normalization", () => {
  it.each([
    ["127.0.0.1:3000", "http://127.0.0.1:3000", true],
    ["localhost:3000", "http://localhost:3000", true],
    ["127.0.0.1:3000", "http://localhost:3000", false],
    ["localhost:3000", "http://127.0.0.1:3000", false],
    ["127.0.0.1:3000", "http://127.0.0.1:4000", false],
    ["127.0.0.1:3000", "https://untrusted.example", false],
  ])("Host %s and Origin %s allowed=%s", (host, origin, allowed) => {
    const request = new NextRequest(`http://${host}/api/analyze-url`, {
      method: "POST",
      headers: { host, origin, "x-forwarded-host": "untrusted.example" },
    });
    expect(new URL(request.url).hostname).toBe("localhost");
    expect(rejectCrossOrigin(request)?.status ?? 200).toBe(allowed ? 200 : 403);
  });
});
