import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function extractMarkdownLinks(text: string) {
  const links: string[] = [];
  let i = 0;
  while (i < text.length) {
    const openBracket = text.indexOf("[", i);
    if (openBracket === -1) break;
    const closeBracket = text.indexOf("]", openBracket);
    if (closeBracket === -1) break;
    if (text[closeBracket + 1] === "(") {
      let depth = 1;
      let j = closeBracket + 2;
      while (j < text.length && depth > 0) {
        if (text[j] === "(") depth++;
        else if (text[j] === ")") depth--;
        j++;
      }
      if (depth === 0) {
        const target = text.substring(closeBracket + 2, j - 1).trim();
        links.push(target.startsWith("<") && target.endsWith(">") ? target.slice(1, -1) : target);
        i = j;
        continue;
      }
    }
    i = openBracket + 1;
  }
  return links;
}

describe("DOC-01 & DOC-02 Documentation & AI Instruction Integrity", () => {
  it("reads CommonMark angle destinations while preserving route-group parentheses", () => {
    expect(extractMarkdownLinks("[Info](<../app/(public-info)/>)")).toEqual([
      "../app/(public-info)/",
    ]);
    expect(extractMarkdownLinks("[Routes](./routes-and-navigation.md#routing)")).toEqual([
      "./routes-and-navigation.md#routing",
    ]);
  });
  it("ensures features.md is the single authoritative feature doc without old deleted docs (DOC-01)", () => {
    const aiDocsDir = join(process.cwd(), "ai-agent-docs");
    expect(existsSync(join(aiDocsDir, "features.md"))).toBe(true);

    const deletedDocs = [
      "apk-static.md",
      "authentication.md",
      "community.md",
      "flow-consistency.md",
      "hero-reference.md",
      "input-flow.md",
      "investigations.md",
      "modules-specification.md",
      "results-and-history.md",
      "sandbox-and-academy.md",
      "share-card.md",
      "system-flow-audit.md",
      "api-and-prompts.md",
    ];

    for (const doc of deletedDocs) {
      expect(existsSync(join(aiDocsDir, doc))).toBe(false);
    }
  });

  it("ensures AGENTS.md preserves Next.js automated agent blocks and test execution mandate (DOC-02)", () => {
    const agentsPath = join(process.cwd(), "AGENTS.md");
    expect(existsSync(agentsPath)).toBe(true);
    const content = readFileSync(agentsPath, "utf-8");

    expect(content).toContain("<!-- BEGIN:nextjs-agent-rules -->");
    expect(content).toContain("<!-- END:nextjs-agent-rules -->");
    expect(content).toContain("<!-- BEGIN:nextjs-agent-feedback -->");
    expect(content).toContain("<!-- END:nextjs-agent-feedback -->");
    expect(content).toContain(
      "Default selama pengerjaan dan penyelesaian tugas: jangan membuat/menambah kode test",
    );
  });

  it("verifies relative markdown links in active ai-agent-docs point to existing targets (DOC-01)", () => {
    const aiDocsDir = join(process.cwd(), "ai-agent-docs");
    const docFiles = readdirSync(aiDocsDir).filter((f) => f.endsWith(".md"));

    for (const file of docFiles) {
      const filePath = join(aiDocsDir, file);
      const text = readFileSync(filePath, "utf-8");
      const urls = extractMarkdownLinks(text);

      for (const rawTarget of urls) {
        if (
          rawTarget.startsWith("http://") ||
          rawTarget.startsWith("https://") ||
          rawTarget.startsWith("#")
        ) {
          continue;
        }
        const targetPathOnly = rawTarget.split("#")[0];
        if (!targetPathOnly || targetPathOnly.endsWith("hero-design-01.png")) continue;
        const resolved = resolve(dirname(filePath), targetPathOnly);
        expect(existsSync(resolved)).toBe(true);
      }
    }
  });
});
