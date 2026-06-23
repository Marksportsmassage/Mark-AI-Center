export const safetyRules = [
  "All AI-generated content defaults to need_mark_review = true.",
  "Do not automatically send LINE messages to external users.",
  "Do not automatically publish Instagram content.",
  "Do not automatically modify production customer data.",
  "Do not delete data.",
  "Do not place investment trades.",
  "Do not provide medical diagnosis or promise treatment outcomes."
];

export const reviewDefaults = {
  need_mark_review: true,
  review_status: "pending" as const
};
