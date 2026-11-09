import { Suspense } from "react";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { getSafeRedirectUrl } from "@/lib/validations/auth";
import { AuthCardSkeleton } from "../_components/auth-card-skeleton";
import { ForgotForm } from "./_components/forgot-form";

type Props = { searchParams: Promise<{ redirect?: string | string[] }> };
export const metadata = {
  title: "Lupa password | Guardian Lab",
  description: "Pulihkan akses akun melalui WhatsApp.",
};
async function RecoveryContent({ searchParams }: Props) {
  const query = await searchParams;
  return (
    <ForgotForm
      redirectTarget={getSafeRedirectUrl(
        typeof query.redirect === "string" ? query.redirect : undefined,
        PUBLIC_ROUTES.home,
      )}
    />
  );
}
export default function ForgotPasswordPage(props: Props) {
  return (
    <Suspense fallback={<AuthCardSkeleton title="Menyiapkan pemulihan akses…" fields={1} />}>
      <RecoveryContent {...props} />
    </Suspense>
  );
}
