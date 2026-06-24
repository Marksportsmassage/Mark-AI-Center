"use client";

import Link from "next/link";
import { useState } from "react";
import { AgentCards, InboxList, ProjectCards, ReviewRequired, TaskDispatchList } from "@/components/Cards";
import { ProtectedPage } from "@/components/ProtectedPage";
import { QuickInput } from "@/components/QuickInput";
import { activeOnly, recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { generateTodayBrief } from "@/lib/reports/dailyBrief";
import type { AiAgent, AiInboxItem, DailyBrief, Project, TaskDispatch } from "@/types/firestore";

function DailyBriefPanel({ briefs, userId }: { briefs: DailyBrief[]; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const latestBrief = briefs[0];

  async function generateBrief() {
    setBusy(true);
    try {
      const result = await generateTodayBrief(getClientDb(), userId);
      setCreatedId(result.briefId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="item-header">
        <h2>Daily Brief</h2>
        <button className="button compact" type="button" disabled={busy} onClick={generateBrief}>
          Generate Today Brief
        </button>
      </div>
      {latestBrief ? (
        <div className="item">
          <div className="item-header">
            <h3>{latestBrief.title}</h3>
            <span className="badge">{latestBrief.status}</span>
          </div>
          <p>{latestBrief.summary}</p>
          <div className="action-row">
            <Link className="button secondary compact" href={`/daily-briefs/${latestBrief.id}`}>查看完整 Brief</Link>
            {createdId ? <Link className="button secondary compact" href={`/daily-briefs/${createdId}`}>查看剛產生的 Brief</Link> : null}
          </div>
        </div>
      ) : (
        <p className="muted">今天尚未產生 Daily Brief。</p>
      )}
    </section>
  );
}

function CommandCenterData({ uid }: { uid: string }) {
  const inbox = useFirestoreCollection<AiInboxItem>("ai_inbox", recent20, true);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const projects = useFirestoreCollection<Project>("projects", activeOnly, true);
  const agents = useFirestoreCollection<AiAgent>("ai_agents", activeOnly, true);
  const briefs = useFirestoreCollection<DailyBrief>("daily_briefs", recent20, true);
  const hasError = inbox.error ?? tasks.error ?? projects.error ?? agents.error ?? briefs.error;
  const isLoading = inbox.isLoading || tasks.isLoading || projects.isLoading || agents.isLoading || briefs.isLoading;

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Command Center</h1>
          <p>Mark 專用 AI 總管：收件、審核、任務指派與專案狀態。</p>
        </div>
        <div className="action-row">
          <Link className="button secondary compact" href="/finance-advisor">Finance Advisor</Link>
          <Link className="button secondary compact" href="/universe">Universe</Link>
          <Link className="button secondary compact" href="/knowledge-sop">Knowledge SOP</Link>
          <Link className="button secondary compact" href="/audit-logs">Audit Logs</Link>
          <Link className="button secondary compact" href="/codex-jobs">Codex Jobs</Link>
        </div>
      </header>

      {hasError ? (
        <section className="panel">
          <h2>Firestore status</h2>
          <p className="muted">{hasError}</p>
        </section>
      ) : null}

      <section className="stats-grid">
        <div className="stat">
          <strong>{inbox.items.length}</strong>
          <span className="muted">Inbox items</span>
        </div>
        <div className="stat">
          <strong>{tasks.items.length}</strong>
          <span className="muted">Task dispatches</span>
        </div>
        <div className="stat">
          <strong>{projects.items.length}</strong>
          <span className="muted">Active projects</span>
        </div>
        <div className="stat">
          <strong>{agents.items.length}</strong>
          <span className="muted">AI agents</span>
        </div>
      </section>

      {isLoading ? <p className="muted">Loading Firestore data...</p> : null}

      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <div className="grid">
          <DailyBriefPanel briefs={briefs.items} userId={uid} />
          <QuickInput userId={uid} />
          <InboxList items={inbox.items} tasks={tasks.items} />
          <TaskDispatchList tasks={tasks.items} userId={uid} />
        </div>
        <div className="grid">
          <ReviewRequired inbox={inbox.items} tasks={tasks.items} projects={projects.items} agents={agents.items} />
          <ProjectCards projects={projects.items} />
          <AgentCards agents={agents.items} />
        </div>
      </div>
    </>
  );
}

export function CommandCenterClient() {
  return <ProtectedPage>{(uid) => <CommandCenterData uid={uid} />}</ProtectedPage>;
}
