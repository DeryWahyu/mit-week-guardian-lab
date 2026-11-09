import { Suspense } from "react";
import { ApkInvestigation } from "@/components/apk/apk-investigation";
import { ApkPageSkeleton } from "@/components/apk/apk-page-skeleton";
import styles from "@/components/apk/apk-workspace.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ investigation?: string | string[]; mode?: string | string[] }>;
};

export const metadata = {
  title: "Bedah APK | Guardian Lab",
  description: "Periksa manifest, izin, dan kode APK secara statis tanpa memasangnya di perangkat.",
};

async function ApkContent({ searchParams }: Props) {
  const query = await searchParams;
  const id = typeof query.investigation === "string" ? query.investigation : undefined;
  const returnTo = id
    ? PROTECTED_ROUTES.apkWithInvestigation(id, query.mode === "geek" ? "geek" : undefined)
    : PROTECTED_ROUTES.apkWithMode(query.mode === "geek" ? "geek" : "human");
  const user = await requirePageUser(undefined, returnTo);
  return (
    <WorkspaceShell
      user={user}
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <ApkInvestigation user={user} />
    </WorkspaceShell>
  );
}

export default function ApkPage(props: Props) {
  return (
    <Suspense
      fallback={
        <WorkspaceShell
          className={cn(landingTypography, styles.page)}
          dialogClassName={landingTypography}
        >
          <ApkPageSkeleton />
        </WorkspaceShell>
      }
    >
      <ApkContent {...props} />
    </Suspense>
  );
}
