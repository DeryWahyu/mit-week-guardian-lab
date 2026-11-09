import styles from "./admin.module.css";
import { AdminLoading } from "./admin-ui";
export function DashboardSkeleton() {
  return (
    <div className={styles.content}>
      <AdminLoading />
      <div className={styles.twoColumns}>
        <AdminLoading />
        <AdminLoading />
      </div>
    </div>
  );
}
