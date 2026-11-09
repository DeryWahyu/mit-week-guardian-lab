import { afterAll, beforeAll, describe, expect, it, spyOn } from "bun:test";
import sharp from "sharp";
import { GET as image } from "@/app/api/academy/quizzes/[id]/thumbnail/route";
import { GET as catalog } from "@/app/api/academy/quizzes/route";
import { DELETE as archive, PUT as update } from "@/app/api/admin/quizzes/[id]/route";
import { GET as adminList, POST as create } from "@/app/api/admin/quizzes/route";
import { MAX_THUMBNAIL_BYTES } from "@/lib/academy/thumbnail-config";
import * as audit from "@/lib/admin/audit";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { adminQuizSchema, type QuizInput, quizSummarySchema } from "@/lib/validations/academy";
import { cleanupUsers, context, fixtureUser, request, tokenFor } from "../admin/helpers";

const ids: string[] = [],
  quizzes: string[] = [];
let adminToken = "",
  userToken = "",
  userId = "";
const input: QuizInput = {
  title: "Thumbnail upload fixture",
  description: "Fictional learning content for isolated image upload checks.",
  category: "SPOT_THE_PHISH",
  difficulty: "EASY",
  expReward: 50,
  published: true,
  questions: [
    {
      questionText: "Apa yang diperiksa sebelum mengikuti tautan?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        { id: "a", text: "Domain tujuan" },
        { id: "b", text: "Warna tombol" },
      ],
      correctAnswers: ["a"],
      explanation: "Periksa domain sebelum mengikuti tautan.",
    },
  ],
};
async function picture(color = "#06758a") {
  const bytes = await sharp({ create: { width: 320, height: 160, channels: 3, background: color } })
    .withMetadata()
    .png()
    .toBuffer();
  return new File([new Uint8Array(bytes)], "thumbnail.png", { type: "image/png" });
}
function upload(file: File, data: unknown = input, id?: string, token = adminToken) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  form.set("thumbnail", file);
  return new Request(`http://localhost:3000/api/admin/quizzes${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    body: form,
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}`, Origin: "http://localhost:3000" },
  });
}
async function saved(published = true) {
  const response = await create(upload(await picture(), { ...input, published }));
  expect(response.status).toBe(201);
  const quiz = adminQuizSchema.parse(await response.json());
  quizzes.push(quiz.id);
  return quiz;
}
beforeAll(async () => {
  const admin = await fixtureUser("ADMIN"),
    user = await fixtureUser();
  ids.push(admin.id, user.id);
  userId = user.id;
  adminToken = await tokenFor(admin.id);
  userToken = await tokenFor(user.id);
});
afterAll(async () => {
  await prisma.quiz.deleteMany({ where: { id: { in: quizzes } } });
  await cleanupUsers(ids);
});

