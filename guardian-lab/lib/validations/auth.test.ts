import { describe, expect, it } from "bun:test";
import { getSafeRedirectUrl, loginSchema, registerFormSchema, registerSchema } from "./auth";

describe("Auth Validation Schemas", () => {
  describe("loginSchema", () => {
    it("validates valid login credentials", () => {
      const res = loginSchema.safeParse({
        email: "analyst@guardianlab.id",
        password: "ValidPassword123!",
      });
      expect(res.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const res = loginSchema.safeParse({
        email: "invalid-email-address",
        password: "ValidPassword123!",
      });
      expect(res.success).toBe(false);
    });

    it("rejects empty password", () => {
      const res = loginSchema.safeParse({
        email: "user@guardianlab.id",
        password: "",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("validates valid registration data without confirmPassword (API format)", () => {
      const res = registerSchema.safeParse({
        name: "Guardian Recruit",
        email: "recruit@guardianlab.id",
        phone: "081234567890",
        password: "RecruitPassword123!",
      });
      expect(res.success).toBe(true);
    });

    it("validates when confirmPassword matches", () => {
      const res = registerSchema.safeParse({
        name: "Guardian Recruit",
        email: "recruit@guardianlab.id",
        phone: "081234567890",
        password: "RecruitPassword123!",
        confirmPassword: "RecruitPassword123!",
      });
      expect(res.success).toBe(true);
    });

    it("rejects when confirmPassword does not match", () => {
      const res = registerSchema.safeParse({
        name: "Guardian Recruit",
        email: "recruit@guardianlab.id",
        phone: "081234567890",
        password: "RecruitPassword123!",
        confirmPassword: "DifferentPassword123!",
      });
      expect(res.success).toBe(false);
    });

    it("rejects password with less than 8 characters", () => {
      const res = registerSchema.safeParse({
        name: "Test User",
        email: "test@guardianlab.id",
        phone: "081234567890",
        password: "short",
      });
      expect(res.success).toBe(false);
    });

    it("rejects password without numbers", () => {
      const res = registerSchema.safeParse({
        name: "Test User",
        email: "test@guardianlab.id",
        phone: "081234567890",
        password: "OnlyLettersHere",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("registerFormSchema", () => {
    it("requires confirmPassword in form schema", () => {
      const res = registerFormSchema.safeParse({
        name: "Guardian Recruit",
        email: "recruit@guardianlab.id",
        phone: "081234567890",
        password: "RecruitPassword123!",
      });
      expect(res.success).toBe(false);
    });

    it("validates when confirmPassword is provided and matches", () => {
      const res = registerFormSchema.safeParse({
        name: "Guardian Recruit",
        email: "recruit@guardianlab.id",
        phone: "081234567890",
        password: "RecruitPassword123!",
        confirmPassword: "RecruitPassword123!",
      });
      expect(res.success).toBe(true);
    });
  });

  describe("getSafeRedirectUrl", () => {
    it("accepts safe relative paths", () => {
      expect(getSafeRedirectUrl("/history")).toBe("/history");
      expect(getSafeRedirectUrl("/academy?tab=quiz")).toBe("/academy?tab=quiz");
      expect(getSafeRedirectUrl("/admin")).toBe("/admin");
    });

    it("blocks open redirect attempts with protocol", () => {
      expect(getSafeRedirectUrl("https://evil.com/phish")).toBe("/");
      expect(getSafeRedirectUrl("http://evil.com")).toBe("/");
    });

    it("blocks protocol-relative URLs", () => {
      expect(getSafeRedirectUrl("//evil.com")).toBe("/");
      expect(getSafeRedirectUrl("/\\evil.com")).toBe("/");
    });

    it("falls back gracefully for null or empty targets", () => {
      expect(getSafeRedirectUrl(null)).toBe("/");
      expect(getSafeRedirectUrl("")).toBe("/");
      expect(getSafeRedirectUrl(undefined, "/custom-fallback")).toBe("/custom-fallback");
    });
  });
});
