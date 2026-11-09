import { redirect } from "next/navigation";
import { Suspense } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { LandingPageView } from "@/components/landing/landing-page-view";
import { getCurrentUser } from "@/lib/auth/session";
import { PROTECTED_ROUTES } from "@/lib/routes";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function LandingContent({ searchParams }: Props) {
  const query = await searchParams;
  if (query.tab === "apk") {
    const id = typeof query.investigation === "string" ? query.investigation : undefined;
    redirect(
      id
        ? PROTECTED_ROUTES.apkWithInvestigation(id, query.mode === "geek" ? "geek" : undefined)
        : PROTECTED_ROUTES.apkWithMode(query.mode === "geek" ? "geek" : "human"),
    );
  }
  const user = await getCurrentUser();
  return <LandingPageView initialUser={user} />;
}

export default function HomePage({ searchParams }: Props) {
  return (
    <div className={landingTypography}>
      <Suspense fallback={<LandingPageView initialUser={null} />}>
        <LandingContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
