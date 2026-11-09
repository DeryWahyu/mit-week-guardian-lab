import { z } from "zod";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { quizInputSchema } from "@/lib/validations/academy";
import { prepareThumbnail, type ThumbnailChange } from "./thumbnail";
import { MAX_THUMBNAIL_BYTES } from "./thumbnail-config";

const writeSchema = quizInputSchema.extend({
  revision: z.iso.datetime().optional(),
  removeThumbnail: z.boolean().optional(),
});
const MAX_QUIZ_BYTES = 200000;

export async function readQuizInput(request: Request, editing = false) {
  let value: unknown;
  let file: File | undefined;
  const multipart = request.headers.get("content-type")?.startsWith("multipart/form-data");
  if (multipart) {
    const form = await readInput(request, MAX_THUMBNAIL_BYTES + MAX_QUIZ_BYTES + 65536, "form");
    if (
      form.getAll("data").length !== 1 ||
      form.getAll("thumbnail").length > 1 ||
      [...form.keys()].some((key) => key !== "data" && key !== "thumbnail")
    )
      throw new InputError("Kirim satu data kuis dan maksimal satu thumbnail.");
    const data = form.get("data");
    if (typeof data !== "string" || Buffer.byteLength(data) > MAX_QUIZ_BYTES)
      throw new InputError("Data kuis tidak valid atau terlalu besar.");
    try {
      value = JSON.parse(data);
    } catch {
      throw new InputError("Data kuis tidak dapat dibaca.");
    }
    const image = form.get("thumbnail");
    if (image !== null && !(image instanceof File))
      throw new InputError("Thumbnail harus berupa berkas gambar.");
    file = image ?? undefined;
  } else value = await readInput(request, MAX_QUIZ_BYTES, "json");
  const { revision, removeThumbnail, ...input } = writeSchema.parse(value);
  if (editing && !revision) throw new InputError("Revisi kuis diperlukan. Muat ulang editor.");
  if (file && removeThumbnail)
    throw new InputError("Pilih ganti thumbnail atau hapus thumbnail, bukan keduanya.");
  const thumbnail: ThumbnailChange | undefined = file
    ? await prepareThumbnail(file)
    : removeThumbnail
      ? null
      : undefined;
  return { input, revision, thumbnail };
}
