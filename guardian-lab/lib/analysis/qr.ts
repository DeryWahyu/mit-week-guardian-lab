import jsQR from "jsqr";
import sharp from "sharp";

export function checkIsUrl(input: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(input.trim()).protocol);
  } catch {
    return false;
  }
}

/** Read actual pixels in RGB, respecting orientation and transparency. */
export async function decodeQrImage(buffer: Buffer) {
  try {
    const image = sharp(buffer, { limitInputPixels: 16_000_000 });
    const metadata = await image.metadata();
    if (!["png", "jpeg", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) {
      return {
        success: false as const,
        errorCode: "QR_UNSUPPORTED_IMAGE",
        error: "Gunakan gambar PNG, JPG, atau WebP yang tidak bergerak.",
      };
    }
    if ((metadata.width ?? 0) * (metadata.height ?? 0) > 16_000_000) {
      return {
        success: false as const,
        errorCode: "QR_IMAGE_TOO_LARGE",
        error: "Resolusi gambar maksimal 16 juta piksel. Perkecil gambar lalu unggah kembali.",
      };
    }
    const { data, info } = await image
      .rotate()
      .toColourspace("srgb")
      .flatten({ background: "#ffffff" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const qr = jsQR(
      new Uint8ClampedArray(data.buffer, data.byteOffset, data.length),
      info.width,
      info.height,
    );
    if (!qr?.data)
      return {
        success: false as const,
        errorCode: "QR_DECODE_FAILED",
        error: "Kode QR tidak ditemukan. Gunakan gambar yang jelas dan utuh.",
      };
    const text = qr.data.trim();
    return {
      success: true as const,
      extracted_text: text,
      is_url: checkIsUrl(text),
      imageFormat: metadata.format,
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("pixel limit")) {
      return {
        success: false as const,
        errorCode: "QR_IMAGE_TOO_LARGE",
        error: "Resolusi gambar maksimal 16 juta piksel. Perkecil gambar lalu unggah kembali.",
      };
    }
    return {
      success: false as const,
      errorCode: "QR_DECODE_FAILED",
      error: "Gambar tidak dapat dibaca. Pilih ulang gambar PNG, JPG, atau WebP.",
    };
  }
}
