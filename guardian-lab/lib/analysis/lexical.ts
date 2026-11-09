/**
 * Guardian Lab: Lexical Threat Scoring Engine
 * Analyzes URL domain, path, Shannon entropy, typosquatting against Indonesian targets,
 * and high-risk TLDs.
 */

export interface IndonesianBrandTarget {
  name: string;
  category: "BANK" | "E_WALLET" | "LOGISTICS" | "ECOMMERCE";
  officialDomains: string[];
  keywords: string[];
}

export const INDONESIAN_BRAND_TARGETS: IndonesianBrandTarget[] = [
  {
    name: "Bank BCA",
    category: "BANK",
    officialDomains: ["klikbca.com", "bca.co.id", "mybca.bca.co.id", "klikbca.co.id"],
    keywords: ["klikbca", "bca", "mybca"],
  },
  {
    name: "Bank Mandiri",
    category: "BANK",
    officialDomains: ["bankmandiri.co.id", "livin.bankmandiri.co.id", "mandiri.co.id"],
    keywords: ["mandiri", "livin", "bankmandiri"],
  },
  {
    name: "Bank BRI",
    category: "BANK",
    officialDomains: ["bri.co.id", "ib.bri.co.id", "brimo.bri.co.id"],
    keywords: ["bri", "brimo", "bankbri"],
  },
  {
    name: "Bank BNI",
    category: "BANK",
    officialDomains: ["bni.co.id", "ibank.bni.co.id"],
    keywords: ["bni", "bni-mobile", "bankbni"],
  },
  {
    name: "DANA Indonesia",
    category: "E_WALLET",
    officialDomains: ["dana.id", "dana.me"],
    keywords: ["dana", "danakaget", "dana-kaget"],
  },
  {
    name: "GoPay / Gojek",
    category: "E_WALLET",
    officialDomains: ["gopay.co.id", "gojek.com"],
    keywords: ["gopay", "gojek"],
  },
  {
    name: "OVO",
    category: "E_WALLET",
    officialDomains: ["ovo.id"],
    keywords: ["ovo"],
  },
  {
    name: "ShopeePay",
    category: "E_WALLET",
    officialDomains: ["shopeepay.co.id", "shopee.co.id"],
    keywords: ["shopeepay", "shopee"],
  },
  {
    name: "Pos Indonesia",
    category: "LOGISTICS",
    officialDomains: ["posindonesia.co.id"],
    keywords: ["posindonesia", "pos-indonesia"],
  },
  {
    name: "J&T Express",
    category: "LOGISTICS",
    officialDomains: ["jet.co.id"],
    keywords: ["jet", "jnt", "j&t"],
  },
];

export const RISKY_TLDS = new Set([
  "top",
  "xyz",
  "buzz",
  "online",
  "site",
  "click",
  "cfd",
  "vip",
  "icu",
  "cam",
  "sbs",
  "monster",
  "fit",
  "link",
  "shop",
  "rest",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
]);

export const PHISHING_KEYWORDS = [
  "verifikasi",
  "login",
  "auth",
  "otp",
  "rekening",
  "saldo-gratis",
  "klaim",
  "claim",
  "undangan",
  "paket",
  "resi",
  "lacak",
  "dana-kaget",
  "bantuan-bansos",
  "hadiah",
  "pemberdayaan",
  "denda",
  "tilang",
  "surat-tilang",
  "ebanking",
];

export interface LexicalAnalysisResult {
  entropy: number;
  isHighEntropy: boolean;
  typosquatTarget?: string;
  brandImpersonated?: string;
  levenshteinDistance?: number;
  isLegitimateDomain: boolean;
  tld: string;
  isRiskyTld: boolean;
  hasApkPath: boolean;
  suspiciousKeywords: string[];
  riskScore: number; // 0 - 100
  suggestedRiskLevel: "SAFE" | "WARNING" | "DANGEROUS" | "PHISHING" | "MALWARE";
  deceptionTricks: string[];
  technicalEvidence: {
    entropy: number;
    typosquatTarget?: string;
    levenshteinDistance?: number;
    suspiciousTld?: string;
    suspiciousKeywords?: string[];
  };
}

/**
 * Calculates Shannon entropy: H(X) = -sum(P(x) * log2(P(x)))
 * Returns value rounded to 3 decimal places.
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

/**
 * Calculates Levenshtein edit distance between strings a and b.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[a.length][b.length];
}

/**
 * Analyzes lexical features of an input URL.
 */
