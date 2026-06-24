import Link from "next/link";

const flows = [
  ["/today", "今天只看 /today", "先看今日主線、不能做事項、待審核與缺資料。"],
  ["/intake", "有資料就貼 /intake", "財務、支出、股票、創業想法先進 review-gated draft。"],
  ["/advisor-chat", "想聊天問策略就去 /advisor-chat", "Rule-based advisor，不呼叫外部 AI，不做外部動作。"],
  ["/review-queue", "要審核就去 /review-queue", "所有 draft 集中 Mark review。"],
  ["/command-brain", "想看總管建議就去 /command-brain", "跨財務、客戶、內容、商業、產品整理下一步。"],
  ["/finance-baseline", "財務基準 /finance-baseline", "資產、負債、安全現金水位。"],
  ["/net-worth", "資產負債 /net-worth", "淨資產與配置，不抓即時價格。"],
  ["/cashflow", "現金流 /cashflow", "收入、固定支出、信用卡與分期月壓力。"],
  ["/investment-decisions", "投資 /investment-decisions", "只做條件式決策，不自動買賣。"],
  ["/client-ops", "客戶 /client-ops", "客戶與課表紀錄，不做醫療診斷。"],
  ["/content-studio", "內容 /content-studio", "IG、國考、PDF、文章草稿，不自動發布。"],
  ["/business-lab", "商業 /business-lab", "小額測試、stop loss、驗證方法。"],
  ["/product-roadmap", "產品 /product-roadmap", "產品功能與 roadmap，不自動 PR/deploy。"]
];

export default function Page() {
  return <div className="grid"><header className="page-header"><div><h1>Start Here / 每日使用入口</h1><p>Mark AI Command Center 每天從這裡開始。所有重要輸出都需要 Mark review。</p></div><div className="action-row"><Link className="button compact" href="/today">Today</Link><Link className="button secondary compact" href="/safety-center">Safety Center</Link></div></header><section className="panel"><h2>每日流程</h2><div className="list">{flows.map(([href, title, body]) => <Link className="item" href={href} key={href}><h3>{title}</h3><p>{body}</p></Link>)}</div></section></div>;
}
