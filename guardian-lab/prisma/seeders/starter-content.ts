import type { QuizInput } from "@/lib/validations/academy";

function question(
  questionText: string,
  options: string[],
  correctIndex: number,
  explanation: string,
) {
  return {
    questionText,
    questionType: "MULTIPLE_CHOICE" as const,
    options: options.map((text, i) => ({ id: `option-${i + 1}`, text })),
    correctAnswers: [`option-${correctIndex + 1}`],
    explanation,
  };
}
export const starterLessons: (QuizInput & { id: string })[] = [
  {
    id: "academy-url-basics",
    title: "Periksa alamat sebelum percaya",
    description: "Kenali susunan domain dan batas perlindungan HTTPS melalui contoh fiktif.",
    category: "SPOT_THE_PHISH",
    difficulty: "EASY",
    expReward: 50,
    published: true,
    questions: [
      question(
        "Pada bank-contoh.invalid.verifikasi.example, bagian mana yang menunjukkan domain utama?",
        ["bank-contoh.invalid", "verifikasi.example", "HTTPS"],
        1,
        "Nama merek di bagian kiri bisa berupa subdomain. Periksa keseluruhan nama host dan cocokkan dengan alamat yang diperoleh dari sumber resmi. Contoh ini memakai domain khusus dokumentasi.",
      ),
      question(
        "Apakah ikon gembok HTTPS membuktikan pemilik situs dapat dipercaya?",
        [
          "Ya, semua situs HTTPS telah diverifikasi keasliannya",
          "Tidak, HTTPS melindungi koneksi tetapi situs penipu juga dapat memakainya",
        ],
        1,
        "HTTPS mengenkripsi koneksi ke domain yang dibuka. HTTPS tidak membuktikan bahwa pemilik domain adalah organisasi yang kamu maksud.",
      ),
    ],
  },
  {
    id: "academy-message-basics",
    title: "Kenali tekanan dalam pesan",
    description: "Latih respons saat menerima pesan mendesak atau permintaan kode rahasia.",
    category: "SOCIAL_ENGINEERING",
    difficulty: "EASY",
    expReward: 50,
    published: true,
    questions: [
      question(
        "Pesan mengaku petugas dan mengancam memblokir akun dalam lima menit. Apa langkah awal yang tepat?",
        [
          "Segera mengirim kode OTP",
          "Hentikan percakapan dan verifikasi melalui kanal resmi yang dicari sendiri",
        ],
        1,
        "Desakan waktu membuat kita melewatkan pemeriksaan. Cari kanal resmi secara mandiri dan jangan memakai kontak yang diberikan pesan mencurigakan.",
      ),
      question(
        "Seorang pengirim meminta OTP untuk membatalkan transaksi. Apa respons yang aman?",
        [
          "Jangan bagikan kode dan periksa transaksi melalui aplikasi resmi",
          "Berikan kode karena transaksi akan dibatalkan",
        ],
        0,
        "OTP adalah kode persetujuan atau akses. Jangan memberikannya kepada pengirim pesan atau menelepon nomor yang disarankan pengirim.",
      ),
    ],
  },
  {
    id: "academy-permission-basics",
    title: "Pahami izin aplikasi Android",
    description:
      "Nilai kesesuaian izin dengan fungsi aplikasi tanpa langsung menyimpulkan semua APK berbahaya.",
    category: "DANGEROUS_PERMISSIONS",
    difficulty: "MEDIUM",
    expReward: 60,
    published: true,
    questions: [
      question(
        "Aplikasi undangan meminta akses membaca SMS. Apa yang perlu dilakukan?",
        [
          "Setujui semua izin agar undangan terbuka",
          "Tolak izin yang tidak sesuai fungsi dan periksa asal aplikasinya",
        ],
        1,
        "Akses SMS dapat membuka isi pesan sensitif. Ketidaksesuaian fungsi dan izin merupakan alasan untuk berhenti dan memeriksa, bukan bukti tunggal bahwa aplikasi pasti malware.",
      ),
      question(
        "Apa yang dapat dibuktikan oleh pemeriksaan statis APK?",
        [
          "Aplikasi pasti aman karena belum dijalankan",
          "Izin dan indikator yang ditemukan di berkas, dengan batasan terhadap perilaku saat berjalan",
        ],
        1,
        "Pemeriksaan statis membaca isi berkas. Kode tersembunyi atau perilaku saat runtime mungkin belum terlihat, sehingga hasilnya bukan jaminan keamanan.",
      ),
    ],
  },
];
