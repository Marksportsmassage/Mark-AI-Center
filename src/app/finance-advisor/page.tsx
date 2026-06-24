"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { FINANCE_RISK_REMINDERS, MARK_FINANCE_INPUTS, ensureFinancialProfileDraft, generateCapitalAllocationDraft, missingFinancialProfileFields } from "@/lib/finance";
import { parseNullableNumber, updateFinancialProfile } from "@/lib/financeReviewActions";
import { formatDateTime, safeJson } from "@/lib/ui/format";
import { asArray, displayText, safeJoin } from "@/lib/ui/safe";
import type { CapitalAllocation, FinanceReview, FinancialProfile } from "@/types/firestore";

function money(value: unknown) {
  return value === null || value === undefined || value === "" ? "需要 Mark 補資料" : String(value);
}

const financeFieldLabels: Record<string, string> = {
  current_cash_available: "目前可動用現金",
  monthly_living_expense: "每月生活費",
  monthly_fixed_costs: "每月固定支出",
  safety_cash_reserve_target: "安全現金水位目標",
  current_investment_value: "目前投資部位估值",
  monthly_income_estimate: "每月收入估計",
  capital_deployment_limit: "單次可投入資金上限",
  current_debt_summary: "負債摘要",
  risk_tolerance: "可接受最大單項虧損 / 風險描述",
  notes: "近期大額支出或備註"
};

