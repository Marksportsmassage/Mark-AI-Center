import Link from "next/link";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const categories = [
  { title: "AI assistant system", status: "provided / implemented", href: "/assistant", detail: "Assistant, universe, today, start here, agent lab, and memory pages exist." },
  { title: "Codex relay and workflow", status: "provided / implemented", href: "/system-status", detail: "GitHub issue #2 is the stable sanitized relay channel." },
  { title: "Finance baseline", status: "provided", href: "/today", detail: "Baseline confirmed; cards, installments, spending alerts, and cloud cost are under watch." },
  { title: "Investments", status: "provided / waiting_review", href: "/investment-decisions", detail: "Core and short-term buckets exist; target and stop loss are still missing." },
  { title: "Income growth", status: "implemented", href: "/income-lab", detail: "No-cost tasks, 7-day sprint, offers, scripts, and offset plan exist." },
  { title: "Exams / study", status: "provided / partial", href: "/exam-review", detail: "Provided PDFs are organized; scanned or teacher-highlight gaps remain." },
  { title: "Clients / course plans", status: "framework", href: "/client-ops", detail: "Client ops exists; current client list and availability are missing." },
  { title: "Content / marketing", status: "framework", href: "/content-studio", detail: "Content studio exists; channel and tone need Mark approval." },
  { title: "Business experiments", status: "framework", href: "/business-lab", detail: "Business tests require budget, recovery plan, and stop loss." },
  { title: "Product / app roadmap", status: "implemented / evolving", href: "/product-roadmap", detail: "Product roadmap and command brain exist; priority order needs review." },
  { title: "Local project organization", status: "partial", href: "/agent-memory", detail: "Assistant project is separated; final 身境 split still needs policy." }
];

const missing = [
  { group: "Blocks decisions now", items: ["Investment target / stop loss", "Old client list", "Available service time slots", "Approved service prices"] },
  { group: "Useful but not blocking", items: ["Teacher-highlighted exam points", "Precise final exam scope", "Insurance standalone schedule", "Student loan repayment start date"] },
  { group: "Optional later", items: ["Preferred content channel", "Brand tone", "身境 split policy", "Daily report cadence"] }
];

export default function Page() {
  return (
    <div className="assistant-page grid">
      <header className="page-header">
        <div>
          <p className="eyebrow">Master Index</p>
          <h1>Mark 系統總索引</h1>
          <p>把 Mark 目前所有資料、系統、缺口與下一步整理成一張可讀地圖。這裡只放 sanitized summary，不放 raw finance、raw PDF、secret 或完整卡號銀行資料。</p>
          <div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="Master Index" /></div>
        </div>
        <div className="action-row">
          <Link className="button compact" href="/assistant">回助理</Link>
          <Link className="button secondary compact" href="/income-lab">Income Lab</Link>
        </div>
      </header>

      <section className="cards-grid">
        {categories.map((item) => (
          <Link className="card assistant-glass-card" href={item.href} key={item.title}>
            <span className="badge review">{item.status}</span>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
          </Link>
        ))}
      </section>

      <section className="panel">
        <h2>缺資料優先級</h2>
        <div className="detail-grid">
          {missing.map((group) => (
            <div key={group.group}>
              <strong>{group.group}</strong>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>文件位置</h2>
        <div className="stack-list">
          <span>docs/master-index/mark-system-master-summary.md</span>
          <span>docs/master-index/data-map.md</span>
          <span>docs/master-index/what-mark-has-provided.md</span>
          <span>docs/master-index/what-is-still-missing.md</span>
          <span>docs/master-index/actionable-next-steps.md</span>
        </div>
      </section>

      <MobileBottomNav />
    </div>
  );
}
