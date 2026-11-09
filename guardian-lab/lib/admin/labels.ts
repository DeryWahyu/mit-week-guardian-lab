export const ADMIN_ACTION_LABELS = {
  USER_SUSPEND: "Penangguhan akun",
  USER_RESTORE: "Pemulihan akun",
  USER_REVOKE_SESSIONS: "Pencabutan sesi",
  USER_SET_ROLE: "Perubahan peran",
  INVESTIGATION_REVIEW: "Tinjauan investigasi",
  CASE_APPROVED: "Persetujuan kasus",
  CASE_REJECTED: "Penolakan kasus",
  CASE_WITHDRAWN: "Penarikan publikasi",
  QUIZ_CREATED: "Pembuatan kuis",
  QUIZ_UPDATED: "Pembaruan kuis",
  QUIZ_ARCHIVED: "Pengarsipan kuis",
  REPORT_EXPORTED: "Ekspor laporan",
} as const;
export const REVIEW_LABELS = {
  REVIEWED: "Sudah ditinjau",
  NEEDS_REVIEW: "Perlu tindak lanjut",
  ESCALATED: "Dieskalasi",
} as const;
export const METRIC_LABELS = {
  users: "Pengguna terdaftar (seluruh waktu)",
  newUsers: "Pengguna baru",
  investigations: "Pemeriksaan",
  completed: "Analisis selesai",
  failed: "Pemeriksaan gagal",
  unavailable: "Model tidak tersedia",
  quizAttempts: "Percobaan kuis",
  quizPassed: "Percobaan kuis lulus",
  communityPublished: "Publikasi aktif yang disetujui",
  activeSandbox: "Sandbox aktif saat ini",
} as const;
