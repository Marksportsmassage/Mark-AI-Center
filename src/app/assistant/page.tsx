"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { AssistantSuggestionPanel } from "@/components/AssistantSuggestionPanel";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { assistantBranches, assistantSuggestions, buildAssistantAnswer, latestFinanceStatus } from "@/lib/assistantExperience";
import { buildReviewQueue } from "@/lib/reviewQueue";
import type { CreditCardObligation, DailyBrief, ExpenseSignal, FinanceDecision, FinanceDecisionReview, InvestmentDecision, TaskDispatch } from "@/types/firestore";

const prompts = [
  "我今天先做什麼？",
  "我現在可以花錢嗎？",
  "我目前財務風險是什麼？",
  "這筆支出值得嗎？",
  "股票能不能加碼？",
  "我要準備期末考",
  "我要整理客戶課表",
  "App 下一步做什麼？"
];

function AssistantData() {
  const expenseSignals = useFirestoreCollection<ExpenseSignal>("expense_signals", recent20, true);
  const financeDecisions = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const financeDecisionReviews = useFirestoreCollection<FinanceDecisionReview>("finance_decision_reviews", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const creditCards = useFirestoreCollection<CreditCardObligation>("credit_card_obligations", recent20, true);
  const briefs = useFirestoreCollection<DailyBrief>("daily_briefs", recent20, true);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(() => buildAssistantAnswer("我今天先做什麼？"));
  const [openBranch, setOpenBranch] = useState<string | null>(null);

  const queue = useMemo(() => buildReviewQueue({
    finance_decisions: financeDecisions.items as never[],
    finance_decision_reviews: financeDecisionReviews.items as never[],
    investment_decisions: investments.items as never[],
    credit_card_obligations: creditCards.items as never[],
    task_dispatches: tasks.items as never[]
  }), [creditCards.items, financeDecisionReviews.items, financeDecisions.items, investments.items, tasks.items]);

  const latestBrief = briefs.items.find((brief) => String(brief.title ?? "").includes("CFO Brief")) ?? briefs.items[0];
  const financeStatus = latestFinanceStatus(expenseSignals.items);
  const missingCount = queue.filter((item) => item.missing_required_fields.length > 0).length;
  const branch = assistantBranches.find((item) => item.id === openBranch) ?? null;

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setAnswer(buildAssistantAnswer(text));
    setQuestion("");
  }

  return (
    <div className="assistant-page">
      <header className="assistant-hero">
        <div>
          <p className="eyebrow">Mark AI Assistant</p>
          <h1>Mark，目前最需要你處理的是什麼？</h1>
          <p>結構化助理模式：不需要 OpenAI API，不新增 secret，所有建議都需要 Mark review。</p>
        </div>
        <div className="assistant-status">
          <span className={`status-dot risk-${financeStatus}`}>{financeStatus}</span>
          <strong>今日財務狀態</strong>
          <small>CFO Brief: {latestBrief?.status ?? "待建立"}</small>
        </div>
      </header>

      <section className="assistant-summary-grid" aria-label="Today summary">
        <div><strong>{queue.length}</strong><span>待審核</span></div>
        <div><strong>{missingCount}</strong><span>缺資料</span></div>
        <div><strong>{financeStatus}</strong><span>財務 / 系統風險</span></div>
      </section>

      <section className="panel assistant-priorities">
        <h2>今天最重要 3 件事</h2>
        <ol>
          <li>核對 Line Pay / 一番賞支出與 940 差額。</li>
          <li>處理信用卡、自動分期與投資 review。</li>
          <li>讀已整理的期末考 MMT / 震波資料，補缺 PDF。</li>
        </ol>
      </section>

      <section className="panel">
        <h2>快速對話</h2>
        <form className="assistant-chat-box" onSubmit={ask}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例如：我今天先做什麼？" />
          <button className="button compact" type="submit">問助理</button>
        </form>
        <div className="prompt-row">
          {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => setAnswer(buildAssistantAnswer(prompt))}>{prompt}</button>)}
        </div>
      </section>

      <section className="assistant-answer panel">
        <div className="item-header">
          <h2>助理回答</h2>
          <span className="badge">結構化助理模式</span>
        </div>
        <div className="assistant-answer-grid">
          <div><strong>目前判斷</strong><p>{answer.sections.current_judgment}</p></div>
          <div><strong>最該處理</strong><p>{answer.sections.priority}</p></div>
          <div><strong>風險</strong><p>{answer.sections.risk}</p></div>
          <div><strong>下一步</strong><p>{answer.sections.next_step}</p></div>
          <div><strong>可建立草稿</strong><p>{answer.sections.draft_available}</p></div>
          <div><strong>可點擊入口</strong><div className="action-row">{answer.sections.links.map((link) => <Link className="button secondary compact" key={link.href} href={link.href}>{link.label}</Link>)}</div></div>
        </div>
        <p className="muted">Safety: {answer.safety_flags.join("、")}</p>
      </section>

      {answer.content_summary ? (
        <section className="panel assistant-content-summary" aria-label="Content summary">
          <div className="item-header">
            <div>
              <h2>{answer.content_summary.title}</h2>
              <p>{answer.content_summary.description}</p>
            </div>
            <span className="badge review">自動跳出</span>
          </div>
          <div className="assistant-summary-columns">
            <div>
              <h3>已製作完成</h3>
              <div className="stack-list">
                {answer.content_summary.ready.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
            <div>
              <h3>需要 Mark 看或確認</h3>
              <div className="stack-list warning-list">
                {answer.content_summary.needs_review.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
          </div>
          <div className="exam-topic-strip">
            {answer.content_summary.topics.map((topic) => (
              <article className="exam-topic-card" key={topic.id}>
                <span className={`badge review completion-${topic.completion}`}>{topic.completion}</span>
                <h3>{topic.title}</h3>
                <p>{topic.status}</p>
                <div className="action-row">
                  {topic.artifacts.map((artifact) => (
                    <Link className="button secondary compact" key={artifact.href + artifact.label} href={artifact.href}>{artifact.label}</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="assistant-card-row" aria-label="Suggestions">
        {assistantSuggestions.map((suggestion) => <AssistantSuggestionPanel key={suggestion.id} suggestion={suggestion} />)}
      </section>

      <section className="panel">
        <h2>分支入口</h2>
        <div className="branch-grid">
          {assistantBranches.map((item) => (
            <button className="branch-card" key={item.id} type="button" onClick={() => setOpenBranch(item.id)}>
              <span className={`badge review risk-${item.risk}`}>{item.risk}</span>
              <strong>{item.title}</strong>
              <small>{item.status}</small>
            </button>
          ))}
        </div>
      </section>

      {branch ? (
        <div className="drawer-backdrop" role="presentation" onClick={() => setOpenBranch(null)}>
          <aside className="drawer assistant-drawer" role="dialog" aria-label={branch.title} onClick={(event) => event.stopPropagation()}>
            <div className="item-header">
              <h2>{branch.title}</h2>
              <button className="button secondary compact" type="button" onClick={() => setOpenBranch(null)}>關閉</button>
            </div>
            <p>{branch.purpose}</p>
            <div className="detail-grid">
              <div><strong>目前狀態</strong><p>{branch.status}</p></div>
              <div><strong>待處理</strong><p>{branch.pending}</p></div>
              <div><strong>缺資料</strong><p>{branch.missing.join("、") || "目前無"}</p></div>
              <div><strong>風險</strong><p>{branch.risk}</p></div>
              <div><strong>最近摘要</strong><p>{branch.recent}</p></div>
              <div><strong>建議下一步</strong><p>{branch.next_action}</p></div>
            </div>
            <div className="action-row">
              <Link className="button compact" href={branch.href}>前往主要入口</Link>
              {branch.nodes.map((node) => <Link className="button secondary compact" key={node.href + node.label} href={node.href}>{node.label}</Link>)}
            </div>
          </aside>
        </div>
      ) : null}

      <MobileBottomNav />
    </div>
  );
}

export default function Page() {
  return <ProtectedPage>{() => <AssistantData />}</ProtectedPage>;
}
