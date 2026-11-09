import type { AdminReport } from "@/lib/validations/admin";
import styles from "./admin.module.css";
export function AdminChart({ data }: { data: AdminReport }) {
  const max = Math.max(1, ...data.daily.map((day) => day.investigations));
  const width = 760,
    height = 170,
    step = width / Math.max(1, data.daily.length);
  return (
    <figure className={styles.chart}>
      <figcaption>
        <strong>Aktivitas pemeriksaan</strong>
        <span>
          {data.from} sampai {data.to} (WIB)
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Jumlah pemeriksaan harian pada periode terpilih"
      >
        <line x1="0" y1="160" x2="760" y2="160" stroke="#dce5ee" />
        {data.daily.map((day, i) => (
          <rect
            key={day.date}
            x={i * step + step * 0.15}
            y={160 - (day.investigations / max) * 145}
            width={step * 0.7}
            height={(day.investigations / max) * 145}
            rx={Math.min(3, step * 0.2)}
            fill="#08929c"
          >
            <title>{`${day.date}: ${day.investigations} pemeriksaan`}</title>
          </rect>
        ))}
      </svg>
      {data.totals.investigations === 0 && (
        <p className={styles.muted}>Belum ada pemeriksaan dalam periode ini.</p>
      )}
      <details className={styles.chartDetails}>
        <summary>Lihat data harian</summary>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal (WIB)</th>
                <th>Pemeriksaan</th>
                <th>Pengguna baru</th>
                <th>Percobaan kuis</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((day) => (
                <tr key={day.date}>
                  <th scope="row">{day.date}</th>
                  <td data-label="Pemeriksaan">{day.investigations}</td>
                  <td data-label="Pengguna baru">{day.users}</td>
                  <td data-label="Percobaan kuis">{day.quizAttempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
