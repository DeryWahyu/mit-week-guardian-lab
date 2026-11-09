import type { ReactNode } from "react";
import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import styles from "./info.module.css";

export default function PublicInfoLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Header variant="information" />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
