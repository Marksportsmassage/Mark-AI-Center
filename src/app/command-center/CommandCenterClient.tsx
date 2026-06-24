"use client";

import Link from "next/link";
import { useState } from "react";
import { AgentCards, InboxList, ProjectCards, ReviewRequired, TaskDispatchList } from "@/components/Cards";
import { ProtectedPage } from "@/components/ProtectedPage";
import { QuickInput } from "@/components/QuickInput";
import { activeOnly, recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { generateTodayBrief } from "@/lib/reports/dailyBrief";
import { asArray, displayText } from "@/lib/ui/safe";
import type { AiAgent, AiInboxItem, CreditCardObligation, DailyBrief, FinanceDecision, FinancialProfile, InvestmentDecision, Project, TaskDispatch } from "@/types/firestore";

function DailyBriefPanel({ briefs, userId }: { briefs: DailyBrief[]; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const latestBrief = briefs[0];

  async function generateBrief() {
    setBusy(true);
    try {
      const result = await generateTodayBrief(getClientDb(), userId);
      setCreatedId(result.briefId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="item-header">
        <h2>Daily Brief</h2>
        <button className="button compact" type="button" disabled={busy} onClick={generateBrief}>
          Generate Today Brief
        </button>
      </div>
      {latestBrief ? (
        <div className="item">
          <div className="item-header">
            <h3>{latestBrief.title}</h3>
            <span className="badge">{latestBrief.status}</span>
          </div>
          <p>{latestBrief.summary}</p>
          <div className="action-row">
            <Link className="button secondary compact" href={`/daily-briefs/${latestBrief.id}`}>查看完整 Brief</Link>
            {createdId ? <Link className="button secondary compact" href={`/daily-briefs/${createdId}`}>查看剛產生的 Brief</Link> : null}
          </div>
        </div>
      ) : (
        <p className="muted">今天尚未產生 Daily Brief。</p>
      )}
    </section>
  );
}

function money(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("zh-TW") : "0";
}

function CfoTodaySummary({
  decisions,
  investments,
  creditCards,
  profile
}: {
  decisions: FinanceDecision[];
  investments: InvestmentDecision[];
  creditCards: CreditCardObligation[];
  profile: FinancialProfile | null;
}) {
  const financeNeedsReview = decisions.filter((item) => ["waiting_review", "waiting_mark_input", "draft"].includes(String(item.status ?? "")));
  const investmentNeedsReview = investments.filter((item) => ["waiting_review", "waiting_mark_input", "draft"].includes(String(item.status ?? "")));
  const highRiskFinance = decisions.filter((item) => item.is_warning_signal || (item.amount ?? 0) >= 30000).slice(0, 3);
  const highRiskInvestments = investments.filter((item) => item.current_thesis_status !== "valid" || item.average_down_allowed === false).slice(0, 3);
  const highRiskItems = [...highRiskFinance.map((item) => displayText(item.title)), ...highRiskInvestments.map((item) => displayText(item.symbol, "投資項目需補資料"))].slice(0, 5);
  const creditPressure = creditCards.reduce((total, item) => total + (item.monthly_cashflow_impact ?? item.total_statement_amount ?? 0), 0);
  const missingProfile = asArray<string>(profile?.missing_required_fields).length ? asArray<string>(profile?.missing_required_fields) : ["目前可動用現金", "安全現金水位目標", "單次可投入資金上限"];
  const noSpendNextSteps = ["補財務基本資料", "整理投資原始買進理由", "為高風險項目產生 Review Draft"];
  const noAddToday = investments
    .filter((item) => item.position_type === "add" || item.position_type === "new_buy" || item.average_down_allowed === false)
    .slice(0, 3)
    .map((item) => displayText(item.symbol, "未命名投資項目"));
  const topItems = [...financeNeedsReview, ...investmentNeedsReview]
    .slice(0, 3)
    .map((item) => "title" in item ? displayText(item.title, "待審核財務項目") : displayText(item.symbol, "待審核投資項目"));

  return (
    <section className="panel">
      <div className="item-header">
        <h2>CFO 今日摘要</h2>
        <span className="badge review">Mark review {financeNeedsReview.length + investmentNeedsReview.length}</span>
      </div>
      <div className="detail-grid">
        <div><strong>今日最需要處理的 3 個財務項目</strong><ul>{(topItems.length ? topItems : ["目前沒有待審核財務項目"]).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><strong>高風險支出 / 投資項目</strong><ul>{(highRiskItems.length ? highRiskItems : ["目前沒有高風險項目"]).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><strong>信用卡 / 分期壓力</strong><p>{money(creditPressure)} TWD / month-like pressure</p></div>
        <div><strong>需要補資料的財務基準</strong><ul>{missingProfile.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><strong>可先做且不花錢的下一步</strong><ul>{noSpendNextSteps.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><strong>不建議今天加碼的項目</strong><ul>{(noAddToday.length ? noAddToday : ["缺安全現金水位前，不建議任何加碼"]).map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
      <div className="action-row">
        <Link className="button compact" href="/intake">前往 /intake</Link>
        <Link className="button compact" href="/review-queue">前往 /review-queue</Link>
        <Link className="button secondary compact" href="/finance-decisions">前往 /finance-decisions</Link>
        <Link className="button secondary compact" href="/investment-decisions">前往 /investment-decisions</Link>
        <Link className="button secondary compact" href="/expense-signals">前往 /expense-signals</Link>
      </div>
      <p className="muted">此摘要只整理既有 Firestore draft，不呼叫外部 API、不抓即時股價、不代表已批准支出或交易。</p>
    </section>
  );
}

function CommandCenterData({ uid }: { uid: string }) {
  const inbox = useFirestoreCollection<AiInboxItem>("ai_inbox", recent20, true);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const projects = useFirestoreCollection<Project>("projects", activeOnly, true);
  const agents = useFirestoreCollection<AiAgent>("ai_agents", activeOnly, true);
  const briefs = useFirestoreCollection<DailyBrief>("daily_briefs", recent20, true);
  const financeDecisions = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const creditCards = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", recent20, true);
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", recent20, true);
  const hasError = inbox.error ?? tasks.error ?? projects.error ?? agents.error ?? briefs.error ?? financeDecisions.error ?? investments.error ?? creditCards.error ?? profiles.error;
  const isLoading = inbox.isLoading || tasks.isLoading || projects.isLoading || agents.isLoading || briefs.isLoading || financeDecisions.isLoading || investments.isLoading || creditCards.isLoading || profiles.isLoading;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Command Center</h1>
          <p>Mark 專用 AI 總管：收件、審核、任務指派與專案狀態。</p>
        </div>
        <div className="action-row">
          <Link className="button compact" href="/today">今天只看這裡</Link>
          <Link className="button secondary compact" href="/advisor-chat">Advisor Chat</Link>
          <Link className="button secondary compact" href="/command-brain">Command Brain</Link>
          <Link className="button secondary compact" href="/finance-advisor">Finance Advisor</Link>
          <Link className="button secondary compact" href="/universe">Universe</Link>
          <Link className="button secondary compact" href="/knowledge-sop">Knowledge SOP</Link>
          <Link className="button secondary compact" href="/audit-logs">Audit Logs</Link>
          <Link className="button secondary compact" href="/codex-jobs">Codex Jobs</Link>
        </div>
      </header>

      {hasError ? (
        <section className="panel">
          <h2>Firestore status</h2>
          <p className="muted">{hasError}</p>
        </section>
      ) : null}

      <section className="stats-grid">
        <div className="stat">
          <strong>{inbox.items.length}</strong>
          <span className="muted">Inbox items</span>
        </div>
        <div className="stat">
          <strong>{tasks.items.length}</strong>
          <span className="muted">Task dispatches</span>
        </div>
        <div className="stat">
          <strong>{projects.items.length}</strong>
          <span className="muted">Active projects</span>
        </div>
        <div className="stat">
          <strong>{agents.items.length}</strong>
          <span className="muted">AI agents</span>
        </div>
      </section>

      {isLoading ? <p className="muted">Loading Firestore data...</p> : null}

      <CfoTodaySummary decisions={financeDecisions.items} investments={investments.items} creditCards={creditCards.items} profile={profiles.items[0] ?? null} />

      <section className="panel">
        <h2>現在先做</h2>
        <div className="action-row">
          <Link className="button compact" href="/today">前往 Today Dashboard</Link>
          <Link className="button secondary compact" href="/intake">前往 AI 資料輸入中心</Link>
          <Link className="button compact" href="/review-queue">查看 Mark Review Queue</Link>
          <Link className="button compact" href="/finance-advisor">補財務基本資料</Link>
          <Link className="button secondary compact" href="/finance-decisions">查看重大財務決策</Link>
          <Link className="button secondary compact" href="/investment-decisions">查看投資決策</Link>
          <Link className="button secondary compact" href="/expense-signals">查看警訊支出</Link>
          <Link className="button secondary compact" href="/audit-logs">查看 Audit Logs</Link>
          <Link className="button secondary compact" href="/client-ops">客戶 / 課表</Link>
          <Link className="button secondary compact" href="/content-studio">內容 / 國考</Link>
          <Link className="button secondary compact" href="/business-lab">商業實驗</Link>
          <Link className="button secondary compact" href="/product-roadmap">產品 Roadmap</Link>
        </div>
      </section>

      <section className="panel">
        <h2>快速入口</h2>
        <p className="muted">大筆支出、警訊消費、信用卡、分期、投資與創業測試都先進 review-gated draft。</p>
        <div className="action-row">
          <Link className="button compact" href="/intake">新增資料 / 貼上財務內容</Link>
          <Link className="button secondary compact" href="/expense-signals">查看警訊支出</Link>
          <Link className="button secondary compact" href="/investment-decisions">查看投資決策</Link>
          <Link className="button secondary compact" href="/expense-signals">查看信用卡與分期</Link>
          <Link className="button secondary compact" href="/finance-advisor">查看 Finance Advisor</Link>
          <Link className="button secondary compact" href="/advisor-chat">問 Advisor</Link>
        </div>
      </section>

      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="grid">
          <DailyBriefPanel briefs={briefs.items} userId={uid} />
          <QuickInput userId={uid} />
          <InboxList items={inbox.items} tasks={tasks.items} />
          <TaskDispatchList tasks={tasks.items} userId={uid} />
        </div>
        <div className="grid">
          <ReviewRequired inbox={inbox.items} tasks={tasks.items} projects={projects.items} agents={agents.items} />
          <ProjectCards projects={projects.items} />
          <AgentCards agents={agents.items} />
        </div>
      </div>
    </>
  );
}

export function CommandCenterClient() {
  return <ProtectedPage>{(uid) => <CommandCenterData uid={uid} />}</ProtectedPage>;
}
