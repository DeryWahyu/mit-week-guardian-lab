import { ArrowUpRight, FileSearch, KeyRound } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./profile.module.css";

export function ProfileSecurity() {
  return (
    <section
      className={styles.security}
      aria-labelledby="profile-security-title"
      data-user-reveal
      data-user-order="1"
    >
      <FeatureIcon name="security" className={styles.securityIcon} />
      <h2 id="profile-security-title">Akunmu, tetap terjaga.</h2>
      <p>Gunakan password unik dan jaga kerahasiaan kode OTP. WhatsApp membantu pemulihan akses.</p>
      <Link
        href={AUTH_ROUTES.forgotPasswordWithRedirect(PROTECTED_ROUTES.profile)}
        className={styles.securityLink}
      >
        <KeyRound size={23} aria-hidden="true" />
        Pulihkan password
        <ArrowUpRight size={20} aria-hidden="true" />
      </Link>
      <Link href={PROTECTED_ROUTES.history} className={styles.securityLink}>
        <FileSearch size={23} aria-hidden="true" />
        Buka riwayat pemeriksaan
        <ArrowUpRight size={20} aria-hidden="true" />
      </Link>
    </section>
  );
}
