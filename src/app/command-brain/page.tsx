"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DataFreshnessBadge } from "@/components/assistant-ui/DataFreshnessBadge";
import { TimeContextBadge } from "@/components/assistant-ui/TimeContextBadge";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { buildCommandBrief, createCommandBriefDraft } from "@/lib/commandBrain";
import { getClientDb } from "@/lib/firebase/client";
import { buildReviewQueue } from "@/lib/reviewQueue";
import { safeJoin } from "@/lib/ui/safe";
import type { BusinessExperiment, ClientProfile, CommandBrief, ContentDraft, DecisionFollowup, FinanceDecision, InvestmentDecision, ProductFeature, TaskDispatch } from "@/types/firestore";

function CommandBrainData({ uid }: { uid: string }) {
  const briefs = useFirestoreCollection<CommandBrief>("command_briefs", recent20, true);
  const finance = useFirestoreCollection<FinanceDecision>("finance_decisions", recent20, true);
  const investments = useFirestoreCollection<InvestmentDecision>("investment_decisions", recent20, true);
  const clients = useFirestoreCollection<ClientProfile>("client_profiles", recent20, true);
  const content = useFirestoreCollection<ContentDraft>("content_drafts", recent20, true);
  const business = useFirestoreCollection<BusinessExperiment>("business_experiments", recent20, true);
  const products = useFirestoreCollection<ProductFeature>("product_features", recent20, true);
  const tasks = useFirestoreCollection<TaskDispatch>("task_dispatches", recent20, true);
  const followups = useFirestoreCollection<DecisionFollowup>("decision_followups", recent20, true);
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const queue = useMemo(() => buildReviewQueue({ finance_decisions: finance.items as never[], investment_decisions: investments.items as never[], client_profiles: clients.items as never[], content_drafts: content.items as never[], business_experiments: business.items as never[], product_features: products.items as never[], task_dispatches: tasks.items as never[], decision_followups: followups.items as never[] }), [business.items, clients.items, content.items, finance.items, followups.items, investments.items, products.items, tasks.items]);
  const draft = useMemo(() => buildCommandBrief({ userId: uid, financeDecisions: finance.items, investmentDecisions: investments.items, clientProfiles: clients.items, contentDrafts: content.items, businessExperiments: business.items, productFeatures: products.items, taskDispatches: tasks.items, followups: followups.items, reviewQueueItems: queue }), [business.items, clients.items, content.items, finance.items, followups.items, investments.items, products.items, queue, tasks.items, uid]);
  async function create() {
    setBusy(true);
    try {
      const result = await createCommandBriefDraft(getClientDb(), draft);
      setCreated(result.commandBriefId);
    } finally {
      setBusy(false);
    }
  }
  return <div className="grid"><header className="page-header"><div><h1>Command Brain</h1><p>跨財務、投資、客戶、內容、商業、產品的總管判斷。只建立 Command Brief Draft。</p><div className="assistant-meta-row"><TimeContextBadge /><DataFreshnessBadge label="Command Brain" /></div></div><div className="action-row"><button className="button compact" disabled={busy} onClick={create}>產生 Command Brief Draft</button><Link className="button secondary compact" href="/review-queue">Review Queue</Link></div></header>{created ? <section className="panel"><p>Created command brief: <span className="mono">{created}</span></p></section> : null}<section className="panel"><h2>Current Brain Preview</h2><div className="detail-grid"><div><strong>summary</strong><p>{draft.summary}</p></div><div><strong>review queue</strong><p>{queue.length}</p></div><div><strong>external actions</strong><p>{String(draft.external_action_allowed)}</p></div><div><strong>Mark review</strong><p>{String(draft.need_mark_review)}</p></div></div></section><section className="panel"><h2>今日主線 / 本週主線</h2><div className="detail-grid"><div><strong>main_focus</strong><ul>{draft.main_focus.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>cross_branch_risks</strong><ul>{draft.cross_branch_risks.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>no_cost_actions</strong><p>{safeJoin(draft.no_cost_actions)}</p></div><div><strong>blocked_items</strong><ul>{draft.blocked_items.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>recommended_sops</strong><p>{safeJoin(draft.recommended_sops)}</p></div><div><strong>codex_job_candidates</strong><p>{safeJoin(draft.codex_job_candidates)}</p></div><div><strong>assistant_handoff_candidates</strong><p>{safeJoin(draft.assistant_handoff_candidates)}</p></div></div></section><section className="panel"><h2>Command Briefs</h2><div className="list">{briefs.items.length ? briefs.items.map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{item.summary}</p><p className="muted">{safeJoin(item.main_focus)}</p></article>) : <p className="muted">尚未建立 command briefs。</p>}</div></section></div>;
}

export default function Page() {
  return <ProtectedPage>{(uid) => <CommandBrainData uid={uid} />}</ProtectedPage>;
}
