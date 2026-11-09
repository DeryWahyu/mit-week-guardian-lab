import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PUBLIC_ROUTES } from "@/lib/routes";
import styles from "../info.module.css";

type Props = {
  title: string;
  summary: string;
  children: ReactNode;
};

export function InfoPage({ title, summary, children }: Props) {
  return (
    <article className={styles.article}>
      <Link href={PUBLIC_ROUTES.home} className={styles.backLink}>
        <ArrowLeft aria-hidden="true" />
        Kembali ke Beranda
      </Link>
      <header className={styles.articleHeader}>
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>
      <div className={styles.content}>{children}</div>
    </article>
  );
}
