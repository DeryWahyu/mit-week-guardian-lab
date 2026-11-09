import { cn } from "@/lib/utils";
import styles from "./gateway.module.css";

export function GatewayAccountNotice({ id, className }: { id: string; className?: string }) {
  return (
    <p id={id} className={cn(styles.accountHelp, className)}>
      <strong>Perlu akun terverifikasi.</strong> Masuk untuk memeriksa dan menyimpan riwayat.
      WhatsApp digunakan untuk verifikasi akun dan pemulihan akses.
    </p>
  );
}
