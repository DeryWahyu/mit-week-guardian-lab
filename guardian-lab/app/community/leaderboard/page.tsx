import { Suspense } from "react";
import { LeaderboardPageSkeleton } from "@/components/community/leaderboard-states";
import { LeaderboardView } from "@/components/community/leaderboard-view";
import styles from "@/components/community/leaderboard.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";
export const metadata = {
  title: "Peringkat Guardian",
  description: "Peringkat belajar berdasarkan EXP akun Guardian.",
};
async function Content() {
  const user = await requirePageUser();
  return <LeaderboardView scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<LeaderboardPageSkeleton />}>
        <Content />
      </Suspense>
    </WorkspaceShell>
  );
}
