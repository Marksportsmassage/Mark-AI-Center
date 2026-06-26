export type FreshnessLevel = "fresh" | "stale" | "outdated";

export type FreshnessResult = {
  level: FreshnessLevel;
  label: string;
  ageHours: number | null;
  isOverdue: boolean;
};

export function dataFreshness(updatedAt: Date | string | number | null | undefined, now = new Date()): FreshnessResult {
  if (!updatedAt) {
    return { level: "outdated", label: "沒有更新時間", ageHours: null, isOverdue: true };
  }

  const updatedMs = new Date(updatedAt).getTime();
  if (!Number.isFinite(updatedMs)) {
    return { level: "outdated", label: "更新時間不可讀", ageHours: null, isOverdue: true };
  }

  const ageHours = Math.max(0, (now.getTime() - updatedMs) / 3_600_000);
  if (ageHours <= 24) return { level: "fresh", label: "24 小時內更新", ageHours, isOverdue: false };
  if (ageHours <= 72) return { level: "stale", label: "1-3 天未更新", ageHours, isOverdue: false };
  return { level: "outdated", label: "超過 3 天未更新", ageHours, isOverdue: true };
}

export function isOverdue(deadline: Date | string | number | null | undefined, now = new Date()) {
  if (!deadline) return false;
  const targetMs = new Date(deadline).getTime();
  return Number.isFinite(targetMs) && targetMs < now.getTime();
}
