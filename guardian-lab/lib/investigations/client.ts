import type { z } from "zod";

export type LoadProblem = {
  kind: "unauthenticated" | "forbidden" | "not_found" | "invalid" | "server" | "network";
  message: string;
  retryable: boolean;
};
export class ResourceError extends Error {
  constructor(public problem: LoadProblem) {
    super(problem.message);
  }
}
export async function readResource<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  if (!response.ok) {
    const problem: LoadProblem =
      response.status === 401
        ? {
            kind: "unauthenticated",
            message: "Masuk kembali untuk membuka rekaman investigasi Anda.",
            retryable: false,
          }
        : response.status === 403
          ? {
              kind: "forbidden",
              message: "Anda tidak memiliki akses ke investigasi ini.",
              retryable: false,
            }
          : response.status === 404
            ? {
                kind: "not_found",
                message: "Rekaman investigasi tidak ditemukan.",
                retryable: false,
              }
            : response.status === 400
              ? {
                  kind: "invalid",
                  message: "ID atau filter investigasi tidak valid.",
                  retryable: false,
                }
              : {
                  kind: "server",
                  message: "Data gagal dimuat dari server. Silakan coba kembali.",
                  retryable: true,
                };
    throw new ResourceError(problem);
  }
  try {
    return schema.parse(await response.json());
  } catch {
    throw new ResourceError({
      kind: "invalid",
      message: "Data investigasi tidak sesuai format yang diharapkan.",
      retryable: true,
    });
  }
}
export function getLoadProblem(error: unknown): LoadProblem {
  return error instanceof ResourceError
    ? error.problem
    : {
        kind: "network",
        message: "Koneksi terputus atau terlalu lama. Data belum dapat diperbarui.",
        retryable: true,
      };
}
