"use client";

import Image from "next/image";
import { useId } from "react";
import folders from "@/public/features/community-folders-shield.webp";
import mascot from "@/public/landing/guardian-community-helper.webp";
import styles from "./community-illustration.module.css";

export function CommunityIllustration() {
  const id = useId();
  const paint = (name: string) => `${id}-${name}`;
  return (
    <div className={styles.scene} aria-hidden="true">
      <svg viewBox="0 0 500 340" fill="none" className={styles.backdrop} focusable="false">
        <defs>
          <linearGradient
            id={paint("cyan")}
            x1="25"
            y1="25"
            x2="401"
            y2="306"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#d0f7fa" />
            <stop offset="1" stopColor="#dcecff" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient
            id={paint("lavender")}
            x1="399"
            y1="77"
            x2="122"
            y2="303"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#e0d8fc" stopOpacity="0.7" />
            <stop offset="1" stopColor="#dfdefb" stopOpacity="0.4" />
          </linearGradient>
          <filter id={paint("shadow")} x="-20%" y="-20%" width="150%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#36537c" floodOpacity="0.13" />
          </filter>
        </defs>
        <path
          d="M13 157C34 75 111 8 225 5C308 1 370 31 388 87C402 130 443 164 456 219C472 274 426 302 362 306L135 307C62 304-9 242 13 157Z"
          fill={`url(#${paint("cyan")})`}
        />
        <path
          d="M39 201C95 142 263 65 379 65C448 65 491 94 491 145C493 203 454 257 408 281C360 305 307 305 251 308L126 298C73 288 15 253 39 201Z"
          fill={`url(#${paint("lavender")})`}
        />
        <g filter={`url(#${paint("shadow")})`}>
          <path
            d="M31 58C31 35 62 22 103 22C145 22 177 35 177 58C177 78 159 92 139 95L145 113L126 99C84 103 31 87 31 58Z"
            fill="#fff"
            stroke="#e6eef9"
          />
          <text x="104" y="54" textAnchor="middle" className={styles.speech}>
            <tspan x="104">Belajar bareng,</tspan>
            <tspan x="104" dy="17">
              jaga sesama.
            </tspan>
          </text>
        </g>
        <path
          d="M393 112L390 126M408 116L399 129M417 129L404 135"
          stroke="#08a6b0"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className={styles.mascot}>
        <Image src={mascot} alt="" sizes="(max-width: 700px) 200px, 310px" />
      </div>
      <Image
        src={folders}
        alt=""
        className={styles.folders}
        sizes="(max-width: 700px) 140px, 210px"
      />
    </div>
  );
}
