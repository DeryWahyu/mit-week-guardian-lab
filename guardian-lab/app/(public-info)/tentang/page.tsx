import type { Metadata } from "next";
import Link from "next/link";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { InfoPage } from "../_components/info-page";

export const metadata: Metadata = {
  title: "Tentang Guardian Lab | Guardian Lab",
  description:
    "Kenali Guardian Lab, platform untuk memahami tautan mencurigakan, memeriksa APK, belajar, dan berbagi peringatan.",
};

export default function AboutPage() {
  return (
    <InfoPage
      title="Tentang Guardian Lab"
      summary="Ruang untuk mengenali hal yang meragukan sebelum mengambil langkah di dunia digital."
    >
      <section>
        <h2>Mengenal risiko, satu langkah setiap kali</h2>
        <p>
          Guardian Lab membantu kamu memeriksa tautan dan kode QR, membaca informasi dari file APK,
          serta menjelajahi situs melalui browser terisolasi. Tujuannya memberi informasi yang
          lebih jelas agar kamu dapat menentukan tindakan berikutnya.
        </p>
      </section>
      <section>
        <h2>Tiga pilar Guardian Lab</h2>
        <ul>
          <li>
            <strong>Recognize: kenali.</strong> Mulai dari tautan, gambar QR, atau file APK.
            Baca status pemeriksaan dan temuan yang tersedia tanpa memasang APK di perangkatmu.
          </li>
          <li>
            <strong>Protect: periksa di ruang terpisah.</strong> Jika diperlukan, buka situs
            melalui sandbox web yang berjalan di server, dengan sesi maksimal 180 detik.
          </li>
          <li>
            <strong>Act: bagikan peringatan.</strong> Hasil yang sudah lengkap dapat dibuat
            menjadi Guardian Share Card. Kasus yang diajukan pemilik dan disetujui admin dapat
            dipelajari melalui komunitas.
          </li>
        </ul>
      </section>
      <section>
        <h2>Belajar dan memahami batasnya</h2>
        <p>
          Academy menyediakan pelajaran dan kuis untuk melatih kewaspadaan. Komunitas memberi
          ruang untuk mempelajari bukti dari kasus yang telah ditinjau.
        </p>
        <p>
          Informasi mengikuti hasil yang tersedia; hasil yang belum lengkap tidak diberi skor
          perkiraan. Pemeriksaan APK bersifat statis, dan eksekusi Android dinamis belum tersedia.
          Hasil pemeriksaan bukan jaminan bahwa suatu tautan atau aplikasi aman.
        </p>
        <p>
          Model AI membaca pola URL dan tautan hasil QR sebagai indikator riset nonkomersial.
          Model masih dikembangkan; skor rendah tetap perlu verifikasi. Isi halaman dan
          redirect tidak diperiksa oleh model ini.
        </p>
      </section>
      <section>
        <h2>Mulai dengan input pilihanmu</h2>
        <p>
          Kamu memilih dan mengirim sendiri tautan atau berkas yang ingin diperiksa. Buka{" "}
          <Link href={PUBLIC_ROUTES.homeWithGateway()}>bar pemeriksaan</Link> untuk memulai, atau
          baca <Link href={PUBLIC_ROUTES.privacy}>Kebijakan Privasi</Link> dan{" "}
          <Link href={PUBLIC_ROUTES.terms}>Ketentuan Penggunaan</Link> terlebih dahulu.
        </p>
      </section>
    </InfoPage>
  );
}
