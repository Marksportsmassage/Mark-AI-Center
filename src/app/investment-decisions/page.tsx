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
  const [rawInput, setRawInput] = useState("");
  const templates = [
    ["新買進判斷", "新買進判斷：標的、成本、現價、數量、持股時間、原始買進理由、短線 / 長線定位、可投入資金、停損點、目標價"],
    ["加碼 / 攤平判斷", "加碼 / 攤平判斷：標的、成本、現價、數量、持股時間、原始買進理由是否仍成立、短線 / 長線定位、可投入資金、安全現金水位、停損點、目標價"],
    ["減碼 / 停利判斷", "減碼 / 停利判斷：標的、成本、現價、數量、持股時間、原始買進理由、目前是否達目標價、短線 / 長線定位、需要保留現金原因"],
    ["停損判斷", "停損判斷：標的、成本、現價、數量、持股時間、原始買進理由是否失效、第二停損線、最大可承受虧損"],
    ["續抱檢查", "續抱檢查：標的、成本、現價、數量、持股時間、原始買進理由、短線 / 長線定位、目標價、停損點"]
  ];

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const nextRawInput = String(new FormData(event.currentTarget).get("raw_input") ?? "").trim();
    try {
      if (nextRawInput) {
        const result = await createInvestmentDecisionDraft(getClientDb(), uid, nextRawInput);
        setCreatedId(result.investmentDecisionId);
        event.currentTarget.reset();
        setRawInput("");
      }
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid"><header className="page-header"><div><h1>股票 / 投資決策</h1><p>只建立決策草稿，不抓即時股價、不自動下單、不保證獲利。</p></div><div className="action-row"><Link className="button secondary compact" href="/finance-advisor">財務決策中心</Link><Link className="button secondary compact" href="/finance-decisions">重大財務決策</Link></div></header>{investments.error ? <section className="panel"><p className="muted">{investments.error}</p></section> : null}<section className="panel"><h2>快速建立模板</h2><div className="action-row">{templates.map(([label, value]) => <button className="button secondary compact" key={label} type="button" onClick={() => setRawInput(value)}>{label}</button>)}</div><ul><li>原始理由 unknown 或 invalid，不允許直接攤平。</li><li>沒有安全現金水位，不允許建議加碼，只能標記 needs_more_info。</li><li>若倉位太高，建議 reduce / hold，不建議加碼。</li><li>不自動下單，不保證獲利。</li></ul></section><section className="panel"><h2>新增 investment decision draft</h2><form className="grid" onSubmit={create}><label>投資決策輸入<textarea name="raw_input" rows={5} value={rawInput} onChange={(event) => setRawInput(event.target.value)} placeholder="例如：台積電 2330 要不要加碼？目前成本..." /></label><button className="button compact" disabled={busy}>建立投資決策草稿</button>{createdId ? <p className="muted">已建立：<Link className="mono" href={`/investment-decisions/${createdId}`}>{createdId}</Link></p> : null}</form></section><section className="panel"><h2>投資決策列表</h2><div className="list">{investments.items.length === 0 ? <p className="muted">目前沒有投資決策草稿。</p> : investments.items.map((item) => <Link className="item" href={`/investment-decisions/${item.id}`} key={item.id}><div className="item-header"><h3>{displayText(item.symbol, "需要補標的")}</h3><span className="badge review">{displayText(item.status)}</span></div><div className="detail-grid"><div><strong>position_type</strong><p>{displayText(item.position_type)}</p></div><div><strong>thesis</strong><p>{displayText(item.current_thesis_status)}</p></div><div><strong>可否攤平</strong><p>{item.average_down_allowed ? "條件式允許" : "不允許"}</p></div><div><strong>missing</strong><p>{safeJoin(item.missing_required_fields)}</p></div></div><p className="muted">不自動抓即時股價；需要 Mark 補目前價格 / 成本 / 數量 / 原始買進理由。</p></Link>)}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <InvestmentDecisions uid={uid} />}</ProtectedPage>;
}
