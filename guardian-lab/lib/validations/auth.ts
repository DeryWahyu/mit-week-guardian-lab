import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";
import { fitsPasswordLimit, MAX_PASSWORD_BYTES } from "@/lib/auth/password-policy";
import { AUTH_ROUTES } from "@/lib/routes";

const passwordSchema = z
  .string()
  .max(MAX_PASSWORD_BYTES, "Password maksimal 72 byte UTF-8")
  .refine(fitsPasswordLimit, "Password maksimal 72 byte UTF-8");

export const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .transform((value, context) => {
    const phone = parsePhoneNumberFromString(value, { defaultCountry: "ID", extract: false });
    if (!phone?.isValid() || phone.ext) {
      context.addIssue({ code: "custom", message: "Masukkan nomor WhatsApp yang valid" });
      return z.NEVER;
    }
    return phone.number;
  });

export const newPasswordSchema = passwordSchema
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Za-z]/, "Password harus mengandung minimal satu huruf")
  .regex(/[0-9]/, "Password harus mengandung minimal satu angka");

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .max(191, "Email maksimal 191 karakter")
    .email("Format email tidak valid")
    .toLowerCase(),
  password: passwordSchema.min(1, "Password wajib diisi"),
  redirect: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["USER", "ADMIN"]),
  exp: z.number(),
  streakDays: z.number(),
});

export const sessionResponseSchema = z.object({ user: sessionUserSchema.nullable() });

export const authSuccessSchema = z.object({
  success: z.literal(true),
  redirectTo: z.string(),
  user: sessionUserSchema,
});

export const otpRequiredSchema = z.object({
  success: z.literal(true),
  status: z.literal("verification_required"),
  redirectTo: z.literal(AUTH_ROUTES.otp),
  deliveryQueued: z.boolean(),
});

export function getAuthError(data: unknown, fallback: string): string {
  const parsed = z
    .object({ error: z.string().optional(), message: z.string().optional() })
    .safeParse(data);
  return parsed.success ? parsed.data.error || parsed.data.message || fallback : fallback;
}

export const baseRegisterSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(50, "Nama maksimal 50 karakter"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .max(191, "Email maksimal 191 karakter")
    .email("Format email tidak valid")
    .toLowerCase(),
  password: newPasswordSchema,
  confirmPassword: z.string().optional(),
  redirect: z.string().optional(),
});

export const registerSchema = baseRegisterSchema.refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  },
);

export type RegisterInput = z.infer<typeof registerSchema>;

export const registerFormSchema = baseRegisterSchema
  .extend({
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;

/**
 * Sanitizes redirect search parameters to prevent open-redirect vulnerabilities.
 * Ensures the target starts with a single `/` and does not contain protocol or double slashes.
 */
export function getSafeRedirectUrl(target: string | null | undefined, fallback = "/"): string {
  if (!target || typeof target !== "string") return fallback;
  const trimmed = target.trim();
  let decoded = trimmed;
  try {
    for (let index = 0; index < 3; index++) {
      if (
        !decoded.startsWith("/") ||
        decoded.startsWith("//") ||
        decoded.includes("\\") ||
        decoded
          .split("")
          .some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)
      ) {
        return fallback;
      }
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    const destination = new URL(trimmed, "https://guardian.invalid");
    if (destination.origin === "https://guardian.invalid") return trimmed;
  } catch {
    return fallback;
  }
  return fallback;
}
