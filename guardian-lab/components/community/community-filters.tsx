import { RefreshCw, Search } from "lucide-react";
import type { CommunityListState } from "./community-presentation";
import styles from "./community.module.css";

export function CommunityFilters({ list }: { list: CommunityListState }) {
  const query = list.query;
  if (!query) return null;
  const own = query.view === "mine";
  return (
    <div className={styles.filters} data-with-status={own}>
      <label className={styles.searchField}>
        <span>Cari kasus</span>
        <div className={styles.searchControl}>
          <Search aria-hidden="true" size={19} />
          <input
            type="search"
            placeholder="Cari judul atau ringkasan..."
            aria-label="Cari kasus"
            maxLength={150}
            value={query.q}
            onChange={(event) => list.change("q", event.target.value)}
          />
        </div>
      </label>
      <label>
        <span>Tampilan</span>
        <select
          aria-label="Tampilan komunitas"
          value={query.view}
          onChange={(event) => list.change("view", event.target.value)}
        >
          <option value="published">Kasus disetujui</option>
          <option value="mine">Pengajuan saya</option>
        </select>
      </label>
      {own && (
        <label>
          <span>Status</span>
          <select
            aria-label="Status pengajuan"
            value={query.status ?? ""}
            onChange={(event) => list.change("status", event.target.value)}
          >
            <option value="">Semua status</option>
            <option value="PENDING_REVIEW">Menunggu tinjauan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </label>
      )}
      <label>
        <span>Jenis</span>
        <select
          aria-label="Jenis investigasi"
          value={query.type ?? ""}
          onChange={(event) => list.change("type", event.target.value)}
        >
          <option value="">Semua jenis</option>
          {["URL", "QR", "APK"].map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={list.retry}
        disabled={list.refreshing || list.loading}
        className={styles.secondaryButton}
      >
        <RefreshCw aria-hidden="true" size={18} />
        {list.refreshing ? "Memperbarui..." : "Perbarui daftar"}
      </button>
    </div>
  );
}
