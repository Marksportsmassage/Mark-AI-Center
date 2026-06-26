import Link from "next/link";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { noGoIncomeRules, sevenDaySprint, todayIncomeTasks } from "@/lib/incomeStrategy";
import { revenueOpportunities } from "@/lib/revenueOpportunities";

export default function Page() {
  return (
    <div className="assistant-page grid">
      <header className="page-header">
        <div>
          <p className="eyebrow">Income Growth</p>
          <h1>收入成長行動室</h1>
          <p>目標不是多想，而是今天做出不花錢、可審核、可回收支出的收入行動。所有訊息與 offer 都只建立草稿。</p>
          <div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="收入策略" /></div>
        </div>
        <div className="action-row">
          <Link className="button compact" href="/assistant?prompt=我怎麼提高收入？">問收入助理</Link>
          <Link className="button secondary compact" href="/review-queue">Review Queue</Link>
        </div>
      </header>

      <section className="panel">
        <h2>今天 3 個收入任務</h2>
        <div className="cards-grid">
          {todayIncomeTasks.map((task) => (
            <article className="card assistant-glass-card" key={task.id}>
              <span className="badge review">{task.timeBox}</span>
              <h3>{task.title}</h3>
              <p>{task.action}</p>
              <small>{task.expectedImpact}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>本週收入 Sprint</h2>
        <ol>{sevenDaySprint.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <section className="cards-grid">
        {revenueOpportunities.map((opportunity) => (
          <article className="card assistant-glass-card" key={opportunity.id}>
            <div className="item-header">
              <h2>{opportunity.title}</h2>
              <span className="badge">{opportunity.expectedRange}</span>
            </div>
            <p>{opportunity.why}</p>
            <strong>下一步</strong>
            <ul>{opportunity.steps.map((step) => <li key={step}>{step}</li>)}</ul>
            <strong>草稿</strong>
            <p>{opportunity.draft}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>不要做</h2>
        <div className="stack-list warning-list">
          {noGoIncomeRules.map((rule) => <span key={rule}>{rule}</span>)}
        </div>
      </section>

      <section className="panel">
        <h2>最快抵銷支出</h2>
        <p>本週先用 2 個高單價時段或 4 次舊客回流，對應抵銷 Line Pay 警訊支出 11,840、Firebase 成本與信用卡壓力。所有回訪都先放 Review Queue 給 Mark 審核。</p>
      </section>

      <MobileBottomNav />
    </div>
  );
}
