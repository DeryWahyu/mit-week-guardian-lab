import { ArrowRight, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PROTECTED_ROUTES } from "@/lib/routes";
import folders from "@/public/features/community-folders-search.webp";
import type { CommunityQuery } from "./community-presentation";
import styles from "./community.module.css";

export function CommunityEmpty({
  query,
  totalPages,
}: {
  query: CommunityQuery;
  totalPages: number;
}) {
  const outside = query.page > totalPages;
  const filtered = Boolean(query.q || query.type || query.status);
  const own = query.view === "mine";
  const reset = outside || filtered;
  const href = reset
    ? own
      ? PROTECTED_ROUTES.communityMine
      : PROTECTED_ROUTES.community
    : own
      ? PROTECTED_ROUTES.history
      : PROTECTED_ROUTES.academy;
  return (
    <div className={styles.empty}>
      <div className={styles.emptyArtwork} aria-hidden="true">
        <Image src={folders} alt="" sizes="170px" />
        <svg viewBox="0 0 36 35" fill="none" focusable="false">
          <path
            d="M7 4L4 16M20 8L13 19M30 20L19 25"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3>
        {outside
          ? "Halaman di luar daftar"
          : filtered
            ? "Tidak ada kasus yang cocok"
            : own
              ? "Belum ada pengajuanmu"
              : "Belum ada kasus pada daftar ini"}
      </h3>
      <p>
        {outside
          ? "Buka halaman pertama untuk melihat kasus yang tersedia."
          : filtered
            ? "Ubah pencarian atau filter untuk menemukan kasus lain."
            : own
              ? "Pilih hasil lengkap dari riwayat, lalu tinjau sebelum mengajukannya."
              : "Kasus akan tampil setelah disetujui admin. Sambil menunggu, coba latihan di Academy."}
      </p>
      <Link href={href} className={styles.primaryButton}>
        {!own && !reset && <BookOpen aria-hidden="true" size={22} />}
        {reset ? "Lihat semua kasus" : own ? "Ajukan dari riwayat" : "Belajar di Academy"}
        <ArrowRight aria-hidden="true" size={20} />
      </Link>
    </div>
  );
}
