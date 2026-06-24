"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { createCodexJobDraft } from "@/lib/codexJobs";
import { FINANCE_REVIEW_PROJECTS, generateFinanceReview } from "@/lib/finance";
import { generateDecisionReportDraft } from "@/lib/reports/decisionReport";
import { reviewTaskDispatch, type TaskReviewAction } from "@/lib/review/reviewTaskDispatch";
import { createSopDraftFromTask } from "@/lib/sop";
import { formatDateTime, safeJson } from "@/lib/ui/format";
import type { AiAgent, AiInboxItem, TaskDispatch } from "@/types/firestore";

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <strong>{label}</strong>
      <p>{typeof value === "boolean" ? String(value) : value ? String(value) : "None"}</p>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="json-block">{safeJson(value)}</pre>;
}

function TaskDispatchDetailData({ taskId, uid }: { taskId: string; uid: string }) {
  const [task, setTask] = useState<TaskDispatch | null>(null);
  const [inbox, setInbox] = useState<AiInboxItem | null>(null);
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [financeReviewId, setFinanceReviewId] = useState<string | null>(null);
  const [codexJobId, setCodexJobId] = useState<string | null>(null);
  const [sopId, setSopId] = useState<string | null>(null);

  async function load() {
    setError(null);
    const db = getClientDb();
    try {
      const taskSnap = await getDoc(doc(db, "task_dispatches", taskId));
      if (!taskSnap.exists()) {
        setTask(null);
        setInbox(null);
        setAgents([]);
        setError("Task dispatch not found.");
        return;
      }

      const nextTask = { id: taskSnap.id, ...taskSnap.data() } as TaskDispatch;
      setTask(nextTask);

      if (nextTask.source_inbox_id) {
        const inboxSnap = await getDoc(doc(db, "ai_inbox", nextTask.source_inbox_id));
        setInbox(inboxSnap.exists() ? ({ id: inboxSnap.id, ...inboxSnap.data() } as AiInboxItem) : null);
      } else {
        setInbox(null);
      }

      if (nextTask.agent_ids?.length) {
        const chunks = nextTask.agent_ids.slice(0, 10);
        const agentSnap = await getDocs(query(collection(db, "ai_agents"), where("__name__", "in", chunks)));
        setAgents(agentSnap.docs.map((item) => ({ id: item.id, ...item.data() }) as AiAgent));
      } else {
        setAgents([]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load task detail.");
    }
  }

  useEffect(() => {
    void load();
  }, [taskId]);

  const isBusiness = useMemo(() => {
    if (!task) return false;
    return Boolean(
      task.project_id?.includes("business") ||
        task.project_id === "capital_compounding" ||
        task.task_type.includes("startup") ||
        task.task_type.includes("investment") ||
        task.task_type.includes("capital")
    );
  }, [task]);

  async function runReview(action: TaskReviewAction) {
    setBusy(action);
    try {
      const db = getClientDb();
      await reviewTaskDispatch(db, taskId, action, uid);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function generateReport() {
    setBusy("report");
    try {
      const db = getClientDb();
      const result = await generateDecisionReportDraft(db, taskId, uid);
      setReportId(result.reportId);
    } finally {
      setBusy(null);
    }
  }

  async function generateFinance() {
    setBusy("finance");
    try {
      const result = await generateFinanceReview(getClientDb(), taskId, uid);
      setFinanceReviewId(result.financeReviewId);
    } finally {
      setBusy(null);
    }
  }

  async function createCodexJob() {
    setBusy("codex");
    try {
      const result = await createCodexJobDraft(getClientDb(), taskId, uid);
      setCodexJobId(result.jobId);
    } finally {
      setBusy(null);
    }
  }

  async function createSop() {
    setBusy("sop");
    try {
      const result = await createSopDraftFromTask(getClientDb(), taskId, uid);
      setSopId(result.sopId);
    } finally {
      setBusy(null);
    }
  }

  if (error) {
    return (
      <section className="panel">
        <h2>Task detail error</h2>
        <p className="muted">{error}</p>
        <div className="action-row">
          <Link className="button secondary compact" href="/command-center">Back to Command Center</Link>
          <button className="button compact" type="button" onClick={load}>Retry</button>
        </div>
      </section>
    );
  }

  if (!task) {
    return <p className="muted">Loading task detail...</p>;
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <h1>{task.title}</h1>
          <p>Task Dispatch Detail</p>
        </div>
        <div className="action-row">
          <Link className="button secondary compact" href="/command-center">Back to Command Center</Link>
          <Link className="button secondary compact" href="/settings">Back to Settings</Link>
        </div>
      </header>

      <section className="panel">
        <h2>任務總覽</h2>
        <div className="detail-grid">
          <Field label="project_id" value={task.project_id} />
          <Field label="agent_ids" value={task.agent_ids?.join(", ")} />
          <Field label="task_type" value={task.task_type} />
          <Field label="priority" value={task.priority} />
          <Field label="status" value={task.status} />
          <Field label="decision_status" value={task.decision_status} />
          <Field label="need_mark_review" value={task.need_mark_review} />
          <Field label="external_action_allowed" value={Boolean(task.external_action_allowed)} />
          <Field label="created_at" value={formatDateTime(task.created_at)} />
          <Field label="updated_at" value={formatDateTime(task.updated_at)} />
        </div>
      </section>

      <section className="panel">
        <h2>任務背景</h2>
        <div className="detail-grid">
          <Field label="background" value={task.background} />
          <Field label="source_inbox_id" value={task.source_inbox_id} />
          {inbox ? (
            <>
              <Field label="ai_inbox raw_text" value={inbox.raw_text ?? inbox.body} />
              <Field label="ai_inbox normalized_text" value={inbox.normalized_text} />
              <Field label="ai_inbox summary" value={inbox.summary} />
            </>
          ) : (
            <Field label="source inbox" value="找不到對應 ai_inbox，任務仍可審核。" />
          )}
        </div>
      </section>

      <section className="panel">
        <h2>指派 AI 人員</h2>
        <div className="list">
          {agents.length === 0 ? <p className="muted">找不到對應 AI agent，請檢查 seed 資料。</p> : null}
          {agents.map((agent) => (
            <article className="item" key={agent.id}>
              <div className="item-header">
                <h3>{agent.name}</h3>
                <span className="badge">{agent.role}</span>
              </div>
              <p>{agent.responsibilities?.join(" ")}</p>
              <JsonBlock value={agent.forbidden_actions} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>執行說明</h2>
        <div className="detail-grid">
          <Field label="instructions" value={task.instructions ?? task.instruction} />
          <Field label="completion_standard" value={task.completion_standard} />
          <Field label="report_format" value={task.report_format} />
          <Field label="owner_type" value={task.owner_type} />
          <Field label="human_assistant_needed" value={task.human_assistant_needed} />
          <Field label="ai_agent_needed" value={task.ai_agent_needed} />
          <Field label="codex_needed" value={task.codex_needed} />
        </div>
      </section>

      <section className="panel">
        <h2>風險與安全</h2>
        <div className="badge-row">
          <span className="badge urgent">external_action_allowed=false</span>
          <span className="badge review">不可自動付款</span>
          <span className="badge review">不可自動下單</span>
          <span className="badge review">不可自動聯絡供應商</span>
          <span className="badge review">不可自動對外傳訊息</span>
          <span className="badge review">不可醫療診斷或投資保證</span>
        </div>
        <div className="detail-grid" style={{ marginTop: 12 }}>
          <Field label="risk_level" value={task.risk_level} />
          <Field label="safety_forbidden_reasons" value={task.safety_forbidden_reasons?.join(" / ")} />
        </div>
      </section>

      <section className="panel">
        <h2>商業 / 資金資訊</h2>
        {isBusiness ? (
          <div className="detail-grid">
            <Field label="capital_required" value={task.capital_required} />
            <Field label="expected_roi" value={task.expected_roi} />
            <Field label="payback_period" value={task.payback_period} />
            <Field label="cashflow_impact" value={task.cashflow_impact} />
            <Field label="stage" value={task.stage} />
            <Field label="risk_level" value={task.risk_level} />
          </div>
        ) : (
          <p className="muted">此任務非商業/資金決策類。</p>
        )}
      </section>

      <section className="panel">
        <h2>Review 操作</h2>
        <div className="action-row">
          <button className="button compact" disabled={Boolean(busy)} onClick={() => runReview("approve")}>Approve</button>
          <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => runReview("reject")}>Reject</button>
          <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => runReview("more_info")}>Need More Info</button>
          <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => runReview("archive")}>Archive</button>
          <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => runReview("doing")}>Mark as Doing</button>
          <button className="button secondary compact" disabled={Boolean(busy)} onClick={() => runReview("done")}>Mark as Done</button>
          <button className="button compact" disabled={Boolean(busy) || !task.project_id || !FINANCE_REVIEW_PROJECTS.includes(task.project_id)} onClick={generateFinance}>Generate Finance Review</button>
          <button className="button compact" disabled={Boolean(busy)} onClick={generateReport}>Generate Draft Decision Report</button>
          <button className="button compact" disabled={Boolean(busy)} onClick={createCodexJob}>Create Codex Job Draft</button>
          <button className="button compact" disabled={Boolean(busy)} onClick={createSop}>Create SOP Draft from Task</button>
        </div>
        {financeReviewId ? <p className="muted" style={{ marginTop: 12 }}>Finance review created: <Link className="mono" href={`/finance-reviews/${financeReviewId}`}>{financeReviewId}</Link></p> : null}
        {codexJobId ? <p className="muted" style={{ marginTop: 12 }}>Codex job draft created: <Link className="mono" href={`/codex-jobs/${codexJobId}`}>{codexJobId}</Link></p> : null}
        {sopId ? <p className="muted" style={{ marginTop: 12 }}>SOP draft created: <Link className="mono" href={`/knowledge-sop/${sopId}`}>{sopId}</Link></p> : null}
        {reportId ? (
          <p className="muted" style={{ marginTop: 12 }}>
            Draft report created: <Link className="mono" href={`/decision-reports/${reportId}`}>{reportId}</Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}

export function TaskDispatchDetailClient({ taskId }: { taskId: string }) {
  return <ProtectedPage>{(uid) => <TaskDispatchDetailData taskId={taskId} uid={uid} />}</ProtectedPage>;
}
