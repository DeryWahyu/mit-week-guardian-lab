import { redirect } from "next/navigation";
import { AUTH_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";
import { getCurrentUser } from "./session";

export async function requirePageUser(role?: "ADMIN", returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(returnTo ? AUTH_ROUTES.loginWithRedirect(returnTo) : AUTH_ROUTES.login);
  if (role && user.role !== role) redirect(PUBLIC_ROUTES.home);
  return user;
}
