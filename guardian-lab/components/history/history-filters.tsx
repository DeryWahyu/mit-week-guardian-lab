"use client";

import { Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { INVESTIGATION_STATUS_LABELS } from "@/lib/investigations/presentation";
import { PROTECTED_ROUTES } from "@/lib/routes";
import styles from "./history-workspace.module.css";

type Values = {
  type: string;
  risk: string;
  status: string;
  search: string;
  from: string;
  to: string;
};
const riskOptions = [
  "SAFE",
  "LOW",
  "MEDIUM",
  "WARNING",
  "HIGH",
  "DANGEROUS",
  "PHISHING",
  "MALWARE",
  "CRITICAL",
];

export function HistoryFilters({
  values,
  onChange,
}: {
  values: Values;
  onChange: (key: string, value: string) => void;
}) {
  const panelId = useId();
  const advanced = [
    values.status !== "ALL",
    values.risk !== "ALL",
    Boolean(values.from),
    Boolean(values.to),
  ].filter(Boolean).length;
  const [expanded, setExpanded] = useState(advanced > 0);
  return (
    <div className={styles.filters}>
      <label className={styles.search}>
        <Search aria-hidden="true" size={19} />
        <span className="sr-only">Cari investigasi (Opsional)</span>
        <input
          type="search"
          aria-label="Cari investigasi"
          maxLength={200}
          value={values.search}
          onChange={(event) => onChange("search", event.target.value)}
          placeholder="Cari domain atau nama berkas..."
        />
      </label>
      <div className={styles.filterBar}>
        <div className={styles.typeTabs} role="group" aria-label="Filter jenis input">
          {[
            ["ALL", "Semua"],
            ["URL", "Tautan URL"],
            ["QR", "Kode QR"],
            ["APK", "Berkas APK"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={values.type === value}
              onClick={() => onChange("type", value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.filterActions}>
          <button
            type="button"
            className={styles.advancedToggle}
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setExpanded((open) => !open)}
          >
            <SlidersHorizontal aria-hidden="true" size={17} />
            Filter lanjutan
            {advanced > 0 ? <span>{advanced} aktif</span> : <Plus aria-hidden="true" size={15} />}
          </button>
          <Link href={PROTECTED_ROUTES.history} className={styles.clearFilters}>
            Hapus filter
          </Link>
        </div>
      </div>
      <div id={panelId} hidden={!expanded} className={styles.advancedPanel}>
        <label>
          Status
          <select
            aria-label="Filter status investigasi"
            value={values.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            <option value="ALL">Semua status</option>
            {Object.entries(INVESTIGATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Risiko
          <select
            aria-label="Filter tingkat risiko"
            value={values.risk}
            onChange={(event) => onChange("risk", event.target.value)}
          >
            <option value="ALL">Semua risiko</option>
            {riskOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dari tanggal (Opsional)
          <input
            type="date"
            aria-label="Dari tanggal"
            value={values.from}
            onChange={(event) => onChange("from", event.target.value)}
          />
        </label>
        <label>
          Sampai tanggal (Opsional)
          <input
            type="date"
            aria-label="Sampai tanggal"
            min={values.from || undefined}
            value={values.to}
            onChange={(event) => onChange("to", event.target.value)}
          />
        </label>
      </div>
      {advanced > 0 && (
        <p className={styles.activeFilters}>
          Filter aktif:{" "}
          {[
            values.status !== "ALL"
              ? (INVESTIGATION_STATUS_LABELS[
                  values.status as keyof typeof INVESTIGATION_STATUS_LABELS
                ] ?? "Status tidak valid")
              : "",
            values.risk !== "ALL"
              ? riskOptions.includes(values.risk)
                ? values.risk
                : "Risiko tidak valid"
              : "",
            values.from ? "dari " + values.from : "",
            values.to ? "sampai " + values.to : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
