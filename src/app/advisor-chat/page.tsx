"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildAdvisorContext } from "@/lib/advisorContext";
import { buildAdvisorAnswer, createAdvisorActionDraft, createAdvisorMessage, createAdvisorThread, type AdvisorSuggestedAction } from "@/lib/advisorResponse";
import { getClientDb } from "@/lib/firebase/client";
import { safeJoin } from "@/lib/ui/safe";
import type {
  AccountBalance,
  AdvisorActionDraft,
  AdvisorMessage,
  AdvisorMode,
  AdvisorThread,
  CodexJob,
  CommandBrief,
  DecisionReport,
  DecisionScenario,
  ExpenseSignal,
  FinanceDecision,
  FinanceSnapshot,
  FinancialProfile,
  InvestmentDecision,
  KnowledgeSop,
  Project,
  RecoveryPlan,
  TaskDispatch
} from "@/types/firestore";

const modes: Array<{ value: AdvisorMode; label: string }> = [
  { value: "finance", label: "CFO / 財務" },
  { value: "investment", label: "投資決策" },
  { value: "business", label: "創業 / 商業模式" },
  { value: "studio_ops", label: "工作室營運" },
  { value: "client", label: "客戶 / 課表" },
  { value: "study", label: "國考 / 學習內容" },
  { value: "content", label: "內容行銷" },
  { value: "product", label: "App / 產品開發" },
  { value: "general", label: "General Command" }
];

const quickQuestions: Array<{ mode: AdvisorMode; label: string; question: string }> = [
  { mode: "finance", label: "現在可以花錢嗎", question: "我現在可以花錢嗎？請用目前財務風險幫我判斷。" },
  { mode: "investment", label: "股票能不能加碼", question: "股票可以加碼嗎？請列缺資料、續抱、加碼、減碼與停損條件。" },
  { mode: "study", label: "準備期末考", question: "我要準備期末考，請告訴我已整理內容、待確認內容與今天先讀什麼。" },
  { mode: "client", label: "整理客戶課表", question: "我要整理客戶課表，請幫我列 session note 與下次訓練草稿需要哪些資料。" },
  { mode: "product", label: "App 下一步", question: "助理系統接下來應該先完成什麼？請列可驗收項目。" }
];

function advisorAnswerSections(content: string) {
  return content.split(/\n(?=\d+\. )/).map((section) => {
    const [title = "Advisor", ...body] = section.trim().split("\n");
    return { title, body: body.join("\n").trim() };
  }).filter((section) => section.title || section.body);
}

