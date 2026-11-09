import { apkStaticSchema } from "@/lib/validations/apk-static";
import type { Investigation } from "@/lib/validations/investigation";

export function getApkStaticReport(record: Pick<Investigation, "type" | "inputMetadata">) {
  if (record.type !== "APK") return null;
  const parsed = apkStaticSchema.safeParse(record.inputMetadata.apkStatic);
  return parsed.success ? parsed.data : null;
}
const PERMISSION_EXPLANATIONS: Record<string, string> = {
  READ_SMS: "Meminta akses membaca pesan SMS yang tersimpan.",
  RECEIVE_SMS: "Meminta akses menerima informasi SMS yang masuk.",
  SEND_SMS: "Meminta akses mengirim SMS.",
  READ_CONTACTS: "Meminta akses membaca kontak.",
  READ_PHONE_STATE: "Meminta akses informasi status telepon sesuai batas versi Android.",
  ACCESS_FINE_LOCATION: "Meminta akses lokasi presisi.",
  RECORD_AUDIO: "Meminta akses merekam suara dari mikrofon.",
  CAMERA: "Meminta akses kamera.",
  INTERNET: "Menyatakan kebutuhan akses jaringan internet.",
  REQUEST_INSTALL_PACKAGES: "Meminta kemampuan mengajukan pemasangan paket aplikasi.",
  SYSTEM_ALERT_WINDOW: "Meminta kemampuan menampilkan jendela di atas aplikasi lain.",
  RECEIVE_BOOT_COMPLETED: "Meminta menerima pemberitahuan ketika perangkat selesai menyala.",
};
export function explainPermission(name: string) {
  return (
    PERMISSION_EXPLANATIONS[name.replace(/^android\.permission\./, "")] ??
    "Izin ini tercantum dalam manifest. Dampaknya perlu ditinjau sesuai fungsi aplikasi."
  );
}
