import type { ReviewQueueItem } from "@/lib/reviewQueue";
import { asArray, displayText } from "@/lib/ui/safe";
import type {
  CreditCardObligation,
  DailyBrief,
  ExpenseSignal,
  FinanceDecision,
  FinanceDecisionReview,
  FinancialProfile,
  InvestmentDecision,
  TaskDispatch,
  CapitalAllocation,
  FinanceReview,
  DecisionReport,
  FinanceSnapshot,
  AccountBalance,
  Liability,
  RecoveryPlan,
  DecisionFollowup,
  AuditLog,
  ClientProfile,
  ClientSession,
  ContentDraft,
  BusinessExperiment,
  ProductFeature,
  CommandBrief
} from "@/types/firestore";

export interface TodayDashboardInput {
  financialProfile?: FinancialProfile | null;
  financeDecisions?: FinanceDecision[];
  financeDecisionReviews?: FinanceDecisionReview[];
  investmentDecisions?: InvestmentDecision[];
  expenseSignals?: ExpenseSignal[];
  creditCardObligations?: CreditCardObligation[];
  reviewQueueItems?: ReviewQueueItem[];
  taskDispatches?: TaskDispatch[];
  capitalAllocations?: CapitalAllocation[];
  financeReviews?: FinanceReview[];
  decisionReports?: DecisionReport[];
  financeSnapshots?: FinanceSnapshot[];
  accountBalances?: AccountBalance[];
  liabilities?: Liability[];
  recoveryPlans?: RecoveryPlan[];
  decisionFollowups?: DecisionFollowup[];
  clientProfiles?: ClientProfile[];
  clientSessions?: ClientSession[];
  contentDrafts?: ContentDraft[];
  businessExperiments?: BusinessExperiment[];
  productFeatures?: ProductFeature[];
  commandBriefs?: CommandBrief[];
  dailyBriefs?: DailyBrief[];
  auditLogs?: AuditLog[];
}

export interface TodayDashboardSummary {
  total_waiting_review: number;
  high_risk_count: number;
  missing_info_count: number;
  financial_profile_complete: boolean;
  expense_signal_status: ExpenseSignal["threshold_status"] | "unknown";
  latest_cfo_brief_at: unknown;
  top_three: string[];
  do_not_do_today: string[];
  no_cost_next_actions: string[];
  finance_radar: {
    total_warning_spending: number;
    total_asset_purchase: number;
    total_investment_related: number;
    total_startup_test: number;
    credit_card_installment_pressure: number;
    triggered_rules: string[];
    safety_cash_missing: boolean;
  };
  investment_reminders: string[];
  recovery_plan_reminders: string[];
  followup_reminders: string[];
  non_finance_reminders: string[];
  command_brain_reminders: string[];
}

function isWaitingStatus(status: unknown) {
  return ["waiting_review", "waiting_mark_input", "waiting_mark", "draft", "pending", "needs_more_info"].includes(String(status ?? ""));
}

function queueTitle(item: ReviewQueueItem) {
  return `${item.title} (${item.group})`;
}

function hasMissingFinancialProfile(profile: FinancialProfile | null | undefined) {
  if (!profile) return true;
  return asArray(profile.missing_required_fields).length > 0 ||
    profile.current_cash_available === null ||
    profile.current_cash_available === undefined ||
    profile.safety_cash_reserve_target === null ||
    profile.safety_cash_reserve_target === undefined;
}

