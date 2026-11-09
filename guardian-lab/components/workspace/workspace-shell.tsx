import { Bricolage_Grotesque } from "next/font/google";
import { type ReactNode, ViewTransition } from "react";
import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";
import type { UserSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import styles from "./workspace.module.css";
import { WorkspaceMotion } from "./workspace-motion";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-workspace-display",
  display: "swap",
});

export function WorkspaceShell({
  children,
  user,
  reading = false,
  className,
  dialogClassName,
}: {
  children: ReactNode;
  user?: UserSession;
  reading?: boolean;
  className?: string;
  dialogClassName?: string;
}) {
  return (
    <div className={cn(display.variable, styles.shell, className)}>
      <Header initialUser={user} dialogClassName={dialogClassName} />
      <ViewTransition default="none" enter="guardian-user-page" exit="guardian-user-page">
        <WorkspaceMotion className={cn(styles.main, reading && styles.reading)}>
          {children}
        </WorkspaceMotion>
      </ViewTransition>
      <Footer />
    </div>
  );
}