function FinanceAdvisorData({ uid }: { uid: string }) {
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [allocations, setAllocations] = useState<CapitalAllocation[]>([]);
  const [reviews, setReviews] = useState<FinanceReview[]>([]);
  const [created, setCreated] = useState<string | null>(null);
  const [profileCreated, setProfileCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const db = getClientDb();
      const [p, a, r] = await Promise.all([
        getDocs(query(collection(db, "financial_profile"), where("user_id", "==", uid), limit(1))),
        getDocs(query(collection(db, "capital_allocations"), orderBy("created_at", "desc"), limit(20))),
        getDocs(query(collection(db, "finance_reviews"), orderBy("created_at", "desc"), limit(50)))
      ]);
      setProfile(p.docs[0] ? ({ id: p.docs[0].id, ...p.docs[0].data() } as FinancialProfile) : null);
      setAllocations(a.docs.map((item) => ({ id: item.id, ...item.data() } as CapitalAllocation)).filter((item) => item.id));
      setReviews(r.docs.map((item) => ({ id: item.id, ...item.data() } as FinanceReview)).filter((item) => item.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load finance advisor.");
    }
  }

  useEffect(() => { void load(); }, [uid]);
  const missing = useMemo(() => missingFinancialProfileFields(profile), [profile]);
  const incomplete = !profile || missing.length > 0;

  async function generate() {
    setBusy("allocation");
    try {
      const res = await generateCapitalAllocationDraft(getClientDb(), uid);
      setCreated(res.allocationId);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function createProfileDraft() {
    setBusy("profile");
    setSaveMessage(null);
    try {
      const res = await ensureFinancialProfileDraft(getClientDb(), uid);
      setProfileCreated(res.profileId);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save-profile");
    setSaveMessage(null);
    setError(null);
    try {
      const db = getClientDb();
      const profileId = profile?.id ?? (await ensureFinancialProfileDraft(db, uid)).profileId;
      const form = new FormData(event.currentTarget);
      await updateFinancialProfile(db, profileId, uid, {
        current_cash_available: parseNullableNumber(form.get("current_cash_available")),
        monthly_living_expense: parseNullableNumber(form.get("monthly_living_expense")),
        monthly_fixed_costs: parseNullableNumber(form.get("monthly_fixed_costs")),
        safety_cash_reserve_target: parseNullableNumber(form.get("safety_cash_reserve_target")),
        current_investment_value: parseNullableNumber(form.get("current_investment_value")),
        current_debt_summary: String(form.get("current_debt_summary") ?? "").trim() || null,
        monthly_income_estimate: parseNullableNumber(form.get("monthly_income_estimate")),
        risk_tolerance: String(form.get("risk_tolerance") ?? "").trim() || null,
        capital_deployment_limit: parseNullableNumber(form.get("capital_deployment_limit")),
        notes: String(form.get("notes") ?? "").trim() || null
      });
      setSaveMessage("財務基本資料已儲存為 review-gated draft。沒有觸發投資、付款、下單或外部動作。");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save financial profile.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div><h1>財務決策中心 / CFO</h1><p>現金流、安全現金水位、可投入資金、ROI、回本期、停損線優先。</p></div>
        <div className="action-row"><button className="button secondary compact" onClick={load}>重新整理</button><Link className="button secondary compact" href="/finance-baseline">財務基準總表</Link><Link className="button secondary compact" href="/net-worth">資產負債表</Link><Link className="button secondary compact" href="/cashflow">每月現金流</Link><Link className="button secondary compact" href="/command-center">回 Command Center</Link></div>
      </header>
      {error ? <section className="panel"><p className="muted">{error}</p></section> : null}
      <section className="panel"><h2>三步驟使用流程</h2><ol><li>先補財務基本資料</li><li>再產生資本配置草稿</li><li>最後到 Audit Logs / Capital Allocation Detail 審核</li></ol></section>
      <section className="panel"><h2>Finance Decision Intelligence</h2><div className="action-row"><Link className="button compact" href="/intake">AI 資料輸入中心</Link><Link className="button compact" href="/review-queue">Mark Review Queue</Link><Link className="button secondary compact" href="/finance-decisions">重大財務決策</Link><Link className="button secondary compact" href="/investment-decisions">投資決策</Link><Link className="button secondary compact" href="/expense-signals">警訊支出</Link></div></section>
      <section className="panel"><h2>財務總覽</h2>{incomplete ? <p className="muted">尚未建立完整財務基準資料，請 Mark 補上現金水位、生活費、固定成本與可投入資金。</p> : null}<div className="detail-grid">{["monthly_living_expense", "safety_cash_reserve_target", "current_cash_available", "capital_deployment_limit", "current_investment_value", "monthly_fixed_costs", "risk_tolerance", "status"].map((key) => <div key={key}><strong>{financeFieldLabels[key] ?? key}</strong><p>{money(profile?.[key as keyof FinancialProfile])}</p></div>)}</div><div className="action-row" style={{ marginTop: 12 }}><button className="button compact" disabled={Boolean(busy)} onClick={createProfileDraft}>建立財務基本資料草稿</button>{profileCreated ? <span className="muted">財務基本資料草稿：<span className="mono">{profileCreated}</span></span> : null}</div></section>
      <section className="panel"><h2>需要補的資料</h2><ul>{(missing.length ? missing : MARK_FINANCE_INPUTS).map((item) => <li key={item}>{item}</li>)}</ul>{asArray(profile?.missing_required_fields).length ? <pre className="json-block">{safeJson(asArray(profile?.missing_required_fields))}</pre> : null}</section>
      <section className="panel"><h2>財務基本資料表單</h2><p className="muted">只儲存 Mark 手動輸入的基準資料；不自動產生投資、創業執行或 allocation approval。</p><form className="grid" onSubmit={saveProfile}><div className="detail-grid">{["current_cash_available", "monthly_living_expense", "monthly_fixed_costs", "safety_cash_reserve_target", "current_investment_value", "monthly_income_estimate", "capital_deployment_limit"].map((key) => <label key={key}>{financeFieldLabels[key]}<input name={key} type="number" min="0" step="1" defaultValue={(profile?.[key as keyof FinancialProfile] as number | null | undefined) ?? ""} placeholder="留空代表需要 Mark 補資料" /></label>)}<label>{financeFieldLabels.current_debt_summary}<input name="current_debt_summary" defaultValue={profile?.current_debt_summary ?? ""} placeholder="負債摘要，沒有就留空" /></label><label>{financeFieldLabels.risk_tolerance}<input name="risk_tolerance" defaultValue={profile?.risk_tolerance ?? ""} placeholder="可接受最大單項虧損 / 風險描述" /></label><label>{financeFieldLabels.notes}<input name="notes" defaultValue={profile?.notes ?? ""} placeholder="近期大額支出或其他備註" /></label></div><button className="button compact" disabled={Boolean(busy)} type="submit">儲存財務基本資料</button>{saveMessage ? <p className="muted">{saveMessage}</p> : null}</form></section>
      <section className="panel" id="capital-allocation"><h2>資本配置草稿</h2><p className="muted">財務資料不足仍可產生 draft，但不猜數字，decision_status 會是 needs_more_info。</p><p className="muted">這只會建立草稿，不會投資、不會轉帳、不會付款、不會下單。</p><button className="button compact" disabled={Boolean(busy)} onClick={generate}>產生資本配置草稿</button>{created ? <p>已建立：<Link className="mono" href={`/capital-allocations/${created}`}>{created}</Link></p> : null}<div className="list">{allocations.length === 0 ? <p className="muted">目前沒有資本配置草稿。</p> : allocations.map((allocation) => <article className="item" key={allocation.id}><div className="item-header"><h3>{displayText(allocation.title, "資本配置草稿")}</h3><span className="badge review">{displayText(allocation.decision_status)}</span></div><p>{displayText(allocation.summary, "尚無摘要")}</p><p className="muted">missing: {safeJoin(allocation.missing_required_fields)}</p><Link className="button secondary compact" href={`/capital-allocations/${allocation.id}`}>查看詳情</Link></article>)}</div></section>
      <section className="panel"><h2>CFO / Finance Review</h2><div className="list">{reviews.length === 0 ? <p className="muted">尚未建立 CFO / Finance Review，不建議直接進入執行階段。</p> : reviews.map((review) => <article className="item" key={review.id}><div className="item-header"><h3>{displayText(review.title, "Finance Review")}</h3><span className="badge review">{displayText(review.status)}</span></div><div className="detail-grid"><div><strong>project_id</strong><p>{displayText(review.project_id)}</p></div><div><strong>recommendation</strong><p>{displayText(review.recommendation)}</p></div><div><strong>liquidity_risk</strong><p>{displayText(review.liquidity_risk)}</p></div><div><strong>created_at</strong><p>{formatDateTime(review.created_at)}</p></div></div><p className="muted">missing: {safeJoin(review.missing_required_fields)}</p><Link className="button secondary compact" href={`/finance-reviews/${review.id}`}>查看詳情</Link>{review.source_task_dispatch_id ? <Link className="button secondary compact" href={`/task-dispatches/${review.source_task_dispatch_id}`}>View source task</Link> : null}</article>)}</div></section>
      <section className="panel"><h2>財務風險提醒</h2><ul>{FINANCE_RISK_REMINDERS.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>
  );
}

export default function Page() {
  return <ProtectedPage>{(uid) => <FinanceAdvisorData uid={uid} />}</ProtectedPage>;
}
