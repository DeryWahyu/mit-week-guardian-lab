import { Suspense } from "react";
import { LearningSkeleton } from "@/components/academy/learning-ui";
import { AndroidEmulatorView } from "@/components/sandbox/android-emulator-view";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
export const metadata = {
  title: "Sandbox Android - Guardian Lab",
  description: "Ketersediaan eksekusi Android dan akses bedah APK statis.",
};
export default function Page() {
  return (
    <WorkspaceShell>
      <Suspense fallback={<LearningSkeleton presentation="workspace" />}>
        <AndroidEmulatorView />
      </Suspense>
    </WorkspaceShell>
  );
}
