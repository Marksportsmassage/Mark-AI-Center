"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { generateFinanceDecisionReview, reviewFinanceDecision } from "@/lib/financeDecisionIntelligence";
import { createSopDraftFromFinanceDecision } from "@/lib/sop";
import { safeJson } from "@/lib/ui/format";
import { displayText } from "@/lib/ui/safe";
import type { FinanceDecision, FinanceDecisionReview } from "@/types/firestore";

function Field({ label, value }: { label: string; value: unknown }) {
  return <div><strong>{label}</strong><p>{displayText(value)}</p></div>;
}

function FinanceDecisionDetail({ id, uid }: { id: string; uid: string }) {
  const [decision, setDecision] = useState<FinanceDecision | null>(null);
  const [reviews, setReviews] = useState<FinanceDecisionReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [createdReviewId, setCreatedReviewId] = useState<string | null>(null);
  const [sopId, setSopId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const db = getClientDb();
      const snap = await getDoc(doc(db, "finance_decisions", id));
      setDecision(snap.exists() ? ({ id: snap.id, ...snap.data() } as FinanceDecision) : null);
      const reviewSnap = await getDocs(query(collection(db, "finance_decision_reviews"), where("finance_decision_id", "==", id), limit(10)));
      setReviews(reviewSnap.docs.map((item) => ({ id: item.id, ...item.data() } as FinanceDecisionReview)).sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load finance decision.");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function createReview() {
    setBusy("review");
    try {
      const result = await generateFinanceDecisionReview(getClientDb(), id, uid);
      setCreatedReviewId(result.reviewId);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function act(action: "mark_reviewed" | "need_more_info" | "archive") {
    setBusy(action);
    try {
      await reviewFinanceDecision(getClientDb(), id, action, uid);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function createSop() {
    setBusy("sop");
    try {
      const result = await createSopDraftFromFinanceDecision(getClientDb(), id, uid);
      setSopId(result.sopId);
    } finally {
      setBusy(null);
    }
  }

  if (error) return <section className="panel"><h2>Finance decision error</h2><p className="muted">{error}</p><button className="button compact" onClick={load}>Retry</button></section>;
  if (!loaded) return <p className="muted">Loading finance decision...</p>;
  if (!decision) return <section className="panel"><h2>找不到重大財務決策</h2><p className="muted">這筆 finance decision 不存在，或目前帳號沒有權限讀取。</p><Link className="button secondary compact" href="/finance-decisions">回重大財務決策</Link></section>;
  const latestReview = reviews[0];

  return <div className="grid"><header className="page-header"><div><h1>{displayText(decision.title, "重大財務決策")}</h1><p>{displayText(decision.decision_type)} · {displayText(decision.status)} · external_action_allowed=false</p></div><div className="action-row"><Link className="button secondary compact" href="/finance-decisions">Finance Decisions</Link><Link className="button secondary compact" href="/audit-logs">Audit Logs</Link></div></header><section className="panel"><h2>原始輸入 / 分類</h2><div className="detail-grid"><Field label="raw_input" value={decision.raw_input}/><Field label="amount" value={decision.amount}/><Field label="currency" value={decision.currency}/><Field label="decision_stage" value={decision.decision_stage}/><Field label="decision_type" value={decision.decision_type}/><Field label="category" value={decision.category}/><Field label="is_warning_signal" value={decision.is_warning_signal}/><Field label="is_asset_purchase" value={decision.is_asset_purchase}/><Field label="is_investment" value={decision.is_investment}/><Field label="payment_method" value={decision.payment_method}/><Field label="related_stock_symbol" value={decision.related_stock_symbol}/></div></section><section className="panel"><h2>決策分析</h2>{latestReview ? <div className="grid"><div className="detail-grid"><Field label="classification_reason" value={latestReview.classification_reason}/><Field label="usability_assessment" value={latestReview.usability_assessment}/><Field label="cashflow_impact" value={latestReview.cashflow_impact}/><Field label="risk_level" value={latestReview.risk_level}/><Field label="recommendation" value={latestReview.recommendation}/><Field label="status" value={latestReview.status}/></div><pre className="json-block">{safeJson({ recovery_methods: latestReview.recovery_methods, offset_methods: latestReview.offset_methods, breakeven_plan: latestReview.breakeven_plan, stop_loss_conditions: latestReview.stop_loss_conditions, next_actions: latestReview.next_actions, missing_required_fields: latestReview.missing_required_fields })}</pre>{createdReviewId ? <p className="muted">New review draft: <span className="mono">{createdReviewId}</span></p> : null}</div> : <p className="muted">尚未產生 Finance Decision Review。</p>}</section><section className="panel"><h2>Review Actions</h2><p className="muted">所有操作只寫 Firestore / audit_logs，不會付款、不會轉帳、不會下單、不會聯絡外部。</p><div className="action-row"><button className="button compact" disabled={Boolean(busy)} onClick={createReview}>產生或更新 Finance Decision Review</button><button className="button compact" disabled={Boolean(busy)} onClick={() => act("mark_reviewed")}>Mark as Reviewed</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("need_more_info")}>Need More Info</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("archive")}>Archive</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={createSop}>Create SOP Draft from Decision</button></div>{sopId ? <p className="muted">SOP draft: <Link className="mono" href={`/knowledge-sop/${sopId}`}>{sopId}</Link></p> : null}</section></div>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((value) => setId(value.id)); }, [params]);
  return <ProtectedPage>{(uid) => id ? <FinanceDecisionDetail id={id} uid={uid} /> : null}</ProtectedPage>;
}
