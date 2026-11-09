import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/auth/access";
import { serializeInvestigation } from "@/lib/investigations/serialize";
import { prisma } from "@/lib/prisma";
import { investigationIdSchema } from "@/lib/validations/investigation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeRequest(request);
  if (auth.error) return auth.error;
  const parsed = investigationIdSchema.safeParse((await params).id);
  if (!parsed.success)
    return NextResponse.json({ error: "ID investigasi tidak valid." }, { status: 400 });
  try {
    const record = await prisma.forensicRecord.findUnique({ where: { id: parsed.data } });
    if (!record)
      return NextResponse.json({ error: "Rekaman investigasi tidak ditemukan." }, { status: 404 });
    if (auth.user.role !== "ADMIN" && record.userId !== auth.user.id)
      return NextResponse.json(
        { error: "Anda tidak memiliki akses ke investigasi ini." },
        { status: 403 },
      );
    return NextResponse.json(serializeInvestigation(record), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Detail investigasi gagal dimuat." }, { status: 500 });
  }
}
