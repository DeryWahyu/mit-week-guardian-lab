import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { STANDARD_USER_FIXTURE } from "../e2e/fixtures/user-fixtures";

let standardSession: string | undefined;

/** A real database session for feature tests; pass an explicit empty cookie map to test guests. */
export async function getStandardSessionCookies(): Promise<Record<string, string>> {
  if (!standardSession) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: STANDARD_USER_FIXTURE.id } });
    standardSession = await createSessionToken(user);
  }
  return { [SESSION_COOKIE_NAME]: standardSession };
}
