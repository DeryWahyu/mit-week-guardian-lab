# Alur Kerja AI

1. Baca [AGENTS.md](../AGENTS.md), lalu hanya panduan dan bagian [fitur](./features.md) yang terkait tugas. Untuk kode Next.js, baca dokumentasi versi terpasang di `node_modules/next/dist/docs/`.
2. Periksa status Git, implementasi, dan pemanggil dengan `rg`. Pertahankan perubahan pengguna serta kode di luar lingkup tugas.
3. Kerjakan perubahan mengikuti [standar kode](./code-quality.md); gunakan panduan UI, rute, atau branding hanya bila relevan.
4. Perbarui dokumen pemilik kontrak yang berubah dan [TEST_PLAN.md](../TEST_PLAN.md). Ikuti [aturan dokumentasi dan kebersihan perubahan](./documentation-and-cleanup.md), termasuk pemeriksaan berkas terkait yang tidak lagi dipakai.
5. Tinjau diff dan bersihkan berkas sementara. Laporkan perubahan serta pemeriksaan yang masih tertunda.

**Izin pembuatan dan eksekusi test mengikuti [AGENTS.md](../AGENTS.md#eksekusi-pengujian).** Menyelesaikan implementasi tidak otomatis mengizinkan pengujian atau build.

Jika diminta commit, gunakan branch `feat/*`, `fix/*`, `refactor/*`, `docs/*`, atau `chore/*` berbasis `origin/main`; jangan commit ke `main`. PR diarahkan ke `main`, dengan squash saat merge.
