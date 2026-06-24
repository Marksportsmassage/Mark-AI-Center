import type { AiAgent, CodexJob, DecisionReport, FinanceReview, KnowledgeSop, Project, TaskDispatch } from "@/types/firestore";

export interface UniverseInput {
  projects: Project[];
  agents: AiAgent[];
  tasks: TaskDispatch[];
  reports: DecisionReport[];
  financeReviews: FinanceReview[];
  jobs: CodexJob[];
  sops: KnowledgeSop[];
}

function needsReview(task: TaskDispatch) {
  return task.need_mark_review || task.status === "waiting_review" || task.status === "waiting_mark";
}

function isHighRisk(review: FinanceReview) {
  return review.liquidity_risk === "high" || review.recommendation === "reject" || review.recommendation === "delay";
}

export function buildUniverseSummary(input: UniverseInput) {
  const reviewTasks = input.tasks.filter(needsReview);
  const highRiskReviews = input.financeReviews.filter(isHighRisk);
  const financeMissingItems = Array.from(new Set(input.financeReviews.flatMap((review) => review.missing_required_fields ?? []))).slice(0, 8);
  return {
    totalActiveProjects: input.projects.filter((project) => project.status === "active").length,
    activeAgents: input.agents.filter((agent) => agent.status === "active").length,
    waitingReviewTasks: reviewTasks.length,
    decisionReports: input.reports.length,
    financeReviews: input.financeReviews.length,
    codexJobDrafts: input.jobs.filter((job) => job.status === "draft").length,
    activeSops: input.sops.filter((sop) => sop.status === "active").length,
    financeAdvisor: {
      financeReviewCount: input.financeReviews.length,
      waitingMarkInputCount: input.financeReviews.filter((review) => review.status === "waiting_mark_input").length,
      highRiskCount: highRiskReviews.length
    },
    focusRecommendations: {
      reviewNodes: reviewTasks.slice(0, 3).map((task) => ({ id: task.id, title: task.title, href: `/task-dispatches/${task.id}` })),
      highRiskNodes: highRiskReviews.slice(0, 3).map((review) => ({ id: review.id, title: review.title, href: `/finance-reviews/${review.id}` })),
      sopCandidates: input.reports.slice(0, 3).map((report) => report.title),
      financeMissingItems
    }
  };
}

export function projectUniverseStats(input: UniverseInput, projectId: string) {
  const projectTasks = input.tasks.filter((task) => task.project_id === projectId || task.related_project_id === projectId);
  const projectReports = input.reports.filter((report) => report.project_id === projectId);
  const projectReviews = input.financeReviews.filter((review) => review.project_id === projectId);
  const projectJobs = input.jobs.filter((job) => projectTasks.some((task) => task.id === job.source_task_dispatch_id));
  const projectSops = input.sops.filter((sop) => sop.project_id === projectId);
  const latestUpdatedAt = [...projectTasks, ...projectReports, ...projectReviews, ...projectJobs, ...projectSops]
    .map((item) => item.updated_at ?? item.created_at)
    .filter(Boolean)
    .sort()
    .at(-1);
  return {
    taskCount: projectTasks.length,
    waitingReviewCount: projectTasks.filter(needsReview).length,
    needsMoreInfoCount: projectTasks.filter((task) => task.decision_status === "needs_more_info" || task.status === "waiting_mark").length,
    highRiskCount: projectReviews.filter(isHighRisk).length,
    decisionReportCount: projectReports.length,
    financeReviewCount: projectReviews.length,
    codexJobCount: projectJobs.length,
    sopCount: projectSops.length,
    latestUpdatedAt
  };
}
