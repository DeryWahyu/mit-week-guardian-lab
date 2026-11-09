# Guardian Lab

Guardian Lab adalah platform anti-phishing dan analisis APK untuk MIT-Week 2026. Alurnya menghubungkan **pemeriksaan, penjelajahan terisolasi, pembelajaran, dan berbagi hasil** dalam satu akun.

Aplikasi web menggunakan Next.js App Router, React, TypeScript, Bun, Prisma dan MySQL. Layanan model Python berada pada repository terpisah: [guardian-lab-ai](https://github.com/DeryWahyu/guardian-lab-ai).

## Fitur utama

| Fitur                  | Kemampuan                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pemeriksaan URL dan QR | Menganalisis pola alamat melalui Logistic Regression V6. QR dibaca dari gambar PNG/JPG/WebP, lalu tautannya memakai alur analisis URL yang sama.                                      |
| Dua mode hasil         | Mode Bahasa Manusia menampilkan ringkasan dan temuan; Mode Teknis menyediakan bukti, metadata model serta pencarian bukti pada detail rekaman/kasus.                                  |
| Ruang Uji              | Membuka tautan publik melalui Chromium/KasmVNC di server terisolasi, maksimal 180 detik per sesi, dengan clipboard dan unduhan ke perangkat diblokir.                                 |
| Bedah APK              | Mengekstrak identitas, izin dan jejak kode melalui JADX tanpa memasang atau menjalankan APK. Penilaian ancaman memakai DeepSeek bila dikonfigurasi, dengan fallback heuristik luring. |
| Riwayat                | Menyimpan pemeriksaan milik akun, dengan pencarian, filter, pagination serta halaman detail hasil dan status.                                                                         |
| Bagikan Hasil          | Membuat Guardian Share Card dari hasil lengkap, mengunduh PNG, menyalin pesan WhatsApp dan membuka pilihan berbagi jika didukung browser.                                             |
| Belajar / Academy      | Menyediakan materi, latihan, pembahasan, progres, EXP, streak serta lencana. EXP diberikan pada kelulusan pertama sesuai aturan latihan.                                              |
| Komunitas              | Mengajukan hasil untuk ditinjau admin, mempelajari kasus yang disetujui, mengerjakan latihan kasus dan melihat papan peringkat EXP.                                                   |
| Profil                 | Menampilkan informasi akun, ringkasan aktivitas, progres dan lencana, serta menyediakan perubahan nama tampilan.                                                                      |
| Autentikasi            | Registrasi dengan verifikasi WhatsApp, login email/password, pemulihan password melalui OTP serta pemisahan akses USER dan ADMIN.                                                     |
| Administrasi           | Dashboard, pengelolaan pengguna, tinjauan investigasi, moderasi kasus, CMS Academy dengan thumbnail, monitor layanan, log aktivitas dan laporan/ekspor CSV.                           |

Model URL/QR masih berstatus **riset nonkomersial / shadow**, dengan `production_ready=false`. Indikator rendah tidak menjamin situs aman; model membaca pola URL, bukan isi halaman atau redirect. Jika layanan model tidak tersedia, risiko dan skor tetap kosong. Analisis APK bersifat statis; Android dinamis belum tersedia. Kartu berbagi tidak dikirim otomatis kepada penerima.

Kontrak lengkap dan batas tiap fitur ada pada [features.md](ai-agent-docs/features.md).

## Struktur checkout

Letakkan kedua repository sebagai direktori sejajar agar Compose dapat menemukan layanan model:

```text
guardian-lab-workspace/
├── guardian-lab/       # Aplikasi web
└── guardian-lab-ai/    # Layanan model V6
```

Dari folder kerja:

```bash
git clone https://github.com/DeryWahyu/guardian-lab.git
git clone https://github.com/DeryWahyu/guardian-lab-ai.git
cd guardian-lab
```

Pilih salah satu cara menjalankan aplikasi di bawah. Seluruh perintah web dijalankan dari root **guardian-lab**, tempat `package.json` berada.

## Pilihan A: menjalankan langsung di host

### 1. Siapkan kebutuhan

- Node.js 22 dan Bun 1.3.1, sesuai runtime Docker serta `packageManager` proyek.
- MySQL 8 yang sedang berjalan; pengguna Laragon dapat memakai layanan MySQL lokal.
- Untuk Bedah APK: Java 11+ dan toolchain JADX melalui perintah setup di bawah.
- Untuk analisis URL/QR: Python 3.12 dan layanan V6 pada terminal terpisah.
- Untuk Ruang Uji: Docker Engine Linux atau Docker Desktop dengan Linux containers.

### 2. Pasang dependency dan buat konfigurasi

```powershell
bun install --frozen-lockfile
node scripts/generate-keys.mjs
```

Generator membuat `.env` dari [.env.example](.env.example) bila belum ada, lalu mengisi `SESSION_SECRET` dan `SANDBOX_BROKER_KEY` yang kosong/placeholder. Key yang sudah terisi dipertahankan, dan nilainya tidak dicetak.

Buka `.env`, sesuaikan kredensial MySQL dan alamat lokal:

```dotenv
DATABASE_URL="mysql://USER:PASSWORD@127.0.0.1:3306/guardian_lab"
NEXT_PUBLIC_APP_URL=http://localhost:3000
GUARDIAN_ML_URL=http://127.0.0.1:8001
SANDBOX_BROKER_URL=http://127.0.0.1:4011
SANDBOX_PUBLIC_URL=http://localhost:4010
```

Ganti `USER` dan `PASSWORD` dengan kredensial database lokal. Buat database `guardian_lab` pada MySQL sebelum menerapkan migrasi.

| Konfigurasi tambahan                   | Penggunaan                                                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `FONNTE_TOKEN`                         | Token perangkat Fonnte untuk pengiriman OTP registrasi dan pemulihan akun. Akun demo yang sudah terverifikasi dapat dipakai tanpa mengirim OTP. |
| `DEEPSEEK_API_KEY`                     | Mengaktifkan penilaian ancaman DeepSeek pada APK; bila kosong, pemeriksaan memakai heuristik luring.                                            |
| `SESSION_SECRET`, `SANDBOX_BROKER_KEY` | Key internal acak minimal 32 karakter, disiapkan oleh generator.                                                                                |
| `AUTH_TRUST_PROXY`                     | Biarkan `false` untuk akses lokal; pengaturan proxy tepercaya dijelaskan pada panduan deployment.                                               |

Konfigurasi provider hanya berada di server. Jangan memasukkan `.env` ke Git. Setelah mengubah `.env`, jalankan ulang proses agar konfigurasi baru terbaca.

### 3. Siapkan database dan jalankan web

```powershell
bunx prisma generate
bunx prisma migrate deploy
bun run academy:seed
bun run dev
```

Buka **http://localhost:3000**. `academy:seed` mengisi materi awal tanpa membuat akun demo atau menimpa materi yang sudah diedit.

`npm run dev` juga dapat dipakai setelah dependency terpasang. Perintah dev hanya menjalankan web; lanjutkan setup layanan berikut agar fitur terkait dapat digunakan.

### 4. Aktifkan layanan pendukung

**Model V6 untuk URL/QR.** Buka terminal kedua, dari root web pindah ke repository AI:

```powershell
cd ../guardian-lab-ai
py -3.12 -m venv ml/.venv
./ml/.venv/Scripts/python.exe -m pip install -e "./ml[serve]"
./ml/.venv/Scripts/python.exe scripts/install_v6_model.py
./ml/.venv/Scripts/python.exe -m uvicorn guardian_ml.shadow_service:create_app --factory --host 127.0.0.1 --port 8001 --workers 1 --no-access-log
```

Biarkan terminal model tetap berjalan. Installer mengambil artifact V6 asli dan memverifikasinya, tanpa training ulang. Backend web memakai `GUARDIAN_ML_URL` dari `.env`; browser tidak mengakses Python secara langsung. Pada Linux/macOS, gunakan `python3.12` dan `ml/.venv/bin/python` sesuai [panduan model](ai-agent-docs/deployment.md#layanan-model-urlqr).

**Bedah APK.** Setelah Java tersedia, jalankan dari root web sebelum memakai fitur APK:

```powershell
bun run apk:setup
```

**Ruang Uji.** Saat Docker aktif, jalankan dari root web:

```powershell
bun run sandbox:build
bun run sandbox:up
```

Key broker pada aplikasi dan broker harus sama. Hentikan broker lokal dengan `bun run sandbox:down`. Rincian Java, toolchain dan jaringan ada pada [panduan menjalankan proses di host](ai-agent-docs/deployment.md#alternatif-menjalankan-proses-di-host).

## Pilihan B: seluruh stack dengan Docker

Gunakan Docker Engine Linux atau Docker Desktop dengan Linux containers serta **Docker Compose 2.32.2+**. Kedua repository harus berada pada susunan direktori di atas. Node/Bun, MySQL, Python dan Java untuk aplikasi dijalankan dalam container.

1. Siapkan `.env` dan key dari root web. Dengan GNU Make pada shell yang mendukung Makefile proyek:

   ```bash
   make key-generate
   ```

   Jika memakai PowerShell dengan Node.js 22 dan tanpa GNU Make, gunakan `node scripts/generate-keys.mjs`. Generator ini tidak memerlukan dependency aplikasi. Alternatif manual ada pada [generator key internal](ai-agent-docs/deployment.md#generator-key-internal).

2. Isi `FONNTE_TOKEN` untuk OTP akun biasa dan `DEEPSEEK_API_KEY` bila ingin memakai DeepSeek. Pertahankan `NEXT_PUBLIC_APP_URL=http://localhost:3000` serta `SANDBOX_PUBLIC_URL=http://localhost:4010` untuk akses lokal.

3. Jalankan stack dan biarkan terminal terbuka:

   ```bash
   docker compose --env-file .env -f docker/docker-compose.dev.yml up --build --watch
   ```

   Dengan GNU Make, perintah yang sama tersedia sebagai `make dev`. Bun di host juga menyediakan `bun run docker:dev`.

Buka **http://localhost:3000**. Compose menjalankan web, MySQL 8.4, model V6 dan broker, sekaligus menyiapkan image browser/proxy sandbox. Startup development menerapkan migrasi serta seed materi Academy; akun/data demo dibuat melalui langkah opsional berikut.

Alamat database, model dan broker untuk container diatur otomatis oleh Compose. Database development disimpan pada volume terpisah dari MySQL host. Source web memakai Fast Refresh; perubahan dependency, Prisma dan layanan memicu rebuild melalui Watch. Tidak perlu menjalankan dev server web, Python host atau broker standalone bersamaan dengan stack ini.

Status, log dan penghentian:

```bash
docker compose --env-file .env -f docker/docker-compose.dev.yml ps --all
docker compose --env-file .env -f docker/docker-compose.dev.yml logs --follow --tail=100 app
docker compose --env-file .env -f docker/docker-compose.dev.yml down
```

`down` mempertahankan volume database. Daftar shortcut Make dan rincian Watch ada pada [panduan Compose](ai-agent-docs/deployment.md#development-dengan-compose).

## Akun dan data demo lokal

Untuk mengisi akun serta aktivitas contoh pada database development:

```powershell
# Web berjalan langsung di host
bun run db:seed
```

Atau, dari terminal lain saat stack Compose berjalan:

```bash
docker compose --env-file .env -f docker/docker-compose.dev.yml exec app bun run db:seed
```

| Peran | Nama                  | Email              |
| ----- | --------------------- | ------------------ |
| ADMIN | Admin                 | `admin@gmail.com`  |
| USER  | Alfian Gading Saputra | `gading@gmail.com` |
| USER  | Dery Wahyu Perdana    | `dery@gmail.com`   |
| USER  | Rafli Maulana         | `rafli@gmail.com`  |

Password semua akun demo adalah **`password`**. Nomor seed sudah ditandai terverifikasi. Secara default setelah masuk, USER diarahkan ke landing, sedangkan ADMIN ke dashboard admin.

Seeder lengkap menambahkan progres, EXP, lencana, aktivitas, riwayat dan kasus contoh agar tampilan dapat didemokan. Data simulasi diberi penanda `[DEMO]`/`LOCAL_DEMO`; skor APK demo bukan keluaran AI dan URL/QR demo tanpa pemanggilan model tetap berstatus `UNAVAILABLE`.

Seed ulang tidak menggandakan aktivitas/hadiah demo, tetapi mengembalikan nama, peran, nomor dan password akun pada daftar seed; sesi dicabut bila kredensial/peran/nomor berubah. Jalankan pada database pengembangan yang memang akan diberi data contoh. Detail sumber dan perilakunya ada pada [panduan seeder](ai-agent-docs/deployment.md#alternatif-menjalankan-proses-di-host).

## Kendala umum

| Gejala                                                   | Langkah yang perlu diperiksa                                                                                                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Could not find the Next.js package (next/package.json)` | Pastikan terminal berada di `guardian-lab`, jalankan `bun install --frozen-lockfile`, lalu ulangi perintah dev.                                                                                |
| Web tidak tersambung ke database                         | Pastikan MySQL aktif, database sudah dibuat, `DATABASE_URL` sesuai dan migrasi sudah diterapkan. Compose memakai database container, bukan MySQL Laragon.                                      |
| Hasil URL/QR menunjukkan model belum tersedia            | Pastikan layanan Python dan artifact V6 tersedia serta `GUARDIAN_ML_URL` sesuai. `npm run dev` tidak menjalankan Python. Rekaman unavailable lama tidak diproses ulang otomatis.               |
| OTP belum diterima                                       | Periksa token/perangkat Fonnte, kuota dan status pengiriman. Akun demo menggunakan status verifikasi dari seeder.                                                                              |
| Bedah APK gagal disiapkan                                | Pastikan Java terpasang dan `bun run apk:setup` selesai pada cara host; lihat pesan status/hasil yang ditampilkan.                                                                             |
| Ruang Uji belum tersedia                                 | Pastikan Docker, image browser/proxy, broker, key bersama dan alamat stream tersedia.                                                                                                          |
| Form menolak Origin                                      | Gunakan origin aplikasi yang sama dengan konfigurasi; `localhost` dan `127.0.0.1` merupakan origin berbeda. Rincian ada pada [kontrak akses](ai-agent-docs/features.md#autentikasi-dan-akses). |

## Dokumentasi dan pengujian

- [Kontrak fitur](ai-agent-docs/features.md): alur, hak akses, data dan batas kemampuan.
- [Panduan deployment](ai-agent-docs/deployment.md): konfigurasi lanjutan, model, Docker, HTTPS, reverse proxy dan output standalone.
- [Panduan integrasi model V6](https://github.com/DeryWahyu/guardian-lab-ai/blob/main/ai-agent-docs/web-integration-v6.md): artifact serta API Python.
- [TEST_PLAN.md](TEST_PLAN.md): prasyarat dan cakupan pemeriksaan yang dapat dipilih.
- [Peta dokumentasi](ai-agent-docs/index.md): sumber topik lainnya.

Kontribusi mengikuti [AGENTS.md](AGENTS.md) dan [alur kerja](ai-agent-docs/agent-workflow.md). AI memerlukan persetujuan sesuai [aturan pengujian](AGENTS.md#eksekusi-pengujian) sebelum menjalankan test, lint, typecheck, build atau pemeriksaan browser. Perintah setup pada README ini merupakan panduan penggunaan; pembaruannya tidak berarti semua perintah telah dijalankan atau diverifikasi ulang.
