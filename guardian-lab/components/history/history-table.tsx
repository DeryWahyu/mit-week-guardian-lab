import type { Investigation } from "@/lib/validations/investigation";
import { HistoryRow } from "./history-row";
import styles from "./history-table.module.css";

export function HistoryTable({ records }: { records: Investigation[] }) {
  return (
    <table className={styles.table}>
      <caption className="sr-only">
        Daftar pemeriksaan tersimpan. Tanggal ditampilkan dalam WIB.
      </caption>
      <colgroup>
        <col className={styles.targetColumn} />
        <col className={styles.indicatorColumn} />
        <col className={styles.dateColumn} />
        <col className={styles.actionColumn} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Pemeriksaan</th>
          <th scope="col">Indikator</th>
          <th scope="col">Tanggal</th>
          <th scope="col">
            <span className="sr-only">Aksi</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <HistoryRow key={record.id} record={record} />
        ))}
      </tbody>
    </table>
  );
}
