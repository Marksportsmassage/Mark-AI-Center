"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { reviewCapitalAllocation, type CapitalAllocationAction } from "@/lib/financeReviewActions";
import { formatDateTime, safeJson } from "@/lib/ui/format";
import type { CapitalAllocation } from "@/types/firestore";

function CapitalAllocationDetail({ id, uid }: { id: string; uid: string }) {
  const [allocation, setAllocation] = useState<CapitalAllocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  async function load() { setError(null); try { const snap = await getDoc(doc(getClientDb(), "capital_allocations", id)); setAllocation(snap.exists() ? ({ id: snap.id, ...snap.data() } as CapitalAllocation) : null); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Failed to load capital allocation."); } }
  useEffect(() => { void load(); }, [id]);
  async function act(action: CapitalAllocationAction) { setBusy(action); try { await reviewCapitalAllocation(getClientDb(), id, action, uid); await load(); } finally { setBusy(null); } }
  if (error) return <section className="panel"><h2>Capital allocation error</h2><p className="muted">{error}</p><button className="button compact" onClick={load}>Retry</button></section>;
  if (!allocation) return <p className="muted">Loading capital allocation...</p>;
  return <div className="grid"><header className="page-header"><div><h1>{allocation.title}</h1><p>{allocation.decision_status} · {formatDateTime(allocation.created_at)}</p></div><Link className="button secondary compact" href="/finance-advisor">Finance Advisor</Link></header><section className="panel"><h2>Overview</h2><div className="detail-grid"><div><strong>total_available_capital</strong><p>{allocation.total_available_capital ?? "需要 Mark 補資料"}</p></div><div><strong>safety_cash_reserve</strong><p>{allocation.safety_cash_reserve ?? "需要 Mark 補資料"}</p></div><div><strong>deployable_capital</strong><p>{allocation.deployable_capital ?? "需要 Mark 補資料"}</p></div><div><strong>external_action_allowed</strong><p>{String(Boolean(allocation.external_action_allowed))}</p></div></div></section><section className="panel"><h2>Allocation / Risk Items</h2><pre className="json-block">{safeJson({ allocation_items: allocation.allocation_items, risk_items: allocation.risk_items, missing_required_fields: allocation.missing_required_fields })}</pre></section><section className="panel"><h2>Review Actions</h2><p className="muted">只更新 Firestore + audit_logs，不觸發付款 / 下單 / 投資 / 轉帳 / 創業執行。</p><div className="action-row"><button className="button compact" disabled={Boolean(busy)} onClick={() => act("approve")}>Approve</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("reject")}>Reject</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("more_info")}>Need More Info</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("archive")}>Archive</button></div></section></div>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((value) => setId(value.id)); }, [params]);
  return <ProtectedPage>{(uid) => id ? <CapitalAllocationDetail id={id} uid={uid} /> : null}</ProtectedPage>;
}
