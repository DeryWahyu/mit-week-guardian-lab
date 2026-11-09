# Guardian Lab

Guardian Lab adalah platform anti-phishing dan analisis APK untuk MIT-Week 2026. Aplikasi menghubungkan **pemeriksaan, penjelajahan terisolasi, pembelajaran, dan berbagi hasil** dalam satu akun.

Repository ini memuat aplikasi web Next.js dan layanan model Python Logistic Regression V6. **Untuk juri, berkas demo APK dan QR tersedia di [demo-samples](guardian-lab/demo-samples)** dan dapat diunggah melalui aplikasi setelah masuk.

## Fitur utama

| Fitur | Kemampuan |
| --- | --- |
| Pemeriksaan URL dan QR | Menganalisis pola alamat melalui Logistic Regression V6. QR dibaca dari gambar PNG/JPG/WebP, lalu tautannya memakai alur analisis URL yang sama. |
| Dua mode hasil | Mode Bahasa Manusia menyajikan ringkasan dan temuan. Mode Teknis menampilkan bukti serta metadata model, dengan pencarian bukti pada detail rekaman/kasus. |
| Ruang Uji | Membuka tautan publik melalui Chromium/KasmVNC di server terisolasi, maksimal 180 detik per sesi. Clipboard dan unduhan ke perangkat diblokir. |
| Bedah APK | Memeriksa identitas, izin dan jejak kode melalui JADX tanpa memasang atau menjalankan APK. Penilaian ancaman memakai DeepSeek bila dikonfigurasi, dengan fallback heuristik luring. |
| Riwayat | Menyimpan pemeriksaan milik akun, dilengkapi pencarian, filter, pagination dan detail rekaman. |
| Bagikan Hasil | Membuat Guardian Share Card dari hasil lengkap, mengunduh PNG, menyalin pesan WhatsApp dan membuka pilihan berbagi jika didukung browser. |
| Belajar / Academy | Materi, latihan, pembahasan, progres, EXP, streak dan lencana. EXP diberikan pada kelulusan pertama sesuai aturan latihan. |
| Komunitas | Mengajukan hasil untuk ditinjau admin, mempelajari kasus yang disetujui, mengerjakan latihan kasus dan melihat papan peringkat EXP. |
| Profil | Informasi akun, ringkasan aktivitas, progres, lencana dan perubahan nama tampilan. |
| Autentikasi | Registrasi dengan verifikasi WhatsApp, login email/password, pemulihan password melalui OTP serta pemisahan akses USER dan ADMIN. |
| Administrasi | Dashboard, pengelolaan pengguna, investigasi, moderasi kasus, CMS Academy dengan thumbnail, monitor layanan, log aktivitas dan laporan/ekspor CSV. |

Model URL/QR masih berstatus **riset nonkomersial / shadow**, dengan `production_ready=false`. Model membaca pola URL, bukan isi halaman atau redirect. Indikator rendah tidak menjamin situs aman; jika model tidak tersedia, risiko dan skor tetap kosong. Analisis APK bersifat statis dan Android dinamis belum tersedia. Kartu berbagi dikirim atas tindakan pengguna.

Kontrak lengkap dan batas tiap fitur ada pada [panduan fitur](guardian-lab/ai-agent-docs/features.md).

## Struktur project

```text
guardian-lab-workspace/
├── README.md
├── guardian-lab/                 # Web Next.js, API, Prisma dan MySQL
│   ├── Makefile                 # Perintah development Docker
│   ├── .env.example
│   ├── demo-samples/            # Berkas demo untuk juri
│   └── docker/
└── guardian-lab-ai/              # Layanan model URL/QR V6
```

Kedua folder sudah disertakan dalam repository ini. Dari folder kerja:

```bash
git clone https://github.com/DeryWahyu/mit-week-guardian-lab.git guardian-lab-workspace
cd guardian-lab-workspace
```

**Seluruh perintah `make -C guardian-lab ...` di README ini dijalankan dari root workspace.** Opsi `-C` memakai [Makefile yang sudah ada](guardian-lab/Makefile) di folder web. Jika terminal sudah berada di `guardian-lab`, cukup gunakan `make ...` tanpa `-C guardian-lab`.

## Menjalankan seluruh aplikasi dengan Docker dan Make

### 1. Siapkan kebutuhan

- Git.
- Docker Engine Linux atau Docker Desktop dengan Linux containers yang sedang aktif.
- Docker Compose **2.32.2+**, untuk Compose Watch dan konfigurasi stack proyek.
- GNU Make dan shell POSIX, misalnya Linux/macOS atau WSL pada Windows dengan akses ke Docker.
- Koneksi internet untuk mengunduh image, dependency dan artifact model V6 saat build pertama.

