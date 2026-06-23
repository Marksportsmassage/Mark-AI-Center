export function formatDateTime(value: unknown) {
  if (!value) {
    return "unknown";
  }

  if (typeof value === "string") {
    return value.replace("T", " ").slice(0, 16);
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString("zh-TW");
  }

  return "unknown";
}

export function redactSensitiveJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveJson);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
      const lower = key.toLowerCase();
      if (
        lower.includes("token") ||
        lower.includes("secret") ||
        lower.includes("api_key") ||
        lower.includes("authorization") ||
        key === "LINE_CHANNEL_SECRET" ||
        key === "LINE_CHANNEL_ACCESS_TOKEN" ||
        key === "OPENAI_API_KEY"
      ) {
        return [key, "redacted"];
      }
      return [key, redactSensitiveJson(nested)];
    })
  );
}

export function safeJson(value: unknown) {
  return JSON.stringify(redactSensitiveJson(value), null, 2);
}
