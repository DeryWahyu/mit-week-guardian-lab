"use client";

import Image from "next/image";
import { useId } from "react";
import mascot from "@/public/features/guardian-history-archive.webp";
import styles from "./history-workspace.module.css";

export function HistoryHero() {
  const id = useId();
  const paint = (name: string) => `${id}-${name}`;
  return (
    <header className={styles.hero} data-user-reveal>
      <div className={styles.heroCopy}>
        <h1>
          Jejak pemeriksaanmu,<span>di satu tempat.</span>
        </h1>
        <p>Temukan kembali tautan dan berkas, lalu buka status serta bukti tersimpannya.</p>
      </div>
      <div className={styles.scene} aria-hidden="true">
        <svg className={styles.backdrop} viewBox="0 0 500 350" fill="none" focusable="false">
          <defs>
            <linearGradient
              id={paint("cyan")}
              x1="24"
              y1="32"
              x2="420"
              y2="308"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#d0f8fa" />
              <stop offset="1" stopColor="#dceaff" stopOpacity="0.86" />
            </linearGradient>
            <linearGradient
              id={paint("lavender")}
              x1="423"
              y1="79"
              x2="129"
              y2="322"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#dfd7fc" stopOpacity="0.72" />
              <stop offset="1" stopColor="#e2e2fc" stopOpacity="0.38" />
            </linearGradient>
            <filter id={paint("shadow")} x="-25%" y="-20%" width="155%" height="160%">
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="4"
                floodColor="#38527c"
                floodOpacity="0.14"
              />
            </filter>
          </defs>
          <path
            d="M12 176C27 95 119 8 226 7C314 1 365 41 384 89C400 132 455 161 461 214C473 279 425 316 355 321L139 324C66 320-3 251 12 176Z"
            fill={`url(#${paint("cyan")})`}
          />
          <path
            d="M47 215C97 147 278 62 383 69C444 68 486 99 490 151C495 213 460 274 411 297C357 324 288 325 233 327L128 313C75 301 20 266 47 215Z"
            fill={`url(#${paint("lavender")})`}
          />
          <g filter={`url(#${paint("shadow")})`}>
            <path
              d="M10 63C10 36 48 17 94 17C140 17 178 36 178 63C178 88 157 103 128 108L140 132L113 114C65 116 10 95 10 63Z"
              fill="#fff"
              stroke="#e6eefb"
            />
            <text x="94" y="56" textAnchor="middle" className={styles.speech}>
              <tspan x="94">Mau cek</tspan>
              <tspan x="94" dy="21">
                yang mana?
              </tspan>
            </text>
          </g>
          <path
            d="M113 183L104 173M103 196L89 190M126 177L121 163"
            stroke="#06a5af"
            strokeWidth="3.3"
            strokeLinecap="round"
          />
        </svg>
        <Image
          src={mascot}
          alt=""
          className={styles.mascot}
          sizes="(max-width: 700px) 340px, 520px"
        />
      </div>
    </header>
  );
}
