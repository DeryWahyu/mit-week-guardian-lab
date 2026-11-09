import Link from "next/link";
import { WorkspaceStage } from "@/components/workspace/workspace-stage";
import workspace from "@/components/workspace/workspace.module.css";
import { PROTECTED_ROUTES } from "@/lib/routes";
export function AndroidEmulatorView() {
  return (
    <WorkspaceStage
      title="Kenali aplikasinya lebih dulu."
      description="Sandbox Android belum tersedia. Kamu tetap dapat membaca identitas, izin, dan jejak kode aplikasi melalui pemeriksaan APK statis."
      pose="apk"
      tone="lavender"
    >
      <p className={workspace.notice}>
        Pemeriksaan statis membaca berkas tanpa memasang atau menjalankan aplikasi.
      </p>
      <Link href={PROTECTED_ROUTES.apk} className={`${workspace.primary} mt-4`}>
        Buka bedah APK statis
      </Link>
    </WorkspaceStage>
  );
}
