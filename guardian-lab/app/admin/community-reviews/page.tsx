import { Suspense } from "react";
import { CommunityReviewsView } from "@/components/admin/community-reviews-view";
import { ResultSkeleton } from "@/components/landing/results/result-skeleton";
import { requirePageUser } from "@/lib/auth/page-access";

export const metadata = {
  title: "Moderasi Kasus | Guardian Lab",
  description: "Tinjau temuan komunitas sebelum diterbitkan.",
};
async function ReviewsContent() {
  const user = await requirePageUser("ADMIN");
  return <CommunityReviewsView scope={`${user.id}:${user.role}`} />;
}
export default function AdminCommunityReviewsPage() {
  return (
    <Suspense fallback={<ResultSkeleton />}>
      <ReviewsContent />
    </Suspense>
  );
}
