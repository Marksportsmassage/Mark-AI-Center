"use client";

import Link from "next/link";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { buildCollectionStatus, PRODUCTION_URL, publicEnvPresence, safetyChecklist } from "@/lib/governance";
import type { AuditLog, DailyBrief, DecisionFollowup, FinanceSnapshot, Reviewable } from "@/types/firestore";

function SystemStatusData() {
  const auth = useOwnerAuth();
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const audits = useFirestoreCollection<AuditLog>("audit_logs", recent20, true);
  const briefs = useFirestoreCollection<DailyBrief>("daily_briefs", recent20, true);
  const tasks = useFirestoreCollection<Reviewable>("task_dispatches", recent20, true);
  const followups = useFirestoreCollection<DecisionFollowup>("decision_followups", recent20, true);
  const error = snapshots.error ?? audits.error ?? briefs.error ?? tasks.error ?? followups.error;
  const pendingReview = tasks.items.filter((item) => item.need_mark_review).length;
  const envPresence = publicEnvPresence({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  });
  const collections = buildCollectionStatus({
    finance_snapshots: { count: snapshots.items.length, error: snapshots.error, isLoading: snapshots.isLoading },
    audit_logs: { count: audits.items.length, error: audits.error, isLoading: audits.isLoading },
    daily_briefs: { count: briefs.items.length, error: briefs.error, isLoading: briefs.isLoading },
    task_dispatches: { count: tasks.items.length, error: tasks.error, isLoading: tasks.isLoading },
    decision_followups: { count: followups.items.length, error: followups.error, isLoading: followups.isLoading }
  });
  const safety = safetyChecklist();
  return <div className="grid"><header className="page-header"><div><h1>System Status</h1><p>Production health without displaying secret values.</p><div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="系統狀態" /></div></div><div className="action-row"><Link className="button secondary compact" href="/today">Today Dashboard</Link><Link className="button secondary compact" href="/release-notes">版本紀錄</Link></div></header>{error ? <section className="panel"><h2>Firestore read status</h2><p className="muted">{error}</p></section> : null}<section className="panel"><h2>App / Environment</h2><div className="detail-grid"><div><strong>app version</strong><p>Modern Assistant / Agent Operating System</p></div><div><strong>latest commit</strong><p>main / App Hosting deployed commit</p></div><div><strong>production URL</strong><p>{PRODUCTION_URL}</p></div><div><strong>Firebase project id</strong><p>{envPresence.find((item) => item.key === "NEXT_PUBLIC_FIREBASE_PROJECT_ID")?.status}</p></div><div><strong>NEXT_PUBLIC Firebase env</strong><p>{envPresence.map((item) => `${item.key.replace("NEXT_PUBLIC_FIREBASE_", "")}:${item.status}`).join(" / ")}</p></div><div><strong>route mode</strong><p>Next.js App Hosting / protected client routes</p></div></div></section><section className="panel"><h2>Relay / Handoff</h2><div className="detail-grid"><div><strong>primary relay</strong><p>GitHub issue #2 / sanitized comments</p></div><div><strong>issue URL</strong><p><Link href="https://github.com/Marksportsmassage/Mark-AI-Center/issues/2">Codex ↔ ChatGPT Relay / Handoff Log</Link></p></div><div><strong>browser relay</strong><p>paused until target validation is reliable</p></div><div><strong>local fallback</strong><p>/tmp/codex-to-chatgpt-latest.md</p></div><div><strong>latest command fetch</strong><p>npm run codex:fetch-command</p></div><div><strong>relay safety</strong><p>sanitized only / no raw finance / no raw PDF / no secrets</p></div></div></section><section className="panel"><h2>Auth / Owner</h2><div className="detail-grid"><div><strong>auth status</strong><p>{auth.debugInfo.auth_loaded ? "loaded" : "loading"} / {auth.status}</p></div><div><strong>owner access status</strong><p>{auth.status === "allowed" ? "owner" : auth.message}</p></div><div><strong>Firestore read status</strong><p>{error ? "error" : "ok"}</p></div><div><strong>smoke routes status</strong><p>covered by npm run test:smoke</p></div></div></section><section className="panel"><h2>Major Collections</h2><div className="detail-grid">{collections.map((item) => <div key={item.name}><strong>{item.name}</strong><p>{item.status} / {item.count}{item.message ? ` / ${item.message}` : ""}</p></div>)}<div><strong>recent audit logs count</strong><p>{audits.items.length}</p></div><div><strong>pending review count</strong><p>{pendingReview}</p></div><div><strong>last CFO brief time</strong><p>{String(briefs.items[0]?.created_at ?? "None")}</p></div></div></section><section className="panel"><h2>Safety</h2><div className="detail-grid"><div><strong>LINE reply / push</strong><p>{safety.line_reply_push_enabled ? "enabled" : "disabled"}</p></div><div><strong>functions</strong><p>{safety.functions_deployed ? "deployed" : "skipped / not recently deployed"}</p></div><div><strong>external actions</strong><p>{safety.external_action_allowed ? "enabled" : "disabled"}</p></div><div><strong>secret values displayed</strong><p>{safety.secrets_displayed ? "yes" : "no"}</p></div><div><strong>deploy policy</strong><p>App Hosting only; functions deploy disabled for this sprint.</p></div><div><strong>assistant actions</strong><p>draft / review-gated / external_action_allowed=false</p></div></div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{() => <SystemStatusData />}</ProtectedPage>;
}
