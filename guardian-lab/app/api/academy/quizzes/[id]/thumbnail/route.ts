import { z } from "zod";
import { academyError } from "@/lib/academy/http";
import { authorizeRequest } from "@/lib/auth/access";
import { InputError } from "@/lib/investigations/request-input";
import { prisma } from "@/lib/prisma";
import { safeConnection } from "@/lib/security/connection";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await safeConnection();
    const auth = await authorizeRequest(request);
    if (auth.error) {
      auth.error.headers.set("Cache-Control", "private, no-store");
      return auth.error;
    }
    const { id } = z
      .object({
        id: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[\w-]+$/),
      })
      .parse(await params);
    const image = await prisma.quizThumbnail.findFirst({
      where: { quizId: id, ...(auth.user.role === "ADMIN" ? {} : { quiz: { published: true } }) },
      select: { data: true },
    });
    if (!image) throw new InputError("Thumbnail tidak ditemukan.", 404);
    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": "image/webp",
        "Content-Length": String(image.data.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    const response = academyError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
