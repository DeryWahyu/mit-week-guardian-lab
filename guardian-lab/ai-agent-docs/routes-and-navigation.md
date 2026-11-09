# Rute dan Navigasi

[lib/routes.ts](../lib/routes.ts) menjadi sumber tunggal path internal dan pembentuk URL. Impor konstanta untuk `Link`, router, `redirect()`, dan `fetch()`; jangan menyusun ulang string rute di pemanggil.

## Pemakaian

```tsx
import Link from "next/link";
import { API_ROUTES, PUBLIC_ROUTES } from "@/lib/routes";

<Link href={PUBLIC_ROUTES.actWithInvestigation(investigationId)}>Buat Share Card</Link>;

const response = await fetch(API_ROUTES.historyDetail(investigationId));
```

- Pilih kelompok `PUBLIC_ROUTES`, `AUTH_ROUTES`, `PROTECTED_ROUTES`, `ADMIN_ROUTES`, atau `API_ROUTES` sesuai pemanggil. Nama kelompok tidak menggantikan pemeriksaan sesi/peran.
- Gunakan builder yang tersedia untuk ID, mode, target, filter, atau halaman. Tambahkan builder di sumber yang sama bila kebutuhan baru belum tercakup; encoding parameter dilakukan di sana.
- Saat mengubah rute, selaraskan handler/halaman, seluruh pemanggil, aturan akses pada `proxy.ts` dan server, serta [tes rute](../lib/routes.test.ts).
- Aturan state pada query ada di [ai-guidelines.md](./ai-guidelines.md#state-pada-url); pembatasan akses ada di [autentikasi](./features.md#autentikasi-dan-akses).
- Menu fitur pengguna memakai label Bahasa Indonesia. Tautan utama menuju landing berlabel **Beranda**, sementara path dan pembentuk URL tetap mengikuti `lib/routes.ts`.
- Halaman Tentang Guardian Lab, Kebijakan Privasi, dan Ketentuan Penggunaan memakai layout bersama pada [app/(public-info)](<../app/(public-info)/layout.tsx>), tanpa kewajiban login. Navbar varian informasi menaut ke Beranda dan ketiga halaman tersebut untuk semua status sesi; halaman aktif mengikuti pathname. Gaya navbar menggunakan komponen yang sama dengan landing dan halaman fitur. Kolom **Informasi** pada kedua varian footer memakai konstanta publik untuk menaut ketiganya.

Profil pemilik sesi diakses dari avatar/nama navbar desktop dan menu Profil saya di ponsel. Akses halaman/API tetap memeriksa sesi database; profil bukan halaman publik dan bukan detail pengguna berdasarkan ID URL.

Jangan menyalin daftar konstanta ke dokumentasi. Path dan signature terbaru dibaca langsung dari kode.
