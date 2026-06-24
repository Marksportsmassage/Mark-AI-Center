import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import type { AccountBalance, FinanceSnapshot, FinancialProfile, Liability, RiskLevel } from "@/types/firestore";

export interface FinanceBaselineInput {
  userId: string;
  snapshotDate: string;
  monthKey: string;
  accountBalances?: Array<Partial<AccountBalance>>;
  liabilities?: Array<Partial<Liability>>;
  financialProfile?: FinancialProfile | null;
  monthlyVariableExpensesEstimate?: number | null;
}

function amount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function sumAccountBalances(accounts: Array<Partial<AccountBalance>>, type?: AccountBalance["account_type"]) {
  return accounts
    .filter((item) => !type || item.account_type === type)
    .reduce((total, item) => total + amount(item.balance), 0);
}

export function sumLiabilities(liabilities: Array<Partial<Liability>>) {
  return liabilities.reduce((total, item) => total + amount(item.current_balance), 0);
}

export function sumMonthlyDebtPayments(liabilities: Array<Partial<Liability>>) {
  return liabilities.reduce((total, item) => total + amount(item.monthly_cashflow_impact ?? item.monthly_payment), 0);
}

export function calculateFinanceSnapshot(input: FinanceBaselineInput): Omit<FinanceSnapshot, "id" | "created_at" | "updated_at"> {
  const accounts = input.accountBalances ?? [];
  const liabilities = input.liabilities ?? [];
  const totalCash = sumAccountBalances(accounts, "cash");
  const totalBank = sumAccountBalances(accounts, "bank");
  const totalInvestment = sumAccountBalances(accounts, "brokerage") + sumAccountBalances(accounts, "crypto") + sumAccountBalances(accounts, "gold");
  const totalAssets = accounts.reduce((total, item) => total + amount(item.balance), 0);
  const totalLiabilities = sumLiabilities(liabilities);
  const netWorth = totalAssets - totalLiabilities;
  const safetyTarget = input.financialProfile?.safety_cash_reserve_target ?? null;
  const monthlyFixed = input.financialProfile?.monthly_fixed_costs ?? input.financialProfile?.monthly_living_expense ?? null;
  const monthlyDebt = sumMonthlyDebtPayments(liabilities);
  const availableCash = safetyTarget === null ? null : totalCash + totalBank - safetyTarget;
  const safetyMonths = monthlyFixed && safetyTarget ? safetyTarget / monthlyFixed : null;
  const missing = [
    accounts.length === 0 ? "account_balances" : null,
    safetyTarget === null ? "安全現金水位目標" : null,
    monthlyFixed === null ? "每月固定支出 / 生活費" : null,
    input.financialProfile?.monthly_income_estimate === null || input.financialProfile?.monthly_income_estimate === undefined ? "每月收入估計" : null
  ].filter(Boolean) as string[];
  const risk: RiskLevel = missing.length ? "unknown" : availableCash !== null && availableCash < 0 ? "high" : monthlyDebt > 0 && monthlyFixed !== null && monthlyDebt > monthlyFixed * 0.5 ? "medium" : "low";
  return {
    user_id: input.userId,
    snapshot_date: input.snapshotDate,
    month_key: input.monthKey,
    total_cash: totalCash,
    total_bank_balance: totalBank,
    total_investment_value: totalInvestment,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    net_worth: netWorth,
    monthly_income_estimate: input.financialProfile?.monthly_income_estimate ?? null,
    monthly_fixed_expenses: monthlyFixed,
    monthly_variable_expenses_estimate: input.monthlyVariableExpensesEstimate ?? null,
    monthly_debt_payments: monthlyDebt,
    safety_cash_reserve_target: safetyTarget,
    safety_cash_reserve_months: safetyMonths,
    available_cash_after_reserve: availableCash,
    investment_allocation_summary: `投資資產估值 ${totalInvestment}，不含即時價格更新。`,
    liability_summary: liabilities.length ? `負債 ${liabilities.length} 筆，月付 ${monthlyDebt}。` : "尚未建立負債資料。",
    missing_required_fields: missing,
    risk_level: risk,
    need_mark_review: true,
    external_action_allowed: false,
    status: missing.length ? "waiting_mark_input" : "draft"
  };
}

export function buildAccountBalanceDraft(userId: string, input: Partial<AccountBalance>): Omit<AccountBalance, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    account_name: input.account_name || "未命名帳戶",
    account_type: input.account_type || "other",
    currency: input.currency || "TWD",
    balance: input.balance ?? null,
    as_of_date: input.as_of_date || new Date().toISOString().slice(0, 10),
    notes: input.notes ?? null,
    need_mark_review: true,
    external_action_allowed: false,
    status: input.balance === null || input.balance === undefined ? "waiting_mark_input" : "draft"
  };
}

export function buildLiabilityDraft(userId: string, input: Partial<Liability>): Omit<Liability, "id" | "created_at" | "updated_at"> {
  const monthlyImpact = input.monthly_cashflow_impact ?? input.monthly_payment ?? null;
  return {
    user_id: userId,
    liability_type: input.liability_type || "other",
    lender_name: input.lender_name || "未命名負債",
    original_amount: input.original_amount ?? null,
    current_balance: input.current_balance ?? null,
    monthly_payment: input.monthly_payment ?? null,
    remaining_terms: input.remaining_terms ?? null,
    interest_rate: input.interest_rate ?? null,
    due_date: input.due_date ?? null,
    notes: input.notes ?? null,
    monthly_cashflow_impact: monthlyImpact,
    risk_level: monthlyImpact && monthlyImpact >= 10000 ? "medium" : "unknown",
    need_mark_review: true,
    external_action_allowed: false,
    status: "draft"
  };
}

export async function createFinanceBaselineDraft(db: Firestore, input: FinanceBaselineInput) {
  const accounts = input.accountBalances ?? [];
  const liabilities = input.liabilities ?? [];
  const accountRefs = [];
  for (const account of accounts) {
    const draft = buildAccountBalanceDraft(input.userId, account);
    accountRefs.push(await addDoc(collection(db, "account_balances"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() }));
  }
  const liabilityRefs = [];
  for (const liability of liabilities) {
    const draft = buildLiabilityDraft(input.userId, liability);
    liabilityRefs.push(await addDoc(collection(db, "liabilities"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() }));
  }
  const snapshot = calculateFinanceSnapshot(input);
  const snapshotRef = await addDoc(collection(db, "finance_snapshots"), { ...snapshot, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), {
    user_id: input.userId,
    action: "finance_baseline.create_draft",
    target_collection: "finance_snapshots",
    target_id: snapshotRef.id,
    before: null,
    after: { account_count: accountRefs.length, liability_count: liabilityRefs.length, net_worth: snapshot.net_worth, external_action_allowed: false },
    reason: "Created finance baseline draft. No payment, transfer, trade, or external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  return { snapshotId: snapshotRef.id, accountIds: accountRefs.map((ref) => ref.id), liabilityIds: liabilityRefs.map((ref) => ref.id) };
}
