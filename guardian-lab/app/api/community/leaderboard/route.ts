import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { getRanking } from "@/lib/community/ranking";
import { safeConnection } from "@/lib/security/connection";
import { rankingPageSchema } from "@/lib/validations/platform";
export async function GET(request: Request) {
  await safeConnection();
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  const page = rankingPageSchema.safeParse(
    new URL(request.url).searchParams.get("page") ?? undefined,
  );
  if (!page.success)
    return NextResponse.json({ error: "Halaman peringkat tidak valid." }, { status: 400 });
  try {
    return NextResponse.json(await getRanking(page.data, auth.user.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Peringkat belum dapat dimuat." }, { status: 503 });
  }
}
