"use client";

import Image from "next/image";
import { useState } from "react";
import permissions from "@/public/features/academy-permissions.webp";
import phishing from "@/public/features/academy-phishing.webp";
import social from "@/public/features/academy-social-engineering.webp";
import styles from "./academy-catalog.module.css";
import type { AcademyQuiz } from "./academy-presentation";

const topicImages = {
  SPOT_THE_PHISH: phishing,
  SOCIAL_ENGINEERING: social,
  DANGEROUS_PERMISSIONS: permissions,
};

export function AcademyTopicArt({
  category,
  thumbnailUrl,
  sizes,
}: {
  category: AcademyQuiz["category"];
  thumbnailUrl?: string | null;
  sizes?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const custom = Boolean(thumbnailUrl && failedUrl !== thumbnailUrl);
  return (
    <Image
      src={custom && thumbnailUrl ? thumbnailUrl : topicImages[category]}
      alt=""
      fill
      sizes={sizes ?? "(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 370px"}
      className={styles.topicImage}
      unoptimized={custom}
      onError={custom ? () => setFailedUrl(thumbnailUrl ?? null) : undefined}
    />
  );
}