function AdvisorChatData({ uid }: { uid: string }) {
  const threads = useFirestoreCollection<AdvisorThread>("advisor_threads", recent20, true);
  const messages = useFirestoreCollection<AdvisorMessage>("advisor_messages", recent20, true);
  const actionDrafts = useFirestoreCollection<AdvisorActionDraft>("advisor_action_drafts", recent20, true);
  const profiles = useFirestoreCollection<FinancialProfile>("financial_profile", recent20, true);
  const snapshots = useFirestoreCollection<FinanceSnapshot>("finance_snapshots", recent20, true);
  const accounts = useFirestoreCollection<AccountBalance>("account_balances", recent20, true);
  const signals = useFirestoreCollection<ExpenseSignal>("expense_signals", recent20, true);
  const financeDecisions = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const projects = useFirestoreCollection<Project>("projects", recent20, true);
  const scenarios = useFirestoreCollection<DecisionScenario>("decision_scenarios", recent20, true);
  const recoveryPlans = useFirestoreCollection<RecoveryPlan>("recovery_plans", recent20, true);
  const codexJobs = useFirestoreCollection<CodexJob>("codex_jobs", recent20, true);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const reports = useFirestoreCollection<DecisionReport>("decision_reports", recent20, true);
  const sops = useFirestoreCollection<KnowledgeSop>("knowledge_sop", recent20, true);
  const commandBriefs = useFirestoreCollection<CommandBrief>("command_briefs", recent20, true);
  const [mode, setMode] = useState<AdvisorMode>("finance");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<AdvisorMessage | null>(null);
  const [lastActions, setLastActions] = useState<AdvisorSuggestedAction[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeMessages = useMemo(() => messages.items.filter((item) => !activeThreadId || item.thread_id === activeThreadId), [messages.items, activeThreadId]);
  const loadError = threads.error ?? messages.error ?? profiles.error ?? snapshots.error ?? signals.error ?? financeDecisions.error ?? investments.error ?? commandBriefs.error;

  function contextFor(nextMode = mode) {
    return buildAdvisorContext(nextMode, {
      financialProfile: profiles.items[0] ?? null,
      financeSnapshots: snapshots.items,
      accountBalances: accounts.items,
      expenseSignals: signals.items,
      financeDecisions: financeDecisions.items,
      investmentDecisions: investments.items,
      projects: projects.items,
      decisionScenarios: scenarios.items,
      recoveryPlans: recoveryPlans.items,
      codexJobs: codexJobs.items,
      taskDispatches: tasks.items,
      decisionReports: reports.items,
      knowledgeSops: sops.items,
      commandBriefs: commandBriefs.items
    });
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("ask");
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      const submittedQuestion = String(form.get("question") ?? question).trim();
      if (!submittedQuestion) return;
      const db = getClientDb();
      let threadId = activeThreadId;
      if (!threadId) {
        const thread = await createAdvisorThread(db, { user_id: uid, title: submittedQuestion.slice(0, 60), mode, summary: `Advisor thread: ${submittedQuestion.slice(0, 120)}`, status: "active", need_mark_review: true, external_action_allowed: false });
        threadId = thread.threadId;
        setActiveThreadId(threadId);
      }
      await createAdvisorMessage(db, { thread_id: threadId, user_id: uid, role: "user", content: submittedQuestion, mode, context_used: [], suggested_actions: [], missing_required_fields: [], safety_flags: ["need_mark_review=true", "external_action_allowed=false"], need_mark_review: true, external_action_allowed: false });
      const context = contextFor(mode);
      const answer = buildAdvisorAnswer(mode, submittedQuestion, context);
      const saved = await createAdvisorMessage(db, { thread_id: threadId, user_id: uid, role: "assistant", content: answer.content, mode, context_used: answer.context_used, suggested_actions: answer.suggested_actions as never[], missing_required_fields: answer.missing_required_fields, safety_flags: answer.safety_flags, need_mark_review: true, external_action_allowed: false });
      setLastAnswer({ id: saved.messageId, thread_id: threadId, user_id: uid, role: "assistant", content: answer.content, mode, context_used: answer.context_used, suggested_actions: answer.suggested_actions as never[], missing_required_fields: answer.missing_required_fields, safety_flags: answer.safety_flags, need_mark_review: true, external_action_allowed: false, created_at: "", updated_at: "" });
      setLastActions(answer.suggested_actions);
      setQuestion("");
      event.currentTarget.reset();
    } catch (askError) {
      setError(askError instanceof Error ? askError.message : "Advisor failed.");
    } finally {
      setBusy(null);
    }
  }

  async function createDraft(action: AdvisorSuggestedAction) {
    if (!activeThreadId) return;
    setBusy(action.action_type);
    try {
      await createAdvisorActionDraft(getClientDb(), { user_id: uid, thread_id: activeThreadId, source_message_id: lastAnswer?.id ?? null, action_type: action.action_type, title: action.title, summary: action.summary, target_collection: action.target_collection, draft_payload: action.draft_payload, status: "draft", need_mark_review: true, external_action_allowed: false });
    } finally {
      setBusy(null);
    }
  }

  const context = contextFor(mode);
  const latestSections = lastAnswer ? advisorAnswerSections(lastAnswer.content) : [];
  return <div className="grid advisor-chat-page"><header className="page-header"><div><h1>AI Advisor Chat</h1><p>AI 總管 / CFO / 專案顧問 / 內容助理 / 客戶管理助理的統一對話入口。</p></div><div className="action-row"><Link className="button secondary compact" href="/assistant">Assistant</Link><Link className="button secondary compact" href="/review-queue">Review Queue</Link><Link className="button secondary compact" href="/today">Today</Link></div></header>{loadError || error ? <section className="panel"><h2>Advisor status</h2><p className="muted">{error ?? loadError}</p></section> : null}<section className="panel advisor-compose"><h2>New Conversation</h2><div className="assistant-question-strip">{quickQuestions.map((item) => <button key={item.label} type="button" onClick={() => { setMode(item.mode); setQuestion(item.question); }}>{item.label}</button>)}</div><form className="grid" onSubmit={ask}><label>mode<select value={mode} onChange={(event) => setMode(event.target.value as AdvisorMode)}>{modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>question<textarea name="question" rows={5} required value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="把你想討論的策略、財務、投資、客戶、內容、產品問題貼在這裡。" /></label><button className="button compact" disabled={Boolean(busy)}>送出給 Advisor</button></form></section><section className="panel"><h2>Context Preview</h2><div className="detail-grid"><div><strong>context_used</strong><p>{safeJoin(context.context_used)}</p></div><div><strong>missing_required_fields</strong><p>{safeJoin(context.missing_required_fields)}</p></div><div><strong>review_queue</strong><p>{context.review_queue.length}</p></div></div><ul>{context.facts.map((item) => <li key={item}>{item}</li>)}</ul></section>{lastAnswer ? <section className="panel latest-advisor-answer"><div className="item-header"><h2>Latest Advisor Answer</h2><span className="badge review">review-gated</span></div><div className="assistant-answer-grid">{latestSections.map((section) => <article key={section.title}><strong>{section.title}</strong><p>{section.body}</p></article>)}</div><p className="muted">safety: {safeJoin(lastAnswer.safety_flags)}</p><div className="list">{lastActions.map((action) => <article className="item" key={action.action_type}><div className="item-header"><h3>{action.title}</h3><span className="badge review">{action.target_collection}</span></div><p>{action.summary}</p><button className="button compact" disabled={Boolean(busy)} onClick={() => createDraft(action)}>建立草稿</button></article>)}</div></section> : null}<section className="panel"><h2>Thread History</h2><div className="action-row">{threads.items.slice(0, 8).map((thread) => <button className="button secondary compact" key={thread.id} onClick={() => setActiveThreadId(thread.id)}>{thread.title}</button>)}</div><div className="list">{activeMessages.slice(0, 10).map((message) => <article className="item" key={message.id}><div className="item-header"><h3>{message.role}</h3><span className="badge">{message.mode}</span></div><p>{message.content.slice(0, 260)}</p><p className="muted">missing: {safeJoin(message.missing_required_fields)}</p></article>)}</div></section><section className="panel"><h2>Action Drafts</h2><div className="list">{actionDrafts.items.length ? actionDrafts.items.map((draft) => <article className="item" key={draft.id}><div className="item-header"><h3>{draft.title}</h3><span className="badge review">{draft.status}</span></div><p>{draft.summary}</p><Link className="button compact" href="/review-queue">前往 Review Queue</Link></article>) : <p className="muted">尚未建立 advisor action drafts。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <AdvisorChatData uid={uid} />}</ProtectedPage>;
}
