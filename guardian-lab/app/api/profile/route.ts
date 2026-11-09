import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { authorizeRequest } from "@/lib/auth/access";
import { InputError, readInput } from "@/lib/investigations/request-input";
import { getProfile, updateProfile } from "@/lib/profile/service";
import { safeConnection } from "@/lib/security/connection";
import { profileUpdateSchema } from "@/lib/validations/profile";

const headers = { "Cache-Control": "private, no-store" };
function errorResponse(error: unknown, input = false) {
  if (error && typeof error === "object" && "digest" in error) throw error;
  if (error instanceof InputError)
    return NextResponse.json({ error: error.message }, { status: error.status, headers });
  if (input && error instanceof ZodError)
    return NextResponse.json(
      { error: "Isian profil belum valid. Nama harus 2–50 karakter." },
      { status: 400, headers },
    );
  return NextResponse.json(
    { error: "Profil belum dapat diproses. Silakan coba kembali." },
    { status: 503, headers },
  );
}
export async function GET(request: Request) {
  try {
    await safeConnection();
    const auth = await authorizeRequest(request);
    if (auth.error) {
      auth.error.headers.set("Cache-Control", "private, no-store");
      return auth.error;
    }
    return NextResponse.json(await getProfile(auth.user.id), { headers });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PATCH(request: Request) {
  try {
    await safeConnection();
    const auth = await authorizeRequest(request);
    if (auth.error) {
      auth.error.headers.set("Cache-Control", "private, no-store");
      return auth.error;
    }
    const input = profileUpdateSchema.parse(await readInput(request, 4096, "json"));
    return NextResponse.json(await updateProfile(auth.user.id, input), { headers });
  } catch (error) {
    return errorResponse(error, true);
  }
}
