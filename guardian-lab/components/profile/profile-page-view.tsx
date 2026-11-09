"use client";

import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES } from "@/lib/routes";
import { profileSchema } from "@/lib/validations/profile";
import { ProfileAchievements, ProfileActivity } from "./profile-achievements";
import { ProfileDetails } from "./profile-details";
import { ProfileIdentity } from "./profile-identity";
import { ProfileSecurity } from "./profile-security";
import { ProfileProblem, ProfileSkeleton } from "./profile-states";
import styles from "./profile.module.css";

export function ProfilePageView({ scope }: { scope: string }) {
  const resource = useApiResource(API_ROUTES.profile, profileSchema, { scope });
  if (resource.loading) return <ProfileSkeleton />;
  if (resource.problem) return <ProfileProblem problem={resource.problem} retry={resource.retry} />;
  const profile = resource.data;
  if (!profile) return null;
  return (
    <div className={styles.content}>
      <header className={styles.heading} data-user-reveal>
        <h1>
          Profil <span>Guardian.</span>
        </h1>
        <p>Informasi akun dan langkah belajarmu, dalam satu ruang.</p>
      </header>
      <ProfileIdentity profile={profile} />
      <div className={styles.columns}>
        <ProfileDetails key={profile.id} profile={profile} reload={resource.retry} />
        <aside className={styles.stack} aria-label="Pencapaian dan keamanan akun">
          <ProfileAchievements profile={profile} />
          <ProfileSecurity />
        </aside>
      </div>
      <ProfileActivity profile={profile} />
    </div>
  );
}
