import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import { buildReviewQueue, type ReviewQueueItem } from "@/lib/reviewQueue";
import { asArray, displayText } from "@/lib/ui/safe";
import type { BusinessExperiment, ClientProfile, CommandBrief, ContentDraft, DecisionFollowup, FinanceDecision, InvestmentDecision, ProductFeature, TaskDispatch } from "@/types/firestore";

export interface CommandBrainInput {
  userId: string;
  financeDecisions?: FinanceDecision[];
  investmentDecisions?: InvestmentDecision[];
  clientProfiles?: ClientProfile[];
  contentDrafts?: ContentDraft[];
  businessExperiments?: BusinessExperiment[];
  productFeatures?: ProductFeature[];
  taskDispatches?: TaskDispatch[];
  followups?: DecisionFollowup[];
  reviewQueueItems?: ReviewQueueItem[];
}

function waiting(status: unknown) {
  return ["draft", "waiting_review", "waiting_mark_input", "pending", "missed"].includes(String(status ?? ""));
}

export function buildCommandBrief(input: CommandBrainInput): Omit<CommandBrief, "id" | "created_at" | "updated_at"> {
  const finance = asArray<FinanceDecision>(input.financeDecisions);
  const investments = asArray<InvestmentDecision>(input.investmentDecisions);
  const clients = asArray<ClientProfile>(input.clientProfiles);
  const content = asArray<ContentDraft>(input.contentDrafts);
  const business = asArray<BusinessExperiment>(input.businessExperiments);
  const products = asArray<ProductFeature>(input.productFeatures);
  const tasks = asArray<TaskDispatch>(input.taskDispatches);
  const followups = asArray<DecisionFollowup>(input.followups);
  const queue = input.reviewQueueItems ?? buildReviewQueue({
    finance_decisions: finance as never[],
    investment_decisions: investments as never[],
    client_profiles: clients as never[],
    content_drafts: content as never[],
    business_experiments: business as never[],
    product_features: products as never[],
    task_dispatches: tasks as never[],
    decision_followups: followups as never[]
  });
  const blocked = [
    ...finance.filter((item) => waiting(item.status) && (item.amount ?? 0) >= 30000).map((item) => `大額財務決策待審核：${item.title}`),
    ...investments.filter((item) => item.average_down_allowed === false || item.current_thesis_status !== "valid").map((item) => `投資不可直接加碼：${displayText(item.symbol, item.id)}`),
    ...followups.filter((item) => item.status === "missed").map((item) => `missed followup：${item.title}`)
  ];
  return {
    user_id: input.userId,
    title: `Command Brief ${new Date().toISOString().slice(0, 10)}`,
    summary: `跨分支待審核 ${queue.length}；finance ${finance.length}、investment ${investments.length}、client ${clients.length}、content ${content.length}、business ${business.length}、product ${products.length}。`,
    main_focus: queue.slice(0, 3).map((item) => item.title).concat(queue.length ? [] : ["先到 /intake 或 /advisor-chat 建立可審核草稿"]).slice(0, 3),
    cross_branch_risks: [
      ...blocked,
      ...business.filter((item) => !item.stop_loss).map((item) => `商業實驗缺 stop loss：${item.title}`),
      ...clients.filter((item) => asArray(item.risk_notes).length > 0).map((item) => `客戶注意事項：${item.display_name}`)
    ].slice(0, 10),
    no_cost_actions: ["補資料", "清 Review Queue", "整理 SOP", "建立 followup", "問 Advisor Chat"],
    blocked_items: blocked.length ? blocked : ["目前沒有明確 blocked items，但正式行動仍需 Mark review"],
    recommended_sops: ["Advisor 回答格式", "客戶 session note 格式", "商業實驗 stop loss 模板", "產品 roadmap review checklist"].slice(0, 5),
    codex_job_candidates: products.filter((item) => waiting(item.status)).slice(0, 5).map((item) => item.title),
    assistant_handoff_candidates: tasks.filter((item) => item.human_assistant_needed).slice(0, 5).map((item) => item.title),
    need_mark_review: true,
    external_action_allowed: false,
    status: "draft"
  };
}

export async function createCommandBriefDraft(db: Firestore, draft: Omit<CommandBrief, "id" | "created_at" | "updated_at">) {
  const ref = await addDoc(collection(db, "command_briefs"), { ...draft, created_at: serverTimestamp(), updated_at: serverTimestamp() });
  await addDoc(collection(db, "audit_logs"), { user_id: draft.user_id, action: "command_brief.create_draft", target_collection: "command_briefs", target_id: ref.id, before: null, after: { external_action_allowed: false, status: "draft" }, reason: "Command Brain draft only. No auto dispatch, Codex job, assistant handoff, or external action.", created_at: serverTimestamp(), updated_at: serverTimestamp() });
  return { commandBriefId: ref.id };
}
