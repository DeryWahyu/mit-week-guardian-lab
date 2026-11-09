import type { Metadata } from "next";
import { Suspense } from "react";
import { ActPageView } from "@/components/act/act-page-view";
import { SharePageSkeleton } from "@/components/act/share-page-skeleton";
import styles from "@/components/act/share-workspace.module.css";
import { landingTypography } from "@/components/landing/landing-font";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Bagikan Hasil | Guardian Lab",
  description: "Buat gambar dan pesan untuk keluarga dari hasil investigasi yang tersimpan.",
};

async function ActContent() {
  const user = await requirePageUser();
  return <ActPageView accessScope={`${user.id}:${user.role}`} />;
}

export default function ActPage() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<SharePageSkeleton />}>
        <ActContent />
      </Suspense>
    </WorkspaceShell>
  );
}
