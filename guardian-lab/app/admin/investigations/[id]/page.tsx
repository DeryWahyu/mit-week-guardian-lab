import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminInvestigationDetailView } from "@/components/admin/admin-investigation-detail";
import { AdminLoading } from "@/components/admin/admin-ui";
import { requirePageUser } from "@/lib/auth/page-access";
import { investigationIdSchema } from "@/lib/validations/investigation";
export const metadata = { title: "Tinjauan Investigasi | Guardian Lab" };
async function Content({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser("ADMIN");
  const parsed = investigationIdSchema.safeParse((await params).id);
  if (!parsed.success) notFound();
  return (
    <AdminInvestigationDetailView
      key={user.id + parsed.data}
      id={parsed.data}
      scope={`${user.id}:${user.role}`}
    />
  );
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content params={params} />
    </Suspense>
  );
}
