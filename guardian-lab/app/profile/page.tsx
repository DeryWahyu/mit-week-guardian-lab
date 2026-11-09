import { Suspense } from "react";
import { landingTypography } from "@/components/landing/landing-font";
import { ProfilePageView } from "@/components/profile/profile-page-view";
import { ProfileSkeleton } from "@/components/profile/profile-states";
import styles from "@/components/profile/profile.module.css";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { requirePageUser } from "@/lib/auth/page-access";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Profil | Guardian Lab",
  description: "Informasi akun, perjalanan belajar dan pencapaian Guardian-mu.",
};
async function Content() {
  const user = await requirePageUser(undefined, PROTECTED_ROUTES.profile);
  return <ProfilePageView key={user.id} scope={`${user.id}:${user.role}`} />;
}
export default function ProfilePage() {
  return (
    <WorkspaceShell
      className={cn(landingTypography, styles.page)}
      dialogClassName={landingTypography}
    >
      <Suspense fallback={<ProfileSkeleton />}>
        <Content />
      </Suspense>
    </WorkspaceShell>
  );
}
