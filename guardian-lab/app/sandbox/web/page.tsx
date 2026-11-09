import { Suspense } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { SandboxSkeleton } from "@/components/sandbox/sandbox-page-state";
import { WebSandboxView } from "@/components/sandbox/web-sandbox-view";
import styles from "@/components/sandbox/web-sandbox.module.css";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";
export const metadata = {
  title: "Ruang Uji | Guardian Lab",
  description: "Buka tautan publik di browser server terisolasi dengan batas sesi 180 detik.",
};
async function Content() {
  const user = await requirePageUser();
  return <WebSandboxView scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<SandboxSkeleton />}>
        <Content />
      </Suspense>
    </WorkspaceShell>
  );
}
