export const DEMO_VERSION = "local-demo-v1";
export const DEMO_ANALYSIS_SOURCE = "LOCAL_DEMO";
const DAY = 86_400_000;
const WIB_OFFSET = 7 * 3_600_000;

export type DemoStep = {
  kind: "quiz" | "case";
  key: string;
  daysAgo: number;
  pass: boolean;
};

export type DemoInvestigationItem = {
  key: string;
  type: "URL" | "QR";
  target: string;
  riskLevel: "SAFE" | "WARNING" | "HIGH" | "PHISHING" | "MEDIUM";
  riskScore: number;
  scamCategory: string;
  summary: string;
  deceptionTricks: string[];
  daysAgo: number;
};

export type DemoProfile = {
  email: string;
  key: string;
  title: string;
  filename: string;
  permissions: string[];
  riskScore: number;
  riskLevel: "HIGH" | "MEDIUM";
  secondaryStatus: "PENDING_REVIEW" | "REJECTED" | "APPROVED";
  baseExp?: number;
  items?: DemoInvestigationItem[];
  timeline: DemoStep[];
};

export const demoProfiles: DemoProfile[] = [
  {
    email: "gading@gmail.com",
    key: "gading",
    title: "Izin SMS pada undangan digital",
    filename: "Undangan_Pernikahan_Simulasi.apk",
    permissions: [
      "android.permission.RECEIVE_SMS",
      "android.permission.READ_SMS",
      "android.permission.INTERNET",
      "android.permission.READ_CONTACTS",
    ],
    riskScore: 85,
    riskLevel: "HIGH",
    secondaryStatus: "APPROVED",
    baseExp: 100,
    items: [
      {
        key: "url-klikbca",
        type: "URL",
        target: "https://klikbca-verifikasi-keamanan.example/login",
        riskLevel: "PHISHING",
        riskScore: 92,
        scamCategory: "Phishing Internet Banking Palsu",
        summary:
          "Halaman web meniru antarmuka perbankan resmi dengan formulir tiruan untuk mencuri nomor kartu ATM, PIN, dan respons token keamanan.",
        deceptionTricks: [
          "Domain typosquatting yang menyerupai domain perbankan resmi",
          "Formulir interaktif meminta nomor kartu ATM dan respons token keamanan",
        ],
        daysAgo: 4,
      },
      {
        key: "qr-pln",
        type: "QR",
        target: "https://promo-token-pln.example/klaim-subsidi",
        riskLevel: "WARNING",
        riskScore: 65,
        scamCategory: "Penipuan Subsidi Token Listrik",
        summary:
          "Kode QR pamflet media sosial mengarahkan ke situs pendaftaran palsu yang meminta identitas KTP dan nomor telepon korban.",
        deceptionTricks: [
          "Memanfaatkan isu subsidi tarif listrik nasional untuk menarik korban",
          "Mengarahkan pemindaian kamera ponsel ke situs pihak ketiga tidak terverifikasi",
        ],
        daysAgo: 2,
      },
    ],
    timeline: [
      { kind: "quiz", key: "academy-url-basics", daysAgo: 6, pass: false },
      { kind: "quiz", key: "academy-url-basics", daysAgo: 5, pass: true },
      { kind: "quiz", key: "academy-message-basics", daysAgo: 4, pass: true },
      { kind: "quiz", key: "academy-permission-basics", daysAgo: 3, pass: true },
      { kind: "case", key: "dery", daysAgo: 2, pass: true },
      { kind: "case", key: "rafli", daysAgo: 1, pass: false },
      { kind: "case", key: "rafli", daysAgo: 0, pass: true },
    ],
  },
  {
    email: "dery@gmail.com",
    key: "dery",
    title: "Akses kontak yang tidak sesuai fungsi aplikasi",
    filename: "hadiah-latihan.apk",
    permissions: ["android.permission.READ_CONTACTS", "android.permission.READ_PHONE_STATE"],
    riskScore: 58,
    riskLevel: "MEDIUM",
    secondaryStatus: "REJECTED",
    baseExp: 0,
    items: [
      {
        key: "url-shopee",
        type: "URL",
        target: "https://promo-kupon-belanja-shopee.example/klaim",
        riskLevel: "WARNING",
        riskScore: 55,
        scamCategory: "Kupon Belanja Palsu E-Commerce",
        summary:
          "Tautan promosi flash sale tidak resmi yang mengumpulkan nomor WhatsApp dan data pribadi pengunjung dengan iming-iming undian belanja.",
        deceptionTricks: [
          "Meniru logo dan palet warna marketplace populer",
          "Hitung mundur palsu untuk menciptakan urgensi klaim hadiah",
        ],
        daysAgo: 3,
      },
      {
        key: "qr-donasi",
        type: "QR",
        target: "https://donasi-masjid-jogja.example/qris",
        riskLevel: "SAFE",
        riskScore: 15,
        scamCategory: "Tautan Donasi Komunitas Terverifikasi",
        summary:
          "Hasil pemindaian QRIS donasi terdaftar resmi dengan identitas yayasan terverifikasi tanpa pengalihan mencurigakan.",
        deceptionTricks: [],
        daysAgo: 1,
      },
    ],
    timeline: [
      { kind: "quiz", key: "academy-url-basics", daysAgo: 3, pass: true },
      { kind: "quiz", key: "academy-message-basics", daysAgo: 2, pass: true },
      { kind: "case", key: "gading", daysAgo: 1, pass: false },
      { kind: "case", key: "gading", daysAgo: 0, pass: true },
    ],
  },
  {
    email: "rafli@gmail.com",
    key: "rafli",
    title: "Permintaan akses overlay pada berkas pengiriman",
    filename: "paket-latihan.apk",
    permissions: ["android.permission.SYSTEM_ALERT_WINDOW", "android.permission.READ_SMS"],
    riskScore: 76,
    riskLevel: "HIGH",
    secondaryStatus: "PENDING_REVIEW",
    baseExp: 0,
    items: [
      {
        key: "url-telkomsel",
        type: "URL",
        target: "https://login-my-telkomsel-poin.example/tukar-hadiah",
        riskLevel: "PHISHING",
        riskScore: 78,
        scamCategory: "Phishing Poin Operator Seluler",
        summary:
          "Situs web meniru portal penukaran poin pulsa operator telekomunikasi dengan meminta nomor telepon dan kode verifikasi OTP.",
        deceptionTricks: [
          "Notifikasi palsu batas masa kedaluwarsa poin pulsa",
          "Permintaan input nomor ponsel dan kode verifikasi langsung",
        ],
        daysAgo: 2,
      },
      {
        key: "qr-parkir",
        type: "QR",
        target: "https://parkir-mall-online.example/bayar",
        riskLevel: "SAFE",
        riskScore: 8,
        scamCategory: "Tautan Pembayaran Parkir Digital",
        summary:
          "Kode QR tiket parkir resmi yang mengarah ke gateway pembayaran terdaftar tanpa ancaman keamanan.",
        deceptionTricks: [],
        daysAgo: 1,
      },
    ],
    timeline: [
      { kind: "quiz", key: "academy-url-basics", daysAgo: 1, pass: true },
      { kind: "quiz", key: "academy-message-basics", daysAgo: 0, pass: false },
    ],
  },
];

