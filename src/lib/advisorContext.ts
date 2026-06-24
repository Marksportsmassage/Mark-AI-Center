import { buildReviewQueue, type ReviewQueueItem } from "@/lib/reviewQueue";
import { asArray, displayText } from "@/lib/ui/safe";
import type {
  AccountBalance,
  AdvisorMode,
  CodexJob,
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

export interface AdvisorContextInput {
  financialProfile?: FinancialProfile | null;
  financeSnapshots?: FinanceSnapshot[];
  accountBalances?: AccountBalance[];
  expenseSignals?: ExpenseSignal[];
  financeDecisions?: FinanceDecision[];
  investmentDecisions?: InvestmentDecision[];
  projects?: Project[];
  decisionScenarios?: DecisionScenario[];
  recoveryPlans?: RecoveryPlan[];
  codexJobs?: CodexJob[];
  taskDispatches?: TaskDispatch[];
  decisionReports?: DecisionReport[];
  knowledgeSops?: KnowledgeSop[];
}

export interface AdvisorContext {
  mode: AdvisorMode;
  context_used: string[];
  facts: string[];
  missing_required_fields: string[];
  review_queue: ReviewQueueItem[];
}

function profileMissing(profile: FinancialProfile | null | undefined) {
  if (!profile) return ["financial_profile"];
  return [
    ...asArray<string>(profile.missing_required_fields),
    ...(profile.current_cash_available === null || profile.current_cash_available === undefined ? ["current_cash_available"] : []),
    ...(profile.safety_cash_reserve_target === null || profile.safety_cash_reserve_target === undefined ? ["safety_cash_reserve_target"] : [])
  ];
}

export function buildAdvisorContext(mode: AdvisorMode, input: AdvisorContextInput): AdvisorContext {
  const profile = input.financialProfile ?? null;
  const snapshots = asArray<FinanceSnapshot>(input.financeSnapshots);
  const signals = asArray<ExpenseSignal>(input.expenseSignals);
  const financeDecisions = asArray<FinanceDecision>(input.financeDecisions);
  const investments = asArray<InvestmentDecision>(input.investmentDecisions);
  const projects = asArray<Project>(input.projects);
  const scenarios = asArray<DecisionScenario>(input.decisionScenarios);
  const recoveryPlans = asArray<RecoveryPlan>(input.recoveryPlans);
  const codexJobs = asArray<CodexJob>(input.codexJobs);
  const tasks = asArray<TaskDispatch>(input.taskDispatches);
  const reports = asArray<DecisionReport>(input.decisionReports);
  const sops = asArray<KnowledgeSop>(input.knowledgeSops);
  const reviewQueue = buildReviewQueue({
    finance_decisions: financeDecisions as never[],
    investment_decisions: investments as never[],
    decision_scenarios: scenarios as never[],
    recovery_plans: recoveryPlans as never[],
    codex_jobs: codexJobs as never[],
    task_dispatches: tasks as never[],
    knowledge_sop: sops as never[]
  });
  const baseMissing = profileMissing(profile);

  if (mode === "finance") {
    return {
      mode,
      context_used: ["financial_profile", "finance_snapshots", "expense_signals", "finance_decisions", "investment_decisions", "review_queue"],
      facts: [
        `finance snapshots: ${snapshots.length}`,
        `latest net worth: ${displayText(snapshots[0]?.net_worth, "待補")}`,
        `expense signal: ${displayText(signals[0]?.threshold_status, "unknown")}`,
        `waiting finance decisions: ${financeDecisions.filter((item) => item.status !== "reviewed").length}`
      ],
      missing_required_fields: baseMissing,
      review_queue: reviewQueue
    };
  }

  if (mode === "investment") {
    return {
      mode,
      context_used: ["investment_decisions", "finance_baseline", "cashflow"],
      facts: [
        `investment decisions: ${investments.length}`,
        `cash after reserve: ${displayText(snapshots[0]?.available_cash_after_reserve, "待補")}`,
        `baseline missing: ${baseMissing.length}`
      ],
      missing_required_fields: [...baseMissing, ...investments.flatMap((item) => asArray<string>(item.missing_required_fields))],
      review_queue: reviewQueue
    };
  }

  if (mode === "business") {
    return {
      mode,
      context_used: ["projects", "decision_scenarios", "recovery_plans"],
      facts: [`projects: ${projects.length}`, `decision scenarios: ${scenarios.length}`, `recovery plans: ${recoveryPlans.length}`],
      missing_required_fields: projects.length ? [] : ["business_project_context"],
      review_queue: reviewQueue
    };
  }

  if (mode === "product") {
    return {
      mode,
      context_used: ["codex_jobs", "task_dispatches", "decision_reports", "product_sops"],
      facts: [`codex jobs: ${codexJobs.length}`, `task dispatches: ${tasks.length}`, `decision reports: ${reports.length}`],
      missing_required_fields: tasks.length || codexJobs.length ? [] : ["product_task_context"],
      review_queue: reviewQueue
    };
  }

  if (mode === "client") {
    return { mode, context_used: ["client_notes"], facts: ["client/training notes: waiting for Mark input"], missing_required_fields: ["client_profile", "session_notes"], review_queue: reviewQueue };
  }

  if (mode === "content" || mode === "study") {
    return { mode, context_used: ["knowledge_sop", "content_or_study_notes"], facts: [`knowledge SOPs: ${sops.length}`, "content/study drafts: waiting for Mark input"], missing_required_fields: ["topic", "source_material"], review_queue: reviewQueue };
  }

  return {
    mode,
    context_used: ["review_queue", "task_dispatches", "knowledge_sop"],
    facts: [`review queue: ${reviewQueue.length}`, `tasks: ${tasks.length}`, `SOPs: ${sops.length}`],
    missing_required_fields: [],
    review_queue: reviewQueue
  };
}
