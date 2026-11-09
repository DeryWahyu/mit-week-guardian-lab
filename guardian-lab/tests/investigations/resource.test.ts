import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { getLoadProblem, readResource } from "@/lib/investigations/client";

describe("Investigation read failures", () => {
  it.each([
    [401, "unauthenticated", false],
    [403, "forbidden", false],
    [404, "not_found", false],
    [400, "invalid", false],
    [500, "server", true],
  ] as const)("classifies status %s", async (status, kind, retryable) => {
    try {
      await readResource(
        new Response('{"error":"raw private server detail"}', { status }),
        z.object({ id: z.string() }),
      );
      throw new Error("Expected failure");
    } catch (error) {
      const problem = getLoadProblem(error);
      expect(problem.kind).toBe(kind);
      expect(problem.retryable).toBe(retryable);
      expect(problem.message).not.toContain("raw private");
    }
  });
  it("rejects malformed or mismatched success data rather than generating a result", async () => {
    for (const body of ["invalid JSON", '{"id":42}']) {
      try {
        await readResource(new Response(body), z.object({ id: z.string() }));
        throw new Error("Expected failure");
      } catch (error) {
        expect(getLoadProblem(error).kind).toBe("invalid");
        expect(getLoadProblem(error).retryable).toBe(true);
      }
    }
  });
  it("does not expose raw network exception text", () => {
    const problem = getLoadProblem(new Error("private connection details"));
    expect(problem.kind).toBe("network");
    expect(problem.message).not.toContain("private");
  });
});
