import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { receiveUrlInvestigation } from "@/lib/investigations/receive-url";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { urlSubmissionSchema } from "@/lib/validations/analysis-input";

export async function POST(request: Request) {
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  try {
    const parsed = urlSubmissionSchema.safeParse(await readInput(request, 128 * 1024, "json"));
    if (!parsed.success)
      throw new InputError(parsed.error.issues[0]?.message ?? "Masukkan tautan yang valid.");
    const record = await receiveUrlInvestigation({
      userId: auth.user.id,
      url: parsed.data.url,
      type: "URL",
    });
    return NextResponse.json(serializeInvestigation(record), {
      status: record.status === "FAILED" ? 422 : 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof InputError
            ? error.message
            : "Investigasi gagal disimpan. Silakan coba kembali.",
      },
      { status: error instanceof InputError ? error.status : 500 },
    );
  }
}
