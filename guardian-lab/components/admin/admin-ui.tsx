import { ArrowLeft, ArrowRight, Inbox, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LoadProblem } from "@/lib/investigations/client";
import { AUTH_ROUTES } from "@/lib/routes";
import styles from "./admin.module.css";
export function AdminHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHeading}>
      <div>
        <p className={styles.eyebrow}>Ruang administrator</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className={styles.headingActions}>{actions}</div>}
    </header>
  );
}
export function AdminRefresh({ retry, pending }: { retry: () => void; pending: boolean }) {
  return (
    <button type="button" className={styles.secondary} onClick={retry} disabled={pending}>
      <RefreshCw size={16} aria-hidden="true" />
      {pending ? "Memperbarui..." : "Perbarui"}
    </button>
  );
}
export function AdminLoading() {
  return (
    <output className={styles.loading} aria-label="Memuat data admin" aria-busy="true">
      {[0, 1, 2].map((n) => (
        <span key={n} aria-hidden="true" />
      ))}
    </output>
  );
}
export function AdminProblem({
  problem,
  retry,
  reset,
}: {
  problem: LoadProblem;
  retry: () => void;
  reset?: string;
}) {
  const access = problem.kind === "unauthenticated" || problem.kind === "forbidden";
  return (
    <div role="alert" className={styles.problem}>
      <h2>
        {access
          ? "Sesi atau akses admin sudah berubah."
          : problem.kind === "invalid"
            ? "Data atau filter belum valid."
            : "Data belum dapat dimuat."}
      </h2>
      <p>
        {access
          ? "Masuk kembali dengan akun administrator."
          : problem.kind === "invalid"
            ? "Periksa pilihan filter, rentang tanggal atau nomor halaman."
            : "Koneksi atau layanan sedang bermasalah. Coba kembali beberapa saat lagi."}
      </p>
      <div>
        {problem.retryable && (
          <button type="button" className={styles.primary} onClick={retry}>
            Coba lagi
          </button>
        )}
        {access ? (
          <Link className={styles.secondary} href={AUTH_ROUTES.login}>
            Masuk kembali
          </Link>
        ) : (
          reset && (
            <Link className={styles.secondary} href={reset}>
              Hapus filter
            </Link>
          )
        )}
      </div>
    </div>
  );
}
export function AdminEmpty({
  title = "Belum ada data.",
  description = "Data yang sesuai akan tampil di sini.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className={styles.empty}>
      <Inbox aria-hidden="true" size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}
export function AdminPager({
  pagination,
  change,
}: {
  pagination: { page: number; totalPages: number; total: number };
  change: (key: string, value: string) => void;
}) {
  return (
    <nav aria-label="Halaman daftar admin" className={styles.pagination}>
      <span>
        Halaman {pagination.page} dari {pagination.totalPages} ·{" "}
        {pagination.total.toLocaleString("id-ID")} data
      </span>
      <div>
        <button
          type="button"
          className={styles.secondary}
          disabled={pagination.page <= 1}
          onClick={() => change("page", String(pagination.page - 1))}
        >
          <ArrowLeft aria-hidden="true" size={15} />
          Sebelumnya
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => change("page", String(pagination.page + 1))}
        >
          Berikutnya
          <ArrowRight aria-hidden="true" size={15} />
        </button>
      </div>
    </nav>
  );
}
export function adminDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
export function AdminMetrics({
  items,
}: {
  items: Array<{ label: string; value: number | string; hint?: string }>;
}) {
  return (
    <dl className={styles.metrics}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>
            {typeof item.value === "number" ? item.value.toLocaleString("id-ID") : item.value}
          </dd>
          {item.hint && <p>{item.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
