export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
export const THUMBNAIL_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const THUMBNAIL_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export function thumbnailFileProblem(file: Pick<File, "size" | "type">): string | null {
  if (!THUMBNAIL_TYPES.some((type) => type === file.type))
    return "Pilih gambar JPG, PNG, atau WebP.";
  if (file.size === 0) return "Gambar kosong. Pilih berkas lain.";
  if (file.size > MAX_THUMBNAIL_BYTES) return "Ukuran thumbnail maksimal 5 MB.";
  return null;
}
