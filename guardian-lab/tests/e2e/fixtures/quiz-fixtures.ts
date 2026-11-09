/**
 * Test Fixtures: Guardian Academy Quizzes, Questions, Badges, and EXP Milestones
 */

export interface QuizQuestionFixture {
  id: string;
  questionType: "SPOT_THE_PHISH" | "SOCIAL_ENGINEERING" | "DANGEROUS_PERMISSIONS";
  prompt: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
  expReward: number;
}

export const ACADEMY_QUIZ_FIXTURES: QuizQuestionFixture[] = [
  {
    id: "q-spot-phish-bca",
    questionType: "SPOT_THE_PHISH",
    prompt:
      "Manakah dari dua alamat situs berikut yang merupakan situs internet banking resmi Bank BCA?",
    options: [
      { id: "opt-1", text: "https://klikbca.com", isCorrect: true },
      { id: "opt-2", text: "https://klikbca-verifikasi-otp.xyz", isCorrect: false },
    ],
    explanation:
      "Domain resmi Bank BCA adalah klikbca.com. Domain penipu menambahkan kata-kata jebakan dan menggunakan TLD .xyz.",
    expReward: 50,
  },
  {
    id: "q-social-eng-kurir",
    questionType: "SOCIAL_ENGINEERING",
    prompt:
      "Trik psikologis apa yang dimanfaatkan pelaku saat mengirimkan file .apk dengan pesan 'Paket Anda Tertahan Segera Cek Resi'?",
    options: [
      { id: "opt-1", text: "Rasa panik dan ketergesa-gesaan (Urgency & Fear)", isCorrect: true },
      {
        id: "opt-2",
        text: "Rasa percaya karena pengirim memakai foto profil seragam polisi",
        isCorrect: false,
      },
      { id: "opt-3", text: "Iming-iming hadiah undian gratis", isCorrect: false },
    ],
    explanation:
      "Pelaku memanfaatkan emosi kepanikan agar korban langsung mengklik dan menginstal file tanpa memeriksa ekstensi .apk.",
    expReward: 40,
  },
  {
    id: "q-perm-sms-receiver",
    questionType: "DANGEROUS_PERMISSIONS",
    prompt:
      "Jika sebuah aplikasi pelacak paket ekspedisi meminta izin 'android.permission.RECEIVE_SMS', apakah izin ini wajar?",
    options: [
      { id: "opt-1", text: "Wajar, karena kurir perlu mengirim SMS konfirmasi", isCorrect: false },
      {
        id: "opt-2",
        text: "Berbahaya & Tidak Wajar! Izin ini digunakan menyadap SMS kode OTP perbankan",
        isCorrect: true,
      },
      { id: "opt-3", text: "Wajar, asalkan HP terhubung ke WiFi", isCorrect: false },
    ],
    explanation:
      "Aplikasi ekspedisi kurir resmi hanya memerlukan koneksi internet untuk mengecek nomor resi, tidak pernah butuh menyadap SMS masuk.",
    expReward: 60,
  },
];

export const BADGE_FIXTURES = [
  {
    code: "ANTI_QUISHING_MASTER",
    title: "Anti-Quishing Master",
    description: "Selesaikan 5 analisis dan investigasi kode QR berbahaya",
    expReward: 100,
  },
  {
    code: "APK_DISSECTOR",
    title: "APK Dissector",
    description: "Berhasil membongkar manifest dan bot token dari sampel malware APK",
    expReward: 150,
  },
  {
    code: "PHISHING_HUNTER",
    title: "Phishing Hunter",
    description: "Mendeteksi 10 tautan typosquatting dan mengekspor Guardian Share Card",
    expReward: 200,
  },
];

export const GUARDIAN_RANKS = [
  { minExp: 0, maxExp: 99, title: "Recruit" },
  { minExp: 100, maxExp: 299, title: "Junior Analyst" },
  { minExp: 300, maxExp: 599, title: "Cyber Sentinel" },
  { minExp: 600, maxExp: Infinity, title: "Forensic Master" },
];
