export const MARK_TIME_ZONE = "Asia/Taipei";

export type PartOfDay = "凌晨" | "早上" | "下午" | "晚上";

export type TimeContext = {
  timeZone: typeof MARK_TIME_ZONE;
  now: Date;
  iso: string;
  dateKey: string;
  currentDate: string;
  currentTime: string;
  dayOfWeek: string;
  partOfDay: PartOfDay;
  timestampLabel: string;
};

function partsFor(date: Date) {
  const formatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: MARK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long"
  });
  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

export function getPartOfDay(hour: number): PartOfDay {
  if (hour < 6) return "凌晨";
  if (hour < 12) return "早上";
  if (hour < 18) return "下午";
  return "晚上";
}

export function getTimeContext(now = new Date()): TimeContext {
  const parts = partsFor(now);
  const hour = Number(parts.hour ?? "0");
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const currentDate = `${parts.year}/${parts.month}/${parts.day}`;
  const currentTime = `${parts.hour}:${parts.minute}`;

  return {
    timeZone: MARK_TIME_ZONE,
    now,
    iso: now.toISOString(),
    dateKey,
    currentDate,
    currentTime,
    dayOfWeek: String(parts.weekday ?? ""),
    partOfDay: getPartOfDay(hour),
    timestampLabel: `${currentDate} ${currentTime} ${parts.weekday ?? ""} (${MARK_TIME_ZONE})`
  };
}

export function formatTaipeiDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: MARK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).format(new Date(date));
}

export function formatTaipeiDateTime(date: Date | string | number) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: MARK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false
  }).format(new Date(date));
}

export function formatRelativeDeadline(deadline: Date | string | number, now = new Date()) {
  const targetKey = getTimeContext(new Date(deadline)).dateKey;
  const nowKey = getTimeContext(now).dateKey;
  const targetUtc = Date.UTC(Number(targetKey.slice(0, 4)), Number(targetKey.slice(5, 7)) - 1, Number(targetKey.slice(8, 10)));
  const nowUtc = Date.UTC(Number(nowKey.slice(0, 4)), Number(nowKey.slice(5, 7)) - 1, Number(nowKey.slice(8, 10)));
  const diffDays = Math.round((targetUtc - nowUtc) / 86_400_000);

  if (diffDays < 0) return `已逾期 ${Math.abs(diffDays)} 天`;
  if (diffDays === 0) return "今天到期";
  if (diffDays === 1) return "明天到期";
  return `${diffDays} 天後到期`;
}
