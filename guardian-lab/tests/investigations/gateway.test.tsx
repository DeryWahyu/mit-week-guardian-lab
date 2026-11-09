import { beforeEach, describe, expect, it, mock } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AnalysisGateway } from "@/components/landing/analysis-gateway";
import type { AnalysisGatewayProps } from "@/components/landing/analysis-gateway-types";
import { useAnalysisGateway } from "@/components/landing/use-analysis-gateway";
import { createInvestigation } from "@/lib/investigations/service";
import { prisma } from "@/lib/prisma";
import { STANDARD_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";

let mockSearch = "";
let mockPathname = "/";
let currentUrl = "/";

mock.module("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

mock.module("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} alt={(props.alt as string) || ""} />,
}));

// Setup global browser navigation mocks
globalThis.window = {
  location: {
    get search() {
      const idx = currentUrl.indexOf("?");
      return idx >= 0 ? currentUrl.slice(idx) : "";
    },
    get hash() {
      return "";
    },
  },
  history: {
    replaceState: (_: unknown, __: unknown, url: string) => {
      currentUrl = url;
      const queryIdx = url.indexOf("?");
      mockSearch = queryIdx >= 0 ? url.slice(queryIdx + 1) : "";
    },
    pushState: (_: unknown, __: unknown, url: string) => {
      currentUrl = url;
      const queryIdx = url.indexOf("?");
      mockSearch = queryIdx >= 0 ? url.slice(queryIdx + 1) : "";
    },
  },
} as unknown as Window & typeof globalThis;

function GatewayTestHarness({
  props,
  onHook,
}: {
  props: AnalysisGatewayProps;
  onHook: (gw: ReturnType<typeof useAnalysisGateway>) => void;
}) {
  const gw = useAnalysisGateway(props);
  onHook(gw);
  return null;
}

describe("GATEWAY-TYPE-01: AnalysisGateway input contract and lifecycle", () => {
  beforeEach(() => {
    currentUrl = "/";
    mockSearch = "";
    mockPathname = "/";
  });

  it("renders AnalysisGateway static markup successfully and accepts onInputChange prop", () => {
    const handleInput = mock(() => {});
    const html = renderToStaticMarkup(
      <AnalysisGateway onInputChange={handleInput} defaultTab="url" />,
    );

    expect(html).toContain("Pemeriksaan tautan");
    expect(html).toContain('id="url-target-input"');
    expect(html).toContain('type="text"');
    expect(html).toContain('placeholder="Tempel tautan yang bikin ragu…"');
    expect(html).toContain("Tautannya belum dibuka di perangkatmu.");
  });

  it("calls onInputChange callback when URL input changes", () => {
    let callCount = 0;
    let hookResult!: ReturnType<typeof useAnalysisGateway>;

    renderToStaticMarkup(
      <GatewayTestHarness
        props={{
          onInputChange: () => {
            callCount++;
          },
        }}
        onHook={(gw) => {
          hookResult = gw;
        }}
      />,
    );

    hookResult.changeUrl("https://bank-bca-aman.test");
    expect(callCount).toBe(1);

    hookResult.changeUrl("https://login-portal.test");
    expect(callCount).toBe(2);
  });

  it("calls onInputChange callback when QR file is selected or cleared", () => {
    let callCount = 0;
    let hookResult!: ReturnType<typeof useAnalysisGateway>;

    renderToStaticMarkup(
      <GatewayTestHarness
        props={{
          onInputChange: () => {
            callCount++;
          },
        }}
        onHook={(gw) => {
          hookResult = gw;
        }}
      />,
    );

    const testFile = new File(["fake-qr-data"], "qr-code.png", { type: "image/png" });
    hookResult.selectQr([testFile]);
    expect(callCount).toBe(1);

    hookResult.clearQr();
    expect(callCount).toBe(2);
  });

  it("calls onInputChange callback when opening or closing QR dialog", () => {
    let callCount = 0;
    let hookResult!: ReturnType<typeof useAnalysisGateway>;

    renderToStaticMarkup(
      <GatewayTestHarness
        props={{
          onInputChange: () => {
            callCount++;
          },
        }}
        onHook={(gw) => {
          hookResult = gw;
        }}
      />,
    );

    hookResult.openQr();
    expect(callCount).toBe(1);

    hookResult.closeQr();
    expect(callCount).toBe(2);
  });

  it("clears displayed result from view and URL without deleting or altering database records", async () => {
    // 1. Create a persistent investigation record
    const record = await createInvestigation({
      userId: STANDARD_USER_FIXTURE.id,
      target: "https://phishing-scam-demo.test/login",
      type: "URL",
      inputMetadata: { simulated: true },
    });

    // 2. Set browser location to emulate currently viewing the investigation
    currentUrl = `/?investigation=${record.id}&tab=url`;
    mockSearch = `investigation=${record.id}&tab=url`;

    // 3. Emulate LandingInvestigation.clearResult
    let viewCleared = false;
    function clearResult() {
      viewCleared = true;
      const next = new URLSearchParams(window.location.search);
      if (!next.has("investigation")) return;
      next.delete("investigation");
      window.history.replaceState(null, "", `/${next.size ? `?${next}` : ""}`);
    }

    let hookResult!: ReturnType<typeof useAnalysisGateway>;
    renderToStaticMarkup(
      <GatewayTestHarness
        props={{
          onInputChange: clearResult,
        }}
        onHook={(gw) => {
          hookResult = gw;
        }}
      />,
    );

    // 4. User types a new URL -> onInputChange triggers clearResult
    hookResult.changeUrl("https://new-url-to-check.test");

    expect(viewCleared).toBe(true);
    // URL search param "investigation" is cleaned up
    expect(window.location.search).not.toContain(record.id);
    expect(window.location.search).not.toContain("investigation");

    // 5. Verify the record STILL EXISTS in the database with intact metadata
    const stored = await prisma.forensicRecord.findUnique({ where: { id: record.id } });
    expect(stored).not.toBeNull();
    expect(stored?.id).toBe(record.id);
    expect(stored?.target).toBe("https://phishing-scam-demo.test/login");
  });

  it("operates normally without errors when onInputChange is undefined / omitted", () => {
    let hookResult!: ReturnType<typeof useAnalysisGateway>;

    renderToStaticMarkup(
      <GatewayTestHarness
        props={{}}
        onHook={(gw) => {
          hookResult = gw;
        }}
      />,
    );

    expect(() => {
      hookResult.changeUrl("https://safe-site.test");
      hookResult.openQr();
      const testFile = new File(["qr"], "sample.png", { type: "image/png" });
      hookResult.selectQr([testFile]);
      hookResult.clearQr();
      hookResult.closeQr();
    }).not.toThrow();
  });
});
