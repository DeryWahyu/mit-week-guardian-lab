import type { useHistory } from "./use-history";

export type HistoryState = ReturnType<typeof useHistory>;

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export function formatHistoryDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Tanggal belum tersedia" : dateFormat.format(date);
}
