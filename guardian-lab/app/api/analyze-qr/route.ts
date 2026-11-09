import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { decodeQrImage } from "@/lib/analysis/qr";
import { authorizeRequest } from "@/lib/auth/access";
import { receiveUrlInvestigation } from "@/lib/investigations/receive-url";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { receiveFailedInvestigation } from "@/lib/investigations/service";
import {
  MAX_QR_BYTES,
  qrFileSchema,
  qrSubmissionSchema,
  scanUrlSchema,
} from "@/lib/validations/analysis-input";

export async function POST(request: Request) {
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  try {
    let buffer: Buffer;
    if (
      request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ===
      "multipart/form-data"
    ) {
      const form = await readInput(request, MAX_QR_BYTES + 64 * 1024, "form");
      const files = [...form.getAll("file"), ...form.getAll("image")];
      if (files.length !== 1 || !(files[0] instanceof File))
        throw new InputError("Pilih satu gambar QR untuk setiap pemeriksaan.");
      const file = files[0];
      const parsed = qrFileSchema.safeParse({ name: file.name, size: file.size, type: file.type });
      if (!parsed.success)
        throw new InputError(parsed.error.issues[0]?.message ?? "Gambar tidak valid.");
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      const parsed = qrSubmissionSchema.safeParse(
        await readInput(request, 7 * 1024 * 1024 + 64 * 1024, "json"),
      );
      if (!parsed.success) throw new InputError("Payload gambar QR tidak valid.");
      buffer = Buffer.from(
        parsed.data.imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
        "base64",
      );
    }
    if (!buffer.length || buffer.length > MAX_QR_BYTES)
      throw new InputError("Gambar tidak boleh kosong dan maksimal 5 MB.");
    const decoded = await decodeQrImage(buffer);
    const inputMetadata = {
      sha256: createHash("sha256").update(buffer).digest("hex"),
      fileSizeBytes: buffer.length,
      decoder: "jsqr",
      binaryStored: false,
    };
    const url = decoded.success ? scanUrlSchema.safeParse(decoded.extracted_text) : null;
    if (!decoded.success || !url?.success) {
      const error = !decoded.success
        ? decoded.error
        : !decoded.is_url
          ? "Isi QR bukan URL HTTP atau HTTPS. Pilih QR yang berisi tautan."
          : url && !url.success
            ? (url.error.issues[0]?.message ?? "Tautan pada QR tidak valid.")
            : "Tautan pada QR tidak valid.";
      const code = !decoded.success
        ? decoded.errorCode
        : !decoded.is_url
          ? "QR_NOT_URL"
          : "QR_INVALID_URL";
      const record = await receiveFailedInvestigation(
        { userId: auth.user.id, target: "Gambar QR", type: "QR", inputMetadata },
        code,
        error,
      );
      return NextResponse.json(
        { ...serializeInvestigation(record), error, is_url: false },
        { status: 422, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const record = await receiveUrlInvestigation({
      userId: auth.user.id,
      url: url.data,
      type: "QR",
      inputMetadata: {
        ...inputMetadata,
        isUrl: true,
        imageFormat: decoded.imageFormat ?? "",
        width: decoded.width,
        height: decoded.height,
      },
    });
    return NextResponse.json(
      { ...serializeInvestigation(record), extracted_text: record.target, is_url: true },
      {
        status: record.status === "FAILED" ? 422 : 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof InputError
            ? error.message
            : "Investigasi QR gagal disimpan. Silakan coba kembali.",
      },
      { status: error instanceof InputError ? error.status : 500 },
    );
  }
}
