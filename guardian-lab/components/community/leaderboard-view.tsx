"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApiResource } from "@/lib/hooks/use-api-resource";
import { API_ROUTES, PROTECTED_ROUTES } from "@/lib/routes";
import { rankingPageSchema, rankingSchema } from "@/lib/validations/platform";
import { LeaderboardHero } from "./leaderboard-hero";
import { LeaderboardPanel } from "./leaderboard-panel";
import { LeaderboardPodium } from "./leaderboard-podium";
import styles from "./leaderboard.module.css";

export function LeaderboardView({ scope }: { scope: string }) {
  const parsed = rankingPageSchema.safeParse(useSearchParams().get("page") ?? undefined);
  const page = parsed.success ? parsed.data : 1;
  const resource = useApiResource(API_ROUTES.leaderboard(page), rankingSchema, { scope });
  return (
    <div className={styles.content}>
      <LeaderboardHero />
      {!parsed.success && (
        <p className={styles.invalidNotice}>
          <Info aria-hidden="true" size={18} />
          <span>
            Nomor halaman tidak valid. Menampilkan halaman pertama.{" "}
            <Link href={PROTECTED_ROUTES.leaderboard}>Hapus parameter halaman</Link>
          </span>
        </p>
      )}
      {!resource.loading && !resource.problem && resource.data?.page === 1 && (
        <LeaderboardPodium items={resource.data.items} />
      )}
      <LeaderboardPanel
        data={resource.data}
        loading={resource.loading}
        refreshing={resource.refreshing}
        problem={resource.problem}
        retry={resource.retry}
      />
    </div>
  );
}
