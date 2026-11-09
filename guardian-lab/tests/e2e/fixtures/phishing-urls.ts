/**
 * Test Fixtures: Phishing URLs, Typosquatting Domains, and Malformed Targets
 * Authoritative datasets representing Indonesian cybercrime trends (2025–2026)
 * and boundary/adversarial inputs.
 */

export interface PhishingUrlFixture {
  url: string;
  expectedRisk: "SAFE" | "WARNING" | "DANGEROUS" | "PHISHING" | "MALWARE";
  expectedCategory: string;
  brandImpersonated?: string;
  expectedDefanged: string;
  isHighEntropy?: boolean;
}

export const CLEAN_URL_FIXTURES: PhishingUrlFixture[] = [
  {
    url: "https://klikbca.com",
    expectedRisk: "SAFE",
    expectedCategory: "Legitimate Banking Portal",
    expectedDefanged: "hxxps://klikbca[.]com",
  },
  {
    url: "https://www.bankmandiri.co.id",
    expectedRisk: "SAFE",
    expectedCategory: "Legitimate Corporate Portal",
    expectedDefanged: "hxxps://www[.]bankmandiri[.]co[.]id",
  },
  {
    url: "https://posindonesia.co.id/id/tracking",
    expectedRisk: "SAFE",
    expectedCategory: "Legitimate Logistics Tracking",
    expectedDefanged: "hxxps://posindonesia[.]co[.]id/id/tracking",
  },
  {
    url: "https://guardian-lab.security",
    expectedRisk: "SAFE",
    expectedCategory: "Security Platform",
    expectedDefanged: "hxxps://guardian-lab[.]security",
  },
];

export const INDONESIAN_PHISHING_FIXTURES: PhishingUrlFixture[] = [
  {
    url: "https://klikbca-verifikasi-otp.top/login.php",
    expectedRisk: "PHISHING",
    expectedCategory: "Web Phishing Kredensial Perbankan",
    brandImpersonated: "Bank BCA",
    expectedDefanged: "hxxps://klikbca-verifikasi-otp[.]top/login[.]php",
    isHighEntropy: true,
  },
  {
    url: "http://bca-klik-auth.click/secure/ebanking",
    expectedRisk: "PHISHING",
    expectedCategory: "Web Phishing Kredensial Perbankan",
    brandImpersonated: "Bank BCA",
    expectedDefanged: "hxxp://bca-klik-auth[.]click/secure/ebanking",
    isHighEntropy: false,
  },
  {
    url: "https://resi-posindonesia-lacak-paket.buzz/tracking?resi=POS9928172",
    expectedRisk: "PHISHING",
    expectedCategory: "Modus Kurir & Resi Paket Palsu",
    brandImpersonated: "Pos Indonesia",
    expectedDefanged: "hxxps://resi-posindonesia-lacak-paket[.]buzz/tracking?resi=POS9928172",
    isHighEntropy: true,
  },
  {
    url: "https://dana-kaget-saldo-gratis.xyz/claim?code=RAMADHAN2026",
    expectedRisk: "PHISHING",
    expectedCategory: "Social Engineering Saldo Gratis",
    brandImpersonated: "DANA Indonesia",
    expectedDefanged: "hxxps://dana-kaget-saldo-gratis[.]xyz/claim?code=RAMADHAN2026",
    isHighEntropy: false,
  },
  {
    url: "https://undangan-nikah-digital-online.top/undangan.apk",
    expectedRisk: "MALWARE",
    expectedCategory: "APK Penyadap SMS OTP (Modus Kurir/Undangan)",
    expectedDefanged: "hxxps://undangan-nikah-digital-online[.]top/undangan[.]apk",
    isHighEntropy: false,
  },
];

export const BOUNDARY_URL_FIXTURES = {
  empty: "",
  whitespaceOnly: "     \t\n  ",
  oversizedUrl: `https://klikbca-fake-portal.xyz/${"a".repeat(8000)}?param=${"x".repeat(4000)}`,
  missingProtocol: "klikbca-fake-login.xyz/auth",
  invalidProtocol: "ftp://fake-bank-download.xyz/malware.exe",
  scriptInjection: 'https://evil.com/phish?next=<script>alert("XSS")</script>',
  sqliPayload: "https://evil.com/check?id=1' OR 1=1 --",
  pathTraversal: "https://evil.com/view?file=../../../../etc/passwd",
  punycodeHomoglyph: "https://www.xn--bca-9la.com/login", // Cyrillic homoglyph
  rawIpTarget: "http://192.168.1.100:8080/phish/login.html",
  ssrfTarget: "http://169.254.169.254/latest/meta-data/",
  localhostLoopback: "http://localhost:3306/mysql_test",
};
