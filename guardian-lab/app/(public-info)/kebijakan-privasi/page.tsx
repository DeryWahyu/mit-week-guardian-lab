import type { Metadata } from "next";
import Link from "next/link";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { InfoPage } from "../_components/info-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Guardian Lab",
  description:
    "Penjelasan pengolahan data akun, verifikasi WhatsApp, cookie sesi, input pemeriksaan, dan hasil investigasi di Guardian Lab.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Kebijakan Privasi"
      summary="Penjelasan tentang data yang diproses ketika kamu menggunakan Guardian Lab."
    >
      <section>
        <h2>Data akun dan penggunaannya</h2>
        <p>
          Saat mendaftar, kamu memberikan nama, email, nomor WhatsApp, dan password. Data akun
          digunakan untuk masuk, memverifikasi nomor, memulihkan akses, dan menghubungkan
          investigasi serta progres belajar dengan akunmu. Password disimpan dalam bentuk hash.
        </p>
      </section>
      <section>
        <h2>Verifikasi WhatsApp melalui Fonnte</h2>
        <p>
          Guardian Lab menggunakan Fonnte untuk mengirim OTP verifikasi dan pemulihan password.
          Nomor tujuan serta isi pesan OTP diteruskan ke layanan tersebut agar pesan dapat
          dikirim melalui WhatsApp. Kode memiliki masa berlaku dan tidak boleh dibagikan kepada
          orang lain.
        </p>
      </section>
      <section>
        <h2>Cookie dan sesi masuk</h2>
        <p>
          Cookie sesi digunakan untuk mengenali akun setelah kamu masuk. Cookie ini bersifat
          HttpOnly, sehingga tidak dapat dibaca langsung oleh JavaScript halaman. Sesi memiliki
          masa berlaku dan diperiksa kembali ketika kamu mengakses fitur yang membutuhkan akun.
        </p>
        <p>
          Keluar dari akun mengakhiri sesi yang digunakan. Tindakan ini tidak menghapus akun,
          riwayat investigasi, atau progres belajar yang tersimpan.
        </p>
      </section>
      <section>
        <h2>Input pemeriksaan dan riwayat</h2>
        <p>
          Tautan, gambar QR, dan file APK diproses setelah kamu memilih serta mengirimkannya.
          Rekaman pemeriksaan, metadata, status, dan temuan yang tersedia disimpan agar riwayat
          dapat dibuka kembali oleh akun yang berhak.
        </p>
        <p>
          Sistem menyaring informasi sensitif pada target dan bukti sebelum menyimpannya,
          termasuk kredensial URL serta nilai query dan fragment. Penyaringan otomatis tidak
          menggantikan kehati-hatianmu: jangan kirim password, OTP, token, atau kredensial korban.
        </p>
        <p>
          Untuk pemeriksaan AI, backend mengirim URL yang sudah disaring ke layanan model
          privat. Gambar QR didekode di server sebelum tautannya dikirim. Layanan model
          memproses pola URL tanpa membuka situs tujuan; skor dan metadata model disimpan
          bersama hasil investigasi. Data akun dan gambar QR tidak dikirim ke model URL.
        </p>
        <p>
          File APK diperiksa di server tanpa dipasang di perangkatmu. Sandbox web berjalan
          terpisah di server dan memiliki sesi maksimal 180 detik. Berakhirnya sesi sandbox tidak
          menghapus riwayat investigasi yang telah tersimpan.
        </p>
      </section>
      <section>
        <h2>Komunitas dan pembagian hasil</h2>
        <p>
          Pengajuan kasus komunitas membutuhkan persetujuan pemilik investigasi dan peninjauan
          admin sebelum dapat dibaca anggota lain. Kasus yang disetujui menampilkan salinan bukti
          yang telah disaring, bukan seluruh rekaman privat pemilik.
        </p>
        <p>
          Share Card tersedia untuk hasil yang sudah lengkap. Periksa kembali isi kartu sebelum
          mengunduh atau membagikannya di luar Guardian Lab, karena salinan yang kamu bagikan
          dapat diterima pihak lain.
        </p>
      </section>
      <section>
        <h2>Penggunaan data secara bertanggung jawab</h2>
        <p>
          Gunakan data dan berkas yang berhak kamu periksa. Penjelasan batas penggunaan layanan
          tersedia pada <Link href={PUBLIC_ROUTES.terms}>Ketentuan Penggunaan</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
