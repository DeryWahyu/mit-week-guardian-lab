import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getPostLoginRedirect } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthCardSkeleton } from "../_components/auth-card-skeleton";
import { RegisterForm } from "./_components/register-form";

export const metadata = {
  title: "Daftar Akun | Guardian Lab",
  description:
    "Buat akun Guardian Lab untuk memeriksa ancaman digital dan menyimpan riwayat pemeriksaan.",
};

type Props = { searchParams: Promise<{ redirect?: string | string[] }> };

export default function RegisterPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<AuthCardSkeleton title="Menyiapkan pendaftaran…" fields={5} enlarged />}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterContent({ searchParams }: Props) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams]);
  const requested = typeof query.redirect === "string" ? query.redirect : undefined;
  if (user) redirect(getPostLoginRedirect(user.role, requested));
  return <RegisterForm />;
}
