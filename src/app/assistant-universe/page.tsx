"use client";

import Link from "next/link";
import { useState } from "react";
import { AssistantUniverseScene } from "@/components/AssistantUniverseScene";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProtectedPage } from "@/components/ProtectedPage";
import { assistantBranches, assistantBranchCompletion, assistantRiskLabel } from "@/lib/assistantExperience";

function AssistantUniverse() {
  const [activeId, setActiveId] = useState(assistantBranches[0]?.id ?? "");
  const active = assistantBranches.find((item) => item.id === activeId) ?? assistantBranches[0];
  return (
    <div className="assistant-page">
      <header className="page-header">
        <div>
          <h1>Mark AI 公司宇宙</h1>
          <p>中心是 Mark AI Assistant；每顆行星是一位公司助理員工。點行星就能查看職責、記憶、提醒與入口。</p>
        </div>
        <Link className="button secondary compact" href="/assistant">回助理首頁</Link>
      </header>

      <section className="universe-layout">
        <AssistantUniverseScene branches={assistantBranches} activeId={active.id} onSelect={setActiveId} />
        <div className="universe-orbit" aria-label="Assistant branches">
          {assistantBranches.map((branch) => (
            <button className={`universe-card ${activeId === branch.id ? "active" : ""}`} key={branch.id} type="button" onClick={() => setActiveId(branch.id)}>
              <span className={`badge review risk-${branch.risk}`}>{assistantRiskLabel(branch.risk)}</span>
              <strong>{branch.title}</strong>
              <small>{branch.status}</small>
              <span className="assistant-progress" aria-label={`${branch.title} completion ${assistantBranchCompletion(branch)} percent`}><span style={{ width: `${assistantBranchCompletion(branch)}%` }} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel universe-detail">
        <div className="item-header">
          <h2>{active.title}</h2>
          <span className="badge">{assistantRiskLabel(active.risk)}</span>
        </div>
        <p>{active.purpose}</p>
        <div className="detail-grid">
          <div><strong>目前狀態</strong><p>{active.status}</p></div>
          <div><strong>待審核 / 待處理</strong><p>{active.pending}</p></div>
          <div><strong>缺資料</strong><p>{active.missing.join("、") || "目前無"}</p></div>
          <div><strong>風險</strong><p>{assistantRiskLabel(active.risk)}</p></div>
          <div><strong>最近摘要</strong><p>{active.recent}</p></div>
          <div><strong>建議下一步</strong><p>{active.next_action}</p></div>
          <div><strong>這位員工記住</strong><p>{active.memory_items.join("、")}</p></div>
          <div><strong>會主動提醒</strong><p>{active.reminder_rules.join("、")}</p></div>
        </div>
        <div className="assistant-summary-columns universe-work-summary">
          <div>
            <h3>已完成</h3>
            <div className="stack-list">
              {active.completed.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
          <div>
            <h3>需要 Mark 確認</h3>
            <div className="stack-list warning-list">
              {active.review_items.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </div>
        <div className="assistant-question-strip universe-question-strip" aria-label="Questions for this assistant">
          {active.ask_examples.map((prompt) => <Link className="question-pill" key={prompt} href={`/assistant?prompt=${encodeURIComponent(prompt)}`}>{prompt}</Link>)}
        </div>
        <div className="node-strip">
          {active.nodes.map((node) => (
            <Link className="node-pill" key={node.href + node.label} href={node.href}>
              <strong>{node.label}</strong>
              <span>{node.status}</span>
            </Link>
          ))}
        </div>
      </section>

      <MobileBottomNav />
    </div>
  );
}

export default function Page() {
  return <ProtectedPage>{() => <AssistantUniverse />}</ProtectedPage>;
}
