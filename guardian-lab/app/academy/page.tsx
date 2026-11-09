import { Suspense } from "react";
import { AcademyPageView } from "@/components/academy/academy-page-view";
import { AcademySkeleton } from "@/components/academy/academy-page-state";
import styles from "@/components/academy/academy.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";
export const metadata = {
  title: "Belajar | Guardian Lab",
  description: "Latihan mengenali ancaman digital dan progres belajar akunmu.",
};
async function Content() {
  const user = await requirePageUser();
  return <AcademyPageView scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page, styles.hub)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<AcademySkeleton />}>
        <Content />
      </Suspense>
    </WorkspaceShell>
  );
}
