import {
  addDoc,
  collection,
  doc,
  type Firestore,
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { ensureFinancialProfileDraft, MARK_FINANCE_INPUTS } from "@/lib/finance";
import { createFinanceBaselineDraft } from "@/lib/financeBaseline";
import {
  buildCreditCardObligationDraft,
  buildFinanceDecisionDraft,
  buildFinanceDecisionReviewDraft,
  buildExpenseSignalSnapshot,
  buildInvestmentDecisionDraft
} from "@/lib/financeDecisionIntelligence";
import type { CreditCardObligation, FinanceDecision, InvestmentDecision } from "@/types/firestore";

export type IntakeKind = "financial_snapshot" | "spending" | "investment" | "project_decision";

export interface IntakeResult {
  kind: string;
  collection: string;
  id: string;
  href: string;
  next_actions: string[];
}

export interface IntakeOptions {
  autoReview?: boolean;
  monthKey?: string | null;
  notes?: string | null;
}

function parseAmount(text: string, label?: string) {
  const normalized = text.replace(/,/g, "");
  const source = label ? normalized.match(new RegExp(`${label}[^0-9]*(\\d+(?:\\.\\d+)?)(?:\\s*(萬|千|元|塊))?`)) : normalized.match(/(\d+(?:\.\d+)?)(?:\s*(萬|千|元|塊))?/);
  if (!source) return null;
  const base = Number(source[1]);
  if (!Number.isFinite(base)) return null;
  if (source[2] === "萬") return base * 10000;
  if (source[2] === "千") return base * 1000;
  return base;
}

function parseLineAmount(text: string) {
  return parseAmount(text);
}

function parseCurrency(text: string) {
  if (text.includes("USDT")) return "USDT";
  if (text.includes("USD") || text.includes("美元")) return "USD";
  return "TWD";
}

function sumExplicitAmounts(text: string) {
  const matches = text.replace(/,/g, "").matchAll(/(\d+(?:\.\d+)?)(?:\s*(萬|千|元|塊))?/g);
  let total = 0;
  let count = 0;
  for (const match of matches) {
    const base = Number(match[1]);
    if (!Number.isFinite(base)) continue;
    total += match[2] === "萬" ? base * 10000 : match[2] === "千" ? base * 1000 : base;
    count += 1;
  }
  return count > 0 ? total : null;
}

function parseBankSectionCash(rawText: string) {
  const cashLines = rawText.split(/\r?\n/).map((line) => line.trim()).filter((line) =>
    line && !/(股票|投資|固定支出|固定成本|生活費|安全現金|安全水位|收入|負債)/.test(line)
  );
  return cashLines.length ? sumExplicitAmounts(cashLines.join("\n")) : null;
}

function sectionLines(rawText: string, headings: string[]) {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const results: string[] = [];
  let active = false;
  for (const line of lines) {
    const isHeading = /[:：]$/.test(line);
    if (isHeading) {
      active = headings.some((heading) => line.includes(heading));
      continue;
    }
    if (active) results.push(line);
  }
  return results;
}

export function parseBatchIntakeText(rawText: string) {
  const financialLines = sectionLines(rawText, ["銀行", "現金", "財務"]);
  const creditCardLines = sectionLines(rawText, ["信用卡"]);
  const linePayLines = sectionLines(rawText, ["Line Pay", "line pay"]);
  const stockLines = sectionLines(rawText, ["股票", "投資"]);
  const projectLines = sectionLines(rawText, ["創業", "專案", "資產"]);
  const spendingFallback = rawText.split(/\r?\n/).map((line) => line.trim()).filter((line) =>
    /(課程|衣服|器材|Line Pay|line pay|花了|買了)/.test(line) && !stockLines.includes(line)
  );
  return {
    financial_snapshot: financialLines.length ? financialLines.join("\n") : "",
    spending_items: Array.from(new Set([...linePayLines, ...spendingFallback])),
    credit_card_items: creditCardLines,
    investment_items: stockLines,
    project_items: projectLines
  };
}

export function parseFinancialSnapshotText(rawText: string) {
  const sectionCash = rawText.includes("\n") ? parseBankSectionCash(rawText) : null;
  const currentCash = sectionCash ?? parseAmount(rawText, "現金") ?? parseAmount(rawText, "銀行") ?? parseAmount(rawText, "可動用");
  const investmentValue = parseAmount(rawText, "股票") ?? parseAmount(rawText, "投資");
  const fixedCosts = parseAmount(rawText, "固定支出") ?? parseAmount(rawText, "固定成本");
  const livingExpense = parseAmount(rawText, "生活費");
  const safetyReserve = parseAmount(rawText, "安全現金") ?? parseAmount(rawText, "安全水位");
  const missing_required_fields = [
    currentCash === null ? "目前可動用現金" : null,
    livingExpense === null ? "每月生活費" : null,
    fixedCosts === null ? "每月固定支出" : null,
    safetyReserve === null ? "安全現金水位目標" : null,
    investmentValue === null ? "股票 / 投資部位估值" : null,
    "單次可投入資金上限",
    "可接受最大單項虧損"
  ].filter(Boolean) as string[];
  return {
    current_cash_available: currentCash,
    current_investment_value: investmentValue,
    monthly_fixed_costs: fixedCosts,
    monthly_living_expense: livingExpense,
    safety_cash_reserve_target: safetyReserve,
    missing_required_fields
  };
}

export function parseSpendingDecisionText(rawText: string, overrides: { amount?: number | null; payment_method?: string | null; occurred_at?: string | null; category?: string | null } = {}) {
  const draft = buildFinanceDecisionDraft(rawText, "pending-user", "manual");
  const amount = overrides.amount ?? draft.amount ?? parseAmount(rawText);
  return {
    ...draft,
    amount,
    currency: parseCurrency(rawText),
    occurred_at: overrides.occurred_at ?? draft.occurred_at,
    payment_method: overrides.payment_method ?? draft.payment_method,
    category: overrides.category ?? draft.category
  };
}

export function parseInvestmentDecisionText(rawText: string, overrides: Partial<InvestmentDecision> = {}) {
  return {
    ...buildInvestmentDecisionDraft(rawText, "pending-user"),
    ...overrides,
    missing_required_fields: Array.from(new Set([...(buildInvestmentDecisionDraft(rawText, "pending-user").missing_required_fields ?? []), ...(overrides.missing_required_fields ?? [])]))
  };
}

export function parseProjectDecisionText(rawText: string, overrides: { amount?: number | null; related_project_id?: string | null; notes?: string | null } = {}) {
  const draft = buildFinanceDecisionDraft(rawText, "pending-user", "manual");
  return {
    ...draft,
    amount: overrides.amount ?? draft.amount ?? parseAmount(rawText),
    related_project_id: overrides.related_project_id ?? draft.related_project_id,
    notes: overrides.notes ?? draft.notes
  };
}

async function audit(db: Firestore, userId: string, action: string, collectionName: string, id: string, after: Record<string, unknown>, reason: string) {
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action,
    target_collection: collectionName,
    target_id: id,
    before: null,
    after,
    reason,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
}

async function createFinanceDecisionReviewForIntake(db: Firestore, userId: string, decision: FinanceDecision) {
  const review = buildFinanceDecisionReviewDraft(decision);
  const ref = await addDoc(collection(db, "finance_decision_reviews"), {
    ...review,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  await audit(db, userId, "finance_decision.review", "finance_decision_reviews", ref.id, { finance_decision_id: decision.id, recommendation: review.recommendation, external_action_allowed: false }, "Auto-created review draft from intake. Mark review is still required and no external action executed.");
  return ref.id;
}

async function createExpenseSignalSnapshotFromIntake(db: Firestore, userId: string, decisions: FinanceDecision[], monthKey?: string | null) {
  const snapshot = buildExpenseSignalSnapshot(decisions, userId, monthKey || new Date().toISOString().slice(0, 7));
  const ref = await addDoc(collection(db, "expense_signals"), {
    ...snapshot,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  await audit(db, userId, "expense_signal.update", "expense_signals", ref.id, { month_key: snapshot.month_key, threshold_status: snapshot.threshold_status }, "Auto-updated expense signal snapshot from intake. No external action executed.");
  return ref.id;
}

export async function createFinancialProfileDraftFromIntake(db: Firestore, userId: string, rawText: string, monthKey?: string | null, notes?: string | null): Promise<IntakeResult> {
  const { profileId } = await ensureFinancialProfileDraft(db, userId);
  const parsed = parseFinancialSnapshotText(rawText);
  const profileRef = doc(db, "financial_profile", profileId);
  const beforeSnap = await getDoc(profileRef);
  await updateDoc(profileRef, {
    current_cash_available: parsed.current_cash_available,
    current_investment_value: parsed.current_investment_value,
    monthly_fixed_costs: parsed.monthly_fixed_costs,
    monthly_living_expense: parsed.monthly_living_expense,
    safety_cash_reserve_target: parsed.safety_cash_reserve_target,
    notes: [notes, monthKey ? `month_key: ${monthKey}` : null, `raw_snapshot: ${rawText}`].filter(Boolean).join("\n"),
    missing_required_fields: parsed.missing_required_fields,
    need_mark_review: true,
    external_action_allowed: false,
    review_status: "pending",
    status: parsed.missing_required_fields.length ? "waiting_mark_input" : "draft",
    updated_at: serverTimestamp()
  });
  await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "intake.financial_snapshot",
    target_collection: "financial_profile",
    target_id: profileId,
    before: beforeSnap.exists() ? beforeSnap.data() : null,
    after: { missing_required_fields: parsed.missing_required_fields, external_action_allowed: false },
    reason: "Created or updated financial profile draft from unified intake. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { kind: "財務基本資料草稿", collection: "financial_profile", id: profileId, href: "/finance-advisor", next_actions: ["補財務資料", "到 Review Queue 審核", "查看 Audit Logs"] };
}

export async function createSpendingDraftFromIntake(db: Firestore, userId: string, rawText: string, overrides: { amount?: number | null; payment_method?: string | null; occurred_at?: string | null; category?: string | null } = {}, options: IntakeOptions = { autoReview: true }): Promise<IntakeResult[]> {
  const parsed = parseSpendingDecisionText(rawText, overrides);
  const financeDraft: Omit<FinanceDecision, "id" | "created_at" | "updated_at"> = { ...parsed, user_id: userId, source: "manual" };
  const financeRef = await addDoc(collection(db, "finance_decisions"), { ...financeDraft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, userId, "finance_decision.create", "finance_decisions", financeRef.id, { decision_type: financeDraft.decision_type, external_action_allowed: false }, "Created finance decision draft from unified intake. No external action executed.");
  const decision = { id: financeRef.id, ...financeDraft, created_at: "", updated_at: "" } as FinanceDecision;
  const results: IntakeResult[] = [{ kind: "重大財務決策草稿", collection: "finance_decisions", id: financeRef.id, href: `/finance-decisions/${financeRef.id}`, next_actions: [options.autoReview !== false ? "已自動產生或準備產生 Review Draft" : "產生 Finance Decision Review", "到 Review Queue 審核", "查看 Audit Logs"] }];
  if (options.autoReview !== false) {
    const reviewId = await createFinanceDecisionReviewForIntake(db, userId, decision);
    results.push({ kind: "Finance Decision Review Draft", collection: "finance_decision_reviews", id: reviewId, href: `/finance-decisions/${financeRef.id}`, next_actions: ["Mark review 後再決策", "不可自動付款 / 下單 / 交易"] });
  }

  if (rawText.includes("信用卡") || rawText.includes("帳單") || rawText.includes("分期")) {
    const obligation = { ...buildCreditCardObligationDraft(userId, rawText), external_action_allowed: false, created_at: serverTimestamp(), updated_at: serverTimestamp() };
    const obligationRef = await addDoc(collection(db, "credit_card_obligations"), obligation);
    await audit(db, userId, rawText.includes("分期") ? "credit_card_obligation.create" : "credit_card_obligation.create", "credit_card_obligations", obligationRef.id, { status: obligation.status, external_action_allowed: false }, "Created credit card/installment obligation draft from unified intake. No double-counted consumption or external action.");
    results.push({ kind: rawText.includes("分期") ? "分期義務草稿" : "信用卡帳單草稿", collection: "credit_card_obligations", id: obligationRef.id, href: "/review-queue", next_actions: ["補信用卡 / 分期資料", "到 Review Queue 審核"] });
    if (options.autoReview !== false) {
      const signalId = await createExpenseSignalSnapshotFromIntake(db, userId, [decision], options.monthKey);
      results.push({ kind: "Expense Signal Snapshot", collection: "expense_signals", id: signalId, href: "/expense-signals", next_actions: ["查看本月警訊門檻", "確認信用卡 / 分期壓力"] });
    }
  }
  return results;
}

export async function createInvestmentDraftFromIntake(db: Firestore, userId: string, rawText: string, overrides: Partial<InvestmentDecision> = {}, options: IntakeOptions = { autoReview: true }): Promise<IntakeResult> {
  const parsed = parseInvestmentDecisionText(rawText, overrides);
  const autoReviewFields = options.autoReview === false ? {} : { cashflow_impact: `${parsed.cashflow_impact} 已建立 review-gated 分析欄位；仍需 Mark 補安全現金水位與持倉資料。` };
  const ref = await addDoc(collection(db, "investment_decisions"), { ...parsed, ...autoReviewFields, user_id: userId, external_action_allowed: false, need_mark_review: true, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, userId, "investment_decision.create", "investment_decisions", ref.id, { symbol: parsed.symbol ?? null, auto_review: options.autoReview !== false, external_action_allowed: false }, "Created investment decision draft from unified intake. No market data fetch or trade executed.");
  if (options.autoReview !== false) {
    await audit(db, userId, "investment_decision.review", "investment_decisions", ref.id, { status: parsed.status, external_action_allowed: false }, "Auto-populated investment decision review fields. No trade executed.");
  }
  return { kind: "投資決策草稿", collection: "investment_decisions", id: ref.id, href: `/investment-decisions/${ref.id}`, next_actions: [options.autoReview !== false ? "已建立投資分析欄位" : "補目前價格 / 成本 / 數量", "到 Review Queue 審核", "查看 Audit Logs"] };
}

export async function createProjectDecisionDraftFromIntake(db: Firestore, userId: string, rawText: string, overrides: { amount?: number | null; related_project_id?: string | null; notes?: string | null } = {}, options: IntakeOptions = { autoReview: true }): Promise<IntakeResult[]> {
  const parsed = parseProjectDecisionText(rawText, overrides);
  const ref = await addDoc(collection(db, "finance_decisions"), { ...parsed, user_id: userId, source: "manual", external_action_allowed: false, need_mark_review: true, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, userId, "finance_decision.create", "finance_decisions", ref.id, { decision_type: parsed.decision_type, related_project_id: parsed.related_project_id, external_action_allowed: false }, "Created startup/project/asset finance decision draft from unified intake. No external action executed.");
  const decision = { id: ref.id, ...parsed, user_id: userId, source: "manual", created_at: "", updated_at: "" } as FinanceDecision;
  const results: IntakeResult[] = [{ kind: "創業 / 資產決策草稿", collection: "finance_decisions", id: ref.id, href: `/finance-decisions/${ref.id}`, next_actions: [options.autoReview !== false ? "已自動產生 Review Draft" : "產生 Finance Decision Review", "到 Review Queue 審核", "查看 Audit Logs"] }];
  if (options.autoReview !== false) {
    const reviewId = await createFinanceDecisionReviewForIntake(db, userId, decision);
    results.push({ kind: "Finance Decision Review Draft", collection: "finance_decision_reviews", id: reviewId, href: `/finance-decisions/${ref.id}`, next_actions: ["確認回本方式", "設定停損線"] });
  }
  return results;
}

export async function createDraftFromIntake(db: Firestore, userId: string, kind: IntakeKind, rawText: string) {
  if (kind === "financial_snapshot") return [await createFinancialProfileDraftFromIntake(db, userId, rawText)];
  if (kind === "spending") return createSpendingDraftFromIntake(db, userId, rawText);
  if (kind === "investment") return [await createInvestmentDraftFromIntake(db, userId, rawText)];
  return createProjectDecisionDraftFromIntake(db, userId, rawText);
}

export const INTAKE_MISSING_FINANCIAL_FIELDS = MARK_FINANCE_INPUTS;

export async function createDraftsFromBatchIntake(db: Firestore, userId: string, rawText: string, options: IntakeOptions = { autoReview: true }) {
  const parsed = parseBatchIntakeText(rawText);
  const results: IntakeResult[] = [];
  if (parsed.financial_snapshot) {
    results.push(await createFinancialProfileDraftFromIntake(db, userId, parsed.financial_snapshot, options.monthKey, options.notes));
    const accounts = parsed.financial_snapshot.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => ({
      account_name: line.replace(/\d.*/, "").trim() || "財務帳戶",
      account_type: line.includes("現金") ? "cash" as const : "bank" as const,
      balance: parseLineAmount(line),
      notes: options.notes ?? null
    })).filter((account) => account.balance !== null);
    const baseline = await createFinanceBaselineDraft(db, {
      userId,
      snapshotDate: new Date().toISOString().slice(0, 10),
      monthKey: options.monthKey || new Date().toISOString().slice(0, 7),
      accountBalances: accounts
    });
    results.push({ kind: "Finance Baseline Snapshot Draft", collection: "finance_snapshots", id: baseline.snapshotId, href: "/finance-baseline", next_actions: ["補安全現金水位", "檢查資產負債表", "到 Review Queue 審核"] });
  }
  for (const item of parsed.spending_items) results.push(...await createSpendingDraftFromIntake(db, userId, item, {}, options));
  for (const item of parsed.credit_card_items) results.push(...await createSpendingDraftFromIntake(db, userId, item, {}, options));
  for (const item of parsed.investment_items) results.push(await createInvestmentDraftFromIntake(db, userId, item, {}, options));
  for (const item of parsed.project_items) results.push(...await createProjectDecisionDraftFromIntake(db, userId, item, {}, options));
  if (!results.length && rawText.trim()) results.push(...await createSpendingDraftFromIntake(db, userId, rawText, {}, options));
  return results;
}
