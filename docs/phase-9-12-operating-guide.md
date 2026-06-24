# Phase 9-12 Operating Guide

主入口是 `https://mark-ai-center--mark-ai-center.asia-east1.hosted.app`。不要使用 `mark-ai-center.web.app` 作為正式入口。

## Daily Flow

1. 每天先看 `/today`，確認 CFO 今日摘要、待審核項目、followups、風險提醒。
2. 把銀行、信用卡、分期、支出、投資、創業想法貼到 `/intake`。
3. 到 `/review-queue` 審核所有 waiting review / waiting mark input 草稿。
4. 到 `/finance-baseline` 補財務基準，再看 `/net-worth` 與 `/cashflow`。
5. 大額支出、投資、創業測試前先到 `/decision-lab` 模擬。
6. 每週到 `/weekly-review` 產生回顧 draft。
7. 每月到 `/monthly-close` 產生月結 draft。
8. 用 `/system-status` 檢查 production health，用 `/data-quality` 檢查缺資料。

## Important Rules

- functions 仍未部署，除非 Mark 另行批准。
- LINE reply / push disabled。
- 投資只做草稿，不自動交易、不自動下單、不保證獲利。
- 不自動付款、不自動轉帳、不聯絡供應商。
- 信用卡繳費不 double count 為新消費。
- Line Pay 只記錄大筆 / 警訊支出，普通生活流水帳不需要全部塞進系統。
- 所有重要輸出都維持 `need_mark_review=true` 與 `external_action_allowed=false`。
