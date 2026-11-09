"use client";

import { useId } from "react";
import { ApkFileIcon } from "@/components/shared/apk-icons";
import styles from "./browser-illustration.module.css";

export function BrowserIllustration({
  variant = "sandbox",
  caption,
}: {
  variant?: "sandbox" | "apk";
  caption: string;
}) {
  const id = useId();
  const paint = (name: string) => `${id}-${name}`;
  const apk = variant === "apk";
  return (
    <svg
      className={styles.artwork}
      data-variant={variant}
      viewBox="0 0 500 470"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMin meet"
    >
      <defs>
        <linearGradient
          id={paint("cyan")}
          x1="86"
          y1="46"
          x2="439"
          y2="346"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#d7f7fa" />
          <stop offset="1" stopColor="#d3f3fa" stopOpacity="0.76" />
        </linearGradient>
        <linearGradient
          id={paint("lavender")}
          x1="375"
          y1="68"
          x2="161"
          y2="344"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#dfddfc" stopOpacity="0.7" />
          <stop offset="1" stopColor="#e0e7fb" stopOpacity="0.36" />
        </linearGradient>
        <linearGradient
          id={paint("rim")}
          x1="195"
          y1="119"
          x2="452"
          y2="338"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4a5d89" />
          <stop offset="0.52" stopColor="#7182aa" />
          <stop offset="1" stopColor="#344a74" />
        </linearGradient>
        <linearGradient
          id={paint("frame")}
          x1="198"
          y1="120"
          x2="437"
          y2="334"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#35456e" />
          <stop offset="0.5" stopColor="#263555" />
          <stop offset="1" stopColor="#405782" />
        </linearGradient>
        <linearGradient
          id={paint("screen")}
          x1="216"
          y1="156"
          x2="429"
          y2="327"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f9fbff" />
          <stop offset="1" stopColor="#e9edff" />
        </linearGradient>
        <linearGradient id={paint("paper")} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#f3f8ff" />
        </linearGradient>
        <filter
          id={paint("frame-shadow")}
          x="135"
          y="89"
          width="360"
          height="290"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow dx="2" dy="9" stdDeviation="6" floodColor="#254b73" floodOpacity="0.17" />
        </filter>
        <filter id={paint("paper-shadow")} x="-20%" y="-30%" width="140%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#294d75" floodOpacity="0.16" />
        </filter>
        <filter id={paint("ground-blur")} x="-20%" y="-150%" width="140%" height="400%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <path
        d="M6 180C18 76 102 21 190 18C279 12 323 41 340 91C367 147 397 167 438 190C485 215 506 270 496 312C480 365 455 361 392 358L115 352C52 346 8 290 5 226C0 211 1 198 6 180Z"
        fill={`url(#${paint("cyan")})`}
        transform={apk ? "translate(0 6)" : undefined}
      />
      <path
        d="M70 184C137 115 296 53 375 66C413 61 425 83 436 121C462 187 503 227 493 296C483 351 451 364 394 360L155 344C88 339 34 261 70 184Z"
        fill={`url(#${paint("lavender")})`}
        transform={apk ? "translate(0 6)" : undefined}
      />
      <ellipse
        cx="320"
        cy={apk ? 362 : 352}
        rx="139"
        ry="10"
        fill="#6385ae"
        fillOpacity="0.16"
        filter={`url(#${paint("ground-blur")})`}
      />
      <g filter={`url(#${paint("frame-shadow")})`} transform={apk ? "translate(0 10)" : undefined}>
        <path
          d="M204 121L443 109Q467 107 466 134L458 323Q457 348 433 348L193 342Q168 341 170 316L181 145Q183 122 204 121Z"
          fill="#263d65"
        />
        <path
          d="M202 118L440 106Q464 104 463 131L455 320Q454 345 431 345L192 339Q167 338 169 314L180 143Q182 119 202 118Z"
          fill={`url(#${paint("rim")})`}
          stroke="#8796b8"
          strokeWidth="1.2"
        />
        <path
          d="M203 121L439 109Q461 107 460 132L452 319Q451 342 430 342L193 336Q171 335 172 314L183 144Q184 122 203 121Z"
          fill={`url(#${paint("frame")})`}
          stroke="#a7b5d1"
          strokeOpacity="0.2"
        />
        <path
          d="M202 153L437 142Q453 141 452 158L445 317Q444 334 427 334L191 328Q177 328 178 312L187 169Q188 154 202 153Z"
          fill="#162c4b"
        />
        <path
          d="M203 155L437 144Q451 143 450 159L443 316Q442 331 427 331L192 326Q179 326 180 312L189 170Q190 156 203 155Z"
          fill={`url(#${paint("screen")})`}
          stroke="#d6e0f3"
          strokeWidth="1.1"
        />
        <g transform="rotate(-2.4 320 135)">
          <circle cx="212" cy="135" r="4.7" fill="#ff8b72" />
          <circle cx="229" cy="135" r="4.7" fill="#ffd55d" />
          <circle cx="246" cy="135" r="4.7" fill="#96e676" />
          <text x="325" y="139" textAnchor="middle" className={styles.browserTitle}>
            {apk ? "Bedah APK" : "Browser terisolasi"}
          </text>
        </g>
        {apk ? (
          <ApkFileIcon x={286} y={180} width={64} height={83} className={styles.apkFile} />
        ) : (
          <path
            d="M321 192C327 196 335 198 342 201V215C342 228 334 238 321 245C308 238 300 228 300 215V201C307 199 315 196 321 192Z"
            stroke="#c5cfe7"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <text x="321" y={apk ? 280 : 267} textAnchor="middle" className={styles.screenCaption}>
          {caption}
        </text>
      </g>
      <g filter={`url(#${paint("paper-shadow")})`}>
        <path
          d={
            apk
              ? "M97 78C98 60 121 51 151 52C180 51 204 61 211 80C218 101 201 118 166 121L156 136L153 122C123 124 94 108 97 78Z"
              : "M101 80C101 63 124 54 153 54C181 54 204 62 206 79C209 96 189 108 160 109L154 118L151 110C122 111 100 100 101 80Z"
          }
          fill={`url(#${paint("paper")})`}
          stroke="#eaf0fa"
        />
        <text x="154" y={apk ? 76 : 80} textAnchor="middle" className={styles.speechText}>
          <tspan x="154">{apk ? "Yuk, cek" : "Aku bantu"}</tspan>
          <tspan x="154" dy="15">
            {apk ? "sebelum" : "jelajahi."}
          </tspan>
          {apk && (
            <tspan x="154" dy="15">
              pasang.
            </tspan>
          )}
        </text>
        <rect
          x={apk ? 222 : 267}
          y={apk ? 374 : 361}
          width={apk ? 196 : 140}
          height="35"
          rx="17.5"
          fill={`url(#${paint("paper")})`}
          stroke="#e7eff9"
        />
        <g stroke="#075570" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          {apk ? (
            <path d="M243 383L256 391L243 399ZM239 400L259 381" />
          ) : (
            <>
              <circle cx="293" cy="379" r="7.2" />
              <path d="M290 368H296M293 368V371M299 372L301 370M293 375V379L296 381" />
            </>
          )}
        </g>
        <text x={apk ? 271 : 308} y={apk ? 396 : 383} className={styles.durationText}>
          {apk ? "Tanpa menjalankan APK" : "Maks. 180 detik"}
        </text>
      </g>
      <path
        d="M441 75L438 87M458 80L450 90M466 94L458 98"
        transform={apk ? "translate(-3 8)" : undefined}
        stroke="#06a7af"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
