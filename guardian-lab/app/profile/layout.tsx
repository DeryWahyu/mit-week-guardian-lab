import type { ReactNode } from "react";
import { ProtectedLayout } from "@/components/shared/protected-layout";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
