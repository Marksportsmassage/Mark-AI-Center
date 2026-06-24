# Security And Deployment Rules

## Deployment

- Firestore rules 只用 `firebase deploy --only firestore:rules --project mark-ai-center`。
- Frontend 只用 `firebase deploy --only apphosting --project mark-ai-center`。
- 不要執行全量 `firebase deploy`。
- 不要 deploy functions，除非 Mark 明確批准並確認必要原因。
- 不要改 secret，不要讀取或印出 `.env.local`。

## External Action Safety

- LINE reply / push disabled。
- 不啟用 LINE webhook 行為變更。
- 不自動交易、不自動下單、不自動付款、不自動轉帳。
- 不聯絡供應商。
- 不假裝有即時股價，不保證投資獲利。
- AI / rule-based outputs 必須 review-gated。

## Production Checks

- `/system-status` 應顯示 public env present/missing，但不顯示任何值。
- `/release-notes` 應顯示 Phase 8-12 內容與安全注意事項。
- `/data-quality` 應列出缺財務基準、投資欄位、信用卡、分期、負債、回本計畫。
- Smoke routes 必須覆蓋 `/today`、`/intake`、`/review-queue`、`/system-status`、`/data-quality`。
