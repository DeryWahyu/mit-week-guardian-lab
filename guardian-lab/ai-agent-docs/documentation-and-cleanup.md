# Dokumentasi dan Kebersihan Perubahan

## Dokumentasi

- Sebelum menambah file dokumentasi, cari dokumen pemilik topik pada [peta dokumentasi](./index.md). Perbarui sumber yang sudah ada dan gunakan tautan silang bila informasinya sudah tercakup.
- Buat file baru hanya jika ada kebutuhan dan pembaca yang jelas serta topiknya tidak tepat ditempatkan pada dokumen yang ada. Tambahkan ke peta dokumentasi agar mudah ditemukan.
- Satu fakta atau kontrak memiliki satu sumber utama. Hindari dokumen, daftar, contoh, laporan pekerjaan, atau salinan detail implementasi yang redundan; perbarui atau hapus rujukan lama ketika memindahkan atau menghapus sumbernya.

## Berkas yang tidak terpakai

- Setiap mengubah kode, periksa berkas dan folder yang terkait perubahan tersebut, termasuk pemanggil, impor, konfigurasi, skrip, aset, dokumentasi, dan referensi URL. Hapus berkas atau folder yang terbukti tidak lagi dibutuhkan akibat perubahan, beserta rujukan usangnya.
- Jangan menganggap file tidak terpakai hanya karena tidak ditemukan impor langsung. Periksa pemakaian dinamis, konvensi framework, akses publik, konfigurasi deploy, dan penggunaan sebagai sumber atau panduan. Jika pemakaiannya belum dapat dipastikan, pertahankan dan jelaskan ketidakpastiannya.
- Batasi pembersihan pada cakupan yang relevan dan hormati perubahan pengguna serta aturan izin pengujian. Jangan hapus data pengguna, rahasia, migrasi, atau artefak operasional hanya berdasarkan pencarian referensi.
