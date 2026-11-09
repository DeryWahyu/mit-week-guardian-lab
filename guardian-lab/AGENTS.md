<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Guardian Lab: Instruksi AI

Platform anti-phishing dan bedah APK untuk MIT-Week 2026, dengan pilar Recognize, Protect/Sandbox, dan Act. Stack: Next.js App Router, TypeScript, Bun, Tailwind v4, Prisma/MySQL.

## Eksekusi pengujian

- **Default selama pengerjaan dan penyelesaian tugas: jangan membuat/menambah kode test, menjalankan build, test, lint, typecheck, atau pemeriksaan browser.** Pengujian didelegasikan kepada pengguna atau model AI lain.
- Cukup perbarui [TEST_PLAN.md](TEST_PLAN.md) dengan cakupan perubahan, langkah pemeriksaan, hasil yang diharapkan, dan prasyarat. Gunakan daftar pemeriksaan tertunda, bukan log pekerjaan atau klaim kelulusan.
- Sebelum eksekusi, tanyakan apakah pengguna ingin menjalankan pemeriksaan beserta cakupannya dan **tunggu persetujuan eksplisit**. Jika pengguna sudah menunda/mendelegasikan, cukup serahkan rencananya. Izin spesifik dalam sesi tetap berlaku untuk cakupan yang disetujui, bukan seluruh suite.
- Jangan menyiapkan runtime atau memperbaiki lingkungan hanya untuk pengujian yang belum disetujui. Penyuntingan kode/dokumen dan peninjauan diff tetap boleh dilakukan.

## Baca sesuai tugas

Mulai dengan [alur kerja](ai-agent-docs/agent-workflow.md). Baca hanya dokumen atau bagian yang relevan; jangan memuat seluruh folder secara rutin.

Ikuti [aturan dokumentasi dan kebersihan perubahan](ai-agent-docs/documentation-and-cleanup.md) saat membuat dokumentasi atau mengubah kode.

| Kebutuhan | Sumber utama |
| --- | --- |
| Kontrak fitur | [features.md](ai-agent-docs/features.md), pilih bagian fitur terkait |
| Struktur kode, tipe, validasi | [code-quality.md](ai-agent-docs/code-quality.md) |
| Dokumentasi dan pembersihan berkas terkait perubahan | [documentation-and-cleanup.md](ai-agent-docs/documentation-and-cleanup.md) |
| UI, bahasa, form | [ai-guidelines.md](ai-agent-docs/ai-guidelines.md) |
| Rute | [routes-and-navigation.md](ai-agent-docs/routes-and-navigation.md) |
| Logo dan generasi maskot | [branding.md](ai-agent-docs/branding.md) |
| Infrastruktur | [system-architecture.md](ai-agent-docs/system-architecture.md) dan [deployment.md](ai-agent-docs/deployment.md) |

[Peta lengkap](ai-agent-docs/index.md) hanya untuk menemukan dokumen. Skema, konstanta, dan implementasi dibaca dari kode; jangan disalin ke dokumentasi.

## Batas produk dan keamanan

- **Zero Real PII:** jangan meminta/menyimpan/mengirim kredensial asli korban. Sanitasi teks sebelum persistensi atau pengiriman ke AI melalui PII Scrubber.
- Hasil analisis memakai Mode Bahasa Manusia sebagai default dan Mode Teknis. Sajikan bukti tersimpan; jangan mengarang skor, permissions, atau C2.
- Input URL, gambar QR, dan APK dimasukkan serta dikirim manual oleh pengguna. Tidak ada tombol contoh, preset malware, atau shortcut pengujian di website; sampel demo disiapkan tim secara eksternal.
- Sandbox web melindungi perangkat melalui Chromium server terisolasi, maksimal 180 detik dan auto-destroy. Android dinamis belum aktif.
- Act hanya berfokus pada Guardian Share Card. Panduan darurat dan generator laporan pemerintah tidak termasuk cakupan.
- Gunakan library matang untuk fungsi kompleks yang sudah tersedia. Biome dan Prettier mengikuti konfigurasi proyek; aturan izin pemeriksaan tetap berlaku.

## Referensi wajib gambar maskot

Sebelum generate/edit maskot, baca [panduan branding](ai-agent-docs/branding.md#panduan-wajib-generasi-maskot), buka [guide empat sudut](public/guide/guardian-lab-fox-3d-guide.png) dengan tool pembaca gambar, lalu **sertakan gambar guide sebagai input referensi tool generasi**. Menulis path di prompt saja tidak cukup. Sertakan [logo cyan](public/brand/guardian-lab-koneksi.png) bila logo terlihat. Pertahankan identitas rubah 3D navy–cyan dari guide.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
