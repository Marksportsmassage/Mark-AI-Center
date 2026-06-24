import { asArray, displayText } from "@/lib/ui/safe";
import type { AccountBalance, CreditCardObligation, DecisionFollowup, FinanceSnapshot, FinancialProfile, InvestmentDecision, Liability, RecoveryPlan } from "@/types/firestore";

export const PRODUCTION_URL = "https://mark-ai-center--mark-ai-center.asia-east1.hosted.app";

export const RELEASE_NOTES = [
  "Phase 8A：Unified Intake + Review Queue",
  "Phase 8B：CFO Operating Loop v1",
  "Phase 8C：Today Operating Dashboard + CFO Brief",
  "Phase 9：Finance Baseline Engine",
  "Phase 10：Decision Simulator / Capital Plan / Recovery Plans",
  "Phase 11：Weekly Review / Monthly Close / Decision Followups",
  "Phase 12：Production Governance / Data Quality / Release Notes",
  "Phase 13：AI Advisor Chat / 對話顧問層",
  "Phase 14：Non-Finance Operating Branches / 客戶、內容、商業、產品",
  "Phase 15：Cross-Branch Command Brain / 跨分支總管能力",
  "Phase 16：Start Here / Safety Center / Final Operating Guide"
];

export const SAFETY_NOTES = [
  "functions 未部署，除非 Mark 另行批准。",
  "LINE reply / push disabled。",
  "投資只建立 review-gated 草稿，不自動交易、不自動下單。",
  "客戶 / 課表紀錄不是醫療診斷，不自動傳訊息給客戶。",
  "內容草稿不自動發布。",
  "不自動付款、不自動轉帳、不聯絡供應商。",
  "不假裝有即時股價，不保證投資獲利。",
  "所有新決策輸出預設 need_mark_review=true 且 external_action_allowed=false。"
];

const publicEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID"
] as const;

export function publicEnvPresence(env: Record<string, string | undefined>) {
  return publicEnvKeys.map((key) => ({ key, status: env[key] ? "present" : "missing" }));
}

export function safetyChecklist() {
  return {
    functions_deployed: false,
    line_reply_push_enabled: false,
    external_action_allowed: false,
    secrets_displayed: false,
    auto_trade_enabled: false,
    auto_payment_enabled: false
  };
}

export function buildCollectionStatus(collections: Record<string, { count?: number; error?: string | null; isLoading?: boolean }>) {
  return Object.entries(collections).map(([name, state]) => ({
    name,
    count: state.count ?? 0,
    status: state.error ? "error" : state.isLoading ? "loading" : "ok",
    message: state.error ?? null
  }));
}

export interface DataQualityInput {
  financialProfile?: FinancialProfile | null;
  financeSnapshots?: FinanceSnapshot[];
  accountBalances?: AccountBalance[];
  liabilities?: Liability[];
  investmentDecisions?: InvestmentDecision[];
  creditCards?: CreditCardObligation[];
  recoveryPlans?: RecoveryPlan[];
  followups?: DecisionFollowup[];
}

export function buildDataQualityReport(input: DataQualityInput) {
  const profile = input.financialProfile ?? null;
  const snapshots = asArray<FinanceSnapshot>(input.financeSnapshots);
  const accounts = asArray<AccountBalance>(input.accountBalances);
  const liabilities = asArray<Liability>(input.liabilities);
  const investments = asArray<InvestmentDecision>(input.investmentDecisions);
  const cards = asArray<CreditCardObligation>(input.creditCards);
  const recoveryPlans = asArray<RecoveryPlan>(input.recoveryPlans);
  const followups = asArray<DecisionFollowup>(input.followups);

  const missingFinancialBaseline = [
    ...(!profile ? ["財務基本資料"] : []),
    ...(profile && (profile.safety_cash_reserve_target === null || profile.safety_cash_reserve_target === undefined) ? ["安全現金水位"] : []),
    ...(snapshots.length === 0 ? ["finance_snapshot"] : []),
    ...(accounts.length === 0 ? ["account_balances"] : []),
    ...(snapshots[0] ? asArray<string>(snapshots[0].missing_required_fields) : [])
  ];

  const missingInvestmentFields = investments.flatMap((item) => {
    const missing = [
      ...(item.cost_basis === null || item.cost_basis === undefined ? ["成本"] : []),
      ...(item.current_price === null || item.current_price === undefined ? ["現價"] : []),
      ...(item.quantity === null || item.quantity === undefined ? ["數量"] : []),
      ...asArray<string>(item.missing_required_fields)
    ];
    return missing.length ? [`${displayText(item.symbol, item.id)}：${Array.from(new Set(missing)).join("、")}`] : [];
  });

  const missingCreditCardFields = cards.flatMap((item) => [
    ...(item.total_statement_amount === null || item.total_statement_amount === undefined ? [`${item.card_name}：信用卡帳單金額`] : []),
    ...(item.due_date ? [] : [`${item.card_name}：繳款期限`]),
    ...asArray<Record<string, unknown>>(item.installment_items).flatMap((installment, index) => installment.remaining_terms ? [] : [`${item.card_name} 分期 ${index + 1}：剩餘期數`])
  ]);

  const missingLiabilityFields = liabilities.flatMap((item) => [
    ...(item.current_balance === null || item.current_balance === undefined ? [`${item.lender_name}：負債餘額`] : []),
    ...(item.monthly_payment === null || item.monthly_payment === undefined ? [`${item.lender_name}：每月付款`] : []),
    ...(item.liability_type === "installment" && (item.remaining_terms === null || item.remaining_terms === undefined) ? [`${item.lender_name}：分期剩餘期數`] : [])
  ]);

  const missingRecoveryPlans = [
    ...(recoveryPlans.length === 0 ? ["尚未建立回本 / recovery plans"] : []),
    ...recoveryPlans.filter((item) => item.cost_to_recover === null || item.cost_to_recover === undefined).map((item) => `${item.title}：待補回收成本`)
  ];

  const openFollowups = followups.filter((item) => item.status === "pending" || item.status === "missed").map((item) => `${item.title}：${item.status}`);
  const allMissing = [...missingFinancialBaseline, ...missingInvestmentFields, ...missingCreditCardFields, ...missingLiabilityFields, ...missingRecoveryPlans];

  return {
    missingFinancialBaseline: Array.from(new Set(missingFinancialBaseline)),
    missingInvestmentFields,
    missingCreditCardFields,
    missingLiabilityFields,
    missingRecoveryPlans,
    openFollowups,
    score: Math.max(0, 100 - allMissing.length * 8),
    status: allMissing.length === 0 ? "complete" : allMissing.length > 8 ? "needs_attention" : "watch"
  };
}
