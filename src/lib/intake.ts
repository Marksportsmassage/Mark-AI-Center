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
import {
  buildCreditCardObligationDraft,
  buildFinanceDecisionDraft,
  buildInvestmentDecisionDraft
} from "@/lib/financeDecisionIntelligence";
import type { FinanceDecision, InvestmentDecision } from "@/types/firestore";

export type IntakeKind = "financial_snapshot" | "spending" | "investment" | "project_decision";

export interface IntakeResult {
  kind: string;
  collection: string;
  id: string;
  href: string;
  next_actions: string[];
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

function parseCurrency(text: string) {
  if (text.includes("USD") || text.includes("美元")) return "USD";
  if (text.includes("USDT")) return "USDT";
  return "TWD";
}

export function parseFinancialSnapshotText(rawText: string) {
  const currentCash = parseAmount(rawText, "現金") ?? parseAmount(rawText, "銀行") ?? parseAmount(rawText, "可動用");
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

export async function createSpendingDraftFromIntake(db: Firestore, userId: string, rawText: string, overrides: { amount?: number | null; payment_method?: string | null; occurred_at?: string | null; category?: string | null } = {}): Promise<IntakeResult[]> {
  const parsed = parseSpendingDecisionText(rawText, overrides);
  const financeDraft: Omit<FinanceDecision, "id" | "created_at" | "updated_at"> = { ...parsed, user_id: userId, source: "manual" };
  const financeRef = await addDoc(collection(db, "finance_decisions"), { ...financeDraft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, userId, "finance_decision.create", "finance_decisions", financeRef.id, { decision_type: financeDraft.decision_type, external_action_allowed: false }, "Created finance decision draft from unified intake. No external action executed.");
  const results: IntakeResult[] = [{ kind: "重大財務決策草稿", collection: "finance_decisions", id: financeRef.id, href: `/finance-decisions/${financeRef.id}`, next_actions: ["產生 Finance Decision Review", "到 Review Queue 審核", "查看 Audit Logs"] }];

  if (rawText.includes("信用卡") || rawText.includes("帳單") || rawText.includes("分期")) {
    const obligation = { ...buildCreditCardObligationDraft(userId, rawText), external_action_allowed: false, created_at: serverTimestamp(), updated_at: serverTimestamp() };
    const obligationRef = await addDoc(collection(db, "credit_card_obligations"), obligation);
    await audit(db, userId, rawText.includes("分期") ? "credit_card_obligation.create" : "credit_card_obligation.create", "credit_card_obligations", obligationRef.id, { status: obligation.status, external_action_allowed: false }, "Created credit card/installment obligation draft from unified intake. No double-counted consumption or external action.");
    results.push({ kind: rawText.includes("分期") ? "分期義務草稿" : "信用卡帳單草稿", collection: "credit_card_obligations", id: obligationRef.id, href: "/review-queue", next_actions: ["補信用卡 / 分期資料", "到 Review Queue 審核"] });
  }
  return results;
}

export async function createInvestmentDraftFromIntake(db: Firestore, userId: string, rawText: string, overrides: Partial<InvestmentDecision> = {}): Promise<IntakeResult> {
  const parsed = parseInvestmentDecisionText(rawText, overrides);
  const ref = await addDoc(collection(db, "investment_decisions"), { ...parsed, user_id: userId, external_action_allowed: false, need_mark_review: true, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, userId, "investment_decision.create", "investment_decisions", ref.id, { symbol: parsed.symbol ?? null, external_action_allowed: false }, "Created investment decision draft from unified intake. No market data fetch or trade executed.");
  return { kind: "投資決策草稿", collection: "investment_decisions", id: ref.id, href: `/investment-decisions/${ref.id}`, next_actions: ["補目前價格 / 成本 / 數量", "到 Review Queue 審核", "查看 Audit Logs"] };
}

export async function createProjectDecisionDraftFromIntake(db: Firestore, userId: string, rawText: string, overrides: { amount?: number | null; related_project_id?: string | null; notes?: string | null } = {}): Promise<IntakeResult> {
  const parsed = parseProjectDecisionText(rawText, overrides);
  const ref = await addDoc(collection(db, "finance_decisions"), { ...parsed, user_id: userId, source: "manual", external_action_allowed: false, need_mark_review: true, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await audit(db, userId, "finance_decision.create", "finance_decisions", ref.id, { decision_type: parsed.decision_type, related_project_id: parsed.related_project_id, external_action_allowed: false }, "Created startup/project/asset finance decision draft from unified intake. No external action executed.");
  return { kind: "創業 / 資產決策草稿", collection: "finance_decisions", id: ref.id, href: `/finance-decisions/${ref.id}`, next_actions: ["產生 Finance Decision Review", "到 Review Queue 審核", "查看 Audit Logs"] };
}

export async function createDraftFromIntake(db: Firestore, userId: string, kind: IntakeKind, rawText: string) {
  if (kind === "financial_snapshot") return [await createFinancialProfileDraftFromIntake(db, userId, rawText)];
  if (kind === "spending") return createSpendingDraftFromIntake(db, userId, rawText);
  if (kind === "investment") return [await createInvestmentDraftFromIntake(db, userId, rawText)];
  return [await createProjectDecisionDraftFromIntake(db, userId, rawText)];
}

export const INTAKE_MISSING_FINANCIAL_FIELDS = MARK_FINANCE_INPUTS;
