import Link from "next/link";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { buildAgentMemorySummary } from "@/lib/agentMemory";

export default function Page() {
  const memory = buildAgentMemorySummary();

  return (
    <div className="assistant-page grid">
      <header className="page-header">
        <div>
          <p className="eyebrow">Agent Memory</p>
          <h1>AI Agent 記憶與企劃案</h1>
          <p>這裡顯示助理目前知道什麼、缺什麼、能用哪些資料，以及哪些資料不可使用。</p>
          <div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="Agent Memory" /></div>
        </div>
        <div className="action-row">
          <Link className="button compact" href="/assistant">回助理</Link>
          <Link className="button secondary compact" href="/agent-lab">Agent Lab</Link>
          <Link className="button secondary compact" href="/data-status">Data Status</Link>
        </div>
      </header>

      <section className="panel">
        <h2>助理已知道</h2>
        <div className="stack-list">
          {memory.knows.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="panel">
        <h2>仍缺資料</h2>
        <div className="stack-list warning-list">
          {memory.missing.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="panel">
        <h2>可用記憶來源</h2>
        <div className="detail-grid">
          {memory.allowedSources.map((source) => (
            <div key={source.id}><strong>{source.title}</strong><p>{source.path} / {source.note}</p></div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>不可使用資料</h2>
        <div className="detail-grid">
          {memory.blockedSources.map((source) => (
            <div key={source.id}><strong>{source.title}</strong><p>{source.path} / {source.note}</p></div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>企劃案位置</h2>
        <p className="mono">docs/agent-memory/agent-operating-plan.md</p>
        <div className="action-row">
          <Link className="button secondary compact" href="/income-lab">Income Lab</Link>
          <Link className="button secondary compact" href="/master-index">Master Index</Link>
          <Link className="button secondary compact" href="/assistant-universe">Assistant Universe</Link>
        </div>
      </section>

      <MobileBottomNav />
    </div>
  );
}
