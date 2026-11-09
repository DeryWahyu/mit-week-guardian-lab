import { Suspense } from "react";
import { LearningSkeleton } from "@/components/academy/learning-ui";
import { QuizCmsView } from "@/components/admin/quiz-cms-view";
import { requirePageUser } from "@/lib/auth/page-access";
export const metadata = {
  title: "Bank Soal - Guardian Lab",
  description: "Kelola materi Guardian Academy.",
};
async function Content() {
  const user = await requirePageUser("ADMIN");
  return <QuizCmsView key={user.id + user.role} scope={`${user.id}:${user.role}`} />;
}
export default function Page() {
  return (
    <Suspense fallback={<LearningSkeleton />}>
      <Content />
    </Suspense>
  );
}
