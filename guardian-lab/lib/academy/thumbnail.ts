import { createHash } from "node:crypto";
import sharp from "sharp";
import { InputError } from "@/lib/investigations/request-input";
import { MAX_THUMBNAIL_BYTES, thumbnailFileProblem } from "./thumbnail-config";

export type ThumbnailChange = { data: Uint8Array<ArrayBuffer>; version: string } | null;

export async function prepareThumbnail(file: File): Promise<NonNullable<ThumbnailChange>> {
  const problem = thumbnailFileProblem(file);
  if (problem) throw new InputError(problem, file.size > MAX_THUMBNAIL_BYTES ? 413 : 400);
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 16_000_000,
      failOn: "warning",
    }).timeout({ seconds: 5 });
    const metadata = await image.metadata();
    const mime = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    if (
      !metadata.format ||
      !(metadata.format in mime) ||
      mime[metadata.format as keyof typeof mime] !== file.type ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("unsupported-image");
    // Re-encoding strips EXIF and other source metadata; only raster WebP is retained.
    const output = await image
      .rotate()
      .resize(1200, 600, { fit: "cover", position: "centre" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    return {
      data: new Uint8Array(output),
      version: createHash("sha256").update(output).digest("hex"),
    };
  } catch {
    throw new InputError(
      "Gambar tidak dapat diproses. Gunakan JPG, PNG, atau WebP statis hingga 16 megapiksel.",
    );
  }
}