describe("Academy thumbnail storage and access", () => {
  it("normalizes the upload, strips metadata, and exposes only private image URLs", async () => {
    const quiz = await saved();
    expect(quiz.thumbnailUrl).toMatch(
      new RegExp(`/api/academy/quizzes/${quiz.id}/thumbnail\\?v=[a-f0-9]{64}$`),
    );
    const response = await image(request(quiz.thumbnailUrl ?? "", userToken), context(quiz.id));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    expect([metadata.width, metadata.height]).toEqual([1200, 600]);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
    const publicPayload: unknown = await (
      await catalog(request("/api/academy/quizzes", userToken))
    ).json();
    const userRows = quizSummarySchema.array().parse(publicPayload);
    expect(JSON.stringify(publicPayload)).not.toContain("correctAnswers");
    expect(JSON.stringify(publicPayload)).not.toContain("explanation");
    expect(userRows.find((row) => row.id === quiz.id)?.thumbnailUrl).toBe(quiz.thumbnailUrl);
    const adminResponse = await adminList(request("/api/admin/quizzes", adminToken));
    const json = await adminResponse.text();
    expect(json).not.toContain('"data":');
    expect(json).not.toContain('"thumbnail":');
    expect(json).not.toContain("thumbnail.png");
    expect((await image(request(quiz.thumbnailUrl ?? ""), context(quiz.id))).status).toBe(401);
  });
  it("allows only administrators to upload and only active sessions to read", async () => {
    expect((await create(upload(await picture(), input, undefined, userToken))).status).toBe(403);
    expect((await create(upload(await picture(), input, undefined, ""))).status).toBe(401);
    const foreign = upload(await picture());
    foreign.headers.set("Origin", "https://foreign.invalid");
    expect((await create(foreign)).status).toBe(403);
    const quiz = await saved(false);
    expect(
      (await image(request(quiz.thumbnailUrl ?? "", userToken), context(quiz.id))).status,
    ).toBe(404);
    expect(
      (await image(request(quiz.thumbnailUrl ?? "", adminToken), context(quiz.id))).status,
    ).toBe(200);
    const temporary = await fixtureUser();
    ids.push(temporary.id);
    const token = await tokenFor(temporary.id);
    await prisma.user.update({ where: { id: temporary.id }, data: { suspendedAt: new Date() } });
    expect((await image(request(quiz.thumbnailUrl ?? "", token), context(quiz.id))).status).toBe(
      401,
    );
  });
  it("preserves an image during text edits, versions replacements, and removes it explicitly", async () => {
    const quiz = await saved();
    const edited = await update(
      request(`/api/admin/quizzes/${quiz.id}`, adminToken, "PUT", {
        ...input,
        title: "Updated thumbnail fixture",
        revision: quiz.updatedAt,
      }),
      context(quiz.id),
    );
    expect(edited.status).toBe(200);
    const current = adminQuizSchema.parse(await edited.json());
    expect(current.thumbnailUrl).toBe(quiz.thumbnailUrl);
    const replacement = await update(
      upload(await picture("#26314f"), { ...input, revision: current.updatedAt }, quiz.id),
      context(quiz.id),
    );
    expect(replacement.status).toBe(200);
    const next = adminQuizSchema.parse(await replacement.json());
    expect(next.thumbnailUrl).not.toBe(quiz.thumbnailUrl);
    const removed = await update(
      request(`/api/admin/quizzes/${quiz.id}`, adminToken, "PUT", {
        ...input,
        revision: next.updatedAt,
        removeThumbnail: true,
      }),
      context(quiz.id),
    );
    expect(removed.status).toBe(200);
    expect((await removed.json()).thumbnailUrl).toBeNull();
    expect(await prisma.quizThumbnail.count({ where: { quizId: quiz.id } })).toBe(0);
    expect(
      (await image(request(next.thumbnailUrl ?? "", userToken), context(quiz.id))).status,
    ).toBe(404);
  });
  it("rolls back thumbnail changes for stale revisions and audit failure", async () => {
    const quiz = await saved();
    const before = await prisma.quizThumbnail.findUniqueOrThrow({ where: { quizId: quiz.id } });
    const stale = await update(
      upload(await picture("#26314f"), { ...input, revision: "2000-01-01T00:00:00.000Z" }, quiz.id),
      context(quiz.id),
    );
    expect(stale.status).toBe(409);
    const spy = spyOn(audit, "appendAudit").mockRejectedValue(new Error("isolated audit failure"));
    try {
      const failed = await update(
        upload(await picture("#26314f"), { ...input, revision: quiz.updatedAt }, quiz.id),
        context(quiz.id),
      );
      expect(failed.status).toBe(503);
    } finally {
      spy.mockRestore();
    }
    expect(await prisma.quizThumbnail.findUniqueOrThrow({ where: { quizId: quiz.id } })).toEqual(
      before,
    );
    expect(
      (await prisma.quiz.findUniqueOrThrow({ where: { id: quiz.id } })).updatedAt.toISOString(),
    ).toBe(quiz.updatedAt);
    expect(await prisma.adminAuditLog.count({ where: { entityId: quiz.id } })).toBe(1);
  });
  it("hides archived images from USER while retaining the image, attempts and EXP", async () => {
    const quiz = await saved();
    const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await prisma.quizAttempt.create({
      data: { quizId: quiz.id, userId, score: 100, passed: true, expEarned: 50 },
    });
    expect(
      (
        await archive(
          request(`/api/admin/quizzes/${quiz.id}`, adminToken, "DELETE"),
          context(quiz.id),
        )
      ).status,
    ).toBe(200);
    expect(
      (await image(request(quiz.thumbnailUrl ?? "", userToken), context(quiz.id))).status,
    ).toBe(404);
    expect(
      (await image(request(quiz.thumbnailUrl ?? "", adminToken), context(quiz.id))).status,
    ).toBe(200);
    expect(await prisma.quizAttempt.count({ where: { quizId: quiz.id } })).toBe(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).exp).toBe(before.exp);
  });
  it("rejects invalid or misleading image payloads before changing quiz data", async () => {
    const count = await prisma.quiz.count();
    const cases = [
      new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "fake.png", { type: "image/png" }),
      new File(["<svg/>"], "vector.svg", { type: "image/svg+xml" }),
      new File([], "empty.png", { type: "image/png" }),
      new File([new Uint8Array(await (await picture()).arrayBuffer())], "wrong.jpg", {
        type: "image/jpeg",
      }),
    ];
    for (const file of cases) expect((await create(upload(file))).status).toBe(400);
    const large = new File([new Uint8Array(MAX_THUMBNAIL_BYTES + 1)], "large.png", {
      type: "image/png",
    });
    expect((await create(upload(large))).status).toBe(413);
    const frames = Buffer.alloc(16 * 32 * 3);
    frames.fill(255, 16 * 16 * 3);
    const animation = await sharp(frames, {
      raw: { width: 16, height: 32, pageHeight: 16, channels: 3 },
    })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    expect((await sharp(animation).metadata()).pages).toBe(2);
    expect(
      (
        await create(
          upload(new File([new Uint8Array(animation)], "animated.webp", { type: "image/webp" })),
        )
      ).status,
    ).toBe(400);
    const pixels = await sharp({
      create: { width: 4001, height: 4000, channels: 3, background: "#06758a" },
    })
      .png()
      .toBuffer();
    expect(
      (
        await create(
          upload(new File([new Uint8Array(pixels)], "pixels.png", { type: "image/png" })),
        )
      ).status,
    ).toBe(400);
    expect(
      (await create(upload(await picture(), { ...input, removeThumbnail: true }))).status,
    ).toBe(400);
    const duplicate = upload(await picture());
    const form = await duplicate.formData();
    form.append("thumbnail", await picture());
    expect(
      (
        await create(
          new Request(duplicate.url, {
            method: "POST",
            headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
            body: form,
          }),
        )
      ).status,
    ).toBe(400);
    expect(await prisma.quiz.count()).toBe(count);
  });
});
