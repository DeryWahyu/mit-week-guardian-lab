# Kontrak Fitur Guardian Lab

Baca hanya bagian fitur yang dikerjakan. Batas produk/keamanan dan izin pengujian mengikuti [AGENTS.md](../AGENTS.md). Rute ada di [lib/routes.ts](../lib/routes.ts); skema dan batas rinci dibaca dari file kode yang ditautkan, bukan disalin ke dokumen ini.

## Status aktif

- URL/QR, ekstraksi APK statis, sandbox web, Academy, Share Card, dan komunitas terhubung dengan MySQL.
- URL dan tautan QR memanggil layanan Python Logistic Regression v6 dari backend. Model tetap shadow/riset nonkomersial, `production_ready=false`, dan perlu verifikasi. Bedah APK memadukan ekstraksi statis JADX dengan penilaian ancaman DeepSeek AI (`deepseek-chat`) dan mesin heuristik luring, tanpa memakai classifier URL. Tidak ada worker latar belakang atau proses ulang otomatis.
- Share Card dan kontribusi komunitas menerima hasil lengkap tersimpan, termasuk indikator v6 beserta batas bukti model. Ketidaktersediaan layanan tidak diberi skor atau kategori risiko.
- Android dinamis, viewport ponsel remote, dan thumbnail sesi belum tersedia. Halaman Android menawarkan APK statis; API menolak dengan 503 tanpa sesi palsu.

## Autentikasi dan akses

