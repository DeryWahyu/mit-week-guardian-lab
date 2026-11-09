/**
 * Guardian Lab: Milestone 1 Adversarial Challenger Stress Test Harness
 *
 * Exhaustively stress-tests:
 * 1. PII Scrubber robustness under extreme & evasive inputs (re-entrancy, regex statefulness,
 *    nested phone numbers, code blocks, Telegram bot tokens, international formats).
 * 2. Defang / Refang edge cases (IPv4/IPv6, unusual ports, query strings, fragmented paths,
 *    userinfo deception, roundtrip fidelity).
 * 3. Session & JWT security (tampered signatures, alg: none, expired tokens, empty/corrupt cookies,
 *    hardcoded bypass tokens, concurrent logins).
 * 4. RBAC Proxy boundary tests (role enforcement on /admin and /api/admin, /history and /academy
 *    guards, open-redirect sanitization).
 */

import { describe, expect, it } from "bun:test";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { GET as meGET } from "@/app/api/auth/me/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { signSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { getPostLoginRedirect } from "@/lib/auth/redirect";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { defangUrl, isDefanged, refangUrl } from "@/lib/security/defang";
import { hasPii, REDACTION_TAGS, scrubPii } from "@/lib/security/pii-scrubber";
import { getSafeRedirectUrl } from "@/lib/validations/auth";
import { proxy } from "@/proxy";
import { ADMIN_USER_FIXTURE, STANDARD_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";

describe("Milestone 1 Adversarial Challenge & Stress Suite", () => {
  // =========================================================================
  // 1. PII SCRUBBER ROBUSTNESS UNDER EXTREME INPUTS
  // =========================================================================
  describe("1. PII Scrubber Robustness Under Extreme Inputs", () => {
    describe("Statefulness and Re-entrancy (/g RegExp Bug)", () => {
      it("should yield consistent results when hasPii is called consecutively on the same string", () => {
        const email = "attacker@evil-domain.com";
        const firstCall = hasPii(email);
        const secondCall = hasPii(email);
        const thirdCall = hasPii(email);

        expect(firstCall).toBe(true);
        expect(secondCall).toBe(true);
        expect(thirdCall).toBe(true);
      });

      it("should yield consistent results when hasPii is called consecutively with different PII inputs", () => {
        const phone = "081234567890";
        const token = "1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ123456789";
        const nik = "3171012345670001";

        expect(hasPii(phone)).toBe(true);
        expect(hasPii(phone)).toBe(true);
        expect(hasPii(token)).toBe(true);
        expect(hasPii(token)).toBe(true);
        expect(hasPii(nik)).toBe(true);
        expect(hasPii(nik)).toBe(true);
      });

      it("should not falsely report benign text as PII after matching PII", () => {
        const pii = "Hubungi 081234567890 sekarang";
        const benign = "Server running on port 8080 with sha256:abcd";

        expect(hasPii(pii)).toBe(true);
        expect(hasPii(benign)).toBe(false);
        expect(hasPii(benign)).toBe(false);
      });
    });

    describe("Indonesian Phone Numbers: Nested & Formatted Variants", () => {
      it("redacts phone numbers nested in JSON payloads", () => {
        const jsonPayload = JSON.stringify({
          contact: {
            admin: {
              phone: "+6281234567890",
            },
          },
        });
        const result = scrubPii(jsonPayload);
        expect(result.redactedCounts.phone).toBeGreaterThanOrEqual(1);
        expect(result.sanitizedText).toContain(REDACTION_TAGS.phone);
        expect(result.sanitizedText).not.toContain("+6281234567890");
      });

      it("redacts phone numbers nested in XML/HTML markup", () => {
        const html = `<div data-phone="0812-3456-7890"><span>Hubungi CS: +6281987654321</span></div>`;
        const result = scrubPii(html);
        expect(result.redactedCounts.phone).toBe(2);
        expect(result.sanitizedText).not.toContain("0812-3456-7890");
        expect(result.sanitizedText).not.toContain("+6281987654321");
      });

      it("evaluates phone numbers with country code variants (+62, 62, 0)", () => {
        const input = "Nomor 1: +628123456789, Nomor 2: 6281398765432, Nomor 3: 085712345678";
        const result = scrubPii(input);
        expect(result.redactedCounts.phone).toBe(3);
        expect(result.sanitizedText).not.toContain("085712345678");
        expect(result.sanitizedText).not.toContain("6281398765432");
        expect(result.sanitizedText).not.toContain("+628123456789");
      });

      it("tests boundary lengths for Indonesian phone numbers", () => {
        // Minimum valid Indonesian mobile: 08 + 8 digits = 10 digits
        const validShort = "0812345678";
        // Maximum valid Indonesian mobile: 08 + 11 digits = 13 digits
        const validLong = "0812345678901";
        // Too short (081) - should NOT redact
        const tooShort = "Kode wilayah 081 tidak lengkap";

        const resValid = scrubPii(`${validShort} dan ${validLong}`);
        expect(resValid.redactedCounts.phone).toBe(2);

        const resShort = scrubPii(tooShort);
        expect(resShort.redactedCounts.phone).toBe(0);
      });
    });

    describe("16-Digit NIK / Bank Cards in Code & Contexts", () => {
      it("redacts 16-digit numbers in markdown code blocks", () => {
        const mdCodeBlock =
          '```json\n{\n  "nik": "3171012345670001",\n  "card": "4111-2222-3333-4444"\n}\n```';
        const result = scrubPii(mdCodeBlock);
        expect(result.redactedCounts.nik).toBe(2);
        expect(result.sanitizedText).not.toContain("3171012345670001");
        expect(result.sanitizedText).not.toContain("4111-2222-3333-4444");
      });

      it("redacts 16-digit numbers with spaced or hyphenated 4x4 grouping", () => {
        const spaced = "Card: 5200 1234 5678 9010 and 4242-1111-2222-3333";
        const result = scrubPii(spaced);
        expect(result.redactedCounts.nik).toBe(2);
        expect(result.sanitizedText).not.toContain("5200 1234 5678 9010");
        expect(result.sanitizedText).not.toContain("4242-1111-2222-3333");
      });

      it("does not redact 15-digit numbers or 64-char SHA hashes", () => {
        const hexHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        const fifteenDigits = "123456789012345";
        const result = scrubPii(`Hash: ${hexHash}, Nonce: ${fifteenDigits}`);
        expect(result.redactedCounts.nik).toBe(0);
        expect(result.sanitizedText).toContain(hexHash);
        expect(result.sanitizedText).toContain(fifteenDigits);
      });
    });

    describe("Telegram Bot Tokens: Prefix and URL Variants", () => {
      it("redacts Telegram bot token embedded with /bot prefix in URL", () => {
        const url =
          "https://api.telegram.org/bot7123456789:AAEFG1234567890abcdef1234567890abcd/sendMessage";
        const result = scrubPii(url);
        expect(result.redactedCounts.token).toBe(1);
        expect(result.sanitizedText).toContain(
          "https://api.telegram.org/bot[EXTRACTED_BOT_TOKEN_REDACTED]/sendMessage",
        );
        expect(result.sanitizedText).not.toContain(
          "7123456789:AAEFG1234567890abcdef1234567890abcd",
        );
      });

      it("redacts Telegram bot token assigned to variables or json keys", () => {
        const input = `const BOT_TOKEN = "9876543210:ZYXwv9876543210abcdef9876543210abcd";`;
        const result = scrubPii(input);
        expect(result.redactedCounts.token).toBe(1);
        expect(result.sanitizedText).toContain(REDACTION_TAGS.token);
      });

      it("tests token lookbehind with different prefixes", () => {
        const tokenString = "1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ123456789";
        const prefixedSlash = `/bot${tokenString}`;
        const prefixedColon = `token:${tokenString}`;
        const prefixedEqual = `key=${tokenString}`;

        expect(scrubPii(prefixedSlash).redactedCounts.token).toBe(1);
        expect(scrubPii(prefixedEqual).redactedCounts.token).toBe(1);
        expect(scrubPii(prefixedColon).redactedCounts.token).toBe(1);
      });
    });
  });

  // =========================================================================
  // 2. DEFANG / REFANG EDGE CASES
  // =========================================================================
  describe("2. Defang / Refang Edge Cases", () => {
    describe("IPv4, IPv6, and Non-Standard Hostnames", () => {
      it("defangs standard IPv4 addresses with ports", () => {
        const ipUrl = "http://192.168.1.100:8080/c2-control";
        const defanged = defangUrl(ipUrl);
        expect(defanged).toBe("hxxp://192[.]168[.]1[.]100:8080/c2-control");
        expect(isDefanged(defanged)).toBe(true);

        const refanged = refangUrl(defanged);
        expect(refanged).toBe(ipUrl);
      });

      it("defangs IPv6 loopback and standard addresses", () => {
        const ipv6Url = "http://[::1]:8080/status";
        const defanged = defangUrl(ipv6Url);
        expect(defanged).toBe("hxxp://[::1]:8080/status");
        expect(isDefanged(defanged)).toBe(true);
      });

      it("handles IPv4-mapped IPv6 format", () => {
        const mappedIpv6 = "http://[::ffff:192.0.2.1]:80/malware";
        const defanged = defangUrl(mappedIpv6);
        expect(isDefanged(defanged)).toBe(true);
        expect(defanged).toContain("hxxp://");
      });

      it("defangs bare domains and hostnames without protocol", () => {
        const bareDomain = "phishing-bca-login.xyz";
        const defanged = defangUrl(bareDomain);
        expect(defanged).toBe("phishing-bca-login[.]xyz");
        expect(isDefanged(defanged)).toBe(true);

        const refanged = refangUrl(defanged);
        expect(refanged).toBe(bareDomain);
      });
    });

    describe("Unusual Ports and Complex Query Strings", () => {
      it("defangs URLs with boundary ports (0 and 65535)", () => {
        const portZero = "http://attacker.com:0/endpoint";
        const portMax = "https://attacker.com:65535/beacon";

        const defZero = defangUrl(portZero);
        const defMax = defangUrl(portMax);

        expect(defZero).toBe("hxxp://attacker[.]com:0/endpoint");
        expect(defMax).toBe("hxxps://attacker[.]com:65535/beacon");
      });

      it("preserves query parameters and fragment paths while defanging domain", () => {
        const complexUrl =
          "https://phish.target.com:8443/login/step1.php?redirect=https://real.com/auth.php&session_id=1.2.3#stage.2";
        const defanged = defangUrl(complexUrl);

        // Hostname must be defanged
        expect(defanged).toContain("hxxps://phish[.]target[.]com:8443");
        // Path and query params preserved
        expect(defanged).toContain("/login/step1.php");
        expect(defanged).toContain("redirect=https://real.com/auth.php");
        expect(defanged).toContain("#stage.2");
      });

      it("handles userinfo deception in phishing URLs (e.g. google.com@attacker.com)", () => {
        const deceptiveUrl = "https://bca.co.id@phishing-portal.com/login";
        const defanged = defangUrl(deceptiveUrl);
        // The defanged result should at least defang the effective host and not crash
        expect(isDefanged(defanged)).toBe(true);
      });

      it("handles non-URL protocols like javascript: and data: gracefully", () => {
        const jsUri = "javascript:alert(document.cookie)";
        const defanged = defangUrl(jsUri);
        // Should not crash and should return safe string
        expect(typeof defanged).toBe("string");
      });
    });
  });

  // =========================================================================
  // 3. SESSION & JWT SECURITY
  // =========================================================================
  describe("3. Session & JWT Security", () => {
    describe("Cryptographic Verification & Tamper Resistance", () => {
      it("rejects token when signature is altered", async () => {
        const validToken = await signSessionToken({
          userId: "usr_attacker_01",
          email: "attacker@test.com",
          name: "Attacker",
          role: "USER",
        });

        // Split JWT into header, payload, signature
        const parts = validToken.split(".");
        expect(parts.length).toBe(3);

        // Tamper signature
        const tamperedSignature = `${parts[2].substring(0, parts[2].length - 4)}WXYZ`;
        const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

        const verified = await verifySessionToken(tamperedToken);
        expect(verified).toBeNull();
      });

      it("rejects token when payload claims are tampered to escalate role to ADMIN", async () => {
        const validToken = await signSessionToken({
          userId: "usr_user_02",
          email: "user@test.com",
          name: "Normal User",
          role: "USER",
        });

        const parts = validToken.split(".");
        const payloadJson = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        payloadJson.role = "ADMIN"; // Privilege escalation attempt
        const tamperedPayloadB64 = Buffer.from(JSON.stringify(payloadJson)).toString("base64url");

        const forgedToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;
        const verified = await verifySessionToken(forgedToken);
        expect(verified).toBeNull();
      });

      it("rejects token signed with 'none' algorithm", async () => {
        const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
          "base64url",
        );
        const payload = Buffer.from(
          JSON.stringify({
            userId: "usr_admin_001",
            email: ADMIN_USER_FIXTURE.email,
            name: "Guardian Admin",
            role: "ADMIN",
            exp: Math.floor(Date.now() / 1000) + 3600,
          }),
        ).toString("base64url");

        const noneToken = `${header}.${payload}.`;
        const verified = await verifySessionToken(noneToken);
        expect(verified).toBeNull();
      });

      it("rejects token signed with a foreign secret key", async () => {
        const foreignKey = new TextEncoder().encode("foreign-unauthorized-secret-key-32b");
        const foreignToken = await new SignJWT({
          userId: "usr_admin_001",
          email: ADMIN_USER_FIXTURE.email,
          name: "Guardian Admin",
          role: "ADMIN",
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("2h")
          .sign(foreignKey);

        const verified = await verifySessionToken(foreignToken);
        expect(verified).toBeNull();
      });

      it("rejects expired token", async () => {
        const secret = new TextEncoder().encode(
          process.env.SESSION_SECRET ||
            process.env.AUTH_SECRET ||
            "guardian-lab-default-session-secret-key-32-bytes",
        );
        const expiredToken = await new SignJWT({
          userId: "usr_user_003",
          email: "expired@test.com",
          name: "Expired User",
          role: "USER",
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
          .setExpirationTime(Math.floor(Date.now() / 1000) - 3600) // Expired 1 hour ago
          .sign(secret);

        const verified = await verifySessionToken(expiredToken);
        expect(verified).toBeNull();
      });

      it("handles empty strings and malformed tokens safely", async () => {
        expect(await verifySessionToken("")).toBeNull();
        expect(await verifySessionToken("   ")).toBeNull();
        expect(await verifySessionToken("invalid-garbage-token")).toBeNull();
        expect(await verifySessionToken("a.b.c")).toBeNull();
        expect(await verifySessionToken("..")).toBeNull();
      });
    });

    describe("Concurrent Logins & Session Persistence", () => {
      it("supports multiple concurrent active sessions for the same user without collision", async () => {
        const testUser = await prisma.user.findFirst({
          where: { email: STANDARD_USER_FIXTURE.email },
        });
        expect(testUser).not.toBeNull();
        if (!testUser) return;

        // Sign two distinct tokens concurrently
        const token1 = await signSessionToken({
          userId: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        });

        const token2 = await signSessionToken({
          userId: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        });

        // Tokens must be unique because of crypto jti
        expect(token1).not.toBe(token2);

        // Store both in database
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const s1 = await prisma.session.create({
          data: { userId: testUser.id, token: token1, expiresAt },
        });
        const s2 = await prisma.session.create({
          data: { userId: testUser.id, token: token2, expiresAt },
        });

        expect(s1.id).toBeDefined();
        expect(s2.id).toBeDefined();

        // Both tokens verify properly
        const v1 = await verifySessionToken(token1);
        const v2 = await verifySessionToken(token2);
        expect(v1?.userId).toBe(testUser.id);
        expect(v2?.userId).toBe(testUser.id);

        // Cleanup
        await prisma.session.deleteMany({
          where: { token: { in: [token1, token2] } },
        });
      });
    });
  });

  // =========================================================================
  // 4. RBAC PROXY BOUNDARY TESTS
  // =========================================================================
  describe("4. RBAC Proxy Boundary Tests", () => {
    let adminToken: string;
    let userToken: string;

    it("prepares valid admin and user test tokens", async () => {
      adminToken = await signSessionToken({
        userId: "usr_admin_001",
        email: ADMIN_USER_FIXTURE.email,
        name: "Guardian Admin",
        role: "ADMIN",
      });

      userToken = await signSessionToken({
        userId: "usr_user_002",
        email: STANDARD_USER_FIXTURE.email,
        name: "Citizen Analyst",
        role: "USER",
      });

      expect(adminToken).toBeDefined();
      expect(userToken).toBeDefined();
    });

    describe("/admin/* and /api/admin/* Access Controls", () => {
      it("blocks unauthenticated user from /admin/secret with redirect to /login", async () => {
        const req = new NextRequest("http://localhost:3000/admin/secret");
        const res = await proxy(req);

        expect(res.status).toBe(307); // NextResponse.redirect defaults to 307
        const location = res.headers.get("location");
        expect(location).toContain("/login");
        expect(location).toContain("redirect=%2Fadmin%2Fsecret");
      });

      it("blocks USER role from /admin/secret with redirect to home (/)", async () => {
        const req = new NextRequest("http://localhost:3000/admin/secret", {
          headers: {
            cookie: `${SESSION_COOKIE_NAME}=${userToken}`,
          },
        });
        const res = await proxy(req);

        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toBe("http://localhost:3000/");
      });

      it("allows ADMIN role to access /admin/secret", async () => {
        const req = new NextRequest("http://localhost:3000/admin/secret", {
          headers: {
            cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
          },
        });
        const res = await proxy(req);

        // NextResponse.next() returns 200 without redirect
        expect(res.status).toBe(200);
        expect(res.headers.get("location")).toBeNull();
      });

      it("returns 401 Unauthorized when accessing /api/admin/quizzes without cookie", async () => {
        const req = new NextRequest("http://localhost:3000/api/admin/quizzes");
        const res = await proxy(req);

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toContain("Otentikasi diperlukan");
      });

      it("returns 403 Forbidden when accessing /api/admin/quizzes with USER role", async () => {
        const req = new NextRequest("http://localhost:3000/api/admin/quizzes", {
          headers: {
            cookie: `${SESSION_COOKIE_NAME}=${userToken}`,
          },
        });
        const res = await proxy(req);

        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error).toContain("Hak akses administrator diperlukan");
      });

      it("allows ADMIN role to access /api/admin/quizzes", async () => {
        const req = new NextRequest("http://localhost:3000/api/admin/quizzes", {
          headers: {
            cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
          },
        });
        const res = await proxy(req);

        expect(res.status).toBe(200);
      });
    });

    describe("/history/* and /academy/* Protection", () => {
      it("redirects unauthenticated guest trying to access /history to /login", async () => {
        const req = new NextRequest("http://localhost:3000/history?filter=phishing");
        const res = await proxy(req);

        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/login");
        expect(location).toContain("redirect=%2Fhistory%3Ffilter%3Dphishing");
      });

      it("redirects unauthenticated guest trying to access /academy to /login", async () => {
        const req = new NextRequest("http://localhost:3000/academy");
        const res = await proxy(req);

        expect(res.status).toBe(307);
        const location = res.headers.get("location");
        expect(location).toContain("/login?redirect=%2Facademy");
      });

      it("allows authenticated USER to access /history and /academy", async () => {
        const reqHistory = new NextRequest("http://localhost:3000/history", {
          headers: { cookie: `${SESSION_COOKIE_NAME}=${userToken}` },
        });
        const resHistory = await proxy(reqHistory);
        expect(resHistory.status).toBe(200);

        const reqAcademy = new NextRequest("http://localhost:3000/academy", {
          headers: { cookie: `${SESSION_COOKIE_NAME}=${userToken}` },
        });
        const resAcademy = await proxy(reqAcademy);
        expect(resAcademy.status).toBe(200);
      });
    });

    describe("Open Redirect Resistance in Proxy & Validation Helper", () => {
      it("blocks open redirect attempts with protocol-relative URL (//evil.com)", () => {
        expect(getSafeRedirectUrl("//evil.com")).toBe("/");
        expect(getSafeRedirectUrl("///evil.com")).toBe("/");
      });

      it("blocks open redirect attempts with backslashes (/\\evil.com or /\\\\evil.com)", () => {
        expect(getSafeRedirectUrl("/\\evil.com")).toBe("/");
        expect(getSafeRedirectUrl("/\\\\evil.com")).toBe("/");
      });

      it("blocks open redirect attempts with absolute URLs or javascript:", () => {
        expect(getSafeRedirectUrl("https://evil.com")).toBe("/");
        expect(getSafeRedirectUrl("http://evil.com/login")).toBe("/");
        expect(getSafeRedirectUrl("javascript:alert(1)")).toBe("/");
      });

      it("allows safe internal relative paths", () => {
        expect(getSafeRedirectUrl("/history")).toBe("/history");
        expect(getSafeRedirectUrl("/history?tab=apk")).toBe("/history?tab=apk");
        expect(getSafeRedirectUrl("/academy/quiz/1")).toBe("/academy/quiz/1");
      });

      it("neutralizes open redirect attempts when authenticated user visits /login?redirect=//evil.com", async () => {
        const req = new NextRequest("http://localhost:3000/login?redirect=//evil.com", {
          headers: { cookie: `${SESSION_COOKIE_NAME}=${userToken}` },
        });
        const res = await proxy(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("location")).toBeNull();
        expect(getPostLoginRedirect("USER", req.nextUrl.searchParams.get("redirect"))).toBe("/");
      });

      it("neutralizes open redirect attempts when authenticated user visits /login?redirect=/\\evil.com", async () => {
        const req = new NextRequest("http://localhost:3000/login?redirect=/\\evil.com", {
          headers: { cookie: `${SESSION_COOKIE_NAME}=${userToken}` },
        });
        const res = await proxy(req);

        expect(res.status).toBe(200);
        expect(res.headers.get("location")).toBeNull();
        expect(getPostLoginRedirect("USER", req.nextUrl.searchParams.get("redirect"))).toBe("/");
      });
    });
  });

  // =========================================================================
  // 5. BACKDOOR ELIMINATION & ENDPOINT INTEGRITY
  // =========================================================================
  describe("5. Backdoor Elimination & Endpoint Integrity", () => {
    it("unconditionally rejects mock backdoor cookie guardian_session=valid_attacker on /api/auth/me with HTTP 401", async () => {
      const req = new Request("http://localhost:3000/api/auth/me", {
        headers: {
          cookie: "guardian_session=valid_attacker",
        },
      });
      const res = await meGET(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.authenticated).toBe(false);
      expect(body.user).toBeNull();
      expect(body.error).toBe("Sesi tidak ditemukan atau telah kedaluwarsa");
    });

    it("unconditionally rejects mock backdoor tokens with 'valid_' substrings on /api/auth/me", async () => {
      const bypassTokens = [
        "valid_jwt_token",
        "valid_user_jwt",
        "valid_",
        "attacker_valid_test",
        "valid_admin_token",
      ];

      for (const token of bypassTokens) {
        const req = new Request("http://localhost:3000/api/auth/me", {
          headers: {
            cookie: `guardian_session=${token}`,
          },
        });
        const res = await meGET(req);
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.authenticated).toBe(false);
      }
    });

    it("rejects duplicate registration with HTTP 409 and never wipes the existing user or active sessions", async () => {
      const existingUser = await prisma.user.findFirst({
        where: { email: STANDARD_USER_FIXTURE.email },
        include: { sessions: true },
      });
      expect(existingUser).not.toBeNull();
      if (!existingUser) return;

      const beforeUserId = existingUser.id;
      const beforeSessionCount = existingUser.sessions.length;

      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Attacker Trying To Wipe Account",
          email: existingUser.email,
          phone: existingUser.phone ?? "+6281234567893",
          password: "AttackerPassword123!",
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(409);

      const body = await res.json();
      expect(body.error).toContain("Email sudah terdaftar");

      const afterUser = await prisma.user.findUnique({
        where: { email: existingUser.email },
        include: { sessions: true },
      });

      expect(afterUser).not.toBeNull();
      expect(afterUser?.id).toBe(beforeUserId);
      expect(afterUser?.sessions.length).toBe(beforeSessionCount);
    });
  });

  // =========================================================================
  // 6. SERVER-SIDE SESSION REVOCATION LIFECYCLE
  // =========================================================================
  describe("6. Server-Side Session Revocation Lifecycle", () => {
    it("authenticates active session with 200, then returns 401 immediately upon database revocation", async () => {
      const user = await prisma.user.findFirst({
        where: { email: STANDARD_USER_FIXTURE.email },
      });
      expect(user).not.toBeNull();
      if (!user) return;

      // Create a genuine cryptographically signed session token
      const token = await signSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const expiresAt = new Date(Date.now() + 3600000); // 1 hour valid
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // 1. Verify /api/auth/me returns 200 for active session
      const reqActive = new Request("http://localhost:3000/api/auth/me", {
        headers: {
          cookie: `guardian_session=${token}`,
        },
      });
      const resActive = await meGET(reqActive);
      expect(resActive.status).toBe(200);
      const bodyActive = await resActive.json();
      expect(bodyActive.authenticated).toBe(true);
      expect(bodyActive.email).toBe(user.email);

      // 2. Revoke session by deleting from database (simulating logout or administrative revocation)
      await prisma.session.delete({ where: { id: session.id } });

      // 3. Verify /api/auth/me immediately returns 401
      const reqRevoked = new Request("http://localhost:3000/api/auth/me", {
        headers: {
          cookie: `guardian_session=${token}`,
        },
      });
      const resRevoked = await meGET(reqRevoked);
      expect(resRevoked.status).toBe(401);
      const bodyRevoked = await resRevoked.json();
      expect(bodyRevoked.authenticated).toBe(false);
      expect(bodyRevoked.error).toContain("Sesi tidak ditemukan atau telah kedaluwarsa");
    });

    it("rejects session with 401 when database expiresAt is in the past", async () => {
      const user = await prisma.user.findFirst({
        where: { email: STANDARD_USER_FIXTURE.email },
      });
      expect(user).not.toBeNull();
      if (!user) return;

      const token = await signSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Expired 5 minutes ago in DB
      const expiredSession = await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() - 300000),
        },
      });

      const reqExpired = new Request("http://localhost:3000/api/auth/me", {
        headers: {
          cookie: `guardian_session=${token}`,
        },
      });
      const resExpired = await meGET(reqExpired);
      expect(resExpired.status).toBe(401);
      const bodyExpired = await resExpired.json();
      expect(bodyExpired.authenticated).toBe(false);

      // Clean up
      await prisma.session.delete({ where: { id: expiredSession.id } });
    });
  });

  // =========================================================================
  // 7. HIGH-VOLUME ALTERNATING PII INVARIANCE
  // =========================================================================
  describe("7. High-Volume Alternating PII Invariance", () => {
    it("executes 500 rapid alternating calls without state leakage or false negatives", () => {
      const piiEmail = "attacker-phishing@evil-telemetry.co.id";
      const benignText = "Build completed with status code 200 at timestamp 1730419200";

      for (let i = 0; i < 500; i++) {
        expect(hasPii(piiEmail)).toBe(true);
        expect(hasPii(benignText)).toBe(false);
      }
    });

    it("retains zero statefulness after scrubPii execution", () => {
      const phoneInput = "Nomor WhatsApp: 081234567890 silahkan hubungi";

      for (let i = 0; i < 100; i++) {
        const scrubbed = scrubPii(phoneInput);
        expect(scrubbed.sanitizedText).toContain(REDACTION_TAGS.phone);
        expect(hasPii(phoneInput)).toBe(true);
      }
    });
  });
});
