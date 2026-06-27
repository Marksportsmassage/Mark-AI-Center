import Link from "next/link";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { expenseOffsetTargets, noGoIncomeRules, sevenDaySprint, shortVideoScripts, todayIncomeTasks, todayNoCostIncomeActions } from "@/lib/incomeStrategy";
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

      <section className="panel">
        <h2>今天不花錢收入行動</h2>
        <div className="detail-grid">
          <div>
            <strong>30 分鐘可做</strong>
            <ul>{todayNoCostIncomeActions.thirtyMinutes.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <strong>2 小時可做</strong>
            <ul>{todayNoCostIncomeActions.twoHours.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
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
        <h2>短影片 / 動畫腳本</h2>
        <div className="cards-grid">
          {shortVideoScripts.map((script) => (
            <article className="card assistant-glass-card" key={script.title}>
              <h3>{script.title}</h3>
              <p><strong>開頭：</strong>{script.hook}</p>
              <p><strong>內容：</strong>{script.outline}</p>
              <p><strong>CTA：</strong>{script.cta}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>不要做</h2>
        <div className="stack-list warning-list">
          {noGoIncomeRules.map((rule) => <span key={rule}>{rule}</span>)}
        </div>
      </section>

      <section className="panel">
        <h2>最快抵銷支出</h2>
        <ul>{expenseOffsetTargets.map((target) => <li key={target}>{target}</li>)}</ul>
        <p className="muted">所有回訪、貼文、報價都只先建立草稿，必須 Mark 審核後才可外部執行。</p>
      </section>

      <MobileBottomNav />
    </div>
  );
}
