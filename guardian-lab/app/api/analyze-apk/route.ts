import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { acquireApkSlot, receiveApk } from "@/lib/apk/receive";
import { authorizeRequest } from "@/lib/auth/access";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { apkMetadataSchema, MAX_APK_BYTES } from "@/lib/validations/analysis-input";

export async function POST(request: Request) {
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  const release = acquireApkSlot();
  if (!release)
    return NextResponse.json(
      { error: "Mesin ekstraksi sedang digunakan. Tunggu sebentar lalu coba kembali." },
      { status: 429 },
    );
  try {
    if (
      request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
      "multipart/form-data"
    )
      throw new InputError("Unggah berkas APK melalui file picker.");
    const form = await readInput(request, MAX_APK_BYTES + 64 * 1024, "form");
    const files = form.getAll("file");
    if (files.length !== 1 || !(files[0] instanceof File))
      throw new InputError("Pilih satu berkas APK untuk setiap pemeriksaan.");
    const file = files[0];
    const parsed = apkMetadataSchema.safeParse({ fileName: file.name, fileSizeBytes: file.size });
    if (!parsed.success)
      throw new InputError(parsed.error.issues[0]?.message ?? "Berkas APK tidak valid.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const result = await receiveApk(
      {
        userId: auth.user.id,
        target: parsed.data.fileName,
        inputMetadata: {
          ...parsed.data,
          sha256,
          binaryStored: false,
          staticExtractionPerformed: false,
        },
      },
      bytes,
      request.signal,
    );
    return NextResponse.json(result.record, {
      status: result.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof InputError
            ? error.message
            : "Investigasi APK gagal disimpan. Silakan coba kembali.",
      },
      { status: error instanceof InputError ? error.status : 500 },
    );
  } finally {
    release();
  }
}
