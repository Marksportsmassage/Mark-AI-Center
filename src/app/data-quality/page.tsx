"use client";

import Link from "next/link";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildDataQualityReport } from "@/lib/governance";
import type { AccountBalance, CreditCardObligation, DecisionFollowup, FinanceSnapshot, FinancialProfile, InvestmentDecision, Liability, RecoveryPlan } from "@/types/firestore";

function MissingList({ title, items }: { title: string; items: string[] }) {
  return <div><strong>{title}</strong>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted">目前沒有缺資料。</p>}</div>;
}

function DataQualityData() {
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", recent20, true);
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const accounts = useFirestoreCollection<AccountBalance>("account_balances", recent20, true);
  const liabilities = useFirestoreCollection<Liability>("liabilities", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const cards = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", recent20, true);
  const recoveryPlans = useFirestoreCollection<RecoveryPlan>("recovery_plans", recent20, true);
  const followups = useFirestoreCollection<DecisionFollowup>("decision_followups", recent20, true);
  const error = profiles.error ?? snapshots.error ?? accounts.error ?? liabilities.error ?? investments.error ?? cards.error ?? recoveryPlans.error ?? followups.error;
  const report = buildDataQualityReport({
    financialProfile: profiles.items[0] ?? null,
    financeSnapshots: snapshots.items,
    accountBalances: accounts.items,
    liabilities: liabilities.items,
    investmentDecisions: investments.items,
    creditCards: cards.items,
    recoveryPlans: recoveryPlans.items,
    followups: followups.items
  });

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>資料完整度檢查</h1>
          <p>檢查 CFO loop 是否缺財務基準、投資欄位、信用卡、分期、負債與回本計畫。</p>
        </div>
        <div className="action-row">
          <Link className="button compact" href="/intake">前往 Intake</Link>
          <Link className="button secondary compact" href="/finance-baseline">財務基準</Link>
          <Link className="button secondary compact" href="/investment-decisions">投資決策</Link>
        </div>
      </header>
      {error ? <section className="panel"><h2>Firestore read status</h2><p className="muted">{error}</p></section> : null}
      <section className="panel">
        <h2>Data Quality Summary</h2>
        <div className="detail-grid">
          <div><strong>status</strong><p>{report.status}</p></div>
          <div><strong>score</strong><p>{report.score}</p></div>
          <div><strong>open followups</strong><p>{report.openFollowups.length}</p></div>
          <div><strong>external actions</strong><p>disabled</p></div>
        </div>
      </section>
      <section className="panel">
        <h2>缺資料清單</h2>
        <div className="detail-grid">
          <MissingList title="財務基準" items={report.missingFinancialBaseline} />
          <MissingList title="投資成本 / 現價 / 數量" items={report.missingInvestmentFields} />
          <MissingList title="信用卡 / 分期" items={report.missingCreditCardFields} />
          <MissingList title="負債資料" items={report.missingLiabilityFields} />
          <MissingList title="回本計畫" items={report.missingRecoveryPlans} />
          <MissingList title="待追蹤 followups" items={report.openFollowups} />
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return <ProtectedPage>{() => <DataQualityData />}</ProtectedPage>;
}
