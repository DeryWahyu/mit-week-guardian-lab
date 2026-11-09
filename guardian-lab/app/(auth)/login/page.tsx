import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getPostLoginRedirect } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthCardSkeleton } from "../_components/auth-card-skeleton";
import { LoginForm } from "./_components/login-form";

export const metadata = {
  title: "Masuk | Guardian Lab",
  description: "Masuk untuk melanjutkan pemeriksaan dan aktivitasmu di Guardian Lab.",
};

type Props = { searchParams: Promise<{ redirect?: string | string[] }> };

export default function LoginPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AuthCardSkeleton title="Menyiapkan halaman masuk…" enlarged />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: Props) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams]);
  const requested = typeof query.redirect === "string" ? query.redirect : undefined;
  if (user) redirect(getPostLoginRedirect(user.role, requested));
  return <LoginForm />;
}
