import Link from "next/link";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { assistantBranches, assistantBranchCompletion } from "@/lib/assistantExperience";

const architecture = [
  "Assistant Shell",
  "Context Memory",
  "Time Context",
  "Planner",
  "Router",
  "Specialist Agents",
  "Draft Action System",
  "Review Queue",
  "Audit Log",
  "Relay / Handoff",
  "Human Approval Gate",
  "Cost Guard"
];

const approvalItems = [
  "OpenAI / external API key setup",
  "LINE reply / push",
  "Firebase Functions deploy",
  "customer message sending",
  "payment / trading / order actions",
  "paid OCR or market data"
];

export default function Page() {
  return (
    <div className="assistant-page grid">
      <header className="page-header">
        <div>
          <p className="eyebrow">Agent Lab</p>
          <h1>Mark AI Agent 架構實驗室</h1>
          <p>把 Mark AI Center 從頁面集合整理成公司型 AI 助理：主助理、專員工、記憶、審核、relay 與成本守門。</p>
          <div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="Agent 架構" /></div>
        </div>
        <div className="action-row">
          <Link className="button compact" href="/assistant">回助理</Link>
          <Link className="button secondary compact" href="/agent-memory">Agent Memory</Link>
          <Link className="button secondary compact" href="/master-index">Master Index</Link>
        </div>
      </header>

      <section className="panel">
        <h2>Mark AI Agent v1</h2>
        <div className="detail-grid">
          {architecture.map((item, index) => (
            <div key={item}>
              <strong>{index + 1}. {item}</strong>
              <p>{item === "Human Approval Gate" ? "所有重要行動都先進 review，不直接外部執行。" : "已納入 v1 架構設計。"}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cards-grid">
        {assistantBranches.map((branch) => (
          <article className="card assistant-glass-card" key={branch.id}>
            <div className="item-header">
              <h2>{branch.title}</h2>
              <span className="badge review">{assistantBranchCompletion(branch)}%</span>
            </div>
            <p>{branch.purpose}</p>
            <div className="detail-grid">
              <div><strong>目前狀態</strong><p>{branch.status}</p></div>
              <div><strong>下一步</strong><p>{branch.next_action}</p></div>
            </div>
            <Link className="button secondary compact" href={branch.href}>前往入口</Link>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>需要 Mark 批准才可做</h2>
        <div className="stack-list warning-list">
          {approvalItems.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="panel">
        <h2>研究與企劃文件</h2>
        <div className="action-row">
          <Link className="button secondary compact" href="/assistant-universe">助理宇宙</Link>
          <Link className="button secondary compact" href="/data-status">資料狀態</Link>
          <Link className="button secondary compact" href="/command-brain">Command Brain</Link>
          <Link className="button secondary compact" href="/system-status">System Status</Link>
        </div>
        <p className="muted">文件位置：docs/agent-research/mark-ai-agent-architecture.md</p>
      </section>

      <MobileBottomNav />
    </div>
  );
}