export const demoId = (...parts: string[]) => [DEMO_VERSION, ...parts].join("-");
export const learningDay = (date: Date) => Math.floor((date.getTime() + WIB_OFFSET) / DAY);

/** Synthetic history cannot predate the existing account or lie in the future. */
export function demoTime(now: Date, daysAgo: number, _joinedAt?: Date) {
  return new Date(now.getTime() - daysAgo * DAY);
}

/** Merge the new history with persisted learning days, including older legacy streaks. */
export function demoLearningSummary(
  dates: Date[],
  previous: { lastLearningAt: Date | null; streakDays: number },
) {
  const all = previous.lastLearningAt ? [...dates, previous.lastLearningAt] : dates;
  if (!all.length) return { lastLearningAt: null, streakDays: 0 };
  const lastLearningAt = new Date(
    all.reduce((latest, date) => Math.max(latest, date.getTime()), 0),
  );
  const days = new Set(all.map(learningDay));
  const latest = learningDay(lastLearningAt);
  let first = latest;
  while (days.has(first - 1)) first -= 1;
  if (previous.lastLearningAt && previous.streakDays > 0) {
    const anchor = learningDay(previous.lastLearningAt);
    if (anchor >= first - 1 && anchor <= latest) {
      first = Math.min(first, anchor - previous.streakDays + 1);
      while (days.has(first - 1)) first -= 1;
    }
  }
  return { lastLearningAt, streakDays: latest - first + 1 };
}
