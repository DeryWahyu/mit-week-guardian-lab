"use client";

import { Share2 } from "lucide-react";
import Image from "next/image";
import { useId } from "react";
import mascot from "@/public/features/guardian-share.webp";
import styles from "./share-workspace.module.css";

export function ShareIllustration() {
  const id = useId();
  const paint = (name: string) => `${id}-${name}`;
  return (
    <div className={styles.illustration} aria-hidden="true">
      <svg className={styles.illustrationArt} viewBox="0 0 500 445" fill="none" focusable="false">
        <defs>
          <linearGradient
            id={paint("cyan")}
            x1="36"
            y1="23"
            x2="437"
            y2="353"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#d3f7fa" />
            <stop offset="1" stopColor="#d9f2fc" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient
            id={paint("lavender")}
            x1="401"
            y1="60"
            x2="172"
            y2="385"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#e2dbfc" stopOpacity="0.72" />
            <stop offset="1" stopColor="#e0e7fc" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient
            id={paint("navy")}
            x1="245"
            y1="106"
            x2="446"
            y2="403"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#3b507c" />
            <stop offset="0.5" stopColor="#243d68" />
            <stop offset="1" stopColor="#182f54" />
          </linearGradient>
          <linearGradient
            id={paint("paper")}
            x1="232"
            y1="151"
            x2="438"
            y2="399"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fff" />
            <stop offset="1" stopColor="#edf1ff" />
          </linearGradient>
          <filter id={paint("shadow")} x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="2" dy="7" stdDeviation="6" floodColor="#28436f" floodOpacity="0.18" />
          </filter>
        </defs>
        <g transform="translate(0 -28) scale(1 1.07)">
          <path
            d="M8 174C14 84 85 11 174 7C262 0 317 32 339 84C359 127 383 141 429 168C480 198 505 246 491 303C479 362 433 388 379 391L111 392C47 388 7 333 4 269C1 239 0 208 8 174Z"
            fill={`url(#${paint("cyan")})`}
          />
          <path
            d="M65 198C116 137 290 55 372 58C420 54 439 85 448 119C464 178 500 228 491 294C483 348 449 385 393 389L163 382C92 378 26 277 65 198Z"
            fill={`url(#${paint("lavender")})`}
          />
        </g>
        <g filter={`url(#${paint("shadow")})`}>
          <rect
            x="245"
            y="91"
            width="222"
            height="313"
            rx="26"
            transform="rotate(7 356 248)"
            fill="#daddf5"
            fillOpacity="0.8"
            stroke="#f2f4ff"
            strokeWidth="1.8"
          />
          <rect
            x="231"
            y="96"
            width="227"
            height="313"
            rx="25"
            transform="rotate(3.5 344 252)"
            fill="#b9c6e6"
            fillOpacity="0.76"
            stroke="#e8edff"
            strokeWidth="1.6"
          />
        </g>
        <g transform="matrix(1 -0.025 -0.04 1 15 8)" filter={`url(#${paint("shadow")})`}>
          <rect
            x="216"
            y="105"
            width="232"
            height="310"
            rx="26"
            fill={`url(#${paint("navy")})`}
            stroke="#93a4c8"
            strokeWidth="2"
          />
          <rect
            x="219"
            y="108"
            width="226"
            height="304"
            rx="23"
            stroke="#dce7ff"
            strokeOpacity="0.19"
          />
          <text x="332" y="133" textAnchor="middle" className={styles.artTitle}>
            Guardian Share Card
          </text>
          <rect
            x="224"
            y="147"
            width="216"
            height="255"
            rx="21"
            fill={`url(#${paint("paper")})`}
            stroke="#f9fbff"
          />
          <rect x="283" y="161" width="98" height="20" rx="10" fill="#e8e6ff" />
          <text x="332" y="174.5" textAnchor="middle" className={styles.artPreview}>
            PRATINJAU
          </text>
          <g stroke="#41a9b9" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M316 224L342 210M316 230L342 245" />
            <circle cx="308" cy="227" r="9" fill="#d8f5f8" />
            <circle cx="350" cy="206" r="9" fill="#d8f5f8" />
            <circle cx="350" cy="249" r="9" fill="#d8f5f8" />
          </g>
          <rect x="267" y="277" width="130" height="11" rx="5.5" fill="#d8dff2" />
          <rect x="267" y="296" width="113" height="10" rx="5" fill="#d8dff2" />
          <text x="332" y="332" textAnchor="middle" className={styles.artCaption}>
            <tspan x="332">Pilih hasil untuk</tspan>
            <tspan x="332" dy="15">
              melihat kartu
            </tspan>
          </text>
          <rect x="260" y="365" width="144" height="27" rx="13.5" fill="#dcf5f7" />
          <text x="332" y="383" textAnchor="middle" className={styles.artFormat}>
            PNG + pesan teks
          </text>
        </g>
        <g filter={`url(#${paint("shadow")})`}>
          <path
            d="M92 60C92 38 120 24 154 24C189 24 215 38 215 60C215 79 194 93 167 96L165 112L154 97C119 99 92 78 92 60Z"
            fill="#fff"
            stroke="#e8effa"
          />
          <text x="154" y="54" textAnchor="middle" className={styles.artSpeech}>
            <tspan x="154">Bantu</tspan>
            <tspan x="154" dy="16">
              saling jaga.
            </tspan>
          </text>
        </g>
        <path
          d="M445 67L441 83M462 72L452 86M474 87L460 93"
          stroke="#06a6b2"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </svg>
      <div className={styles.mascotWrap}>
        <Image src={mascot} alt="" sizes="(max-width: 800px) 54vw, 340px" />
        <Share2 className={styles.mascotSymbol} strokeWidth={2.5} />
      </div>
    </div>
  );
}
