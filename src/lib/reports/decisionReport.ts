import { addDoc, collection, doc, type Firestore, getDoc, getDocs, limit, query, serverTimestamp, where } from "firebase/firestore";
import type { FinanceReview } from "@/types/firestore";
import type { DecisionRecommendation, DecisionReport, DecisionType, RiskLevel, TaskDispatch } from "@/types/firestore";

type CostItem = DecisionReport["cost_items"][number];
type RiskItem = DecisionReport["risk_items"][number];

function cost(name: string, description: string, required = true): CostItem {
  return { name, description, estimated_min: null, estimated_max: null, required };
}

function risk(riskName: string, level: RiskLevel, mitigation: string): RiskItem {
  return { risk: riskName, level, mitigation };
}

function decisionTypeForTask(task: TaskDispatch): DecisionType {
  const taskType = String(task.task_type ?? "");
  if (String(task.project_id ?? "").includes("business") || taskType.includes("startup")) return "startup";
  if (task.project_id === "capital_compounding" || taskType.includes("investment")) return "finance";
  if (taskType.includes("app")) return "app";
  if (taskType.includes("study")) return "study";
  if (taskType.includes("client")) return "client";
  return "other";
}

function recommendationForProject(projectId?: string): DecisionRecommendation {
  if (projectId === "apparel_business") return "small_test";
  if (projectId === "capital_compounding") return "needs_more_info";
  if (projectId === "ichiban_kuji_business" || projectId === "beverage_business") return "research";
  return "research";
}

function costItemsForTask(task: TaskDispatch): { costItems: CostItem[]; allocationItems?: CostItem[] } {
  if (task.project_id === "apparel_business") {
    return {
      costItems: [
        cost("進貨成本", "首批選品、批發或樣品採購。"),
        cost("拍攝成本", "商品照、穿搭照、短影音素材。"),
        cost("上架素材", "商品文案、尺寸表、賣場頁面素材。"),
        cost("廣告測試", "小額流量測試與受眾驗證。"),
        cost("包材物流", "包裝材料、出貨與物流成本。"),
        cost("退換貨預備金", "尺寸不合、瑕疵與退換貨的預備支出。")
      ]
    };
  }

  if (task.project_id === "ichiban_kuji_business") {
    return {
      costItems: [
        cost("公仔進貨", "抽賞商品、庫存與備品採購。"),
        cost("直播設備", "直播鏡頭、燈光、收音與展示設備。"),
        cost("平台抽成", "直播或交易平台可能產生的手續費。"),
        cost("保底回饋", "活動信任建立與回饋成本。"),
        cost("包裝物流", "出貨、包材與破損預備。")
      ]
    };
  }

  if (task.project_id === "beverage_business") {
    return {
      costItems: [
        cost("租金押金", "店面押金、租金與簽約成本。"),
        cost("裝潢設備", "吧台、製冰、封膜、冷藏與 POS。"),
        cost("原物料", "茶葉、粉料、杯材與初始庫存。"),
        cost("人力", "正職、兼職與訓練成本。"),
        cost("水電雜支", "水電、耗材、清潔與維修。"),
        cost("行銷開幕成本", "開幕活動、外送平台、社群素材。")
      ]
    };
  }

  if (task.project_id === "capital_compounding") {
    return {
      costItems: [],
      allocationItems: [
        cost("現金保留", "維持安全現金水位。"),
        cost("股票投資", "市場部位與波動承受度。"),
        cost("創業測試", "小額驗證預算與停損條件。"),
        cost("App 開發", "產品開發、工具與部署成本。"),
        cost("工作室營運", "固定營運與必要開銷。")
      ]
    };
  }

  return {
    costItems: [
      cost("必要成本", "完成此任務所需的必要資源。"),
      cost("時間成本", "Mark 或 AI 人員投入的時間。", false),
      cost("風險預備", "預留不確定風險與調整空間。", false)
    ]
  };
}

