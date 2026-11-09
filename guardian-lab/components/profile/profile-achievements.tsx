import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { PROTECTED_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/validations/profile";
import styles from "./profile.module.css";
import { profileDate } from "./profile-presentation";

export function ProfileAchievements({ profile }: { profile: Profile }) {
  const badges = profile.progress.badges;
  return (
    <section
      className={cn(styles.panel, styles.achievements)}
      aria-labelledby="profile-badges-title"
      data-user-reveal
    >
      <div className={styles.panelHeading}>
        <FeatureIcon name="badge" className={styles.icon} />
        <div>
          <h2 id="profile-badges-title">Koleksi lencana</h2>
        </div>
        <span className={styles.count}>{badges.length}</span>
      </div>
      {badges.length ? (
        <ul className={styles.badgeList}>
          {badges.slice(0, 4).map((badge) => (
            <li key={badge.id}>
              <FeatureIcon name="badge" className={styles.badgeIcon} />
              <div>
                <h3>{badge.title}</h3>
                <p>{badge.description}</p>
                <time dateTime={badge.awardedAt}>{profileDate(badge.awardedAt)}</time>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <FeatureIcon name="badge" size="large" muted />
          <h3>Lencana pertamamu menanti.</h3>
          <p>Lulus latihan untuk mulai mengumpulkannya.</p>
        </div>
      )}
      <Link href={PROTECTED_ROUTES.academy} className={styles.textLink}>
        {badges.length > 4 ? "Lihat semua di Belajar" : "Jelajahi latihan"}
        <ArrowRight size={20} aria-hidden="true" />
      </Link>
    </section>
  );
}

export function ProfileActivity({ profile }: { profile: Profile }) {
  const attempts = profile.progress.recentAttempts.slice(0, 5);
  return (
    <section className={styles.panel} aria-labelledby="profile-activity-title" data-user-reveal>
      <div className={styles.panelHeading}>
        <FeatureIcon name="casebook" className={styles.icon} />
        <div>
          <h2 id="profile-activity-title">Jejak belajar terbaru</h2>
          <p>Latihan dan kasus yang pernah kamu kerjakan.</p>
        </div>
        <Link href={PROTECTED_ROUTES.academy} className={styles.textLink}>
          Ke Belajar
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </div>
      {attempts.length ? (
        <ul className={styles.activityList}>
          {attempts.map((attempt) => (
            <li key={attempt.id}>
              <div>
                <h3>{attempt.title}</h3>
                <time dateTime={attempt.completedAt}>{profileDate(attempt.completedAt)}</time>
              </div>
              <div className={styles.activityScore}>
                <span>
                  <span className="sr-only">Nilai {attempt.score} dari 100</span>
                  <span aria-hidden="true">{attempt.score}/100</span>
                </span>
                <strong>{attempt.expEarned.toLocaleString("id-ID")} EXP</strong>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <FeatureIcon name="casebook" size="large" muted />
          <h3>Setiap langkah punya cerita.</h3>
          <p>Mulai satu latihan. Jejak belajarmu akan tersimpan di sini.</p>
          <Link href={PROTECTED_ROUTES.academy} className={styles.textLink}>
            Mulai belajar
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
