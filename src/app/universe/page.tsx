"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { ProtectedPage } from "@/components/ProtectedPage";
import { getClientDb } from "@/lib/firebase/client";
import { buildUniverseSummary, projectUniverseStats, type UniverseInput } from "@/lib/universe";
import { formatDateTime } from "@/lib/ui/format";
import type { AiAgent, CodexJob, DecisionReport, FinanceReview, KnowledgeSop, Project, TaskDispatch } from "@/types/firestore";

const emptyData: UniverseInput = { projects: [], agents: [], tasks: [], reports: [], financeReviews: [], jobs: [], sops: [] };

function statusClass(waiting: number, needsInfo: number, highRisk: number) {
  if (highRisk > 0) return "risk";
  if (waiting > 0) return "review";
  if (needsInfo > 0) return "needs-info";
  return "neutral";
}

function Universe() {
  const [data, setData] = useState<UniverseInput>(emptyData);
  const [latestBriefId, setLatestBriefId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    setError(null);
    try {
      const db = getClientDb();
      const [projects, agents, tasks, reports, financeReviews, jobs, sops, briefs] = await Promise.all([
        getDocs(query(collection(db, "projects"), limit(100))),
        getDocs(query(collection(db, "ai_agents"), limit(100))),
        getDocs(query(collection(db, "task_dispatches"), limit(150))),
        getDocs(query(collection(db, "decision_reports"), limit(100))),
        getDocs(query(collection(db, "finance_reviews"), limit(100))),
        getDocs(query(collection(db, "codex_jobs"), limit(100))),
        getDocs(query(collection(db, "knowledge_sop"), limit(150))),
        getDocs(query(collection(db, "daily_briefs"), orderBy("created_at", "desc"), limit(1)))
      ]);
      setData({
        projects: projects.docs.map((item) => ({ id: item.id, ...item.data() }) as Project),
        agents: agents.docs.map((item) => ({ id: item.id, ...item.data() }) as AiAgent),
        tasks: tasks.docs.map((item) => ({ id: item.id, ...item.data() }) as TaskDispatch),
        reports: reports.docs.map((item) => ({ id: item.id, ...item.data() }) as DecisionReport),
        financeReviews: financeReviews.docs.map((item) => ({ id: item.id, ...item.data() }) as FinanceReview),
        jobs: jobs.docs.map((item) => ({ id: item.id, ...item.data() }) as CodexJob),
        sops: sops.docs.map((item) => ({ id: item.id, ...item.data() }) as KnowledgeSop)
      });
      setLatestBriefId(briefs.docs[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load universe data.");
    }
  }
  useEffect(() => { void load(); }, []);
  const summary = useMemo(() => buildUniverseSummary(data), [data]);
  const coreNodes = [
    ["Finance Advisor", "/finance-advisor", `${summary.financeAdvisor.financeReviewCount} reviews / ${summary.financeAdvisor.waitingMarkInputCount} input / ${summary.financeAdvisor.highRiskCount} high risk`],
    ["Capital Allocation", "/finance-advisor", "cash reserve first"],
    ["Finance Risk", "/finance-advisor", "CFO guardrail"],
    ["AI Inbox", "/command-center", `${data.tasks.length} routed tasks`],
    ["Task Dispatch", "/command-center", `${data.tasks.length} tasks`],
    ["Daily Brief", latestBriefId ? `/daily-briefs/${latestBriefId}` : "/command-center", latestBriefId ? "latest brief" : "generate today"],
    ["Decision Reports", "/command-center", `${data.reports.length} reports`],
    ["Knowledge SOP", "/knowledge-sop", `${data.sops.length} SOPs`],
    ["Codex Jobs", "/codex-jobs", `${summary.codexJobDrafts} drafts`],
    ["Audit Logs", "/audit-logs", "viewer"],
    ["Startup Radar", "/command-center?project_id=startup_radar", "startup watch"]
  ];
  return <div className="grid"><header className="page-header"><div><h1>Mark AI Universe Map</h1><p>Read-only universe graph. Finance / Capital is in the core ring before startup execution.</p></div><div className="action-row"><button className="button secondary compact" onClick={load}>Refresh</button><Link className="button secondary compact" href="/command-center">Command Center</Link></div></header>{error ? <section className="panel"><h2>Universe load error</h2><p className="muted">{error}</p></section> : null}<section className="panel"><h2>Summary cards</h2><div className="stat-grid"><div className="stat-card"><strong>Total active projects</strong><span>{summary.totalActiveProjects}</span></div><div className="stat-card"><strong>Active agents</strong><span>{summary.activeAgents}</span></div><div className="stat-card"><strong>Waiting review tasks</strong><span>{summary.waitingReviewTasks}</span></div><div className="stat-card"><strong>Decision reports</strong><span>{summary.decisionReports}</span></div><div className="stat-card"><strong>Finance reviews</strong><span>{summary.financeReviews}</span></div><div className="stat-card"><strong>Codex job drafts</strong><span>{summary.codexJobDrafts}</span></div><div className="stat-card"><strong>Active SOPs</strong><span>{summary.activeSops}</span></div></div></section><section className="panel"><h2>Universe Map</h2><div className="universe"><Link className="node center" href="/command-center">Mark AI Command Center</Link>{coreNodes.map(([name, href, meta]) => <Link key={name} className="node core" href={href}>{name}<small>{meta}</small></Link>)}</div></section><section className="panel"><h2>Project nodes</h2><div className="list">{data.projects.length === 0 ? <p className="muted">No project nodes found. Run seed or check Firestore permissions.</p> : null}{data.projects.map((project) => { const stats = projectUniverseStats(data, project.id); return <Link className={`item node-card ${statusClass(stats.waitingReviewCount, stats.needsMoreInfoCount, stats.highRiskCount)}`} href={`/command-center?project_id=${project.id}`} key={project.id}><div className="item-header"><h3>{project.name}</h3><span className="badge">{project.category}</span></div><p>tasks {stats.taskCount} · waiting {stats.waitingReviewCount} · reports {stats.decisionReportCount} · finance {stats.financeReviewCount} · codex {stats.codexJobCount} · SOP {stats.sopCount}</p><p className="muted">最近更新：{formatDateTime(stats.latestUpdatedAt)}</p></Link>; })}</div></section><section className="panel"><h2>Agent nodes</h2><div className="list">{data.agents.length === 0 ? <p className="muted">No agent nodes found. Run seed or check Firestore permissions.</p> : null}{data.agents.map((agent) => <Link className="item node-card neutral" href="/agents" key={agent.id}><div className="item-header"><h3>{agent.name}</h3><span className="badge">{agent.role}</span></div><p>assigned {data.tasks.filter((task) => task.agent_ids?.includes(agent.id)).length} · default projects {agent.default_projects?.join(", ") || "None"}</p></Link>)}</div></section><section className="panel"><h2>Focus recommendations</h2><div className="detail-grid"><div><strong>今日最需要 Mark Review 的 3 個節點</strong><ul>{summary.focusRecommendations.reviewNodes.map((node) => <li key={node.id}><Link href={node.href}>{node.title}</Link></li>)}</ul></div><div><strong>最高風險節點</strong><ul>{summary.focusRecommendations.highRiskNodes.map((node) => <li key={node.id}><Link href={node.href}>{node.title}</Link></li>)}</ul></div><div><strong>最該整理成 SOP</strong><ul>{summary.focusRecommendations.sopCandidates.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>財務資料待補項目</strong><ul>{(summary.focusRecommendations.financeMissingItems.length ? summary.focusRecommendations.financeMissingItems : ["目前可動用現金", "每月生活費", "安全現金水位目標"]).map((item) => <li key={item}>{item}</li>)}</ul></div></div></section><section className="panel"><h2>Legend</h2><div className="badge-row"><span className="badge review">Review required</span><span className="badge needs-info">Needs info</span><span className="badge urgent">Risk</span><span className="badge">Done</span><span className="badge">Neutral</span></div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{() => <Universe />}</ProtectedPage>;
}
