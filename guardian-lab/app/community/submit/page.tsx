import { Suspense } from "react";
import { CommunitySubmissionView } from "@/components/community/community-submission-view";
import { ResultSkeleton } from "@/components/landing/results/result-skeleton";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";

export const metadata = {
  title: "Ajukan Kasus | Guardian Lab",
  description: "Tinjau dan ajukan snapshot investigasi untuk moderasi komunitas.",
};
async function SubmissionContent() {
  const user = await requirePageUser();
  return <CommunitySubmissionView scope={`${user.id}:${user.role}`} />;
}
export default function SubmissionPage() {
  return (
    <WorkspaceShell>
      <Suspense fallback={<ResultSkeleton />}>
        <SubmissionContent />
      </Suspense>
    </WorkspaceShell>
  );
}
