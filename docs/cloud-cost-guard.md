# Cloud Cost Guard

Current context: Google Cloud Billing Budget Alert reached 100% of the USD 25 budget for Jun 1, 2026 to Jun 30, 2026.

This document is an internal operating guard. It does not change Google Cloud Billing settings, shut down services, or adjust Firebase Console configuration.

## Watch Lines

- Current budget watch line: USD 25/month
- Soft warning: USD 30/month
- Hard review: USD 50/month
- Freeze threshold: USD 100/month

## Rules

- No functions deploy unless Mark explicitly approves.
- No LINE reply / push unless Mark explicitly approves.
- No scheduled jobs unless approved.
- No paid market data unless approved.
- No paid OCR pipeline unless approved.
- No new external paid APIs unless reviewed.
- App Hosting deploys should be batched. Do not deploy every small change.
- Today all frontend changes should be completed first, then App Hosting deployed once.
- Budget alerts do not stop billing automatically.
- Do not automatically adjust Billing Console settings.
- Do not shut down services automatically.

## Operating Notes

- Treat USD 25-30/month as the current infrastructure cost watch line for Mark AI Command Center.
- If monthly cost exceeds USD 30, inspect Billing by service.
- If monthly cost exceeds USD 50, pause new deploys and inspect App Hosting, Cloud Run, Cloud Build, Artifact Registry, Logging, Firestore, and Auth.
- If monthly cost exceeds USD 100 without revenue or clear operational need, freeze nonessential cloud features and require Mark approval.
- Mark should review Billing Console weekly while the system is under active development.

