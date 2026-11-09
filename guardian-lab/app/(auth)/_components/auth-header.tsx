import styles from "../auth.module.css";

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={styles.heading}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}
