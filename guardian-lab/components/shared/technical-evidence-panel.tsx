import { Code2, FileSearch, Search } from "lucide-react";
import type { UrlModelEvidence } from "@/lib/validations/guardian-ml";
import type { ThreatAnalysisResult } from "@/types/analysis";
import styles from "./technical-evidence.module.css";

const evidenceLabels: Record<string, string> = {
  urlModel: "Model URL / QR",
  permissions: "Izin aplikasi",
  c2Endpoints: "Alamat yang tercatat",
  entropy: "Entropi",
  typosquatTarget: "Kemiripan nama domain",
  botTokens: "Indikator token bot",
  suspiciousDexStrings: "Jejak teks DEX",
};

function EvidenceValue({ value, label }: { value: unknown; label: string }) {
  if (value === null) return <span className={styles.nullValue}>Tidak tercatat (null)</span>;
  if (typeof value !== "object") return <code className={styles.scalar}>{String(value)}</code>;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.length ? (
      <ul className={styles.valueList}>
        {value.map((item, index) => (
          <li key={`${index}-${item}`}>
            <code>{item}</code>
          </li>
        ))}
      </ul>
    ) : (
      <p className={styles.nullValue}>Daftar kosong tersimpan.</p>
    );
  }
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: Named scroll region needs keyboard focus to read all saved JSON.
    <section tabIndex={0} aria-label={label} className={styles.json}>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </section>
  );
}

function ModelEvidence({ model }: { model: UrlModelEvidence }) {
  const facts = [
    ["Skor asli model", String(model.model_score)],
    ["Kategori indikator", model.risk_band],
    ["Ambang waspada", String(model.geek.thresholds.warning)],
    ["Ambang tinggi", String(model.geek.thresholds.high)],
    ["Versi model", model.geek.model_version],
    ["Skema fitur", model.geek.feature_schema],
    ["Cakupan", model.geek.scope],
    ["Isi halaman diperiksa", String(model.geek.content_inspected)],
  ];
  return (
    <>
      <dl className={styles.modelFacts}>
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <code>{value}</code>
            </dd>
          </div>
        ))}
      </dl>
      <div className={styles.hash}>
        <span>SHA-256 artefak model</span>
        <code>{model.geek.artifact_sha256}</code>
      </div>
      <p className={styles.modelFootnote}>
        Skor asli dan ambang mengikuti metadata model. Skor bukan probabilitas phishing pada trafik
        nyata; isi halaman dan redirect tidak diperiksa.
      </p>
      <details className={styles.rawDetails}>
        <summary>Seluruh metadata model tersimpan</summary>
        <EvidenceValue value={model} label="Metadata model URL lengkap" />
      </details>
    </>
  );
}

export function TechnicalEvidencePanel({
  evidence,
  metadata,
  search,
  onSearchChange,
  id = "record-evidence",
  description = "Atribut asli dari rekaman pemeriksaan.",
  metadataTitle = "Metadata input dan status proses",
}: {
  evidence: ThreatAnalysisResult["technicalEvidence"];
  metadata: Record<string, unknown>;
  search: string;
  onSearchChange: (value: string) => void;
  id?: string;
  description?: string;
  metadataTitle?: string;
}) {
  const entries = Object.entries(evidence);
  const filtered = entries.filter(([key, value]) =>
    `${key} ${evidenceLabels[key] ?? ""} ${JSON.stringify(value)}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`} data-user-reveal>
      <div className={styles.heading}>
        <span>
          <Code2 size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 id={`${id}-title`}>Telusuri bukti teknis.</h2>
          <p>{description}</p>
        </div>
      </div>
      <label htmlFor={`${id}-search`} className={styles.searchLabel}>
        Cari bukti (Opsional)
      </label>
      <div className={styles.search}>
        <Search size={18} aria-hidden="true" />
        <input
          id={`${id}-search`}
          type="search"
          maxLength={200}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari izin, versi model, threshold..."
        />
      </div>
      <p className={styles.count} aria-live="polite">
        {filtered.length} dari {entries.length} kelompok bukti ditampilkan.
      </p>
      {!filtered.length ? (
        <div className={styles.empty}>
          <FileSearch size={30} aria-hidden="true" />
          <h3>
            {entries.length
              ? "Bukti yang dicari belum ditemukan."
              : "Belum ada bukti teknis tersimpan."}
          </h3>
          <p>
            {entries.length
              ? "Coba kata kunci lain atau kosongkan pencarian."
              : "Atribut yang tidak tercatat tidak menjadi dasar kesimpulan aman."}
          </p>
          {entries.length > 0 && (
            <button type="button" onClick={() => onSearchChange("")}>
              Hapus pencarian
            </button>
          )}
        </div>
      ) : (
        <div className={styles.groups}>
          {filtered.map(([key, value]) => (
            <section key={key} className={styles.group} aria-label={evidenceLabels[key] ?? key}>
              <div className={styles.groupHeading}>
                <h3>{evidenceLabels[key] ?? key}</h3>
                <code>{key}</code>
              </div>
              {key === "urlModel" && evidence.urlModel ? (
                <ModelEvidence model={evidence.urlModel} />
              ) : (
                <EvidenceValue value={value} label={evidenceLabels[key] ?? key} />
              )}
            </section>
          ))}
        </div>
      )}
      <details className={styles.rawDetails}>
        <summary>{metadataTitle}</summary>
        <p>Metadata tersimpan sudah melalui sanitasi. Nilai yang tidak tercatat tetap kosong.</p>
        <EvidenceValue value={metadata} label={metadataTitle} />
      </details>
    </section>
  );
}
