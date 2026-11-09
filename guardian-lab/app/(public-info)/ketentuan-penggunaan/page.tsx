import type { Metadata } from "next";
import Link from "next/link";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { InfoPage } from "../_components/info-page";

export const metadata: Metadata = {
  title: "Ketentuan Penggunaan | Guardian Lab",
  description:
    "Panduan penggunaan Guardian Lab secara bertanggung jawab, termasuk akun, input pemeriksaan, sandbox, dan pembagian hasil.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Ketentuan Penggunaan"
      summary="Gunakan Guardian Lab untuk memahami risiko digital dan memilih tindakan dengan lebih hati-hati."
    >
      <section>
        <h2>Tujuan dan batas penggunaan</h2>
        <p>
          Guardian Lab menyediakan pemeriksaan input, sandbox web, pembelajaran, dan pembagian
          peringatan. Gunakan layanan pada tautan atau berkas yang berhak kamu periksa, serta
          hormati privasi dan hak pihak lain.
        </p>
        <p>
          Jangan gunakan layanan untuk mengakses akun tanpa izin, mencuri data, menyerang
          sistem, atau menyebarkan kredensial dan informasi pribadi orang lain.
        </p>
      </section>
      <section>
        <h2>Akun dan akses fitur</h2>
        <p>
          Halaman pengenalan dan informasi dapat dibaca tanpa login. Mengirim pemeriksaan dan
          mengakses fitur membutuhkan akun dengan nomor WhatsApp yang sudah diverifikasi. Jaga
          password serta OTP milikmu dan gunakan akunmu sendiri.
        </p>
      </section>
      <section>
        <h2>Input dan hasil pemeriksaan</h2>
        <p>
          Tautan, gambar QR, dan APK dipilih serta dikirim manual oleh pengguna. Jangan sertakan
          password, OTP, token, atau kredensial asli korban dalam input pemeriksaan.
        </p>
        <p>
          Hasil mengikuti bukti yang tersedia dan dapat memiliki keterbatasan atau belum
          lengkap. Izin aplikasi menunjukkan kemampuan yang diminta, bukan dengan sendirinya
          bukti pencurian. Tidak ditemukannya suatu indikator bukan jaminan bahwa situs atau
          aplikasi aman.
        </p>
        <p>
          Indikator AI dari pola URL disediakan untuk riset nonkomersial dan masih perlu
          verifikasi. Skor bukan probabilitas phishing pada trafik nyata atau keputusan yang
          sudah dikonfirmasi. Model tidak memeriksa isi halaman maupun redirect.
        </p>
      </section>
      <section>
        <h2>APK dan sandbox</h2>
        <p>
          Pemeriksaan APK bersifat statis, tanpa memasang atau menjalankan aplikasinya di
          perangkatmu. Eksekusi Android dinamis belum tersedia.
        </p>
        <p>
          Sandbox web dibuka melalui tindakanmu dan berjalan di server terisolasi dengan batas
          sesi maksimal 180 detik. Jangan memasukkan kredensial asli ke situs yang sedang
          diperiksa atau menggunakan sandbox untuk aktivitas tanpa izin.
        </p>
      </section>
      <section>
        <h2>Share Card dan komunitas</h2>
        <p>
          Share Card hanya dapat dibuat dari hasil yang sudah lengkap. Bagikan informasi sesuai
          bukti, tanpa menambahkan tuduhan atau data pribadi. Kasus komunitas memerlukan
          persetujuan pemilik investigasi dan peninjauan admin sebelum diterbitkan kepada anggota.
        </p>
      </section>
      <section>
        <h2>Informasi terkait</h2>
        <p>
          Cara data diproses dijelaskan pada{" "}
          <Link href={PUBLIC_ROUTES.privacy}>Kebijakan Privasi</Link>. Untuk mengenal fungsi
          platform, baca <Link href={PUBLIC_ROUTES.about}>Tentang Guardian Lab</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