Cara ini menjalankan Node/Bun, MySQL, Python dan Java di container. Tidak perlu memasang dependency aplikasi, MySQL, Java atau Python secara terpisah di host.

### 2. Buat konfigurasi dan key

```bash
make -C guardian-lab key-generate
```

Perintah membuat `guardian-lab/.env` dari [template environment](guardian-lab/.env.example) bila belum ada, kemudian mengisi `SESSION_SECRET` dan `SANDBOX_BROKER_KEY` yang kosong/placeholder. Key yang sudah valid dipertahankan dan nilainya tidak dicetak.

Buka `guardian-lab/.env`, pertahankan alamat lokal berikut:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
SANDBOX_PUBLIC_URL=http://localhost:4010
```

| Konfigurasi | Penggunaan |
| --- | --- |
| `FONNTE_TOKEN` | Pengiriman OTP untuk registrasi dan pemulihan akun. Akun demo yang sudah terverifikasi dapat dipakai tanpa pengiriman OTP. |
| `DEEPSEEK_API_KEY` | Penilaian ancaman APK melalui DeepSeek. Jika kosong, pemeriksaan memakai heuristik luring. |
| `SESSION_SECRET`, `SANDBOX_BROKER_KEY` | Key internal aplikasi dan broker, diisi melalui generator. |
| `AUTH_TRUST_PROXY` | Biarkan `false` untuk akses lokal; proxy tepercaya mengikuti panduan deployment. |

Compose mengatur alamat database, model dan broker di jaringan container. `DATABASE_URL` dan `GUARDIAN_ML_URL` pada template ditujukan untuk alternatif proses di host. Konfigurasi provider hanya berada di server; simpan `.env` di luar Git.

Pada PowerShell tanpa GNU Make/shell POSIX, Node.js 22 dapat dipakai untuk langkah generator:

```powershell
node guardian-lab/scripts/generate-keys.mjs
```

Lanjutkan perintah Make melalui shell yang memenuhi kebutuhan di atas, atau gunakan [alternatif Docker Compose](guardian-lab/README.md#pilihan-b-seluruh-stack-dengan-docker).

### 3. Jalankan stack

```bash
make -C guardian-lab config
make -C guardian-lab dev
```

`config` memvalidasi konfigurasi Compose tanpa mencetak nilai environment. `dev` membangun image dan menjalankan stack dengan Watch. Biarkan terminal terbuka sampai web siap, lalu akses **http://localhost:3000**.

Stack mencakup web, MySQL 8.4, layanan V6, broker sandbox serta persiapan image browser/proxy. Startup menerapkan migrasi dan mengisi materi Academy. Artifact V6 asli diunduh dan diverifikasi saat image model dibangun, tanpa training ulang. Akun demo dibuat melalui langkah berikut.

Source web diperbarui melalui Watch; perubahan dependency, Prisma dan layanan memicu rebuild sesuai konfigurasi. Setelah mengubah `.env` atau file Compose, hentikan proses dan jalankan kembali perintah yang sama. Stack ini memakai database container terpisah dari MySQL Laragon dan sudah menyertakan sandbox.

### 4. Isi akun dan aktivitas demo

Setelah container aplikasi berjalan, buka terminal kedua di root workspace:

```bash
make -C guardian-lab db-seed
```

Perintah mengisi akun, materi, progres, EXP, lencana, aktivitas, riwayat dan kasus contoh pada database development.

| Peran | Nama | Email | Password |
| --- | --- | --- | --- |
| ADMIN | Admin | `admin@gmail.com` | `password` |
| USER | Alfian Gading Saputra | `gading@gmail.com` | `password` |
| USER | Dery Wahyu Perdana | `dery@gmail.com` | `password` |
| USER | Rafli Maulana | `rafli@gmail.com` | `password` |

Nomor akun seed sudah ditandai terverifikasi. USER secara default diarahkan ke landing setelah login; ADMIN diarahkan ke dashboard admin. Untuk mencoba tampilan pengguna, masuk dengan salah satu akun USER.

Seed ulang tidak menggandakan aktivitas/hadiah demo, tetapi mengembalikan nama, peran, nomor dan password akun seed; sesi dicabut bila kredensial/peran/nomor berubah. Jalankan pada database development yang memang akan diisi data contoh. Data simulasi memakai penanda `[DEMO]`/`LOCAL_DEMO`; skor APK demo bukan keluaran AI dan rekaman URL/QR demo tanpa pemanggilan model tetap `UNAVAILABLE`.

## Demo sample apps untuk juri

Berkas disediakan di [guardian-lab/demo-samples](guardian-lab/demo-samples). Jika membuka melalui GitHub, gunakan **Download raw file** pada halaman berkas untuk menyimpan APK/PNG ke perangkat.

| Sampel | Cara mencoba |
| --- | --- |
| [Undangan_Pernikahan_Simulasi.apk](guardian-lab/demo-samples/Undangan_Pernikahan_Simulasi.apk) | Buka **Bedah APK**, pilih berkas APK ini, lalu tekan **Periksa APK**. Cermati identitas aplikasi, izin dan jejak kode pada dua mode hasil. APK digunakan sebagai berkas unggahan analisis statis; tidak perlu dipasang di ponsel. |
| [01-qr-tautan-contoh.png](guardian-lab/demo-samples/01-qr-tautan-contoh.png) | Pada pemeriksaan di landing, pilih tab **QR**, unggah gambar ini dan jalankan pemeriksaan. Tautan hasil dekode dianalisis melalui model V6. |

Alur singkat penilaian:

1. Jalankan stack dan seed demo, lalu masuk dengan akun USER pada tabel di atas.
2. Unduh salah satu sampel dan unggah secara manual melalui fitur terkait.
3. Bandingkan **Mode Bahasa Manusia** dan **Mode Teknis**, lalu buka hasilnya kembali di **Riwayat**.
4. Gunakan **Bagikan Hasil** dari hasil lengkap untuk meninjau kartu dan pesan yang dihasilkan.
5. Coba latihan pada **Belajar**, pelajari kasus yang tersedia di **Komunitas**, lalu lihat progres pada **Profil** dan papan peringkat.
6. Untuk menilai pengelolaan sistem, masuk dengan akun ADMIN dan buka dashboard admin.

Hasil unggahan mengikuti analisis yang benar-benar tersedia saat dijalankan. Skor atau kategori tertentu tidak ditetapkan sebagai hasil wajib sampel. Sampel disediakan sebagai berkas eksternal dan dipilih manual oleh juri.

## Daftar perintah Make

Perintah berikut memakai target yang tersedia pada [guardian-lab/Makefile](guardian-lab/Makefile), dari root workspace.

| Perintah | Fungsi |
| --- | --- |
| `make -C guardian-lab help` | Menampilkan bantuan; target default Make juga hanya menampilkan bantuan. |
| `make -C guardian-lab key-generate` | Membuat `.env` bila perlu dan mengisi key internal kosong/placeholder. |
| `make -C guardian-lab key-generate KEY=SESSION_SECRET` | Mengisi satu key yang dipilih; `KEY=SANDBOX_BROKER_KEY` juga tersedia. |
| `make -C guardian-lab dev` | Build dan jalankan seluruh stack dengan Watch di foreground. |
| `make -C guardian-lab run` / `make -C guardian-lab up` | Alias dari target `dev`. |
| `make -C guardian-lab ps` | Menampilkan status semua container. |
| `make -C guardian-lab logs` | Mengikuti 100 baris log terakhir seluruh layanan. |
| `make -C guardian-lab logs SERVICE=app` | Mengikuti log aplikasi; ganti `app` dengan `ml` atau `broker` untuk layanan terkait. |
| `make -C guardian-lab build` | Membangun image development. |
| `make -C guardian-lab build SERVICE=ml` | Membangun image layanan model saja. |
| `make -C guardian-lab shell` | Membuka shell container aplikasi yang berjalan. |
| `make -C guardian-lab config` | Memvalidasi Compose tanpa menampilkan nilai environment. |
| `make -C guardian-lab db-migrate` | Menerapkan migrasi yang sudah tersedia pada database development. |
| `make -C guardian-lab db-seed` | Mengisi akun dan aktivitas demo serta materi Academy. |
| `make -C guardian-lab academy-seed` | Mengisi materi Academy saja. |
| `make -C guardian-lab down` | Menghentikan dan menghapus container/network; volume database dipertahankan. |

Target `shell`, `db-migrate`, `db-seed` dan `academy-seed` memerlukan container aplikasi yang berjalan. Migrasi dan seed Academy juga dijalankan otomatis pada startup. Untuk menghentikan Watch gunakan `Ctrl+C`, lalu `make -C guardian-lab down` bila ingin menghapus container/network tanpa menghapus database.

## Alternatif: menjalankan proses langsung di host

Panduan lengkap tersedia di [README web](guardian-lab/README.md#pilihan-a-menjalankan-langsung-di-host). Cara ini memerlukan Node.js 22, Bun 1.3.1 dan MySQL 8; fitur terkait juga memerlukan Python 3.12, Java 11+/JADX serta Docker untuk sandbox.

Dari root workspace:

```powershell
cd guardian-lab
bun install --frozen-lockfile
node scripts/generate-keys.mjs
```

Sesuaikan `guardian-lab/.env` untuk database host dan buat database `guardian_lab` pada MySQL:

```dotenv
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/guardian_lab"
NEXT_PUBLIC_APP_URL=http://localhost:3000
GUARDIAN_ML_URL=http://127.0.0.1:8001
SANDBOX_BROKER_URL=http://127.0.0.1:4011
SANDBOX_PUBLIC_URL=http://localhost:4010
```

Setelah mengganti `USER`/`PASSWORD` dengan kredensial lokal, lanjutkan dari folder `guardian-lab`:

```powershell
bunx prisma generate
bunx prisma migrate deploy
bun run db:seed
bun run dev
```

`bun run db:seed` di sini menyiapkan akun/aktivitas demo; gunakan `bun run academy:seed` bila hanya memerlukan materi awal. Pada cara host, target Make di atas tetap mengelola **stack Docker**, sehingga perintah Bun/Prisma digunakan untuk proses host.

`npm run dev` juga dapat dipakai setelah dependency terpasang. Perintah ini hanya menjalankan web. Jalankan layanan Python V6 pada terminal terpisah, siapkan JADX dengan `bun run apk:setup`, dan gunakan `bun run sandbox:build` serta `bun run sandbox:up` untuk sandbox standalone, sesuai [panduan host](guardian-lab/ai-agent-docs/deployment.md#alternatif-menjalankan-proses-di-host). Pilih satu cara menjalankan untuk menghindari benturan port dan broker.

## Kendala umum

| Gejala | Langkah yang perlu diperiksa |
| --- | --- |
| `No makefile found` dari root | Gunakan `make -C guardian-lab ...`. Makefile berada di folder web. |
| `make`, `printf` atau `id` tidak ditemukan | Pastikan GNU Make dan shell POSIX tersedia. Pada Windows gunakan WSL/shell yang sesuai atau ikuti alternatif Compose pada README web. |
| `Could not find the Next.js package (next/package.json)` | Untuk cara host, jalankan `bun install --frozen-lockfile` dan perintah dev dari folder `guardian-lab`, tempat `package.json` berada. |
| Web belum siap atau container gagal | Lihat `make -C guardian-lab ps` dan `make -C guardian-lab logs SERVICE=app`. Model dapat ditinjau melalui `SERVICE=ml`. |
| Akun demo belum dapat login | Setelah aplikasi siap, jalankan `make -C guardian-lab db-seed` pada cara Docker, atau `bun run db:seed` dari folder web pada cara host. |
| Model URL/QR belum tersedia | Periksa layanan/artifact V6 dan alamat model. Cara host memerlukan proses Python terpisah; rekaman unavailable lama tidak diproses ulang otomatis. |
| OTP belum diterima | Periksa konfigurasi token/perangkat Fonnte serta status pengiriman. Akun demo memakai status terverifikasi dari seeder. |
| Bedah APK atau Ruang Uji belum tersedia | Pada host, periksa Java/JADX atau Docker/broker/key/alamat stream. Stack lengkap sudah menyertakan layanan pendukung ini. |
| Form menolak Origin | Gunakan alamat sesuai `NEXT_PUBLIC_APP_URL`; `localhost` dan `127.0.0.1` merupakan origin berbeda. |

## Dokumentasi lanjutan

- [README web](guardian-lab/README.md): detail setup host dan alternatif Compose tanpa Make.
- [README model V6](guardian-lab-ai/README.md): inferensi, artifact, evaluasi dan keterbatasan model.
- [Panduan integrasi V6](guardian-lab-ai/ai-agent-docs/web-integration-v6.md): kontrak backend web dan API Python.
- [Kontrak fitur](guardian-lab/ai-agent-docs/features.md): alur, hak akses, data dan batas kemampuan.
- [Deployment](guardian-lab/ai-agent-docs/deployment.md): Docker, host, HTTPS, reverse proxy dan output standalone.
- [Rencana pemeriksaan](guardian-lab/TEST_PLAN.md): cakupan pemeriksaan tertunda beserta prasyaratnya.
- [Peta dokumentasi web](guardian-lab/ai-agent-docs/index.md): sumber utama tiap topik.

Perintah pada README ini adalah panduan penggunaan. Pembaruan dokumentasinya ditinjau terhadap Makefile, konfigurasi dan sumber proyek; tidak berarti build, migrasi, seed atau pengujian aplikasi telah dijalankan ulang. Kontribusi AI mengikuti [aturan web](guardian-lab/AGENTS.md) dan [aturan model](guardian-lab-ai/AGENTS.md) sesuai bagian yang diubah.
