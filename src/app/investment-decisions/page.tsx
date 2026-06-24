"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { limit, orderBy } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { createInvestmentDecisionDraft } from "@/lib/financeDecisionIntelligence";
import { displayText, safeJoin } from "@/lib/ui/safe";
import type { InvestmentDecision } from "@/types/firestore";

function InvestmentDecisions({ uid }: { uid: string }) {
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", [orderBy("created_at", "desc"), limit(100)], true);
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const rawInput = String(new FormData(event.currentTarget).get("raw_input") ?? "").trim();
    try {
      if (rawInput) {
        const result = await createInvestmentDecisionDraft(getClientDb(), uid, rawInput);
        setCreatedId(result.investmentDecisionId);
        event.currentTarget.reset();
      }
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid"><header className="page-header"><div><h1>股票 / 投資決策</h1><p>只建立決策草稿，不抓即時股價、不自動下單、不保證獲利。</p></div><div className="action-row"><Link className="button secondary compact" href="/finance-advisor">財務決策中心</Link><Link className="button secondary compact" href="/finance-decisions">重大財務決策</Link></div></header>{investments.error ? <section className="panel"><p className="muted">{investments.error}</p></section> : null}<section className="panel"><h2>新增 investment decision draft</h2><form className="grid" onSubmit={create}><label>投資決策輸入<input name="raw_input" placeholder="例如：台積電 2330 要不要加碼？目前成本..." /></label><button className="button compact" disabled={busy}>建立投資決策草稿</button>{createdId ? <p className="muted">已建立：<Link className="mono" href={`/investment-decisions/${createdId}`}>{createdId}</Link></p> : null}</form></section><section className="panel"><h2>投資決策列表</h2><div className="list">{investments.items.length === 0 ? <p className="muted">目前沒有投資決策草稿。</p> : investments.items.map((item) => <Link className="item" href={`/investment-decisions/${item.id}`} key={item.id}><div className="item-header"><h3>{displayText(item.symbol, "需要補標的")}</h3><span className="badge review">{displayText(item.status)}</span></div><div className="detail-grid"><div><strong>position_type</strong><p>{displayText(item.position_type)}</p></div><div><strong>thesis</strong><p>{displayText(item.current_thesis_status)}</p></div><div><strong>可否攤平</strong><p>{item.average_down_allowed ? "條件式允許" : "不允許"}</p></div><div><strong>missing</strong><p>{safeJoin(item.missing_required_fields)}</p></div></div><p className="muted">不自動抓即時股價；需要 Mark 補目前價格 / 成本 / 數量 / 原始買進理由。</p></Link>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <InvestmentDecisions uid={uid} />}</ProtectedPage>;
}
