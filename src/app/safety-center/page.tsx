import Link from "next/link";
import { SAFETY_NOTES, safetyChecklist } from "@/lib/governance";

export default function Page() {
  const safety = safetyChecklist();
  return <div className="grid"><header className="page-header"><div><h1>Safety Center</h1><p>確認 Mark AI Center 目前只建立 review-gated drafts，不啟用外部行動。</p></div><Link className="button secondary compact" href="/start-here">Start Here</Link></header><section className="panel"><h2>Disabled External Actions</h2><div className="detail-grid"><div><strong>LINE reply / push</strong><p>{safety.line_reply_push_enabled ? "enabled" : "disabled"}</p></div><div><strong>functions deployed in these phases</strong><p>{safety.functions_deployed ? "yes" : "no"}</p></div><div><strong>auto trading</strong><p>{safety.auto_trade_enabled ? "enabled" : "disabled"}</p></div><div><strong>auto payment</strong><p>{safety.auto_payment_enabled ? "enabled" : "disabled"}</p></div><div><strong>supplier contact</strong><p>disabled</p></div><div><strong>auto posting</strong><p>disabled</p></div><div><strong>external_action_allowed</strong><p>{String(safety.external_action_allowed)}</p></div><div><strong>need_mark_review</strong><p>true</p></div></div></section><section className="panel"><h2>Safety Notes</h2><ul>{SAFETY_NOTES.map((item) => <li key={item}>{item}</li>)}</ul><p className="muted">投資建議只做草稿；客戶 / 訓練紀錄不是醫療診斷。</p></section></div>;
}
