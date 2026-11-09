import { FeatureIcon } from "@/components/shared/feature-icon";
import styles from "./leaderboard.module.css";
import { formatExp, type RankingEntry } from "./leaderboard-presentation";

export function RankingList({ items }: { items: RankingEntry[] }) {
  return (
    <ol
      className={styles.rankingList}
      start={items[0]?.position ?? 1}
      aria-label="Daftar peringkat Guardian"
    >
      {items.map((item) => (
        <li key={item.alias} className={styles.rankingRow} data-current={item.isCurrentUser}>
          <span className={styles.position} data-position={item.position}>
            <span className="sr-only">Peringkat </span>
            {item.position}
          </span>
          <div className={styles.identity}>
            <FeatureIcon name="security" className={styles.avatar} />
            <div>
              <p className={styles.alias}>
                {item.alias}
                {item.isCurrentUser && <span className={styles.you}>Kamu</span>}
              </p>
              <p className={styles.meta}>
                <span>{item.rank}</span>
                <span aria-hidden="true">&middot;</span>
                <span>
                  <FeatureIcon name="streak" size="inline" muted={item.streakDays === 0} />
                  {item.streakDays} hari berturut-turut
                </span>
              </p>
            </div>
          </div>
          <p className={styles.exp}>
            <strong>{formatExp(item.exp)}</strong>
            <span>EXP</span>
          </p>
        </li>
      ))}
    </ol>
  );
}
