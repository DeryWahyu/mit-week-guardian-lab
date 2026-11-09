export type GuardianRank = "Recruit" | "Junior Analyst" | "Cyber Sentinel" | "Forensic Master";

export interface RankInfo {
  rank: GuardianRank;
  currentExp: number;
  nextRankExp: number;
  progressPercent: number;
}

export function calculateRank(exp: number): RankInfo {
  if (exp < 100) {
    return {
      rank: "Recruit",
      currentExp: exp,
      nextRankExp: 100,
      progressPercent: Math.min(100, Math.round((exp / 100) * 100)),
    };
  }
  if (exp < 300) {
    return {
      rank: "Junior Analyst",
      currentExp: exp,
      nextRankExp: 300,
      progressPercent: Math.min(100, Math.round(((exp - 100) / 200) * 100)),
    };
  }
  if (exp < 600) {
    return {
      rank: "Cyber Sentinel",
      currentExp: exp,
      nextRankExp: 600,
      progressPercent: Math.min(100, Math.round(((exp - 300) / 300) * 100)),
    };
  }
  return {
    rank: "Forensic Master",
    currentExp: exp,
    nextRankExp: 1000,
    progressPercent: 100,
  };
}
