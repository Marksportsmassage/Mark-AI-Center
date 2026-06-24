"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { reviewInvestmentDecision } from "@/lib/financeDecisionIntelligence";
import { safeJson } from "@/lib/ui/format";
import { displayText } from "@/lib/ui/safe";
import type { InvestmentDecision } from "@/types/firestore";

function Field({ label, value }: { label: string; value: unknown }) {
  return <div><strong>{label}</strong><p>{displayText(value)}</p></div>;
}

function InvestmentDetail({ id, uid }: { id: string; uid: string }) {
  const [investment, setInvestment] = useState<InvestmentDecision | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const snap = await getDoc(doc(getClientDb(), "investment_decisions", id));
      setInvestment(snap.exists() ? ({ id: snap.id, ...snap.data() } as InvestmentDecision) : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load investment decision.");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function act(action: "mark_reviewed" | "need_more_info" | "archive") {
    setBusy(action);
    try {
      await reviewInvestmentDecision(getClientDb(), id, action, uid);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (error) return <section className="panel"><h2>Investment decision error</h2><p className="muted">{error}</p><button className="button compact" onClick={load}>Retry</button></section>;
  if (!loaded) return <p className="muted">Loading investment decision...</p>;
  if (!investment) return <section className="panel"><h2>找不到投資決策</h2><p className="muted">這筆 investment decision 不存在，或目前帳號沒有權限讀取。</p><Link className="button secondary compact" href="/investment-decisions">回投資決策</Link></section>;

  return <div className="grid"><header className="page-header"><div><h1>{displayText(investment.symbol, "投資決策草稿")}</h1><p>{displayText(investment.position_type)} · {displayText(investment.status)} · external_action_allowed=false</p></div><Link className="button secondary compact" href="/investment-decisions">Investment Decisions</Link></header><section className="panel"><h2>投資標的 / 原始理由</h2><div className="detail-grid"><Field label="asset_type" value={investment.asset_type}/><Field label="symbol" value={investment.symbol}/><Field label="market" value={investment.market}/><Field label="cost_basis" value={investment.cost_basis}/><Field label="current_price" value={investment.current_price}/><Field label="quantity" value={investment.quantity}/><Field label="market_value" value={investment.market_value}/><Field label="unrealized_pnl" value={investment.unrealized_pnl}/><Field label="original_thesis" value={investment.original_thesis}/><Field label="current_thesis_status" value={investment.current_thesis_status}/><Field label="time_horizon" value={investment.time_horizon}/></div><p className="muted">沒有即時市場資料；請 Mark 補目前價格 / 持有成本 / 持股數 / 目前損益 / 原始買進理由。</p></section><section className="panel"><h2>條件 / 停損 / 攤平</h2><pre className="json-block">{safeJson({ buy_conditions: investment.buy_conditions, add_conditions: investment.add_conditions, reduce_conditions: investment.reduce_conditions, take_profit_conditions: investment.take_profit_conditions, stop_loss_conditions: investment.stop_loss_conditions, average_down_allowed: investment.average_down_allowed, average_down_conditions: investment.average_down_conditions, max_position_limit: investment.max_position_limit, cashflow_impact: investment.cashflow_impact, missing_required_fields: investment.missing_required_fields })}</pre></section><section className="panel"><h2>Review Actions</h2><p className="muted">所有操作只更新 Firestore / audit_logs，不會交易、不會下單、不會抓即時股價。</p><div className="action-row"><button className="button compact" disabled={Boolean(busy)} onClick={() => act("mark_reviewed")}>Mark as Reviewed</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("need_more_info")}>Need More Info</button><button className="button secondary compact" disabled={Boolean(busy)} onClick={() => act("archive")}>Archive</button></div></section></div>;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  useEffect(() => { void params.then((value) => setId(value.id)); }, [params]);
  return <ProtectedPage>{(uid) => id ? <InvestmentDetail id={id} uid={uid} /> : null}</ProtectedPage>;
}
