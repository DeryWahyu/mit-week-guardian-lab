# Standar Kualitas Kode

## Tanggung jawab dan struktur

- Setiap modul menangani satu tanggung jawab. `page.tsx` menyusun halaman dan mendelegasikan tampilan fitur; polling, mutasi, dan analisis berada dalam hook atau layanan.
- Gunakan sekitar 200–250 baris sebagai batas peninjauan komponen UI. Pecah sub-view, handler, atau skema yang memiliki tanggung jawab sendiri; hindari pemecahan mekanis yang hanya memindahkan baris.
- Gunakan kembali komponen dan hook untuk perilaku yang sama. Pemilihan library mengikuti aturan pada [AGENTS.md](../AGENTS.md).

| Lokasi                               | Tanggung jawab                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `components/ui/`                     | Primitif antarmuka tanpa logika domain atau komunikasi API.                   |
| `components/shared/`                 | Komponen bisnis yang digunakan lintas fitur.                                  |
| `components/<fitur>/`                | Komponen dan hook fitur yang mengikuti pengelompokan proyek saat ini.         |
| `app/<rute>/_components/`, `_hooks/` | Detail lokal rute; gunakan ketika lebih sesuai daripada komponen lintas rute. |
| `lib/<domain>/`                      | Layanan, akses data, dan helper domain.                                       |
| `lib/validations/`                   | Skema Zod untuk input serta kontrak data.                                     |

Komponen lokal dipromosikan ke lokasi bersama ketika benar-benar dibutuhkan fitur lain. Helper domain tetap berada dekat domainnya; `lib/utils.ts` untuk utilitas umum.

## Tipe dan validasi

- Gunakan TypeScript strict tanpa `any`, `as any`, atau `@ts-ignore` untuk melewati pemeriksaan tipe.
- Perlakukan JSON dan respons layanan luar sebagai `unknown`, lalu validasi dengan Zod. Turunkan tipe dari skema menggunakan `z.infer`.
- Terapkan skema input bersama di client dan server jika memungkinkan. Pemeriksaan client tidak menggantikan validasi serta otorisasi server.
- Validasi hasil sanitasi sebelum persistensi bila sanitasi dapat mengosongkan atau mengubah nilai wajib.

## Batas server dan client

- Server Component menjadi pilihan awal; tempatkan `"use client"` pada bagian yang membutuhkan interaksi atau API browser.
- Rahasia, Prisma, pemanggilan model, dan akses alat OS tetap di server. Client menerima DTO terbatas, bukan objek database atau kredensial mentah.
- Dengan Cache Components aktif, baca sesi di dalam batas Suspense yang sesuai. Jangan masukkan data akun ke cache bersama. Kontrak sesi: [autentikasi](./features.md#autentikasi-dan-akses).
- Pisahkan state per akun/peran dan ID sumber. Batalkan request yang sudah tidak relevan serta abaikan hasil yang terlambat.

## State dan penanganan error

- Hitung derived state langsung dari sumbernya; gunakan memo hanya bila perlu. `useEffect` digunakan untuk sinkronisasi dengan sistem luar.
- Gunakan transition untuk pembaruan navigasi/render yang sesuai. Operasi jaringan panjang dapat memakai pending dan AbortController sendiri agar navigasi tetap responsif.
- Tangani kegagalan dengan pesan sesuai dampak. Jangan menelan error dengan empty catch atau membuat data pengganti yang tampak seperti hasil nyata.
- Aturan feedback visual, loading, dan form hanya didefinisikan pada [ai-guidelines.md](./ai-guidelines.md). Navigasi mengikuti [routes-and-navigation.md](./routes-and-navigation.md).

## Gaya dan penamaan

- File/folder: `kebab-case`; komponen dan tipe: `PascalCase`; fungsi/hook: `camelCase`; konstanta rute dan konfigurasi tetap: `UPPER_SNAKE_CASE`.
- Gabungkan kelas kondisional dengan `cn()` dari `lib/utils.ts`. Komponen bersama menerima `className` bila diperlukan; props mengikuti kebutuhan komponennya.
- Gunakan Tailwind atau CSS Modules sesuai lingkup gaya. Inline style hanya untuk nilai dinamis yang tidak sesuai utility statis.
- Prettier beserta plugin Tailwind mengatur format; Biome mengatur lint dan import. Konfigurasi berada di [.prettierrc](../.prettierrc) dan [biome.json](../biome.json).
- Jangan menyimpan path absolut mesin lokal dalam kode atau dokumentasi. Gunakan path relatif, alias `@/`, atau konfigurasi runtime.

Urutan pemeriksaan, pemeliharaan tes, dan aturan Git berada di [agent-workflow.md](./agent-workflow.md).
