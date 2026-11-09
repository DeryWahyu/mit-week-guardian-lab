import { describe, expect, it } from "bun:test";
import QRCode from "qrcode";
import sharp from "sharp";
import { QR_CODE_FIXTURES } from "../../tests/e2e/fixtures/qr-codes";
import { checkIsUrl, decodeQrImage } from "./qr";

describe("QR Code Decoder Helper", () => {
  it("validates valid http and https URLs", () => {
    expect(checkIsUrl("https://example.com")).toBe(true);
    expect(checkIsUrl("http://klikbca.com")).toBe(true);
    expect(checkIsUrl("WIFI:S:Home;P:Secret;;")).toBe(false);
    expect(checkIsUrl("not a url")).toBe(false);
    expect(checkIsUrl("")).toBe(false);
  });

  it("decodes a real QR image correctly", async () => {
    const sample = QR_CODE_FIXTURES[0];
    const result = await decodeQrImage(Buffer.from(sample.imageBase64, "base64"));
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.is_url).toBe(true);
    expect(result.extracted_text).toBe(sample.encodedPayload);
  });

  it("rejects empty buffer", async () => {
    const result = await decodeQrImage(Buffer.from([]));
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("handles non-QR random image buffer gracefully", async () => {
    const nonQrBuffer = Buffer.from("not-an-image-payload");
    const result = await decodeQrImage(nonQrBuffer);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("reads grayscale, grayscale-alpha, JPEG, and WebP QR images", async () => {
    const source = await QRCode.toBuffer("https://example.test/grayscale");
    const images = await Promise.all([
      sharp(source).greyscale().png().toBuffer(),
      sharp(source).greyscale().ensureAlpha().png().toBuffer(),
      sharp(source).jpeg({ quality: 90 }).toBuffer(),
      sharp(source).webp({ lossless: true }).toBuffer(),
    ]);
    for (const buffer of images) {
      const result = await decodeQrImage(buffer);
      expect(result.success).toBe(true);
      if (result.success) expect(result.extracted_text).toBe("https://example.test/grayscale");
    }
  });

  it("reads transparent QR backgrounds against white", async () => {
    const source = await QRCode.toBuffer("https://example.test/transparent", {
      color: { dark: "#000000ff", light: "#ffffff00" },
    });
    const result = await decodeQrImage(source);
    expect(result.success).toBe(true);
    if (result.success) expect(result.extracted_text).toBe("https://example.test/transparent");
  });

  it("rejects SVG content even when submitted as a supported image MIME", async () => {
    const result = await decodeQrImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
      ),
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errorCode).toBe("QR_UNSUPPORTED_IMAGE");
  });

  it("rejects images beyond the pixel limit without rasterizing", async () => {
    const source = await sharp({
      create: { width: 4100, height: 4100, channels: 3, background: "white" },
    })
      .png()
      .toBuffer();
    const result = await decodeQrImage(source);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errorCode).toBe("QR_IMAGE_TOO_LARGE");
  });
});
