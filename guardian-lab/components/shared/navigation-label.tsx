"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import styles from "./landing-chrome.module.css";

export function NavigationLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span
      className={styles.navigationLabel}
      data-pending={pending || undefined}
      aria-busy={pending}
    >
      {children}
    </span>
  );
}