export function analyzeLexicalUrl(rawUrl: string): LexicalAnalysisResult {
  const trimmed = rawUrl.trim();
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  const normalized = hasScheme ? trimmed : `http://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    parsed = new URL(`http://${trimmed.replace(/[^a-zA-Z0-9.-]/g, "")}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();
  const fullTarget = `${hostname}${pathname}${search}`;
  const entropy = calculateShannonEntropy(rawUrl);

  // 1. Check official domain whitelist match
  for (const brand of INDONESIAN_BRAND_TARGETS) {
    if (brand.officialDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return {
        entropy,
        isHighEntropy: false,
        isLegitimateDomain: true,
        tld: hostname.split(".").pop() || "",
        isRiskyTld: false,
        hasApkPath: false,
        suspiciousKeywords: [],
        riskScore: 5,
        suggestedRiskLevel: "SAFE",
        deceptionTricks: [],
        technicalEvidence: {
          entropy,
        },
      };
    }
  }

  // Also check legitimate platform / developer / lab domains
  if (
    hostname === "guardian-lab.security" ||
    hostname.endsWith(".guardian-lab.security") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return {
      entropy,
      isHighEntropy: false,
      isLegitimateDomain: true,
      tld: hostname.split(".").pop() || "",
      isRiskyTld: false,
      hasApkPath: false,
      suspiciousKeywords: [],
      riskScore: 5,
      suggestedRiskLevel: "SAFE",
      deceptionTricks: [],
      technicalEvidence: {
        entropy,
      },
    };
  }

  // 2. Entropy
  const isHighEntropy = entropy > 3.5;

  // 3. TLD extraction & check
  const parts = hostname.split(".");
  const tld = parts.length > 1 ? parts[parts.length - 1] : "";
  const isRiskyTld = RISKY_TLDS.has(tld);

  // 4. Check for direct APK path
  const hasApkPath = pathname.endsWith(".apk") || fullTarget.includes(".apk");

  // 5. Typosquatting / Brand Impersonation Check
  let brandImpersonated: string | undefined;
  let typosquatTarget: string | undefined;
  let minLevDistance: number | undefined;

  for (const brand of INDONESIAN_BRAND_TARGETS) {
    const matchedKeyword = brand.keywords.some((kw) => hostname.includes(kw));
    if (matchedKeyword) {
      brandImpersonated = brand.name;
      typosquatTarget = brand.officialDomains[0];
      minLevDistance = calculateLevenshteinDistance(hostname, brand.officialDomains[0]);
      break;
    }
    // Check edit distance on base domain name
    const mainHostPart = parts[0];
    for (const official of brand.officialDomains) {
      const officialMain = official.split(".")[0];
      const dist = calculateLevenshteinDistance(mainHostPart, officialMain);
      if (dist > 0 && dist <= 2) {
        brandImpersonated = brand.name;
        typosquatTarget = official;
        minLevDistance = dist;
        break;
      }
    }
    if (brandImpersonated) break;
  }

  // 6. Suspicious Keyword Extraction
  const matchedKeywords = PHISHING_KEYWORDS.filter((kw) => fullTarget.includes(kw));

  // 7. Aggregate Risk Score & Deception Tricks
  let score = 10;
  const deceptionTricks: string[] = [];

  if (brandImpersonated) {
    score += 45;
    deceptionTricks.push(
      `Memalsukan nama/identitas ${brandImpersonated} pada domain (${hostname}) untuk mengecoh korban.`,
    );
  }

  if (isRiskyTld) {
    score += 30;
    deceptionTricks.push(
      `Menggunakan Top-Level Domain (TLD) murah berisiko tinggi (.${tld}) yang sering dipakai sindikat penipuan.`,
    );
  }

  if (isHighEntropy) {
    score += 15;
    deceptionTricks.push(
      `Tingkat keacakan karakter (Shannon entropy ${entropy}) sangat tinggi, mengindikasikan tautan acak terobfuskasi.`,
    );
  }

  if (matchedKeywords.length > 0) {
    score += 15;
    deceptionTricks.push(
      `Memuat kata kunci manipulasi psikologis: ${matchedKeywords.slice(0, 3).join(", ")}.`,
    );
  }

  if (hasApkPath) {
    score += 60;
    deceptionTricks.push(
      "Mengarahkan langsung ke pengunduhan file installer aplikasi Android (.apk) tidak resmi.",
    );
  }

  const finalScore = Math.min(100, Math.max(0, score));

  let suggestedRiskLevel: LexicalAnalysisResult["suggestedRiskLevel"];
  if (hasApkPath) {
    suggestedRiskLevel = "MALWARE";
  } else if (finalScore >= 80) {
    suggestedRiskLevel = "PHISHING";
  } else if (finalScore >= 60) {
    suggestedRiskLevel = "DANGEROUS";
  } else if (finalScore >= 26) {
    suggestedRiskLevel = "WARNING";
  } else {
    suggestedRiskLevel = "SAFE";
  }

  return {
    entropy,
    isHighEntropy,
    typosquatTarget,
    brandImpersonated,
    levenshteinDistance: minLevDistance,
    isLegitimateDomain: false,
    tld,
    isRiskyTld,
    hasApkPath,
    suspiciousKeywords: matchedKeywords,
    riskScore: finalScore,
    suggestedRiskLevel,
    deceptionTricks,
    technicalEvidence: {
      entropy,
      typosquatTarget,
      levenshteinDistance: minLevDistance,
      suspiciousTld: isRiskyTld ? `.${tld}` : undefined,
      suspiciousKeywords: matchedKeywords.length > 0 ? matchedKeywords : undefined,
    },
  };
}
