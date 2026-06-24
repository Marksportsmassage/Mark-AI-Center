export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function displayText(value: unknown, fallback = "None") {
  if (value === false) return "false";
  if (value === true) return "true";
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

export function safeJoin(value: unknown, separator = "、", fallback = "None") {
  const items = asArray(value).map((item) => String(item)).filter(Boolean);
  return items.length ? items.join(separator) : fallback;
}