function riskItemsForTask(task: TaskDispatch): RiskItem[] {
  if (task.project_id === "apparel_business") {
    return [
      risk("庫存滯銷", "medium", "先用小批量與預購測試，避免大量壓庫存。"),
      risk("尺寸退換貨", "medium", "建立尺寸表、退換貨規則與預備金。"),
      risk("流量不足", "medium", "用小額廣告測試素材與受眾。"),
      risk("毛利不足", "medium", "先拆解進貨、物流、廣告與退貨後毛利。"),
      risk("現金流被壓住", "high", "設定測試預算上限與停損條件。")
    ];
  }

  if (task.project_id === "ichiban_kuji_business") {
    return [
      risk("法規風險", "high", "先確認抽獎、贈品與直播銷售規則。"),
      risk("信任風險", "medium", "建立透明流程與交易紀錄。"),
      risk("抽獎爭議", "medium", "規則公告、錄影留存與客訴流程。"),
      risk("庫存滯銷", "medium", "避免單一品類過量採購。"),
      risk("現金流週轉", "medium", "控管進貨週期與回款速度。")
    ];
  }

  if (task.project_id === "beverage_business") {
    return [
      risk("固定成本高", "high", "先估損益平衡杯數與租金壓力。"),
      risk("商圈人流不足", "high", "用實地人流觀察與競品分析驗證。"),
      risk("人力管理", "medium", "建立 SOP 與班表成本模型。"),
      risk("食安風險", "high", "先建立清潔、保存與追溯流程。"),
      risk("損益平衡杯數不足", "high", "回推每日杯數、客單與毛利。")
    ];
  }

  if (task.project_id === "capital_compounding") {
    return [
      risk("現金水位不足", "high", "先定義不可動用安全現金。"),
      risk("投資波動", "medium", "以風險承受度控制部位。"),
      risk("創業回收期不確定", "medium", "創業測試需有預算上限與停損點。"),
      risk("過度分散", "medium", "聚焦少數高勝率資金用途。")
    ];
  }

  return [risk("資訊不足", "unknown", "先補齊背景、限制、成功標準與風險。")];
}

export function buildDecisionReportDraft(task: TaskDispatch): Omit<DecisionReport, "id" | "created_at" | "updated_at"> {
  const { costItems, allocationItems } = costItemsForTask(task);
  return {
    source_task_dispatch_id: task.id,
    project_id: task.project_id,
    linked_finance_review_id: null,
    finance_review_status: null,
    title: `Draft Decision Report - ${task.title}`,
    decision_type: decisionTypeForTask(task),
    summary: task.background || task.instructions || "Rule-based draft decision report.",
    capital_required_min: null,
    capital_required_max: null,
    expected_roi_summary: task.expected_roi ?? null,
    payback_period_summary: task.payback_period ?? null,
    risk_level: task.risk_level ?? "unknown",
    cashflow_impact: task.cashflow_impact ?? null,
    stage: task.stage ?? "research",
    assumptions: ["此報告為 rule-based draft，尚未呼叫 OpenAI。", "所有外部行動需 Mark 手動確認。"],
    cost_items: costItems,
    allocation_items: allocationItems ?? [],
    risk_items: riskItemsForTask(task),
    next_steps: ["補齊預算範圍", "確認資料來源", "設定停損條件", "由 Mark 審核是否進入下一階段"],
    stop_loss_conditions: ["超出 Mark 核准預算", "現金水位低於安全線", "風險無法被明確控管"],
    recommendation: recommendationForProject(task.project_id),
    need_mark_review: true,
    review_status: "pending",
    status: "draft"
  };
}

export async function generateDecisionReportDraft(db: Firestore, taskId: string, userId: string) {
  const taskRef = doc(db, "task_dispatches", taskId);
  const taskSnap = await getDoc(taskRef);
  if (!taskSnap.exists()) {
    throw new Error("Task dispatch not found.");
  }

  const task = { id: taskSnap.id, ...taskSnap.data() } as TaskDispatch;
  const draft = buildDecisionReportDraft(task);
  const financeSnap = await getDocs(query(collection(db, "finance_reviews"), where("source_task_dispatch_id", "==", taskId), limit(1)));
  const linkedFinance = financeSnap.docs[0] ? ({ id: financeSnap.docs[0].id, ...financeSnap.docs[0].data() } as FinanceReview) : null;
  const reportDoc = await addDoc(collection(db, "decision_reports"), {
    ...draft,
    linked_finance_review_id: linkedFinance?.id ?? null,
    finance_review_status: linkedFinance?.status ?? null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  const auditDoc = await addDoc(collection(db, "audit_logs"), {
    user_id: userId,
    action: "decision_report.generate_draft",
    target_collection: "decision_reports",
    target_id: reportDoc.id,
    before: null,
    after: { source_task_dispatch_id: taskId, status: "draft" },
    reason: "Generated rule-based draft decision report. No external action executed.",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });

  return { reportId: reportDoc.id, auditLogId: auditDoc.id };
}
