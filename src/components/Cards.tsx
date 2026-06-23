"use client";

import { Archive, Check, HelpCircle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getClientDb } from "@/lib/firebase/client";
import { reviewTaskDispatch } from "@/lib/review/reviewTaskDispatch";
import type { AiAgent, AiInboxItem, Project, TaskDispatch } from "@/types/firestore";

function EmptyState({ message }: { message: string }) {
  return <p className="muted">{message}</p>;
}

function formatDate(value: unknown) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString("zh-TW");
  }

  return "";
}

function JsonBlock({ value }: { value: unknown }) {
  if (!value) {
    return <span className="muted">None</span>;
  }

  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}

function RouteDetailDrawer({
  item,
  task,
  onClose
}: {
  item: AiInboxItem;
  task?: TaskDispatch;
  onClose: () => void;
}) {
  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="AI route detail" onClick={(event) => event.stopPropagation()}>
        <div className="item-header">
          <h2>AI 判斷</h2>
          <button className="button secondary compact" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="detail-grid">
          <div><strong>raw_text</strong><p>{item.raw_text ?? item.body}</p></div>
          <div><strong>normalized_text</strong><p>{item.normalized_text}</p></div>
          <div><strong>detected_intent</strong><p>{item.detected_intent}</p></div>
          <div><strong>project_id</strong><p>{item.project_id}</p></div>
          <div><strong>agent_ids</strong><JsonBlock value={item.agent_ids} /></div>
          <div><strong>confidence</strong><p>{item.confidence ?? "None"}</p></div>
          <div><strong>needs_clarification</strong><p>{String(Boolean(item.needs_clarification))}</p></div>
          <div><strong>clarification_question</strong><p>{item.clarification_question ?? "None"}</p></div>
          <div><strong>summary</strong><p>{item.summary}</p></div>
          <div><strong>next_actions</strong><JsonBlock value={item.next_actions} /></div>
          <div><strong>safety</strong><JsonBlock value={item.safety} /></div>
          <div><strong>status</strong><p>{item.status}</p></div>
          <div><strong>need_mark_review</strong><p>{String(item.need_mark_review)}</p></div>
          <div><strong>created_at</strong><p>{formatDate(item.created_at)}</p></div>
          <div><strong>updated_at</strong><p>{formatDate(item.updated_at)}</p></div>
          {item.route_error ? <div><strong>error_summary_redacted</strong><p>{item.route_error}</p></div> : null}
        </div>

        {task ? (
          <section className="drawer-section">
            <h3>Task Dispatch</h3>
            <div className="detail-grid">
              <div><strong>task title</strong><p>{task.title}</p></div>
              <div><strong>task_type</strong><p>{task.task_type}</p></div>
              <div><strong>background</strong><p>{task.background}</p></div>
              <div><strong>instructions</strong><p>{task.instructions}</p></div>
              <div><strong>completion_standard</strong><p>{task.completion_standard}</p></div>
              <div><strong>report_format</strong><p>{task.report_format}</p></div>
              <div><strong>owner_type</strong><p>{task.owner_type}</p></div>
              <div><strong>status</strong><p>{task.status}</p></div>
              <div><strong>decision_status</strong><p>{task.decision_status}</p></div>
              <div><strong>stage</strong><p>{task.stage}</p></div>
              <div><strong>risk_level</strong><p>{task.risk_level}</p></div>
              <div><strong>capital_required</strong><p>{task.capital_required}</p></div>
              <div><strong>expected_roi</strong><p>{task.expected_roi}</p></div>
              <div><strong>payback_period</strong><p>{task.payback_period}</p></div>
              <div><strong>cashflow_impact</strong><p>{task.cashflow_impact}</p></div>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

export function InboxList({ items, tasks = [] }: { items: AiInboxItem[]; tasks?: TaskDispatch[] }) {
  const [selectedItem, setSelectedItem] = useState<AiInboxItem | null>(null);
  const selectedTask = selectedItem ? tasks.find((task) => task.source_inbox_id === selectedItem.id) : undefined;

  return (
    <section className="panel">
      <h2>AI Inbox</h2>
      <div className="list">
        {items.length === 0 ? (
          <EmptyState message="目前尚無資料，請先執行 npm run seed 或新增第一筆想法。" />
        ) : (
          items.map((item) => (
            <article className="item" key={item.id}>
              <div className="item-header">
                <h3>{item.title || item.summary || "Untitled input"}</h3>
                <span className={`badge ${item.priority === "urgent" ? "urgent" : ""}`}>{item.priority}</span>
              </div>
              <p>{item.summary ?? item.body ?? item.raw_text}</p>
              {item.needs_clarification && item.clarification_question ? (
                <p className="muted">Clarify: {item.clarification_question}</p>
              ) : null}
              <div className="badge-row">
                <span className="badge">{item.source}</span>
                <span className="badge">{item.status}</span>
                {item.detected_intent ? <span className="badge">{item.detected_intent}</span> : null}
                {item.project_id ? <span className="badge">{item.project_id}</span> : null}
                {item.need_mark_review ? <span className="badge review">Mark review</span> : null}
              </div>
              <div className="action-row">
                <button className="button secondary compact" type="button" onClick={() => setSelectedItem(item)}>
                  查看 AI 判斷
                </button>
                {tasks.find((task) => task.source_inbox_id === item.id) ? (
                  <Link className="button secondary compact" href={`/task-dispatches/${tasks.find((task) => task.source_inbox_id === item.id)?.id}`}>
                    查看相關任務
                  </Link>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
      {selectedItem ? <RouteDetailDrawer item={selectedItem} task={selectedTask} onClose={() => setSelectedItem(null)} /> : null}
    </section>
  );
}

export function TaskDispatchList({ tasks, userId }: { tasks: TaskDispatch[]; userId?: string }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reviewTask(taskId: string, action: "approve" | "reject" | "more_info" | "archive") {
    setBusyId(taskId);

    try {
      const db = getClientDb();
      await reviewTaskDispatch(db, taskId, action, userId ?? "unknown");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="panel">
      <h2>Task Dispatch</h2>
      <div className="list">
        {tasks.length === 0 ? (
          <EmptyState message="目前尚無資料，請先執行 npm run seed 或新增第一筆想法。" />
        ) : (
          tasks.map((task) => (
            <article className="item" key={task.id}>
              <div className="item-header">
                <h3>{task.title}</h3>
                <span className={`badge ${task.priority === "urgent" ? "urgent" : ""}`}>{task.priority}</span>
              </div>
              <p>{task.instructions ?? task.instruction}</p>
              <div className="badge-row">
                <span className="badge">{task.status}</span>
                <span className="badge">{task.decision_status}</span>
                <span className="badge">{task.stage}</span>
                {task.project_id ? <span className="badge">{task.project_id}</span> : null}
                {task.agent_ids?.map((agentId) => (
                  <span className="badge" key={agentId}>
                    {agentId}
                  </span>
                ))}
                {task.need_mark_review ? <span className="badge review">Mark review</span> : null}
              </div>
              <div className="action-row">
                <button className="button compact" type="button" disabled={busyId === task.id} onClick={() => reviewTask(task.id, "approve")}>
                  <Check size={15} />
                  Approve
                </button>
                <button className="button secondary compact" type="button" disabled={busyId === task.id} onClick={() => reviewTask(task.id, "reject")}>
                  <X size={15} />
                  Reject
                </button>
                <button className="button secondary compact" type="button" disabled={busyId === task.id} onClick={() => reviewTask(task.id, "more_info")}>
                  <HelpCircle size={15} />
                  Need More Info
                </button>
                <button className="button secondary compact" type="button" disabled={busyId === task.id} onClick={() => reviewTask(task.id, "archive")}>
                  <Archive size={15} />
                  Archive
                </button>
                <Link className="button secondary compact" href={`/task-dispatches/${task.id}`}>
                  查看詳情
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function ProjectCards({ projects }: { projects: Project[] }) {
  return (
    <section className="panel">
      <h2>Projects</h2>
      <div className="cards-grid">
        {projects.length === 0 ? (
          <EmptyState message="目前尚無資料，請先執行 npm run seed 或新增第一筆想法。" />
        ) : (
          projects.map((project) => (
            <article className="card" key={project.id}>
              <div className="card-header">
                <h3>{project.name}</h3>
                <span className={`badge ${project.priority === "urgent" ? "urgent" : ""}`}>{project.priority}</span>
              </div>
              <p>{project.description}</p>
              <div className="badge-row">
                <span className="badge">{project.category}</span>
                <span className="badge">{project.status}</span>
                {project.default_agent_ids?.map((agentId) => (
                  <span className="badge" key={agentId}>
                    {agentId}
                  </span>
                ))}
              </div>
              <p className="muted">Next: {project.next_action}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function AgentCards({ agents }: { agents: AiAgent[] }) {
  return (
    <section className="panel">
      <h2>AI Agents</h2>
      <div className="cards-grid">
        {agents.length === 0 ? (
          <EmptyState message="目前尚無資料，請先執行 npm run seed 或新增第一筆想法。" />
        ) : (
          agents.map((agent) => (
            <article className="card" key={agent.id}>
              <div className="card-header">
                <h3>{agent.name}</h3>
                <span className="badge">{agent.role}</span>
              </div>
              <p>{agent.responsibilities?.[0] ?? agent.mission}</p>
              <div className="badge-row">
                <span className="badge">{agent.status}</span>
                {agent.default_projects?.map((projectId) => (
                  <span className="badge" key={projectId}>
                    {projectId}
                  </span>
                ))}
                {agent.need_mark_review ? <span className="badge review">Mark review</span> : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export function ReviewRequired({
  inbox,
  tasks,
  projects,
  agents
}: {
  inbox: AiInboxItem[];
  tasks: TaskDispatch[];
  projects: Project[];
  agents: AiAgent[];
}) {
  const reviewItems = [
    ...inbox.filter((item) => item.need_mark_review).map((item) => ({ id: item.id, title: item.title, type: "Inbox", date: item.created_at })),
    ...tasks.filter((item) => item.need_mark_review).map((item) => ({ id: item.id, title: item.title, type: "Task", date: item.created_at, href: `/task-dispatches/${item.id}` })),
    ...projects.filter((item) => item.need_mark_review).map((item) => ({ id: item.id, title: item.name, type: "Project", date: item.created_at })),
    ...agents.filter((item) => item.need_mark_review).map((item) => ({ id: item.id, title: item.name, type: "Agent", date: item.created_at }))
  ].slice(0, 12);

  return (
    <section className="panel">
      <h2>Review Required</h2>
      <div className="list">
        {reviewItems.length === 0 ? (
          <EmptyState message="目前沒有等待 Mark review 的項目。" />
        ) : (
          reviewItems.map((item) => (
            <article className="item" key={`${item.type}-${item.id}`}>
              <div className="item-header">
                <h3>{item.title}</h3>
                <span className="badge review">{item.type}</span>
              </div>
              <p>等待 Mark 確認後才可進入下一步。{formatDate(item.date)}</p>
              {"href" in item && item.href ? (
                <div className="action-row">
                  <Link className="button secondary compact" href={item.href}>
                    查看詳情
                  </Link>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