export function buildTodayDashboardSummary(input: TodayDashboardInput): TodayDashboardSummary {
  const profile = input.financialProfile ?? null;
  const queue = asArray<ReviewQueueItem>(input.reviewQueueItems);
  const decisions = asArray<FinanceDecision>(input.financeDecisions);
  const reviews = asArray<FinanceDecisionReview>(input.financeDecisionReviews);
  const investments = asArray<InvestmentDecision>(input.investmentDecisions);
  const signals = asArray<ExpenseSignal>(input.expenseSignals);
  const obligations = asArray<CreditCardObligation>(input.creditCardObligations);
  const recoveryPlans = asArray<RecoveryPlan>(input.recoveryPlans);
  const followups = asArray<DecisionFollowup>(input.decisionFollowups);
  const clients = asArray<ClientProfile>(input.clientProfiles);
  const sessions = asArray<ClientSession>(input.clientSessions);
  const contentDrafts = asArray<ContentDraft>(input.contentDrafts);
  const experiments = asArray<BusinessExperiment>(input.businessExperiments);
  const productFeatures = asArray<ProductFeature>(input.productFeatures);
  const commandBriefs = asArray<CommandBrief>(input.commandBriefs);
  const latestSignal = signals[0] ?? null;
  const latestBrief = asArray<DailyBrief>(input.dailyBriefs).find((brief) => String(brief.title ?? "").includes("CFO Brief")) ?? input.dailyBriefs?.[0] ?? null;
  const financialMissing = hasMissingFinancialProfile(profile);
  const investmentRiskItems = investments.filter((item) =>
    isWaitingStatus(item.status) ||
    item.average_down_allowed === false ||
    item.current_thesis_status === "unknown" ||
    item.current_thesis_status === "invalid" ||
    item.current_price === null ||
    item.cost_basis === null ||
    item.quantity === null ||
    !item.original_thesis
  );
  const missingInfoCount = queue.filter((item) => item.missing_required_fields.length > 0).length +
    decisions.filter((item) => item.status === "waiting_mark_input").length +
    investments.filter((item) => asArray(item.missing_required_fields).length > 0).length +
    (financialMissing ? 1 : 0);
  const highRiskCount = queue.filter((item) => item.risk_priority >= 3).length +
    decisions.filter((item) => item.is_warning_signal || (item.amount ?? 0) >= 30000).length +
    investments.filter((item) => item.current_thesis_status === "invalid" || item.average_down_allowed === false).length +
    (latestSignal && ["warning", "critical"].includes(latestSignal.threshold_status) ? 1 : 0);
  const topQueue = queue
    .slice()
    .sort((a, b) => b.risk_priority - a.risk_priority || b.missing_required_fields.length - a.missing_required_fields.length)
    .slice(0, 3)
    .map(queueTitle);
  const topFallback = [
    ...decisions.filter((item) => isWaitingStatus(item.status)).map((item) => displayText(item.title, "財務決策待審核")),
    ...investmentRiskItems.map((item) => `投資決策：${displayText(item.symbol, "需要補標的")}`),
    ...(latestSignal && latestSignal.threshold_status !== "normal" ? [`Expense signal：${latestSignal.threshold_status}`] : [])
  ].slice(0, 3);
  const creditPressure = obligations.reduce((total, item) => total + (item.monthly_cashflow_impact ?? item.total_statement_amount ?? 0), 0);

  return {
    total_waiting_review: queue.length + reviews.filter((item) => isWaitingStatus(item.status)).length,
    high_risk_count: highRiskCount,
    missing_info_count: missingInfoCount,
    financial_profile_complete: !financialMissing,
    expense_signal_status: latestSignal?.threshold_status ?? "unknown",
    latest_cfo_brief_at: latestBrief?.created_at ?? null,
    top_three: topQueue.length ? topQueue : topFallback,
    do_not_do_today: [
      ...(financialMissing ? ["財務基本資料未完整前，不建議加碼投資"] : []),
      ...(profile?.safety_cash_reserve_target === null || profile?.safety_cash_reserve_target === undefined ? ["安全現金水位未確認前，不建議大額支出"] : []),
      ...(creditPressure > 0 ? ["信用卡 / 分期壓力未確認前，不建議新增分期"] : []),
      ...(investments.some((item) => item.current_thesis_status === "unknown" || item.current_thesis_status === "invalid") ? ["投資標的原始理由 unknown / invalid，不建議攤平"] : []),
      "沒有即時價格資料，不建議直接下買賣結論"
    ],
    no_cost_next_actions: [
      "補財務資料",
      "補投資標的成本 / 現價 / 數量",
      "補信用卡帳單",
      "產生 Finance Decision Review",
      "整理 Audit Logs",
      "建立 SOP Draft",
      "查看 Review Queue"
    ],
    finance_radar: {
      total_warning_spending: latestSignal?.total_warning_spending ?? 0,
      total_asset_purchase: latestSignal?.total_asset_purchase ?? 0,
      total_investment_related: latestSignal?.total_investment_related ?? 0,
      total_startup_test: latestSignal?.total_startup_test ?? 0,
      credit_card_installment_pressure: creditPressure + (latestSignal?.total_installments_monthly ?? 0),
      triggered_rules: asArray<string>(latestSignal?.triggered_rules),
      safety_cash_missing: profile?.safety_cash_reserve_target === null || profile?.safety_cash_reserve_target === undefined || !profile
    },
    investment_reminders: investmentRiskItems.slice(0, 20).map((item) =>
      `${displayText(item.symbol, "需要補標的")}：${displayText(item.current_thesis_status)} / average_down_allowed=${String(item.average_down_allowed)}`
    ),
    recovery_plan_reminders: recoveryPlans.filter((item) => isWaitingStatus(item.status)).slice(0, 5).map((item) => `${item.title}: ${displayText(item.cost_to_recover, "待補成本")}`),
    followup_reminders: followups.filter((item) => item.status === "pending" || item.status === "missed").slice(0, 5).map((item) => `${item.status}: ${item.title} (${item.followup_date})`),
    non_finance_reminders: [
      ...clients.filter((item) => isWaitingStatus(item.status)).map((item) => `客戶草稿：${item.display_name}`),
      ...sessions.filter((item) => isWaitingStatus(item.status)).map((item) => `課表草稿：${item.session_date}`),
      ...contentDrafts.filter((item) => isWaitingStatus(item.status)).map((item) => `內容草稿：${item.title}`),
      ...experiments.filter((item) => isWaitingStatus(item.status)).map((item) => `商業實驗：${item.title}`),
      ...productFeatures.filter((item) => isWaitingStatus(item.status)).map((item) => `產品功能：${item.title}`)
    ].slice(0, 10),
    command_brain_reminders: commandBriefs.filter((item) => isWaitingStatus(item.status)).slice(0, 5).map((item) => `${item.title}: ${item.summary}`)
  };
}

export function todayErrorMessage(errors: Array<string | null | undefined>) {
  const error = errors.find(Boolean);
  return error ? `${error} 若是 Firestore index 缺失，請依 Firebase 提示建立 index；頁面不會執行外部動作。` : null;
}
