"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { limit, orderBy } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { createFinanceDecisionDraft } from "@/lib/financeDecisionIntelligence";
import { displayText } from "@/lib/ui/safe";
import type { FinanceDecision } from "@/types/firestore";

function FinanceDecisionList({ uid }: { uid: string }) {
  const decisions = useFirestoreCollection<FinanceDecision>("finance_decisions", [orderBy("created_at", "desc"), limit(100)], true);
  const [decisionType, setDecisionType] = useState("");
  const [status, setStatus] = useState("");
  const [warningOnly, setWarningOnly] = useState(false);
  const [investmentOnly, setInvestmentOnly] = useState(false);
  const [assetOnly, setAssetOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const filtered = useMemo(() => decisions.items.filter((item) =>
    (!decisionType || item.decision_type === decisionType) &&
    (!status || item.status === status) &&
    (!warningOnly || item.is_warning_signal) &&
    (!investmentOnly || item.is_investment) &&
    (!assetOnly || item.is_asset_purchase)
  ), [decisions.items, decisionType, status, warningOnly, investmentOnly, assetOnly]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const text = String(new FormData(event.currentTarget).get("raw_input") ?? "").trim();
    try {
      if (text) {
        const result = await createFinanceDecisionDraft(getClientDb(), uid, text, "manual");
        setCreatedId(result.financeDecisionId);
        event.currentTarget.reset();
      }
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid"><header className="page-header"><div><h1>重大財務決策</h1><p>追蹤大筆支出、警訊消費、信用卡、分期、投資、資產購買與創業測試支出。</p></div><div className="action-row"><Link className="button secondary compact" href="/finance-advisor">財務決策中心</Link><Link className="button secondary compact" href="/command-center">Command Center</Link></div></header>{decisions.error ? <section className="panel"><h2>Finance decision error</h2><p className="muted">{decisions.error}</p></section> : null}<section className="panel"><h2>新增 manual finance decision draft</h2><form className="grid" onSubmit={create}><label>原始輸入<input name="raw_input" placeholder="例如：我買了課程 18000，想知道能不能花、怎麼回本" /></label><button className="button compact" disabled={busy}>建立重大財務決策草稿</button>{createdId ? <p className="muted">已建立：<Link className="mono" href={`/finance-decisions/${createdId}`}>{createdId}</Link></p> : null}</form></section><section className="panel"><h2>Filters</h2><div className="detail-grid"><label>decision_type<input value={decisionType} onChange={(event) => setDecisionType(event.target.value)} placeholder="warning_spending" /></label><label>status<input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="waiting_mark_input" /></label><label><input type="checkbox" checked={warningOnly} onChange={(event) => setWarningOnly(event.target.checked)} /> 只看警訊</label><label><input type="checkbox" checked={investmentOnly} onChange={(event) => setInvestmentOnly(event.target.checked)} /> 只看投資</label><label><input type="checkbox" checked={assetOnly} onChange={(event) => setAssetOnly(event.target.checked)} /> 只看資產型支出</label></div></section><section className="panel"><h2>Decision List</h2><div className="list">{filtered.length === 0 ? <p className="muted">目前沒有符合條件的重大財務決策。</p> : filtered.map((item) => <Link className="item" href={`/finance-decisions/${item.id}`} key={item.id}><div className="item-header"><h3>{displayText(item.title, "重大財務決策")}</h3><span className="badge review">{displayText(item.status)}</span></div><div className="detail-grid"><div><strong>金額</strong><p>{item.amount ?? "需要 Mark 補資料"} {item.currency ?? "TWD"}</p></div><div><strong>類型</strong><p>{displayText(item.decision_type)}</p></div><div><strong>風險</strong><p>{item.is_warning_signal ? "警訊" : "待分析"}</p></div><div><strong>資產 / 投資</strong><p>{item.is_asset_purchase ? "資產型" : item.is_investment ? "投資型" : "否"}</p></div></div><div className="badge-row">{item.need_mark_review ? <span className="badge review">Mark review</span> : null}<span className="badge">external false</span></div></Link>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <FinanceDecisionList uid={uid} />}</ProtectedPage>;
}
