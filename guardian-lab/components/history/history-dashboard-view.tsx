"use client";

import { HistoryHero } from "./history-hero";
import { HistoryListPanel } from "./history-list-panel";
import { HistoryStatistics } from "./history-statistics";
import { useHistory } from "./use-history";
import styles from "./history-workspace.module.css";

export function HistoryDashboardView({ accessScope }: { accessScope?: string }) {
  const history = useHistory(accessScope);
  return (
    <div className={styles.content}>
      <HistoryHero />
      <HistoryStatistics
        summary={history.loading ? null : (history.data?.summary ?? null)}
        loading={history.loading}
      />
      <HistoryListPanel history={history} />
    </div>
  );
}
