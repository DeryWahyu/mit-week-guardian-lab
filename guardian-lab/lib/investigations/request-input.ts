export class InputError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/** Count streamed bytes as well as Content-Length before native JSON/multipart parsing. */
export async function readInput(request: Request, limit: number, kind: "json"): Promise<unknown>;
export async function readInput(request: Request, limit: number, kind: "form"): Promise<FormData>;
export async function readInput(request: Request, limit: number, kind: "json" | "form") {
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== (kind === "json" ? "application/json" : "multipart/form-data")) {
    throw new InputError("Format pengiriman tidak didukung.", 415);
  }
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length))))
    throw new InputError("Ukuran permintaan tidak valid.");
  if (length && Number(length) > limit)
    throw new InputError("Ukuran permintaan melebihi batas yang diizinkan.", 413);
  if (!request.body) throw new InputError("Input tidak boleh kosong.");
  let bytes = 0;
  let tooLarge = false;
  const body = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        if (bytes > limit) {
          tooLarge = true;
          throw new InputError("Ukuran permintaan melebihi batas yang diizinkan.", 413);
        }
        controller.enqueue(chunk);
      },
    }),
  );
  try {
    const response = new Response(body, {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    });
    return await (kind === "json" ? response.json() : response.formData());
  } catch {
    throw new InputError(
      tooLarge
        ? "Ukuran permintaan melebihi batas yang diizinkan."
        : "Input tidak dapat dibaca. Pilih ulang berkas atau periksa isian.",
      tooLarge ? 413 : 400,
    );
  }
}
