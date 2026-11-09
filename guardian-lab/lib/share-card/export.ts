import { toBlob } from "html-to-image";

/** A fixed 600px canvas at 2x produces the same PNG on mobile and desktop. */
export async function exportShareCard(node: HTMLElement, filename: string): Promise<File> {
  await document.fonts.ready;
  const blob = await toBlob(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    skipFonts: true,
  });
  if (!blob || blob.size === 0) throw new Error("PNG export returned no image");
  return new File([blob], filename, { type: "image/png" });
}
