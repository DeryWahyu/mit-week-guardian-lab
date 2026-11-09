import { authorizeRequest } from "@/lib/auth/access";
import type { UserSession } from "@/lib/auth/session";
import { safeConnection } from "@/lib/security/connection";
import { adminError } from "./http";
export async function adminRoute(request: Request, work: (user: UserSession) => Promise<Response>) {
  try {
    await safeConnection();
    const auth = await authorizeRequest(request, "ADMIN");
    if (auth.error) {
      auth.error.headers.set("Cache-Control", "private, no-store");
      return auth.error;
    }
    return await work(auth.user);
  } catch (error) {
    return adminError(error);
  }
}
