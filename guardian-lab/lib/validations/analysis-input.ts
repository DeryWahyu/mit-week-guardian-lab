import { z } from "zod";

export const MAX_URL_LENGTH = 16384;
export const MAX_QR_BYTES = 5 * 1024 * 1024;
export const MAX_APK_BYTES = 50 * 1024 * 1024;
export const QR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

/** Shared by direct URL submissions and decoded QR payloads. No network access. */
export const scanUrlSchema = z
  .string()
  .trim()
  .min(1, "Masukkan tautan yang ingin diperiksa.")
  .max(MAX_URL_LENGTH, "Tautan maksimal 16.384 karakter.")
  .transform((input, context) => {
    const reject = (message: string) => {
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    };
    if (
      /[\s\\]/.test(input) ||
      [...input].some(
        (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      ) ||
      input.startsWith("/")
    ) {
      return reject(
        "Tautan tidak boleh mengandung spasi, karakter kontrol, atau garis miring terbalik.",
      );
    }
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(input);
    const hostWithPort = /^(?:[^/:?#]+|\[[\da-f:]+\]):\d+(?:[/?#]|$)/i.test(input);
    if (hasScheme && !/^https?:\/\//i.test(input) && !hostWithPort)
      return reject("Gunakan tautan HTTP atau HTTPS.");
    let url: URL;
    try {
      url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    } catch {
      return reject("Format tautan tidak valid. Contoh: https://example.com/halaman");
    }
    if (!["http:", "https:"].includes(url.protocol))
      return reject("Gunakan tautan HTTP atau HTTPS.");
    if (url.username || url.password)
      return reject("Hapus nama pengguna atau kata sandi dari tautan sebelum mengirim.");
    const hostname = url.hostname.replace(/\.$/, "");
    if (
      !hostname ||
      (hostname !== "localhost" &&
        !hostname.startsWith("[") &&
        (!hostname.includes(".") || hostname.split(".").some((label) => !label)))
    ) {
      return reject("Masukkan nama domain yang lengkap, misalnya example.com.");
    }
    if (url.href.length > MAX_URL_LENGTH)
      return reject("Tautan maksimal 16.384 karakter setelah dinormalisasi.");
    return url.href;
  });

export const urlSubmissionSchema = z.object({ url: scanUrlSchema });
export const qrFileSchema = z
  .object({
    name: z.string().min(1).max(255),
    size: z
      .number()
      .int()
      .positive("Gambar tidak boleh kosong.")
      .max(MAX_QR_BYTES, "Ukuran gambar maksimal 5 MB."),
    type: z.string(),
  })
  .superRefine((file, context) => {
    if (
      !(QR_MIME_TYPES as readonly string[]).includes(file.type) &&
      !(
        ["", "application/octet-stream"].includes(file.type) &&
        /\.(png|jpe?g|webp)$/i.test(file.name)
      )
    ) {
      context.addIssue({ code: "custom", message: "Pilih gambar PNG, JPG, atau WebP." });
    }
  });
export const apkMetadataSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/\.apk$/i, "Pilih berkas berekstensi .apk."),
  fileSizeBytes: z
    .number()
    .int()
    .positive("Berkas APK tidak boleh kosong.")
    .max(MAX_APK_BYTES, "Ukuran APK maksimal 50 MB."),
});
export const qrSubmissionSchema = z.object({
  imageBase64: z
    .string()
    .trim()
    .min(1)
    .max(7 * 1024 * 1024)
    .regex(/^(?:data:image\/(?:png|jpeg|webp);base64,)?[A-Za-z0-9+/]+={0,2}$/),
  mimeType: z.enum(QR_MIME_TYPES).optional(),
});