- Registrasi memerlukan nomor WhatsApp unik; normalisasi memakai format internasional dengan Indonesia sebagai default. Registrasi dan login akun belum terverifikasi membuat sesi sementara khusus OTP, bukan sesi aplikasi. Selama sesi itu pengguna dapat memperbaiki nomor yang keliru; perubahan membatalkan kode dan challenge lain. OTP enam digit dikirim melalui Fonnte; verifikasi nomor satu kali diperlukan sebelum sesi USER/ADMIN diterbitkan. Login berikutnya untuk nomor terverifikasi memakai email/password.
- Lupa password menerima nomor WhatsApp, lalu OTP dan password baru. Respons permintaan bersifat umum untuk mencegah pengungkapan akun; reset berhasil mencabut sesi lama dan membuktikan kepemilikan nomor. OTP memiliki masa berlaku, batas percobaan/pengiriman ulang, dan penyimpanan hash; isi kode serta token gateway tidak masuk log. Respons Fonnte diterima sebagai antrean, bukan bukti pesan sampai.
- Sebelum mengirim URL/QR, tamu melihat [keterangan akun](../components/landing/gateway-account-notice.tsx) dekat input dan di dialog QR: perlu akun terverifikasi, riwayat tersimpan, serta WhatsApp untuk verifikasi dan pemulihan akses. Keterangan terhubung ke input/tombol kirim melalui deskripsi aksesibel dan tidak tampil bagi pengguna masuk. Skeleton mengikuti kondisi akun. FAQ menjelaskan alasan pemakaian nomor dan login email/password setelah verifikasi; dialog login tetap menjelaskan kebutuhan akun sebelum melanjutkan.
- Landing, statistik publik, dan halaman informasi tetap terbuka; halaman fitur serta API memerlukan sesi USER/ADMIN. Default setelah login/registrasi: USER ke landing, ADMIN ke `/admin`. Tujuan APK dan profil eksplisit beserta query aman dipertahankan untuk kedua peran; tujuan USER lain tetap dibatasi ke landing.
- Navbar landing untuk tamu menaut ke section Beranda, Fitur, Cara Kerja, Komunitas, dan Mulai; setelah login menu berganti menjadi halaman fitur. Pada halaman informasi, tamu maupun pengguna masuk melihat Beranda serta tautan Tentang Guardian Lab, Kebijakan Privasi, dan Ketentuan Penggunaan. Navbar halaman fitur memakai menu fitur dengan gaya visual yang sama. Perilaku berlaku pada desktop dan menu ponsel; tautan section mempertahankan query halaman.
- `proxy.ts` hanya pemeriksaan JWT awal. Server tetap memverifikasi sesi database, kedaluwarsa/pencabutan, pemilik, dan peran terbaru. API mengembalikan 401 untuk tamu dan 403 untuk hak yang tidak cukup; mutasi memeriksa Origin. Saat URL internal Next memakai alamat bind wildcard atau normalisasi localhost, Host loopback browser pada port yang sama dipakai untuk perbandingan; header forwarded tidak menjadi sumber kepercayaan. Origin harus cocok persis, termasuk protokol dan port; localhost dan alamat IP loopback tetap origin berbeda.
- USER hanya membaca investigasi/sandbox miliknya; admin dapat meninjau sesuai perannya. Tautan hasil bukan akses publik. Data akun memakai `private, no-store`, scope akun/peran, dan tidak masuk cache bersama.
- Registrasi selalu USER. Password bcrypt maksimal 72 byte UTF-8; email maksimal 191 karakter. Body login/registrasi dibatasi 16 KiB melalui stream. Cookie HTTP-only, SameSite Lax, Secure saat production, masa berlaku tujuh hari. Logout mencabut sesi database dan cookie.
- Semua tombol keluar pada navbar desktop, menu ponsel, dan shell admin meminta konfirmasi. Pembatalan tidak mengirim request. Konfirmasi mencabut sesi database dan cookie melalui API logout; setelah berhasil browser mengganti halaman menjadi login. Kegagalan tetap ditampilkan pada dialog agar dapat dicoba kembali, tanpa menganggap sesi telah berakhir.
- `SESSION_SECRET` minimal 32 karakter tanpa nilai pengganti. Dengan Cache Components, baca sesi di batas Suspense yang sesuai.
- `bun run db:seed` hanya untuk lokal: empat akun demo, nomor, nama, kredensial dan perannya tetap ditetapkan di [demo-accounts.ts](../prisma/seeders/demo-accounts.ts); nomor akun seed ditandai terverifikasi sesuai permintaan pemilik. Seed mempertahankan riwayat/EXP sebelumnya sambil menambah aktivitas demo USER satu kali, dan mencabut sesi serta challenge bila password/peran/nomor berubah. Batas lingkungan, penanda simulasi dan perilaku seed ulang mengikuti [deployment](./deployment.md#alternatif-menjalankan-proses-di-host). Registrasi pengguna biasa tetap mengikuti verifikasi WhatsApp. Login memperbarui aktivitas masuk, bukan streak belajar.

Sumber: [lib/auth/](../lib/auth/), [validasi auth](../lib/validations/auth.ts), dan [proxy.ts](../proxy.ts).

## Profil pengguna

- Halaman profil memerlukan sesi aktif dan hanya menampilkan akun pemilik sesi. Avatar/nama pada navbar desktop dan tautan Profil saya pada menu ponsel membuka profil; menu aktif tetap memakai warna tanpa garis. Tujuan profil eksplisit dipertahankan setelah login, verifikasi atau pemulihan, untuk USER maupun ADMIN; default peran lainnya tetap sama.
- Informasi akun berisi nama, email, nomor WhatsApp tersamarkan, status verifikasi dan tanggal bergabung. Ringkasan pemeriksaan, EXP, peringkat, streak WIB, kuis lulus, kasus diselesaikan, lencana serta aktivitas terbaru memakai data tersimpan dan kontrak Academy yang sama. UI tidak menambahkan pencapaian, progres atau skor contoh di luar database; keadaan kosong/loading/gagal dibedakan. Data simulasi lokal hanya dibuat melalui seeder yang diminta secara eksplisit dan memakai penanda demo.
- Pengguna dapat mengganti nama tampilan miliknya, 2–50 karakter setelah trim, tanpa karakter kontrol. Payload ketat hanya menerima nama dan revisi. Penyimpanan memeriksa sesi, Origin, status aktif/terverifikasi dan revisi akun dalam transaksi; perubahan bersamaan menghasilkan 409. Email, nomor, password, peran, EXP dan data pengguna lain tidak dapat diubah melalui endpoint ini. Pembaruan nama memberi notifikasi ke navbar agar membaca ulang sesi dari server.
- Permintaan profil memakai private/no-store, scope akun/peran dan DTO terbatas. Password/hash, token sesi, OTP dan nomor telepon lengkap tidak dikirim. Body pembaruan dibatasi 4 KiB; UI menahan submit ganda, membatalkan request saat unmount, dan menyarankan muat ulang jika penyimpanan belum terkonfirmasi.
- Pemulihan password menaut alur WhatsApp/OTP yang sudah ada, tanpa mengubah kredensial atau mengirim kode otomatis dari halaman profil. Tidak menambah unggah avatar atau mengubah skema database.

Sumber: [layanan profil](../lib/profile/service.ts), [validasi profil](../lib/validations/profile.ts) dan [komponen profil](../components/profile/).

## Rekaman investigasi

`ForensicRecord` menjadi sumber tunggal ID, pemilik, jenis input, status, metadata, bukti, sumber/versi model, serta waktu proses untuk landing, riwayat, dan tindak lanjut. Tidak ada ID hasil sementara atau tabel riwayat tandingan.

| Status                               | Transisi yang diperbolehkan           |
| ------------------------------------ | ------------------------------------- |
| `RECEIVED`                           | `PROCESSING`, `FAILED`, `UNAVAILABLE` |
| `PROCESSING`                         | `COMPLETED`, `FAILED`, `UNAVAILABLE`  |
| `COMPLETED`, `FAILED`, `UNAVAILABLE` | Terminal                              |

- Transisi atomik memeriksa pemilik dan status sebelumnya; perubahan hasil hanya lewat layanan internal server. `COMPLETED` memerlukan hasil tervalidasi, sumber, serta versi model.
- Sebelum hasil tersedia, `riskLevel`, `riskScore`, `scamCategory`, dan `summary` bernilai `null`. Skor `0` hanya untuk hasil nyata; `startedAt` terisi saat proses dimulai dan `finishedAt` saat terminal.
- URL/QR membuat rekaman `RECEIVED` dan transisi `PROCESSING` dalam satu transaksi, memanggil model di luar transaksi, lalu menyimpan status akhir pada ID yang sama. APK melalui `PROCESSING` dan menyimpan laporan statis beserta status akhir secara atomik.
- Respons 201 berarti rekaman tersimpan, bukan penilaian risiko selesai. Persistensi gagal tidak mengembalikan ID sukses.
- Sanitasi PII, kredensial URL, query/fragment, dan nilai sensitif path dilakukan sebelum persistensi maupun panggilan AI. URL inferensi mempertahankan encoding path yang tidak berubah; query/fragment hanya menyisakan penanda keberadaan konteks. Target sensitif tersimpan sebagai representasi tersanitasi; pemeriksaan lanjutan dapat memerlukan input ulang. Sanitasi tetap heuristik, bukan bukti anonimisasi lengkap.
- Rekaman lama `LEGACY_UNVERIFIED` tidak dianggap hasil model terverifikasi. Helper DeepSeek/leksikal lama tetap tidak aktif.

Sumber: [layanan investigasi](../lib/investigations/service.ts), [skema/DTO](../lib/validations/investigation.ts), [sanitasi](../lib/investigations/privacy.ts), dan [PII Scrubber](../lib/security/pii-scrubber.ts).

### Model URL/QR

- Landing memuat keterangan singkat bahwa AI menghasilkan indikator riset yang perlu diverifikasi, serta FAQ tentang skor rendah dan cakupan model. Skor rendah bukan jaminan aman atau probabilitas phishing pada penggunaan nyata. Model membaca pola URL, termasuk hasil dekode QR, tanpa membuka isi halaman atau mengikuti redirect; sandbox merupakan tindakan terpisah yang dipilih pengguna. Copy ini tidak mengubah verdict, status, atau skor hasil tersimpan.
- Backend mengirim URL tersanitasi dan provenance `URL`/`QR` ke `/predict` pada alamat server tepercaya `GUARDIAN_ML_URL`. Timeout lima detik, respons dibatasi 64 KiB dan divalidasi; tidak ada cache, redirect, retry otomatis, atau kunjungan ke target.
- Respons complete menyimpan `analysisSource=GUARDIAN_ML`, versi model dan bukti tervalidasi pada `technicalEvidence.urlModel`. Kategori laporan adalah analisis pola URL; tidak mengarang kedok penipuan atau bukti halaman.
- Risiko mengikuti `risk_band` asli. Skor tampilan dibulatkan dari `model_score * 100`; skor asli dan threshold tetap tersimpan. Skor bukan probabilitas phishing pada trafik nyata. LOW tetap perlu verifikasi.
- Konfigurasi kosong/tidak valid, timeout, gangguan jaringan, respons rusak atau model unavailable menghasilkan `UNAVAILABLE` dengan risiko/skor kosong. Model unsupported atau URL yang tidak dapat disanitasi menghasilkan `FAILED` dan HTTP 422 dengan ID; respons hasil selesai/unavailable adalah 201 setelah tersimpan.
- Integrasi tersedia bagi akun terverifikasi tanpa pembatasan admin. Layanan Python tetap privat; integrasi tidak mengubah status kesiapan produksi model atau memproses ulang rekaman terminal lama.

Sumber: [adapter model](../lib/analysis/guardian-ml.ts), [kontrak respons](../lib/validations/guardian-ml.ts), [sanitasi URL inferensi](../lib/security/model-url.ts), dan [setup model](./deployment.md#layanan-model-urlqr).

## Input URL, QR, dan APK

- Landing menyediakan bar URL dan dialog unggah QR. `?tab=qr` membuka dialog setelah hydration bila tidak sedang menampilkan hasil; tombol QR memakai push history, penutupan memakai replace ke `tab=url`. Back/Forward menyelaraskan tampilan. Pengiriman tetap manual dan membutuhkan login.
- QR dan autentikasi tidak tampil sebagai dua modal sekaligus. Pembatalan login mengembalikan dialog QR beserta pilihan lokalnya; setelah login berkas dipilih ulang. Berkas tidak disimpan pada URL/storage browser.
- APK berada di `/apk`, dengan sesi database wajib sebelum uploader tampil. Proxy menjadi pemeriksaan awal; API tetap mengotorisasi sebelum membaca berkas. Login/registrasi dari APK kembali ke tujuan APK yang aman untuk USER/ADMIN, termasuk saat sesi sudah aktif.
- Hasil APK memakai `?investigation=<id>` dan mode yang sama dengan presenter bersama; ID jenis lain mengarah ke detail riwayat. Tautan lama `/?tab=apk` dialihkan ke halaman APK, hanya mempertahankan ID/mode yang valid.
- Validasi tampil di dekat input. Berkas pengganti tidak valid menghapus pilihan lama; perubahan input membersihkan hasil tampilan tanpa menghapus rekaman. Pending dan kunci sinkron mencegah submit ganda; tidak ada retry pengiriman otomatis.
- URL diketik atau ditempel menggunakan cara bawaan perangkat; tombol unggah QR berada di kolom yang sama. Validasi URL saat submit memfokuskan input tanpa menggeser tombol saat klik.
- URL langsung dan hasil QR memakai satu jalur validasi tanpa membuat rekaman URL kedua. HTTP/HTTPS saja; domain lengkap tanpa protokol memakai HTTPS. Tolak kredensial URL, spasi internal, karakter kontrol, dan backslash. Penerimaan input tidak mengunjungi target.
- Batas URL 16.384 karakter setelah normalisasi. QR menerima PNG/JPG/WebP statis, maksimal 5 MiB dan 16 juta piksel; decoder Sharp/jsQR membaca piksel nyata, orientasi, ruang warna, dan alpha. APK satu berkas `.apk`, maksimal 50 MiB.
- Request dibatasi dari ukuran stream aktual, termasuk tanpa Content-Length. Kontrak JSON/multipart dan overhead berada pada kode pembaca request.
- QR tidak terbaca, non-URL, atau URL tidak valid menghasilkan rekaman `FAILED`, respons 422, dan ID. Isi non-URL tidak disimpan. Input kosong/ganda/metadata salah ditolak sebelum rekaman dibuat.
- Kegagalan server mempertahankan input. Bila respons penyimpanan tidak dapat dipastikan, jelaskan status belum diketahui dan arahkan ke riwayat sebelum kirim ulang. Object URL pratinjau dicabut ketika berganti/unmount.

Sumber: [skema input](../lib/validations/analysis-input.ts), [request reader](../lib/investigations/request-input.ts), [penerimaan URL](../lib/investigations/receive-url.ts), [QR decoder](../lib/analysis/qr.ts), [gateway URL/QR](../components/landing/use-analysis-gateway.ts), [uploader APK](../components/apk/apk-investigation.tsx), dan [hook pengiriman](../lib/hooks/use-investigation-submit.ts).

## Hasil dan riwayat

- Landing page (`/`) menyajikan hasil investigasi phishing dalam dialog interaktif berbasis Base UI Dialog yang dapat ditutup, menjaga alur vertikal halaman landing tetap bersih tanpa sisipan section inline.
- Landing/detail/list menggunakan DTO yang sama. `?investigation=<id>&tab=<jenis>` memuat ulang hasil tersimpan; `?mode=geek` mempertahankan mode. Pergantian akun/ID membersihkan data lama dan respons terlambat diabaikan.
- `RECEIVED`/`PROCESSING` dipoll tiga detik ketika halaman terlihat; terminal menghentikan polling. Refresh/fokus hanya GET, tanpa membuat investigasi baru. Timeout 15 detik memakai AbortController baru pada setiap request agar retry tetap bekerja.
- Hasil lengkap memerlukan status `COMPLETED`, sumber/versi, skor 0–100, kategori, ringkasan, dan bukti valid. Label/warna mengikuti verdict tersimpan; hasil parsial/legacy tidak membuka ekspor atau kontribusi.
- Detail Lihat rekaman memakai tampilan khusus Riwayat dengan hook investigasi, DTO serta validasi hasil yang sama. Metadata menampilkan tanggal WIB, sumber, versi, waktu proses dan provenance unduhan bila ada. Mode manusia/teknis serta pencarian bukti tetap tersimpan pada query `mode`/`evidence`; metadata model lengkap dapat dibuka tanpa membulatkan skor asli atau mengubah threshold. Data demo ditandai sebagai simulasi lokal. Aksi Share Card/pengajuan hanya muncul untuk hasil lengkap; tautan Ruang Uji membuka alur yang sudah ada tanpa memulai sesi otomatis.
- Mode manusia/teknis membaca bukti tersimpan yang sama. Jangan menambahkan C2, permissions, entropy, atau narasi penipuan ketika bukti tidak ada. DTO tidak mengirim relasi identitas akun dan menyaring ulang data legacy tanpa mengubah baris asal.
- Hasil v6 memakai label indikator model serta keterangan riset/perlu verifikasi pada landing, detail, riwayat, Share Card, dan snapshot komunitas. Mode teknis menyajikan skor asli, threshold, versi/hash artifact, serta scope URL-only dari bukti tersimpan.
- Riwayat menggunakan envelope `records`, `pagination`, `summary`; default 12/maksimal 50 per halaman. Filter jenis/risiko/status/pencarian/tanggal diterapkan sebelum pagination, urutan `createdAt` dan `id` menurun.
- Total/agregasi berasal dari seluruh hasil terfilter pada snapshot database yang sama. Risiko hanya menghitung hasil lengkap terverifikasi. Tanggal API UTC; kontrol UI mengubah hari lokal menjadi rentang UTC. Filter tersinkron query dan kembali ke halaman satu saat berubah.
- Bedakan 401, 403, 404, filter salah, kosong, dan gangguan jaringan. Snapshot lama diberi label; respons rusak tidak menjadi hasil pengganti.

Sumber: [history](../lib/investigations/history.ts), [serialisasi](../lib/investigations/serialize.ts), [hook pembaca](../lib/hooks/use-api-resource.ts), dan [tampilan bersama](../components/shared/investigation-view.tsx).

## APK statis

- Halaman Bedah APK menyediakan area tarik/lepas dan tombol pemilih file, ringkasan nama/ukuran berkas serta ganti/hapus. Tombol Periksa APK aktif setelah berkas valid dipilih dan tetap memerlukan submit manual. Keterangan status analisis statis & AI aktif terlihat pada panel form. Ilustrasi membedakan menunggu file, file terpilih, pemuatan dan proses; hasil tetap membaca rekaman tersimpan melalui presenter bersama.

- Server memeriksa ZIP/CRC/manifest lalu menjalankan JADX untuk manifest biner/resource dan DEX; APK tidak dipasang, dieksekusi, atau dikirim ke model. Java 11+ dan toolchain terverifikasi diperlukan; setup ada di [deployment.md](./deployment.md).
- Batas arsip, dekompresi, JVM, durasi, output, dan pembacaan sumber mengikuti [limits.ts](../lib/apk/limits.ts). Tolak traversal, symlink, duplikasi ambigu, enkripsi, arsip palsu, serta XML berbahaya.
- Satu ekstraksi aktif per proses aplikasi; sibuk mengembalikan 429 sebelum rekaman dibuat. Child process tanpa shell menggunakan environment terbatas, tanpa secret, serta cleanup direktori job miliknya setelah selesai/gagal/batal.
- `inputMetadata.apkStatic` menyimpan status `EXTRACTED`/`PARTIAL`, metadata manifest/izin, cakupan, origin dinonaktifkan, fingerprint indikator token, dan potongan Java tersanitasi. Binary/hasil mentah tidak disimpan permanen; pemeriksaan ulang memerlukan unggahan ulang.
- Izin adalah kemampuan yang diminta, bukan bukti pencurian. Data parsial menyatakan keterbatasan; indikator kosong tidak diisi dengan bukti buatan. Pemeriksaan tidak membuktikan installability atau seluruh perilaku runtime.
- Sukses statis & AI: 201 dengan rekaman `COMPLETED` memuat temuan statis JADX pada `inputMetadata` dan penilaian ancaman DeepSeek AI / heuristik pada `result` (`riskLevel`, `riskScore`, `scamCategory`, `summary`, `deceptionTricks`, `technicalEvidence`). Gagal setelah penerimaan: 422 dengan ID `FAILED`; input salah tanpa ID. Alasan ramah pengguna tidak membocorkan stdout/stderr atau path mesin.

Sumber: [lib/apk/](../lib/apk/), [kontrak laporan](../lib/validations/apk-static.ts), dan [toolchain](../lib/apk/toolchain.json).

## Sandbox web dan karantina

- Ruang Uji menampilkan form mulai di samping ilustrasi browser, dengan ringkasan isolasi, durasi dan pembersihan di bawah. Badge kesiapan membaca `available` dari layanan; ilustrasi tidak membuat sesi atau stream. Selama `STARTING`/`ACTIVE`/`UNKNOWN`, target awal dibaca dari sesi, form mulai disembunyikan, dan kontrol periksa status serta penghentian tersedia pada toolbar. Navigasi target baru tetap memberi pemberitahuan bahwa target belum dibuka. Timer ditampilkan sebagai menit:detik dari deadline server; status dan daftar unduhan selalu berasal dari respons layanan.
- Mulai hanya melalui aksi pengguna, bukan GET/pemuatan halaman. Target publik divalidasi; hapus query/fragment hanya setelah persetujuan, tolak PII pada path, IP literal, host lokal/khusus, dan port selain 80/443.
- UUID permintaan mencegah alokasi ganda. Target/sumber berasal dari database; sumber harus URL/QR yang dapat diakses dan cocok. Navigasi target baru tidak mengganti sesi yang masih aktif, serta mereset persetujuan parameter pada form.
- `STARTING` menjadi `ACTIVE` setelah stream siap. Tiket HMAC, cookie HttpOnly, dan kata sandi VNC acak melindungi stream. Polling membaca ulang status agar respons terlambat tidak mengaktifkan sesi terminal.
- Timer mengikuti deadline server. Stop menunggu konfirmasi penghapusan; kegagalan konfirmasi menghasilkan `UNKNOWN`. Tutup tab/logout tidak memperpanjang sesi. Watchdog/reaper membersihkan container dan jaringan.
- Browser melewati proxy egress yang memblokir alamat lokal/metadata setelah DNS dan redirect. Clipboard, perangkat, transfer file lokal, serta auto-open diblokir. Next tidak memegang socket Docker; detail kapasitas/jaringan ada di [deployment.md](./deployment.md).
- APK unduhan dikarantina pada server dengan nama UUID, hash, dan ukuran. Analisis memerlukan pemilik sesi aktif, memakai pipeline statis, dan menghasilkan ID investigasi dengan provenance. Mapping unik sesi/unduhan mencegah duplikasi; retry membaca hasil sama, termasuk setelah expiry. Container menghapus binary, laporan tersimpan tetap tersedia.

Sumber: [lib/sandbox/](../lib/sandbox/), [broker](../docker/sandbox/broker/), dan [validasi](../lib/validations/sandbox.ts).

## Academy dan CMS

- Katalog Belajar menyediakan pencarian `q`, filter `category` dan `status` pada URL, tanpa mengganti data kuis yang diterbitkan. Filter mendukung reload/Back/Forward; nilai kategori/status tidak dikenal memakai tampilan semua. Latihan berikutnya memilih item pertama yang belum lulus, atau latihan ulang ketika semuanya lulus. Progres katalog menghitung kelulusan dari daftar terbit saat ini; ringkasan kelulusan akun tetap memakai progres tersimpan, termasuk kuis yang kemudian diarsipkan. Tanggal aktivitas/lencana ditampilkan dalam WIB. Kuis tetap memakai pilihan tunggal/jamak, dan pembahasan hanya muncul dari hasil penilaian server.

- Halaman latihan menyediakan peta nomor soal, hitungan terjawab dari pilihan aktual, tautan meninjau jawaban serta kartu hasil/pembahasan. Navigasi nomor hanya memakai jangkar halaman dan tidak mengirim jawaban. Radio/checkbox, satu kali hadiah, UUID, revisi, scope akun dan penilaian tetap mengikuti kontrak server. Thumbnail memakai gambar materi yang tersedia atau ilustrasi kategori; progres menjawab tidak ditafsirkan sebagai jawaban benar. Setelah kelulusan, pengantar beralih ke keterangan latihan ulang tanpa tambahan EXP.
- Kuis terbit, EXP, streak, lencana, dan latihan terbaru berasal dari MySQL. API sebelum penilaian tidak mengirim kunci/pembahasan.
- Server menilai seluruh set pilihan yang benar; kelulusan minimal 70% dari pecahan asli. Tolak soal/opsi hilang, asing, duplikat, revisi usang, dan kuis diarsipkan.
- Transaksi mengunci akun/revisi. EXP hanya pada kelulusan pertama per kuis; gagal/ulang nol EXP dan tetap tersimpan. UUID dengan jawaban sama mengembalikan attempt yang sama; payload berbeda pada UUID sama menghasilkan 409.
- Streak memakai hari kalender WIB dan `lastLearningAt`, terpisah dari login. Lencana Langkah Pertama setelah satu kelulusan tanpa bonus; jangan membuka lencana rekaan.
- CMS ADMIN mengelola soal tunggal/jamak/benar-salah, materi, draf/publikasi, dan arsip. Sanitasi diikuti validasi agar konten wajib tetap terbaca. Edit memakai revisi; arsip tidak menghapus attempt/EXP.
- Editor CMS menyediakan thumbnail opsional melalui pilih berkas atau drag-and-drop, pratinjau, ganti, hapus dan batal perubahan gambar. JPG/PNG/WebP statis maksimal 5 MB dan 16 megapiksel dinormalisasi server menjadi WebP rasio 2:1 (1200 × 600), tanpa metadata sumber. Thumbnail disimpan di MySQL dalam transaksi kuis beserta audit; gagal validasi, revisi usang atau audit gagal tidak mengubah gambar tersimpan. Mengubah teks tanpa memilih gambar mempertahankan thumbnail. Penghapusan mengembalikan ilustrasi kategori bawaan. Katalog pengguna dan daftar CMS memakai gambar tersimpan; ilustrasi bawaan juga dipakai jika gambar gagal dimuat. API gambar memerlukan sesi aktif, dan USER hanya dapat membaca gambar kuis terbit. Binary gambar serta nama berkas unggahan tidak dimasukkan ke JSON katalog atau audit. Upload tidak mengubah EXP/progres.
- Seed materi bersifat idempoten tanpa menimpa edit admin. Batas soal/opsi/EXP mengikuti skema; setup seed ada pada deployment.

Sumber: [lib/academy/](../lib/academy/) dan [validasi Academy](../lib/validations/academy.ts).

## Guardian Share Card

- Menu Bagikan Hasil memisahkan pemilihan sumber, pratinjau kartu, dan aksi unduh/salin/bagikan. Tombol aksi menyertakan keterangan singkat tentang gambar, pesan dan pilihan aplikasi, tanpa menambahkan pengiriman otomatis. Indikator tiga langkah menandai pemilihan sumber atau peninjauan kartu yang sedang terbuka; indikator bukan tombol untuk melewati kebutuhan hasil lengkap. Pilihan tetap berasal dari riwayat; tanpa hasil lengkap tidak ada kartu atau kontrol ekspor. Pengguna dapat membuka pratinjau pesan WhatsApp dari konten tersanitasi yang sama sebelum menyalin. Persiapan PNG, gagal/retry, hasil salin, fallback manual dan kemampuan berbagi membaca state sebenarnya.

- `/act?id=...` membaca investigasi lengkap melalui ID, bukan target/skor/temuan dari query. Hasil stale yang gagal diperbarui tidak boleh diekspor.
- Satu representasi konten dipakai pratinjau, PNG, dan pesan. Skor nol valid; SAFE/LOW memakai kartu netral. Maksimal tiga temuan unik yang nyata, tanpa mengisi kekurangan dengan rekaan.
- Kartu v6 menyebut skor indikator, riset nonkomersial, dan kebutuhan verifikasi. Keterangan batas model tidak ikut dipotong bersama ringkasan.
- Target/indikator dinonaktifkan dan PII disaring ulang. Jangan sertakan bukti mentah, token, identitas pemilik, atau tautan riwayat privat. Hostname dipertahankan lengkap; konten panjang dipersingkat dengan penanda.
- `html-to-image` mengekspor PNG 1200 px dari kanvas 600 px. Persiapan/error/retry terlihat; blob hanya di memori, dibuang saat scope/hasil berubah, dan object URL dicabut setelah penggunaan.
- Salin pesan menyediakan fallback manual. Berbagi file hanya jika didukung browser, dengan file siap sebelum klik; pengguna memilih aplikasi tujuan. Pembatalan dibedakan dari kegagalan. Tidak ada publikasi atau pengiriman pesan otomatis.

Sumber: [lib/share-card/](../lib/share-card/) dan [komponen Act](../components/act/).

## Komunitas, latihan, dan peringkat

- Detail Pelajari Kasus mengelompokkan snapshot, status/metadata dan latihan. Mode manusia/teknis serta pencarian bukti mengikuti query yang sama; bukti hanya berasal dari snapshot tersanitasi. Progres/peta soal menghitung pilihan yang terisi, bukan kebenaran. Soal dan hasil memakai komponen presentasi Belajar, sementara penilaian, UUID, revisi, kelulusan semua soal dan hadiah pertama tetap memakai layanan latihan kasus. Preview pengajuan serta moderasi admin mempertahankan presentasi default.

- Pengajuan hanya menerima ID investigasi milik pengguna dan consent. Preview/snapshot disanitasi serta immutable setelah diajukan; perubahan sumber tidak mengubah bukti yang dimoderasi. `sourceRecordId` unik mencegah duplikasi.
- Status `PENDING_REVIEW` diputuskan atomik satu kali menjadi `APPROVED`/`REJECTED`. Persetujuan memerlukan konfirmasi privasi; setiap keputusan memerlukan alasan. Admin tidak menyetujui pengajuan sendiri.
- Pending/ditolak privat bagi pemilik/admin; anggota hanya membaca snapshot disetujui yang valid, tanpa identitas pengaju atau bukti mentah. Sumber dihapus menyembunyikan kasus, sementara snapshot tetap dapat ditinjau pemilik/admin; akun dihapus mengikuti cascade.
- Snapshot publik hanya menyertakan bukti yang diizinkan: izin Android, entropy tersimpan, origin dinonaktifkan, dan respons model URL tervalidasi tanpa target. Metadata v6 tetap membawa status riset/perlu verifikasi; snapshot lama tanpa metadata tetap terbaca. Token, path/query C2, potongan kode mentah, serta ID investigasi privat tidak ikut.
- Latihan dari indikator v6 menilai pembacaan hasil tersimpan, bukan menganggap skor model sebagai ground truth phishing.
- Latihan kasus memakai tiga soal dari snapshot; semua benar untuk lulus. Kelulusan pertama memberi 30 EXP dan lencana Pembaca Bukti tanpa bonus. Membaca/gagal/ulang tidak memberi EXP; revisi, transaksi, dan UUID menjaga idempotensi serta streak Academy.
- Leaderboard anggota memakai EXP USER aktual dan alias Guardian anonim, dengan pagination. Statistik landing berasal dari database; landing menampilkan pengantar Academy/komunitas dan FAQ tanpa peringkat contoh.
- Mutasi, filter, pagination, dan batas body mengikuti skema/API; tidak menerima skor atau bukti buatan klien.

Sumber: [lib/community/](../lib/community/), [validasi komunitas](../lib/validations/community.ts), dan [challenge](../lib/validations/community-challenge.ts).

## Administrasi dan operasional

- Seluruh halaman dan API admin memeriksa sesi ADMIN aktif di server. Penangguhan akun mencabut sesi login dan challenge akses yang masih terbuka; login, penerbitan sesi, pengambilan sesi, serta transaksi penilaian menolak akun yang ditangguhkan. Pemulihan mempertahankan verifikasi, riwayat dan EXP sebelumnya. Leaderboard mengecualikan akun yang sedang ditangguhkan tanpa mengubah EXP tersimpan.
- Pengelolaan pengguna menyediakan pencarian, filter peran/status/verifikasi, aktivitas dan sesi tanpa token/cookie. Penangguhan, pemulihan, pencabutan semua sesi dan perubahan peran memerlukan alasan serta revisi data terakhir. Akun sendiri tidak dapat diubah melalui menu ini. Perubahan peran memerlukan akun aktif terverifikasi; administrator aktif terakhir dilindungi. Penguncian transaksi menserialisasi perubahan akses dan memeriksa ulang peran pelaku sebelum perubahan disimpan.
- Investigasi admin membaca hasil tersanitasi yang sama dengan Riwayat. Catatan dan status tinjauan manusia tersimpan terpisah dengan pemeriksa serta revisinya. Penyimpanan tinjauan tidak mengubah skor, temuan, sumber atau versi model asli.
- Persetujuan/penolakan kasus memerlukan alasan minimal 10 karakter setelah sanitasi; persetujuan juga memerlukan konfirmasi privasi. Larangan meninjau pengajuan sendiri tetap berlaku. Admin dapat menarik publikasi yang sudah disetujui dengan alasan; snapshot dan keputusan sebelumnya tetap tersimpan. Publikasi yang ditarik tersembunyi dari daftar/detail publik serta tidak menerima latihan baru, sementara pemilik dan admin dapat membacanya. Penghargaan dari latihan yang telah selesai tidak dicabut.
- Pembuatan, pembaruan dan pengarsipan kuis memakai CMS Academy dengan revisi dan sanitasi yang sama. Pengarsipan menyembunyikan kuis tanpa menghapus riwayat/EXP.
- Log aktivitas bersifat baca saja melalui API. Mutasi akses pengguna, tinjauan investigasi, keputusan/penarikan kasus, perubahan kuis dan ekspor laporan ditulis bersama pelaku, waktu, objek dan konteks yang dibatasi. Mutasi dan auditnya berada dalam transaksi yang sama; kegagalan audit membatalkan mutasi. Password, OTP, token sesi, credential layanan dan bukti mentah tidak masuk log. Keputusan lama tidak dibuatkan log historis rekaan.
- Dashboard menyediakan ringkasan global, antrean, investigasi terbaru dan tren bertanggal. Laporan menghitung agregat pengguna, investigasi menurut jenis/status, percobaan/kelulusan kuis, publikasi aktif yang disetujui dalam periode dan sesi sandbox aktif saat ini. Periode WIB default 30 hari, maksimal 366 hari. Grafik memiliki tabel harian. Ekspor CSV berisi tanggal dan angka agregat, tanpa identitas akun atau target; ekspor memerlukan ADMIN aktif dan dicatat dalam audit.
- Monitor membaca health model dan broker, koneksi database, sesi sandbox yang belum kedaluwarsa serta hasil permintaan OTP 24 jam terakhir. Monitor tidak menjalankan inferensi atau mengirim OTP. Konfigurasi token dibedakan dari keterjangkauan layanan, penerimaan gateway dibedakan dari pesan terkirim, dan artefak model tersedia dibedakan dari gate produksi. Versi hasil terakhir berasal dari rekaman; versi layanan hanya ditampilkan bila health memberikannya. Kegagalan membaca statistik ditandai belum tersedia, bukan nol.

Sumber: [layanan admin](../lib/admin/), [API admin](../app/api/admin/), [kontrak admin](../lib/validations/admin.ts) dan [migrasi operasi admin](../prisma/migrations/20261108000000_admin_operations/migration.sql).
