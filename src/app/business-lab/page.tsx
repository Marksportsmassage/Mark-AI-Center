"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { recent20, useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { getClientDb } from "@/lib/firebase/client";
import { createBusinessExperimentDraft, createStartupTestPlanDraft } from "@/lib/nonFinanceOps";
import { parseNullableNumber } from "@/lib/financeReviewActions";
import { safeJoin } from "@/lib/ui/safe";
import type { BusinessExperiment, StartupTestPlan } from "@/types/firestore";

function BusinessLabData({ uid }: { uid: string }) {
  const experiments = useFirestoreCollection<BusinessExperiment>("business_experiments", recent20, true);
  const plans = useFirestoreCollection<StartupTestPlan>("startup_test_plans", recent20, true);
  const [created, setCreated] = useState<string | null>(null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kind = String(form.get("kind") ?? "experiment");
    const input = { title: String(form.get("title") ?? ""), budget: parseNullableNumber(form.get("test_budget")), stopLoss: String(form.get("stop_loss") ?? ""), hypothesis: String(form.get("hypothesis") ?? ""), expected: String(form.get("expected_return") ?? ""), validation: String(form.get("validation_method") ?? ""), steps: String(form.get("steps") ?? "") };
    const result = kind === "plan" ? await createStartupTestPlanDraft(getClientDb(), uid, input) : await createBusinessExperimentDraft(getClientDb(), uid, input);
    setCreated(`${result.collection}/${result.id}`); event.currentTarget.reset();
  }
  return <div className="grid"><header className="page-header"><div><h1>創業與商業模式實驗室</h1><p>服飾、一番賞、飲料店、工作室、App、商品化資料。只做實驗草稿，不聯絡供應商、不下單、不付款。</p></div><div className="action-row"><Link className="button secondary compact" href="/decision-lab">Decision Lab</Link><Link className="button secondary compact" href="/review-queue">Review Queue</Link></div></header>{created ? <section className="panel"><p>Created draft: <span className="mono">{created}</span></p></section> : null}<section className="panel"><h2>Create Business Experiment</h2><form className="grid" onSubmit={create}><div className="detail-grid"><label>kind<select name="kind"><option value="experiment">business experiment</option><option value="plan">startup test plan</option></select></label><label>title<input name="title" required /></label><label>test_budget<input name="test_budget" type="number" min="0" /></label><label>stop_loss<input name="stop_loss" placeholder="超過預算或無需求訊號即停止" /></label><label>expected_return<input name="expected_return" /></label><label>validation_method<input name="validation_method" /></label></div><label>hypothesis<textarea name="hypothesis" rows={3} /></label><label>steps<textarea name="steps" rows={3} /></label><button className="button compact">建立商業實驗草稿</button></form></section><section className="panel"><h2>Experiments</h2><div className="list">{experiments.items.map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{item.hypothesis}</p><p className="muted">budget {item.test_budget ?? "待補"} / stop loss {item.stop_loss}</p></article>)}{plans.items.map((item) => <article className="item" key={item.id}><h3>{item.title}</h3><p>{safeJoin(item.steps)}</p><p className="muted">no supplier contact={String(item.no_supplier_contact)} / no payment={String(item.no_payment)}</p></article>)}</div></section></div>;
}

export default function Page() { return <ProtectedPage>{(uid) => <BusinessLabData uid={uid} />}</ProtectedPage>; }
