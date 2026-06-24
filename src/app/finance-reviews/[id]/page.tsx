"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { reviewFinanceReview, type FinanceReviewAction } from "@/lib/financeReviewActions";
import { formatDateTime, safeJson } from "@/lib/ui/format";
import type { FinanceReview } from "@/types/firestore";

function Field({ label, value }: { label: string; value: unknown }) { return <div><strong>{label}</strong><p>{value === false ? "false" : value ? String(value) : "None"}</p></div>; }

function FinanceReviewDetail({ id, uid }: { id: string; uid: string }) {
  const [review, setReview] = useState<FinanceReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  async function load() { setError(null); try { const snap = await getDoc(doc(getClientDb(), "finance_reviews", id)); setReview(snap.exists() ? ({ id: snap.id, ...snap.data() } as FinanceReview) : null); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Failed to load finance review."); } }
  useEffect(() => { void load(); }, [id]);
  async function act(action: FinanceReviewAction) { setBusy(action); try { await reviewFinanceReview(getClientDb(), id, action, uid); await load(); } finally { setBusy(null); } }
  if (error) return <section className="panel"><h2>Finance review error</h2><p className="muted">{error}</p><button className="button compact" onClick={load}>Retry</button></section>;
  if (!review) return <p className="muted">Loading finance review...</p>;
  return <div className="grid"><header className="page-header"><div><h1>{review.title}</h1><p>CFO / Finance Review Detail - no external action.</p></div><div className="action-row"><Link className="button secondary compact" href="/finance-advisor">Finance Advisor</Link>{review.source_task_dispatch_id ? <Link className="button secondary compact" href={`/task-dispatches/${review.source_task_dispatch_id}`}>Source Task</Link> : null}</div></header><section className="panel"><h2>Review Overview</h2><div className="detail-grid"><Field label="source_task_dispatch_id" value={review.source_task_dispatch_id}/><Field label="project_id" value={review.project_id}/><Field label="capital_required" value={review.capital_required}/><Field label="cashflow_impact" value={review.cashflow_impact}/><Field label="roi_assumption" value={review.roi_assumption}/><Field label="payback_period" value={review.payback_period}/><Field label="liquidity_risk" value={review.liquidity_risk}/><Field label="worst_case_loss" value={review.worst_case_loss}/><Field label="recommendation" value={review.recommendation}/><Field label="status" value={review.status}/><Field label="need_mark_review" value={review.need_mark_review}/><Field label="external_action_allowed" value={review.external_action_allowed}/><Field label="created_at" value={formatDateTime(review.created_at)}/></div></section><section className="panel"><h2>Inputs / Stop Loss</h2><pre className="json-block">{safeJson({ stop_loss_conditions: review.stop_loss_conditions, required_mark_inputs: review.required_mark_inputs, missing_required_fields: review.missing_required_fields })}</pre></section><section className="panel"><h2>Review Actions</h2><p className="muted">所有操作只更新 Firestore 與 audit_logs，不觸發任何外部行動。</p><div className="action-row"><button className="button compact" disabled={Boolean(busy)} onClick={() => act("approve")}>Approve Review</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("more_info")}>Need More Info</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("archive")}>Archive</button></div></section></div>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((value) => setId(value.id)); }, [params]);
  return <ProtectedPage>{(uid) => id ? <FinanceReviewDetail id={id} uid={uid} /> : null}</ProtectedPage>;
}
