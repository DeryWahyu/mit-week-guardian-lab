import Image from "next/image";
import reader from "@/public/features/guardian-profile-reader.webp";
import styles from "./profile-illustration.module.css";

export function ProfileIllustration() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <svg className={styles.backdrop} viewBox="0 0 260 250" fill="none">
        <ellipse
          cx="140"
          cy="128"
          rx="101"
          ry="105"
          transform="rotate(31 140 128)"
          fill="url(#profile-cyan)"
        />
        <ellipse
          cx="178"
          cy="127"
          rx="79"
          ry="104"
          transform="rotate(30 178 127)"
          fill="url(#profile-lavender)"
        />
        <ellipse cx="153" cy="236" rx="89" ry="9" fill="url(#profile-shadow)" />
        <path
          d="M49 108L56 119M65 102L68 115M42 124L53 128"
          stroke="#00A5AE"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient
            id="profile-cyan"
            x1="50"
            y1="40"
            x2="210"
            y2="225"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#DAF7F9" />
            <stop offset="1" stopColor="#E9F9FC" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient
            id="profile-lavender"
            x1="154"
            y1="40"
            x2="232"
            y2="206"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#EEE9FF" stopOpacity="0.65" />
            <stop offset="1" stopColor="#E6DAFF" stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id="profile-shadow">
            <stop stopColor="#7D83B2" stopOpacity="0.22" />
            <stop offset="1" stopColor="#7D83B2" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <Image
        className={styles.reader}
        src={reader}
        alt=""
        sizes="(max-width: 480px) 220px, (max-width: 850px) 210px, 240px"
      />
      <div className={styles.note}>
        <span>Satu langkah</span>
        <span>lagi.</span>
      </div>
    </div>
  );
}
