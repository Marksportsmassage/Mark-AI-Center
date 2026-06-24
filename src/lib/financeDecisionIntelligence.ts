import {
  addDoc,
  collection,
  doc,
  type Firestore,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import type {
  CreditCardObligation,
  ExpenseSignal,
  FinanceDecision,
  FinanceDecisionRecommendation,
  FinanceDecisionReview,
  FinanceDecisionStatus,
  FinanceDecisionType,
  InvestmentDecision,
  FinancialProfile,
  RiskLevel
} from "@/types/firestore";

export const FINANCE_DECISION_KEYWORDS = [
  "我花了",
  "我買了",
  "信用卡",
  "分期",
  "Line Pay",
  "line pay",
  "股票",
  "加碼",
  "減碼",
  "停損",
  "停利",
  "投資",
  "想買",
  "要不要買",
  "要不要賣"
];

const investmentKeywords = ["股票", "投資", "加碼", "減碼", "停損", "停利", "要不要買", "要不要賣", "ETF", "etf"];
const assetKeywords = ["設備", "電腦", "鏡頭", "相機", "器材", "課程", "資產", "工作室"];
const startupKeywords = ["創業", "測試", "進貨", "廣告", "開店", "副業", "選品", "一番賞", "飲料店", "App", "app"];
const warningKeywords = ["警訊", "衝動", "爆買", "超支", "壓力", "不該", "太貴", "Line Pay", "line pay"];

export function isFinanceDecisionInput(rawText: string) {
  return FINANCE_DECISION_KEYWORDS.some((keyword) => rawText.includes(keyword));
}

export function shouldRouteOnlyToFinanceDecision(rawText: string) {
  return ["我花了", "我買了", "信用卡", "分期", "Line Pay", "line pay", "加碼", "減碼", "停損", "停利", "要不要買", "要不要賣"].some((keyword) => rawText.includes(keyword));
}

function extractAmount(rawInput: string) {
  const normalized = rawInput.replace(/,/g, "");
  const match = normalized.match(/(?:NT\$|TWD|台幣|新台幣|金額)?\s*(\d+(?:\.\d+)?)(?:\s*(萬|千|元|塊))?/i);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  if (match[2] === "萬") return base * 10000;
  if (match[2] === "千") return base * 1000;
  return base;
}

function guessSymbol(rawInput: string) {
  const upper = rawInput.match(/\b[A-Z]{1,5}\b/);
  if (upper) return upper[0];
  const taiwan = rawInput.match(/\b\d{4}\b/);
  return taiwan?.[0] ?? null;
}

export function classifyFinanceDecision(rawInput: string): {
  decisionType: FinanceDecisionType;
  reason: string;
  missingRequiredFields: string[];
} {
  const text = rawInput.trim();
  if (investmentKeywords.some((keyword) => text.includes(keyword))) {
    return {
      decisionType: text.includes("股票") || text.includes("加碼") || text.includes("減碼") || text.includes("停損") || text.includes("停利") ? "stock_trade" : "investment",
      reason: "輸入包含股票 / 投資 / 加減碼 / 停利停損語意，先建立投資決策草稿，不做買賣判斷。",
      missingRequiredFields: ["標的", "成本", "目前價格", "數量", "持有時間", "原始買進理由", "短線 / 長線定位", "可投入資金"]
    };
  }
  if (text.includes("信用卡")) return { decisionType: "credit_card_payment", reason: "輸入包含信用卡帳單或繳款語意，視為負債/現金流義務，不重複當成新消費。", missingRequiredFields: ["卡別", "帳單月份", "應繳金額", "最低應繳", "到期日", "已繳金額"] };
  if (text.includes("分期")) return { decisionType: "installment", reason: "輸入包含分期，視為每月現金流壓力。", missingRequiredFields: ["分期項目", "每月金額", "剩餘期數", "總金額"] };
  if (startupKeywords.some((keyword) => text.includes(keyword))) return { decisionType: "startup_test", reason: "輸入包含創業/測試/進貨/廣告語意，需確認小額測試、ROI 與停損線。", missingRequiredFields: ["測試預算", "回本方式", "停損線", "預期回收期"] };
  if (assetKeywords.some((keyword) => text.includes(keyword))) return { decisionType: "asset_purchase", reason: "輸入包含設備/課程/資產語意，需評估是否轉為產能、收入或成本節省。", missingRequiredFields: ["用途", "回收方式", "替代方案", "可延後性"] };
  if (warningKeywords.some((keyword) => text.includes(keyword))) return { decisionType: "warning_spending", reason: "Mark 標記為警訊或語意包含衝動/超支，需先 review。", missingRequiredFields: ["消費原因", "是否可退", "是否影響本月現金流"] };
  if (text.includes("現金流") || text.includes("繳費")) return { decisionType: "cashflow_pressure", reason: "輸入與繳費/現金流壓力有關。", missingRequiredFields: ["到期日", "必要金額", "可用現金"] };
  if (!text) return { decisionType: "unknown", reason: "沒有可判斷內容。", missingRequiredFields: ["原始輸入"] };
  return { decisionType: "general_consumption", reason: "未命中特殊投資/資產/負債規則，先視為一般消費草稿等待 Mark review。", missingRequiredFields: ["金額", "用途", "是否必要"] };
}

export function buildFinanceDecisionDraft(rawInput: string, userId: string, source: FinanceDecision["source"] = "manual"): Omit<FinanceDecision, "id" | "created_at" | "updated_at"> {
  const classification = classifyFinanceDecision(rawInput);
  const amount = extractAmount(rawInput);
  const decisionType = classification.decisionType;
  const isInvestment = decisionType === "investment" || decisionType === "stock_trade";
  const isAsset = decisionType === "asset_purchase";
  const isWarning = decisionType === "warning_spending" || (amount !== null && amount >= 10000);
  return {
    user_id: userId,
    source,
    raw_input: rawInput,
    title: rawInput.trim().slice(0, 48) || "重大財務決策草稿",
    amount,
    currency: "TWD",
    occurred_at: null,
    decision_stage: rawInput.includes("已") || rawInput.includes("買了") || rawInput.includes("花了") ? "executed" : "considering",
    decision_type: decisionType,
    category: isInvestment ? "investment" : isAsset ? "asset" : decisionType === "credit_card_payment" ? "debt" : "spending",
    subcategory: null,
    is_asset_purchase: isAsset,
    is_investment: isInvestment,
    is_warning_signal: isWarning,
    is_recurring: decisionType === "installment",
    related_project_id: decisionType === "startup_test" ? "startup_radar" : null,
    related_stock_symbol: isInvestment ? guessSymbol(rawInput) : null,
    related_account: rawInput.includes("信用卡") ? "credit_card" : null,
    payment_method: rawInput.includes("Line Pay") || rawInput.includes("line pay") ? "Line Pay" : rawInput.includes("信用卡") ? "credit_card" : null,
    notes: classification.reason,
    need_mark_review: true,
    external_action_allowed: false,
    status: classification.missingRequiredFields.length ? "waiting_mark_input" : "waiting_review"
  };
}

export function buildFinanceDecisionReviewDraft(decision: FinanceDecision): Omit<FinanceDecisionReview, "id" | "created_at" | "updated_at"> {
  const classification = classifyFinanceDecision(decision.raw_input);
  const missing = [...classification.missingRequiredFields];
  if (decision.amount === null) missing.unshift("金額");
  const highAmount = (decision.amount ?? 0) >= 30000;
  const riskLevel: RiskLevel = decision.decision_type === "credit_card_payment" || highAmount ? "high" : decision.is_warning_signal ? "medium" : "unknown";
  const recommendation: FinanceDecisionRecommendation =
    missing.length > 0 ? "needs_more_info" :
    decision.decision_type === "warning_spending" ? "delay" :
    decision.decision_type === "asset_purchase" ? "small_test" :
    decision.decision_type === "stock_trade" ? "hold" :
    "reduce_amount";
  return {
    finance_decision_id: decision.id,
    user_id: decision.user_id,
    title: `Finance Decision Review - ${decision.title}`,
    summary: "重大財務決策分析草稿。只做決策輔助，不付款、不下單、不交易。",
    classification_reason: classification.reason,
    usability_assessment: "先確認是否壓到安全現金水位、生活費、固定支出、信用卡繳款與分期義務，再決定可否執行。",
    cashflow_impact: decision.amount === null ? "需要 Mark 補金額後才能判斷現金流壓力。" : `此決策會佔用約 ${decision.amount} TWD，需要對照安全現金水位與本月固定支出。`,
    risk_level: riskLevel,
    affects_safety_reserve: highAmount || decision.decision_type === "cashflow_pressure",
    affects_monthly_fixed_cost: decision.decision_type === "installment" || decision.decision_type === "credit_card_payment",
    recovery_methods: ["接案或新客戶收入抵銷", "內容化成素材 / 課程 / 案例", "轉售或折舊控管", "降低未來成本或提升產能"],
    offset_methods: ["縮小金額", "延後購買", "小額測試", "用既有資源替代", "分批投入但不壓安全現金"],
    breakeven_plan: ["先定義回收目標金額", "列出可產生收入的下一步", "設定 30/60/90 天檢查點"],
    stop_loss_conditions: ["影響安全現金水位", "30-90 天內沒有可驗證回收", "需要追加金額但原假設未被證實", "Mark 未 review 不得加碼"],
    next_actions: missing.length ? missing.map((field) => `請 Mark 補：${field}`) : ["Mark review 決策草稿", "確認回本方式與停損線", "若執行，30 天後回顧"],
    recommendation,
    missing_required_fields: Array.from(new Set(missing)),
    need_mark_review: true,
    external_action_allowed: false,
    status: missing.length ? "waiting_mark_input" : "waiting_review"
  };
}

export function buildInvestmentDecisionDraft(rawInput: string, userId: string): Omit<InvestmentDecision, "id" | "created_at" | "updated_at"> {
  const symbol = guessSymbol(rawInput);
  const thesisInvalid = rawInput.includes("理由不成立") || rawInput.includes("跌破") || rawInput.includes("基本面變差");
  const thesisValid = rawInput.includes("原始理由仍成立") || rawInput.includes("理由仍成立") || rawInput.includes("基本面仍成立");
  const missing = ["成本", "目前價格", "數量", "持有時間", "原本買進理由", "短線 / 長線定位", "可投入資金"];
  if (!symbol) missing.unshift("標的");
  return {
    user_id: userId,
    asset_type: rawInput.includes("ETF") || rawInput.includes("etf") ? "etf" : "stock",
    symbol,
    market: null,
    position_type: rawInput.includes("加碼") ? "add" : rawInput.includes("減碼") ? "reduce" : rawInput.includes("賣") ? "sell" : rawInput.includes("買") ? "new_buy" : "review",
    cost_basis: null,
    current_price: null,
    quantity: null,
    market_value: null,
    unrealized_pnl: null,
    original_thesis: null,
    current_thesis_status: thesisInvalid ? "invalid" : thesisValid ? "valid" : "unknown",
    time_horizon: rawInput.includes("長線") ? "long" : rawInput.includes("短線") ? "short" : "medium",
    buy_conditions: ["補齊目前價格、持倉比例、可投入資金後再判斷", "不得影響安全現金水位"],
    add_conditions: thesisValid ? ["原始理由仍成立", "持倉比例未超過上限", "有第二停損線", "不壓到生活費與安全現金"] : [],
    reduce_conditions: ["原始理由變弱", "持倉比例過高", "需要保護安全現金水位"],
    take_profit_conditions: ["達到原先目標價或風險報酬不再划算", "需要降低集中度"],
    stop_loss_conditions: ["原始理由失效", "跌破第二停損線", "影響安全現金水位"],
    average_down_allowed: thesisValid,
    average_down_conditions: thesisValid ? ["只能條件式攤平", "原始理由仍成立", "不得壓安全現金水位", "先設定第二停損線"] : ["原始理由 unknown 或 invalid，不可攤平", "沒有安全現金水位前不可建議加碼", "需要補第二停損線"],
    max_position_limit: "需要 Mark 補持倉比例上限",
    cashflow_impact: "不抓即時股價；需 Mark 補目前價格、成本、數量與可投入資金。",
    missing_required_fields: Array.from(new Set(missing)),
    need_mark_review: true,
    external_action_allowed: false,
    status: "waiting_mark_input"
  };
}

export function buildExpenseSignalSnapshot(decisions: FinanceDecision[], userId: string, monthKey: string): Omit<ExpenseSignal, "id" | "created_at" | "updated_at"> {
  const sum = (types: FinanceDecisionType[]) => decisions.filter((item) => types.includes(item.decision_type)).reduce((total, item) => total + (item.amount ?? 0), 0);
  const warningItems = decisions.filter((item) => item.is_warning_signal).map((item) => item.title);
  const totalWarning = sum(["warning_spending"]);
  const triggeredRules = [
    ...(warningItems.length ? ["本月存在警訊支出"] : []),
    ...(sum(["installment"]) > 0 ? ["分期會形成每月現金流壓力"] : []),
    ...(sum(["credit_card_payment"]) > 0 ? ["信用卡帳單是負債償還，不應重複當成新消費"] : [])
  ];
  const threshold = totalWarning >= 30000 || warningItems.length >= 3 ? "critical" : totalWarning >= 10000 ? "warning" : warningItems.length ? "watch" : "normal";
  return {
    user_id: userId,
    month_key: monthKey,
    total_warning_spending: totalWarning,
    total_asset_purchase: sum(["asset_purchase"]),
    total_investment_related: sum(["investment", "stock_trade"]),
    total_startup_test: sum(["startup_test"]),
    total_credit_card_payment: sum(["credit_card_payment"]),
    total_installments_monthly: sum(["installment"]),
    warning_items: warningItems,
    risk_summary: triggeredRules.length ? triggeredRules.join("；") : "目前沒有重大警訊累積。",
    threshold_status: threshold,
    triggered_rules: triggeredRules,
    need_mark_review: true
  };
}

export function evaluateExpenseThreshold(input: {
  decisions: FinanceDecision[];
  obligations?: CreditCardObligation[];
  profile?: FinancialProfile | null;
}) {
  const decisions = input.decisions;
  const obligations = input.obligations ?? [];
  const profile = input.profile ?? null;
  const warningSpending = decisions.filter((item) => item.decision_type === "warning_spending").reduce((total, item) => total + (item.amount ?? 0), 0);
  const assetPurchase = decisions.filter((item) => item.decision_type === "asset_purchase").reduce((total, item) => total + (item.amount ?? 0), 0);
  const investmentRelated = decisions.filter((item) => item.is_investment).reduce((total, item) => total + (item.amount ?? 0), 0);
  const startupTest = decisions.filter((item) => item.decision_type === "startup_test").reduce((total, item) => total + (item.amount ?? 0), 0);
  const creditCardPressure = obligations.reduce((total, item) => total + (item.monthly_cashflow_impact ?? item.total_statement_amount ?? 0), 0);
  const deployable = profile?.current_cash_available !== null && profile?.current_cash_available !== undefined && profile?.safety_cash_reserve_target !== null && profile?.safety_cash_reserve_target !== undefined
    ? Math.max(0, profile.current_cash_available - profile.safety_cash_reserve_target)
    : null;
  const missing = profile ? [] : ["需要補財務基本資料"];
  const triggered: string[] = [];
  let threshold: ExpenseSignal["threshold_status"] = profile ? "normal" : "watch";
  if (!profile) triggered.push("尚未建立 financial_profile，先補財務基本資料");
  if (deployable !== null && warningSpending > deployable * 0.35) {
    threshold = "warning";
    triggered.push("警訊支出超過可投入資金 35%");
  }
  if (creditCardPressure > 0 && profile?.monthly_income_estimate && creditCardPressure > profile.monthly_income_estimate * 0.35) {
    threshold = "warning";
    triggered.push("信用卡 / 分期月壓力偏高");
  }
  if (profile?.current_cash_available !== null && profile?.current_cash_available !== undefined && profile?.safety_cash_reserve_target !== null && profile?.safety_cash_reserve_target !== undefined) {
    const majorOutflow = warningSpending + creditCardPressure + startupTest;
    if (profile.current_cash_available - majorOutflow < profile.safety_cash_reserve_target) {
      threshold = "critical";
      triggered.push("支出可能影響安全現金水位");
    }
  }
  if ((assetPurchase > 0 || investmentRelated > 0) && deployable !== null && assetPurchase + investmentRelated > deployable * 0.5) {
    threshold = threshold === "critical" ? "critical" : "warning";
    triggered.push("資產 / 投資型支出需要檢查現金流承受度");
  }
  return {
    threshold_status: threshold,
    triggered_rules: triggered,
    missing_required_fields: missing,
    next_actions: triggered.length ? ["先補財務基本資料", "不要今天加碼", "到 Review Queue 審核高風險項目"] : ["維持記錄，僅 review 重大項目"],
    totals: { warningSpending, assetPurchase, investmentRelated, startupTest, creditCardPressure }
  };
}

export async function createFinanceDecisionDraft(db: Firestore, userId: string, rawInput: string, source: FinanceDecision["source"] = "manual") {
  const draft = buildFinanceDecisionDraft(rawInput, userId, source);
  const ref = await addDoc(collection(db, "finance_decisions"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "finance_decision.create",
    target_collection: "finance_decisions",
    target_id: ref.id,
    before: null,
    after: { decision_type: draft.decision_type, status: draft.status, external_action_allowed: false },
    reason: "Created Finance Decision Intelligence draft. No payment, order, trade, transfer, or external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { financeDecisionId: ref.id, decision: { id: ref.id, ...draft } as FinanceDecision };
}

export async function generateFinanceDecisionReview(db: Firestore, decisionId: string, userId: string) {
  const snap = await getDoc(doc(db, "finance_decisions", decisionId));
  if (!snap.exists()) throw new Error("Finance decision not found.");
  const decision = { id: snap.id, ...snap.data() } as FinanceDecision;
  const draft = buildFinanceDecisionReviewDraft(decision);
  const ref = await addDoc(collection(db, "finance_decision_reviews"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "finance_decision.review",
    target_collection: "finance_decision_reviews",
    target_id: ref.id,
    before: null,
    after: { finance_decision_id: decisionId, recommendation: draft.recommendation, external_action_allowed: false },
    reason: "Generated Finance Decision review draft. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { reviewId: ref.id };
}

export async function reviewFinanceDecision(db: Firestore, decisionId: string, action: "mark_reviewed" | "need_more_info" | "archive", userId: string) {
  const status: FinanceDecisionStatus = action === "mark_reviewed" ? "reviewed" : action === "need_more_info" ? "waiting_mark_input" : "archived";
  const ref = doc(db, "finance_decisions", decisionId);
  const beforeSnap = await getDoc(ref);
  const before = beforeSnap.exists() ? beforeSnap.data() : null;
  await updateDoc(ref, { status, need_mark_review: true, external_action_allowed: false, updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `finance_decision.${action}`,
    target_collection: "finance_decisions",
    target_id: decisionId,
    before,
    after: { status, external_action_allowed: false },
    reason: "Finance decision review action. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

export async function createInvestmentDecisionDraft(db: Firestore, userId: string, rawInput: string) {
  const draft = buildInvestmentDecisionDraft(rawInput, userId);
  const ref = await addDoc(collection(db, "investment_decisions"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "investment_decision.create",
    target_collection: "investment_decisions",
    target_id: ref.id,
    before: null,
    after: { symbol: draft.symbol, status: draft.status, external_action_allowed: false },
    reason: "Created investment decision draft. No market data fetch or trade executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { investmentDecisionId: ref.id };
}

export async function reviewInvestmentDecision(db: Firestore, id: string, action: "mark_reviewed" | "need_more_info" | "archive", userId: string) {
  const status: FinanceDecisionStatus = action === "mark_reviewed" ? "reviewed" : action === "need_more_info" ? "waiting_mark_input" : "archived";
  const ref = doc(db, "investment_decisions", id);
  const beforeSnap = await getDoc(ref);
  await updateDoc(ref, { status, need_mark_review: true, external_action_allowed: false, updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: `investment_decision.${action}`,
    target_collection: "investment_decisions",
    target_id: id,
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: { status, external_action_allowed: false },
    reason: "Investment decision review action. No trade executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

export function buildCreditCardObligationDraft(userId: string, rawInput: string): Omit<CreditCardObligation, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    card_name: "需要 Mark 補卡別",
    billing_month: new Date().toISOString().slice(0, 7),
    total_statement_amount: extractAmount(rawInput),
    minimum_payment: null,
    due_date: null,
    paid_amount: null,
    payment_status: "waiting_mark_input",
    installment_items: [],
    recurring_charges: [],
    risk_notes: ["信用卡帳單是負債償還，不重複列為新消費", "需確認到期日與最低應繳"],
    monthly_cashflow_impact: extractAmount(rawInput),
    need_mark_review: true,
    status: "waiting_mark_input"
  };
}
