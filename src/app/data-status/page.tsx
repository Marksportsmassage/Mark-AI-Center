import Link from "next/link";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const provided = [
  "Finance baseline confirmed as usable",
  "Credit cards / installments imported and clarified",
  "Living cost estimate provided",
  "Student loan estimate and deferment provided",
  "Investment broad thesis buckets provided",
  "Exam PDFs and derived docs provided",
  "Income growth is a current priority",
  "GitHub issue #2 relay is active"
];

const missingGroups = [
  { title: "Blocks decisions now", items: ["Investment target / stop loss", "Old client list", "Available service slots", "Approved service prices"] },
  { title: "Useful but not blocking", items: ["Teacher-highlighted exam points", "Exact final exam scope", "Insurance standalone schedule", "Student loan repayment start date"] },
  { title: "Optional later", items: ["Preferred content channel", "Brand voice", "身境 split policy", "LINE approval", "Paid API budget"] }
];

const doNotAskAgain = [
  "First finance baseline is usable unless Mark says data changed.",
  "Credit card and installment records are separated, with auto-installment risk still watched.",
  "Student loan exists and is currently deferred.",
  "Living cost has an initial estimate.",
  "Investment decisions are not approved and remain waiting_review.",
  "LINE reply / push and functions deploy are not approved."
];

export default function Page() {
  return (
    <div className="assistant-page grid">
      <header className="page-header">
        <div>
          <p className="eyebrow">Data Status</p>
          <h1>資料狀態與缺口</h1>
          <p>這頁的目的：Mark 已給過的不要再問；真的缺的資料分優先級；不重要的放到以後。</p>
          <div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="Data Status" /></div>
        </div>
        <div className="action-row">
          <Link className="button compact" href="/master-index">Master Index</Link>
          <Link className="button secondary compact" href="/assistant">回助理</Link>
        </div>
      </header>

      <section className="panel">
        <h2>已提供</h2>
        <div className="stack-list">
          {provided.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="panel">
        <h2>缺資料優先級</h2>
        <div className="detail-grid">
          {missingGroups.map((group) => (
            <div key={group.title}>
              <strong>{group.title}</strong>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>不要再問，除非資料改變</h2>
        <div className="stack-list warning-list">
          {doNotAskAgain.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="panel">
        <h2>文件位置</h2>
        <div className="stack-list">
          <span>docs/data-status/mark-data-status-2026-06-27.md</span>
          <span>docs/data-status/missing-data-prioritized.md</span>
          <span>docs/data-status/provided-data-registry.md</span>
          <span>docs/data-status/do-not-ask-again.md</span>
        </div>
      </section>

      <MobileBottomNav />
    </div>
  );
}
