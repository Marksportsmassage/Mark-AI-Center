"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, CheckCircle2, ClipboardCheck, MessageCircleQuestion, SendHorizontal, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AssistantSuggestionPanel } from "@/components/AssistantSuggestionPanel";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { assistantBranches, assistantBranchCompletion, assistantRiskLabel, assistantSuggestions, buildAssistantAnswer, buildAssistantReviewDashboard, latestFinanceStatus } from "@/lib/assistantExperience";
import { buildAssistantOpsDashboard } from "@/lib/assistantOps";
import { buildReviewQueue } from "@/lib/reviewQueue";
import type { CreditCardObligation, DailyBrief, ExpenseSignal, FinanceDecision, FinanceDecisionReview, InvestmentDecision, TaskDispatch } from "@/types/firestore";

const prompts = [
  "我今天先做什麼？",
  "我現在可以花錢嗎？",
  "我目前財務風險是什麼？",
  "這筆支出值得嗎？",
  "股票能不能加碼？",
  "我要準備期末考",
  "我怎麼提高收入？",
  "我要整理客戶課表",
  "App 下一步做什麼？",
  "助理系統還缺什麼？",
  "有哪些員工在處理？",
  "今天要怎麼匯報？"
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
  const [lastQuestion, setLastQuestion] = useState("我今天先做什麼？");
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const liveAnswerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get("prompt")?.trim();
    if (prompt) {
      setLastQuestion(prompt);
      setAnswer(buildAssistantAnswer(prompt));
    }
  }, []);

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
  const reviewDashboard = useMemo(() => buildAssistantReviewDashboard(), []);
  const opsDashboard = useMemo(() => buildAssistantOpsDashboard(), []);

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setLastQuestion(text);
    setAnswer(buildAssistantAnswer(text));
    setQuestion("");
    window.requestAnimationFrame(() => liveAnswerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function askPrompt(prompt: string) {
    setLastQuestion(prompt);
    setAnswer(buildAssistantAnswer(prompt));
    window.requestAnimationFrame(() => liveAnswerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  return (
    <div className="assistant-page">
      <header className="assistant-hero">
        <div className="assistant-hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> Mark AI Company Assistant</p>
          <h1>你想交代什麼給公司助理？</h1>
          <p>像 GPT 一樣直接問。它會把財務長、投資風控、學習內容、客戶課表、產品開發等員工叫出來協作。</p><div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="助理上下文" /></div>
          <div className="hero-action-row">
            <Link className="button compact" href="/assistant-universe"><Building2 size={16} />進入公司宇宙</Link>
            <Link className="button secondary compact" href="/intake"><ClipboardCheck size={16} />用問答補資料</Link>
            <Link className="button secondary compact" href="/income-lab">提高收入</Link>
            <Link className="button secondary compact" href="/agent-lab">Agent 架構</Link>
            <Link className="button secondary compact" href="/agent-memory">Agent 記憶</Link>
          </div>
        </div>
        <div className="assistant-status">
          <span className={`status-dot risk-${financeStatus}`}>{assistantRiskLabel(financeStatus)}</span>
          <strong><BrainCircuit size={18} />今日提醒狀態</strong>
          <small>CFO 今日簡報：{latestBrief?.status ?? "待建立"}</small>
          <small>所有建議：需要 Mark review</small>
        </div>
      </header>

      <section className="assistant-command-surface">
        <form className="assistant-main-prompt" onSubmit={ask}>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="問我任何事，例如：我今天先做什麼？我要準備期末考？現在可以花錢嗎？" />
          <button className="button compact" type="submit"><SendHorizontal size={16} />送出</button>
        </form>
        <div className="prompt-row">
          {prompts.map((prompt) => <button key={prompt} type="button" onClick={() => askPrompt(prompt)}>{prompt}</button>)}
        </div>
      </section>

      <section className="assistant-live-reply" ref={liveAnswerRef} aria-live="polite">
        <div className="live-question">
          <span>你問</span>
          <p>{lastQuestion}</p>
        </div>
        <div className="live-answer">
          <span>助理回覆</span>
          <h2>{answer.sections.current_judgment}</h2>
          <p>{answer.sections.priority}</p>
          <div className="live-answer-actions">
            {answer.sections.links.map((link) => <Link className="button compact" key={link.href} href={link.href}>{link.label}</Link>)}
          </div>
        </div>
      </section>

      <section className="assistant-action-board" aria-label="Action board">
        <article className="action-board-panel review-panel">
          <div className="item-header">
            <h2><CheckCircle2 size={18} />需要你審核</h2>
            <span className="badge review">{opsDashboard.review_actions.length} 件</span>
          </div>
          <div className="action-task-list">
            {opsDashboard.review_actions.map((item) => (
              <div className={`action-task risk-${item.risk}`} key={item.id}>
                <span>{item.owner_label}</span>
                <strong>{item.title}</strong>
                <p>{item.reason}</p>
                <Link className="button compact" href={item.href}>{item.primary_label}</Link>
              </div>
            ))}
          </div>
        </article>
        <article className="action-board-panel answer-panel">
          <div className="item-header">
            <h2><MessageCircleQuestion size={18} />需要你回答</h2>
            <span className="badge review">{opsDashboard.answer_requests.length} 題</span>
          </div>
          <div className="answer-request-list">
            {opsDashboard.answer_requests.map((item) => (
              <label className="answer-request" key={item.id}>
                <span>{item.owner_label}</span>
                <strong>{item.question}</strong>
                <small>{item.why}</small>
                <input className="input" placeholder={item.placeholder} />
                <Link className="button secondary compact" href={item.href}>用問答輸入補資料</Link>
              </label>
            ))}
          </div>
        </article>
      </section>

      <section className="panel assistant-priorities command-panel">
        <h2><ArrowRight size={18} />今天最重要 3 件事</h2>
        <ol>
          <li>先回答上方 3 個具體問題。</li>
          <li>按上方審核按鈕處理支出、投資、成本守門。</li>
          <li>需要補資料時，直接用問答輸入，不用自己找欄位。</li>
        </ol>
      </section>

      <section className="panel assistant-ops-dashboard compact-ops" aria-label="Company assistant operations">
        <div className="item-header">
          <div>
            <h2>公司助理分工與匯報</h2>
            <p>{opsDashboard.headline}</p>
          </div>
          <span className="badge review">網站內匯報</span>
        </div>
        <div className="ops-brief-grid">
          {opsDashboard.next_reports.map((report) => (
            <article className="ops-brief-card" key={report.id}>
              <span className="badge">{report.owner_label}</span>
              <h3>{report.title}</h3>
              <p>{report.cadence}</p>
              <small>{report.delivery}</small>
            </article>
          ))}
        </div>
        <details className="assistant-secondary-details">
          <summary>查看助理員工分工</summary>
          <div className="ops-assignment-strip" aria-label="Assigned assistant work">
          {opsDashboard.assignments.map((assignment) => (
            <Link className={`ops-assignment-card risk-${assignment.risk}`} href={assignment.href} key={assignment.id}>
              <span>{assignment.owner_label}</span>
              <strong>{assignment.title}</strong>
              <small>{assignment.status} / {assignment.next_report}</small>
              <p>{assignment.next_step}</p>
            </Link>
          ))}
          </div>
        </details>
      </section>

      <section className="panel assistant-review-dashboard" aria-label="Assistant review dashboard">
        <div className="item-header">
          <div>
            <h2>系統已完成與需要你確認</h2>
            <p>這裡是助理主動整理給 Mark 的驗收清單，不用再從後台頁面猜。</p>
          </div>
          <span className="badge review">review deck</span>
        </div>
        <div className="assistant-review-columns">
          <div>
            <h3>已製作完成</h3>
            <div className="assistant-review-card-list">
              {reviewDashboard.completed.map((item) => (
                <Link className="assistant-review-card done" key={item.title} href={item.href}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3>Mark 需要看 / 確認</h3>
            <div className="assistant-review-card-list">
              {reviewDashboard.needsMarkReview.map((item) => (
                <Link className={`assistant-review-card risk-${item.risk}`} key={item.title} href={item.href}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="assistant-question-strip" aria-label="Suggested assistant questions">
          {reviewDashboard.suggestedQuestions.map((prompt) => (
            <button key={prompt} type="button" onClick={() => askPrompt(prompt)}>{prompt}</button>
          ))}
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
            <div className="assistant-recommended-start">
              <h3>建議先看</h3>
              <p>{answer.content_summary.recommended_start}</p>
            </div>
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

      {answer.review_dashboard ? (
        <section className="panel assistant-review-dashboard" aria-label="Assistant system answer review deck">
          <div className="item-header">
            <div>
              <h2>助理系統完成度</h2>
              <p>這是根據你剛剛的問題自動跳出的系統狀態卡。</p>
            </div>
            <span className="badge review">answer deck</span>
          </div>
          <div className="assistant-review-columns">
            <div>
              <h3>已完成</h3>
              <div className="assistant-review-card-list">
                {answer.review_dashboard.completed.map((item) => (
                  <Link className="assistant-review-card done" key={item.title} href={item.href}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3>需要 Mark 確認</h3>
              <div className="assistant-review-card-list">
                {answer.review_dashboard.needsMarkReview.map((item) => (
                  <Link className={`assistant-review-card risk-${item.risk}`} key={item.title} href={item.href}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {answer.ops_dashboard ? (
        <section className="panel assistant-ops-dashboard" aria-label="Assistant operations answer">
          <div className="item-header">
            <div>
              <h2>助理員工正在處理什麼</h2>
              <p>{answer.ops_dashboard.headline}</p>
            </div>
            <span className="badge review">分工回報</span>
          </div>
          <div className="ops-assignment-strip">
            {answer.ops_dashboard.assignments.map((assignment) => (
              <Link className={`ops-assignment-card risk-${assignment.risk}`} href={assignment.href} key={assignment.id}>
                <span>{assignment.owner_label}</span>
                <strong>{assignment.title}</strong>
                <small>{assignment.report_cadence}</small>
                <p>{assignment.next_step}</p>
              </Link>
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
              <span className={`badge review risk-${item.risk}`}>{assistantRiskLabel(item.risk)}</span>
              <strong>{item.title}</strong>
              <small>{item.status}</small>
              <span className="assistant-progress" aria-label={`${item.title} completion ${assistantBranchCompletion(item)} percent`}><span style={{ width: `${assistantBranchCompletion(item)}%` }} /></span>
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
              <div><strong>風險</strong><p>{assistantRiskLabel(branch.risk)}</p></div>
              <div><strong>最近摘要</strong><p>{branch.recent}</p></div>
              <div><strong>建議下一步</strong><p>{branch.next_action}</p></div>
              <div><strong>已完成</strong><p>{branch.completed.join("、")}</p></div>
              <div><strong>Mark 需確認</strong><p>{branch.review_items.join("、")}</p></div>
              <div><strong>這位員工記住</strong><p>{branch.memory_items.join("、")}</p></div>
              <div><strong>會主動提醒</strong><p>{branch.reminder_rules.join("、")}</p></div>
            </div>
            <div className="assistant-question-strip">
              {branch.ask_examples.map((prompt) => <button key={prompt} type="button" onClick={() => askPrompt(prompt)}>{prompt}</button>)}
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
