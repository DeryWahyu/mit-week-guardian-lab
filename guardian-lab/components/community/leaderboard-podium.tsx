import { Award, Crown, Medal } from "lucide-react";
import { FeatureIcon } from "@/components/shared/feature-icon";
import styles from "./leaderboard.module.css";
import { formatExp, type RankingEntry } from "./leaderboard-presentation";

export function LeaderboardPodium({ items }: { items: RankingEntry[] }) {
  const leaders = items.filter((item) => item.position >= 1 && item.position <= 3);
  if (!leaders.length) return null;
  return (
    <section
      className={styles.highlights}
      aria-labelledby="leaderboard-highlights"
      data-user-reveal
      data-user-order="1"
    >
      <div className={styles.sectionHeading}>
        <div>
          <h2 id="leaderboard-highlights">Langkah yang menginspirasi.</h2>
          <p>Guardian dengan total EXP terbanyak.</p>
        </div>
        <span>
          <Award aria-hidden="true" size={16} />
          Peringkat teratas
        </span>
      </div>
      <ol
        className={styles.podium}
        data-count={leaders.length}
        aria-label="Guardian peringkat teratas"
      >
        {leaders.map((item) => {
          const Icon = item.position === 1 ? Crown : Medal;
          const emblem =
            item.position === 1 ? "crown" : item.position === 2 ? "silverMedal" : "bronzeMedal";
          return (
            <li
              key={item.alias}
              className={styles.podiumCard}
              data-position={item.position}
              data-current={item.isCurrentUser}
            >
              <span className={styles.podiumPosition}>
                <Icon aria-hidden="true" size={16} />
                Peringkat {item.position}
              </span>
              <FeatureIcon name={emblem} className={styles.podiumEmblem} />
              <p className={styles.podiumAlias}>
                {item.alias}
                {item.isCurrentUser && <span className={styles.you}>Kamu</span>}
              </p>
              <p className={styles.podiumRank}>{item.rank}</p>
              <p className={styles.podiumExp}>
                <strong>{formatExp(item.exp)}</strong>
                <span>EXP</span>
              </p>
              <p className={styles.podiumStreak}>
                <FeatureIcon name="streak" size="inline" muted={item.streakDays === 0} />
                {item.streakDays} hari berturut-turut
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
