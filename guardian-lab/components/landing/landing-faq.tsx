import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./community.module.css";
import shared from "./landing.module.css";

const questions = [
  {
    question: "Apakah tautan langsung dibuka di perangkat saya?",
    answer:
      "Tidak. Mengirim tautan atau gambar QR tidak membuka situsnya di perangkatmu. Jika kamu memilih sandbox, situs dibuka melalui browser terisolasi di server.",
  },
  {
    question: "Apakah skor rendah berarti tautan pasti aman?",
    answer:
      "Tidak. Skor AI adalah indikator pola URL, bukan jaminan keamanan atau probabilitas phishing pada penggunaan nyata. Tetap periksa pengirim dan tujuan tautan sebelum membuka atau memasukkan data.",
  },
  {
    question: "Apakah AI memeriksa isi situs dan redirect?",
    answer:
      "Belum. Model AI hanya membaca pola alamat URL, termasuk tautan dari gambar QR. Model tidak membuka halaman, mengikuti pengalihan (redirect), atau memindai isi situs. Membuka tautan melalui sandbox merupakan langkah terpisah yang kamu pilih sendiri.",
  },
  {
    question: "Apakah file APK akan dipasang?",
    answer:
      "Tidak. APK diperiksa secara statis untuk membaca izin dan temuan yang tersedia, tanpa memasang atau menjalankan aplikasinya di perangkatmu.",
  },
  {
    question: "Kapan saya perlu masuk ke akun?",
    answer:
      "Kamu bisa mengenal fitur di halaman ini tanpa akun. Untuk mengirim pemeriksaan dan mengakses fitur, masuk dengan akun yang nomor WhatsApp-nya sudah diverifikasi.",
  },
  {
    question: "Untuk apa nomor WhatsApp saya digunakan?",
    answer:
      "Nomor WhatsApp digunakan untuk mengirim OTP verifikasi akun dan pemulihan akses saat lupa password. Setelah nomor terverifikasi, login berikutnya cukup dengan email dan password.",
  },
  {
    question: "Kapan saya bisa membuat Share Card?",
    answer:
      "Share Card dapat dibuat dari hasil analisis yang sudah lengkap. Hasil yang masih diproses atau belum lengkap belum dapat dibagikan sebagai Share Card.",
  },
];

export function LandingFaq() {
  return (
    <section aria-labelledby="landing-faq-title" className={styles.faq}>
      <h3
        id="landing-faq-title"
        className={cn(shared.display, styles.faqTitle)}
        data-landing-reveal
      >
        Sebelum mulai, mungkin kamu penasaran.
      </h3>
      <p className={styles.faqIntro} data-landing-reveal data-landing-order="1">
        AI membantu membaca pola URL. Hasilnya merupakan indikator riset yang tetap perlu
        diverifikasi.
      </p>
      <div className={styles.questions}>
        {questions.map(({ question, answer }, index) => (
          <details key={question} data-landing-reveal data-landing-order={index % 3}>
            <summary>
              {question}
              <Plus aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
