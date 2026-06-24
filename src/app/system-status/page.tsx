"use client";

import Link from "next/link";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import type { AuditLog, DailyBrief, FinanceSnapshot, Reviewable } from "@/types/firestore";

function envStatus(value: string | undefined) {
  return value ? "present" : "missing";
}

function SystemStatusData() {
  const auth = useOwnerAuth();
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const audits = useFirestoreCollection<AuditLog>("audit_logs", recent20, true);
  const briefs = useFirestoreCollection<DailyBrief>("daily_briefs", recent20, true);
  const tasks = useFirestoreCollection<Reviewable>("task_dispatches", recent20, true);
  const error = snapshots.error ?? audits.error ?? briefs.error ?? tasks.error;
  const pendingReview = tasks.items.filter((item) => item.need_mark_review).length;
  return <div className="grid"><header className="page-header"><div><h1>System Status</h1><p>Production health without displaying secret values.</p></div><Link className="button secondary compact" href="/today">Today Dashboard</Link></header>{error ? <section className="panel"><h2>Firestore read status</h2><p className="muted">{error}</p></section> : null}<section className="panel"><h2>App / Environment</h2><div className="detail-grid"><div><strong>production URL</strong><p>https://mark-ai-center--mark-ai-center.asia-east1.hosted.app</p></div><div><strong>Firebase project id</strong><p>{envStatus(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)}</p></div><div><strong>NEXT_PUBLIC Firebase config</strong><p>apiKey {envStatus(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)} / appId {envStatus(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)}</p></div><div><strong>LINE reply / push</strong><p>disabled / not enabled by this app page</p></div><div><strong>functions</strong><p>skipped / not deployed by Phase 9-12 flow</p></div></div></section><section className="panel"><h2>Auth / Owner</h2><div className="detail-grid"><div><strong>auth status</strong><p>{auth.debugInfo.auth_loaded ? "loaded" : "loading"} / {auth.status}</p></div><div><strong>owner access status</strong><p>{auth.status === "allowed" ? "owner" : auth.message}</p></div></div></section><section className="panel"><h2>Major Collections</h2><div className="detail-grid"><div><strong>finance_snapshots</strong><p>{snapshots.items.length}</p></div><div><strong>audit_logs</strong><p>{audits.items.length}</p></div><div><strong>pending review count</strong><p>{pendingReview}</p></div><div><strong>last CFO brief time</strong><p>{String(briefs.items[0]?.created_at ?? "None")}</p></div></div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{() => <SystemStatusData />}</ProtectedPage>;
}
