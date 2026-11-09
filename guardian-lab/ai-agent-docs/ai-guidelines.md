# Panduan UI dan Bahasa

## Bahasa dan bukti

- Gunakan Bahasa Indonesia yang ramah dan jelas. Istilah seperti phishing, sandbox, permissions, dan C2 boleh dipertahankan bila membantu ketepatan.
- Hindari karakter em dash (U+2014) pada copy, metadata, dan dokumentasi. Gunakan koma, titik, titik dua, atau susun ulang kalimat sesuai konteks; judul halaman boleh memakai pemisah vertikal.
- Hasil analisis menyediakan Mode Bahasa Manusia sebagai default dan Mode Teknis (Geek View). Keduanya membaca hasil tersimpan yang sama.
- Jelaskan izin APK sebagai kemampuan yang diminta, bukan bukti bahwa pencurian sudah terjadi. Tampilkan kartu temuan hanya jika ada bukti pendukung.
- Status model, hasil kosong, dan keterbatasan fitur harus terlihat. Jangan mengganti skor yang belum tersedia dengan nol atau data contoh.

## Interaksi dan feedback

- Elemen yang dapat diklik menggunakan `cursor-pointer`; kontrol disabled menampilkan kondisi yang sesuai. Utamakan penanganan di komponen primitif dan CSS global.
- Gunakan elemen semantik, label yang terhubung dengan kontrol, fokus terlihat, dan dukungan keyboard. Status tidak boleh disampaikan melalui warna saja.
- Aksi destruktif memakai [ConfirmDialog](../components/shared/confirm-dialog.tsx) dengan dampak serta label tindakan yang jelas. Jangan gunakan `window.confirm()` atau `window.alert()`.
- Gunakan Sonner melalui satu `Toaster` global di root layout untuk notifikasi operasi. Toast tampil minimalis di kanan bawah dengan latar putih, teks/ikon netral, bayangan halus, dan warna status hanya pada border kiri: hijau sukses, merah error, biru info, kuning peringatan, serta abu-abu untuk pesan umum/loading. Ikon status dan pesan tetap membedakan jenis notifikasi selain warna; tombol tutup memakai label aksesibel Bahasa Indonesia. Gaya berlaku di semua halaman, termasuk tema gelap, dengan margin responsif pada ponsel. Kesalahan yang perlu diperbaiki pada form juga tampil di dekat kontrol terkait.
- Saat mutasi berjalan, tampilkan pending, cegah pengiriman ganda, dan sediakan pemulihan yang sesuai. Hormati reduced motion.
- Mulai dari lebar 320 px, nama/email panjang dan aksi harus membungkus tanpa memperlebar halaman. Deret navigasi atau tabel yang sengaja digulir harus memakai area scroll lokal yang tetap dapat dijangkau. Dialog mengikuti tinggi viewport dinamis, menyediakan scroll internal pada layar pendek dan mempertahankan tombol tutup serta target sentuh minimal 44 px.

## Loading, kosong, error, dan konten

- Pemuatan data menggunakan skeleton yang mengikuti susunan konten. Gunakan `loading.tsx` atau Suspense pada batas pemuatan yang sesuai; aksi tombol memakai status pending yang terlihat.
- Keadaan kosong menjelaskan penyebab dan langkah berikutnya, dengan ikon atau CTA bila membantu. Bedakan belum ada data dari filter tanpa hasil.
- Kegagalan menampilkan pesan sesuai penyebab dan retry bila aman. Data lama yang masih ditampilkan harus diberi penanda.
- Laporan panjang menyediakan pencarian/filter serta pagination atau area scroll yang sesuai. Ukuran daftar tidak boleh membuat kontrol utama sulit dijangkau.

## Form

- Pada ponsel hingga lebar 767 px, input teks/pencarian/tanggal, select dan textarea pada shell pengguna/admin memakai teks minimal 16 px. Ukuran khusus checkbox, radio dan unggahan tetap mengikuti komponennya. Form autentikasi mempertahankan scroll kolom pada viewport pendek, termasuk saat keyboard memperkecil area tampilan.

- Gunakan label dan placeholder kontekstual. Label field wajib memakai tanda bintang merah; label field opsional mencantumkan `(Opsional)`.
- Upload mendukung file picker, keyboard, dan drag-and-drop. Tampilkan format/batas ukuran serta ringkasan berkas terpilih.
- Input investigasi diisi dan dikirim pengguna sendiri tanpa tombol contoh atau preset berkas.
- Validasi pengiriman menampilkan error dan memfokuskan field yang salah. Jangan menggeser tombol saat pointer sedang mengirim form.
- Batas unggahan dan pemulihan input mengikuti [alur input](./features.md#input-url-qr-dan-apk).

## State pada URL

Simpan state tampilan yang perlu bertahan saat reload atau Back/Forward pada query: tab, mode manusia/teknis, ID investigasi, filter, dan halaman daftar. Dialog yang mewakili tab input mengikuti query tab. Dialog sementara lainnya, pending, clipboard, serta berkas unggahan tidak dimasukkan ke URL.

Jangan menaruh kredensial, isi berkas, atau hasil analisis dalam query. Tautan hasil tetap memerlukan otorisasi; bukan mekanisme berbagi publik. Pembentuk URL menggunakan [konstanta rute](./routes-and-navigation.md).

Identitas visual dan komposisi landing mengikuti [branding.md](./branding.md). Pemeriksaan UI mengikuti [alur kerja](./agent-workflow.md).
